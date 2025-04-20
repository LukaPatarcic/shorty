import express from 'express';
import dotenv from 'dotenv';
import { Client } from '@elastic/elasticsearch';
import { consumer, initializeKafka, TOPICS } from './config/kafka';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3002;

// Elasticsearch client setup
const esClient = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200'
});

// Define types for our aggregations
interface ClickAnalyticsAggregations {
  total_clicks: { value: number };
  hourly_clicks: { buckets: Array<{ key: string; doc_count: number }> };
  user_agents: { buckets: Array<{ key: string; doc_count: number }> };
  top_referers: { buckets: Array<{ key: string; doc_count: number }> };
}

// Initialize Elasticsearch indices
async function setupElasticsearch() {
  try {
    // Delete existing indices if they exist
    const clicksIndexExists = await esClient.indices.exists({
      index: 'url-clicks'
    });

    if (clicksIndexExists) {
      await esClient.indices.delete({
        index: 'url-clicks'
      });
    }

    // Create index for URL clicks with proper mappings
    await esClient.indices.create({
      index: 'url-clicks',
      mappings: {
        properties: {
          shortUrl: { type: 'keyword' },
          timestamp: { type: 'date' },
          userAgent: { 
            type: 'text',
            fields: {
              keyword: { type: 'keyword' }
            }
          },
          ipAddress: { type: 'keyword' },
          referer: { 
            type: 'text',
            fields: {
              keyword: { type: 'keyword' }
            }
          }
        }
      }
    });

    // Create index for URL metadata
    const urlsIndexExists = await esClient.indices.exists({
      index: 'urls'
    });

    if (!urlsIndexExists) {
      await esClient.indices.create({
        index: 'urls',
        mappings: {
          properties: {
            shortUrl: { type: 'keyword' },
            originalUrl: { type: 'text' },
            createdAt: { type: 'date' },
            expiresAt: { type: 'date' },
            userId: { type: 'keyword' }
          }
        }
      });
    }
  } catch (error) {
    console.error('Failed to setup Elasticsearch:', error);
  }
}

// Connect to Kafka and subscribe to topics
async function setupKafkaConsumer() {
  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      if (!message.value) return;
      
      const data = JSON.parse(message.value.toString());
      console.log(data);

      // Store click event
      try {
        await esClient.index({
          index: 'url-clicks',
          document: {
            shortUrl: data.data.shortUrl,
            timestamp: new Date(),
            userAgent: data.data.userAgent || 'unknown',
            ipAddress: data.data.ipAddress || '0.0.0.0',
            referer: data.data.referer || 'unknown'
          }
        });
        console.log(`Processed click event for: ${data.data.shortUrl}`);
      } catch (error) {
        console.error('Error indexing click event:', error);
      }
    },
  });
}

// API endpoints
app.get('/analytics/:shortUrl', async (req, res) => {
  const { shortUrl } = req.params;
  
  try {
    // Get URL metadata
    const urlMetadata = await esClient.search({
      index: 'urls',
      query: {
        term: {
          shortUrl: shortUrl
        }
      }
    });

    // Get click analytics
    const clickAnalytics = await esClient.search({
      index: 'url-clicks',
      query: {
        term: {
          shortUrl: shortUrl
        }
      },
      size: 0,
      aggs: {
        total_clicks: {
          value_count: {
            field: 'shortUrl'
          }
        },
        hourly_clicks: {
          date_histogram: {
            field: 'timestamp',
            calendar_interval: 'hour'
          }
        },
        user_agents: {
          terms: {
            field: 'userAgent.keyword'
          }
        },
        top_referers: {
          terms: {
            field: 'referer.keyword'
          }
        }
      }
    });

    res.json({
      urlInfo: urlMetadata.hits.hits[0]?._source || null,
      clickAnalytics: {
        totalClicks: (clickAnalytics.aggregations as unknown as ClickAnalyticsAggregations).total_clicks.value || 0,
        hourlyDistribution: (clickAnalytics.aggregations as unknown as ClickAnalyticsAggregations).hourly_clicks.buckets || [],
        userAgents: (clickAnalytics.aggregations as unknown as ClickAnalyticsAggregations).user_agents.buckets || [],
        topReferers: (clickAnalytics.aggregations as unknown as ClickAnalyticsAggregations).top_referers.buckets || []
      }
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Start the server
async function initialize() {
  try {
    await setupElasticsearch();
    await initializeKafka();
    await setupKafkaConsumer();
    
    app.listen(port, () => {
      console.log(`Analytics service listening at http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Failed to initialize:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received. Shutting down...');
  await consumer.disconnect();
  await esClient.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received. Shutting down...');
  await consumer.disconnect();
  await esClient.close();
  process.exit(0);
});

initialize().catch(console.error); 
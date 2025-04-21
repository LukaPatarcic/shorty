import { Client } from "@elastic/elasticsearch";

// Elasticsearch client setup
const esClient = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200'
});

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

export { esClient, setupElasticsearch };
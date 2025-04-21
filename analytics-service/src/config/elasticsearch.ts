import { Client } from "@elastic/elasticsearch";
import { env } from "./env";
import logger from "./logger";

// Elasticsearch client setup
const esClient = new Client({
  node: env.ELASTICSEARCH_URL || 'http://localhost:9200'
});

export const esIndices = {
    urlClicks: 'url-clicks',
    urlMetadata: 'url-metadata'
}

// Initialize Elasticsearch indices
async function setupElasticsearch() {
  try {
    createIndex(esIndices.urlClicks, {
      properties: {
            code: { type: 'keyword' },
            timestamp: { type: 'date' },
            userAgent: { 
                type: 'text',
                fields: {
                    keyword: { type: 'keyword' }
                }
            },
            ipAddress: { 
                type: 'text',
                fields: {
                    keyword: { type: 'keyword' },
                },
            },
            referer: { 
                type: 'text',
                fields: {
                    keyword: { type: 'keyword' }
                }
            }
        }
    })
    
    createIndex(esIndices.urlMetadata, {
        properties: {
            originalUrl: { type: 'text' },
            code: { type: 'keyword' },
            createdAt: { type: 'date' },
        }
    })

    logger.info('Elasticsearch indices created');
  } catch (error) {
    logger.error({
        message: 'Failed to setup Elasticsearch',
        error,
        stack: error instanceof Error ? error.stack : undefined
    });
  }
}

const createIndex = async (index: string, mappings: any) => {
    const indexExists = await esClient.indices.exists({
        index
    });

    if (!indexExists) {
        await esClient.indices.create({ index, mappings })
    }
}

export { esClient, setupElasticsearch };
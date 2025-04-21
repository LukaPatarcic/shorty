import { Client } from "@elastic/elasticsearch";

// Elasticsearch client setup
const esClient = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200'
});

export const esIndices = {
    urlClicks: 'url-clicks',
    urlMetadata: 'url-metadata'
}

// Initialize Elasticsearch indices
async function setupElasticsearch() {
  try {
    // esClient.indices.delete({
    //     index: esIndices.urlClicks
    // })
    // esClient.indices.delete({
    //     index: esIndices.urlMetadata
    // })
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
    
    console.log('Elasticsearch indices created');
  } catch (error) {
    console.error('Failed to setup Elasticsearch:', error);
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
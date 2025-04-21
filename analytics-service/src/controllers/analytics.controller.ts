import { Request, Response, RequestHandler, NextFunction } from 'express';
import { esClient, esIndices } from '../config/elasticsearch';

interface ClickAnalyticsAggregations {
  total_clicks: { value: number };
  hourly_clicks: { buckets: Array<{ key: string; doc_count: number }> };
  user_agents: { buckets: Array<{ key: string; doc_count: number }> };
  top_referers: { buckets: Array<{ key: string; doc_count: number }> };
  ip_addresses: { buckets: Array<{ key: string; doc_count: number }> };
}

export class AnalyticsController {
  static getAnalytics: RequestHandler = async (req: Request, res: Response) => {
  const { code } = req.params;
  
  try {
    // Get URL metadata
    const urlMetadata = await esClient.search({
      index: esIndices.urlMetadata,
      query: {
        term: {
          code: code
        }
      }
    });

    // Get click analytics
    const clickAnalytics = await esClient.search({
      index: esIndices.urlClicks,
      query: {
        term: {
          code: code
        }
      },
      size: 0,
      aggs: {
        total_clicks: {
          value_count: {
            field: 'code'
          }
        },
        hourly_clicks: {
          date_histogram: {
            field: 'timestamp',
            calendar_interval: 'hour'
          }
        },
        ip_addresses: {
          terms: {
            field: 'ipAddress.keyword'
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
        ipAddresses: (clickAnalytics.aggregations as unknown as ClickAnalyticsAggregations).ip_addresses.buckets || [],
        topReferers: (clickAnalytics.aggregations as unknown as ClickAnalyticsAggregations).top_referers.buckets || []
      }
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
}

  static health: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get stats from Elasticsearch
      const stats = await esClient.cluster.health();
      res.json({
        status: 'healthy',
        elasticsearch: stats
      });
    } catch (error) {
      res.status(500).json({
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
} 
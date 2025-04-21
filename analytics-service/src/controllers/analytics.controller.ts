import { Request, Response, RequestHandler, NextFunction } from 'express';
import { esClient } from '../config/elasticsearch';

interface ClickAnalyticsAggregations {
  total_clicks: { value: number };
  hourly_clicks: { buckets: Array<{ key: string; doc_count: number }> };
  user_agents: { buckets: Array<{ key: string; doc_count: number }> };
  top_referers: { buckets: Array<{ key: string; doc_count: number }> };
}

export class AnalyticsController {
  static getAnalytics: RequestHandler = async (req: Request, res: Response) => {
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
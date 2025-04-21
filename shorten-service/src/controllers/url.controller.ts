import { Request, Response, RequestHandler, NextFunction } from 'express';
import { URLService } from '../services/url.service';
import db from '../config/database';
import logger from '../config/logger';

export class UrlController {
  static shorten = async (req: Request, res: Response) => {
    const { url } = req.body;
    const newUrl = await URLService.createShortURL(url);
    logger.info({
      message: 'Short URL created',
      newUrl
    });

    res.status(200).json(newUrl);
  }

  static health: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Test database connection
        await db.raw('SELECT 1');
        
        res.json({
        status: 'healthy',
        database: 'connected',
        kafka: 'connected'
        });
    } catch (error) {
        logger.error({
          message: 'Database connection failed:',
          error,
          stack: error instanceof Error ? error.stack : undefined
        });
        res.status(500).json({
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
  }
} 
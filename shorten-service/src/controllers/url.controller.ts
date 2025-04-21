import { Request, Response, RequestHandler, NextFunction } from 'express';
import { URLService } from '../services/url.service';
import db from '../config/database';

export class UrlController {
  static shorten = async (req: Request, res: Response) => {
    const { url } = req.body;
    const newUrl = await URLService.createShortURL(url);

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
        res.status(500).json({
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
  }
} 
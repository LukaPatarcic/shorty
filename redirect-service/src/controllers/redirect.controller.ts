import { Request, Response, RequestHandler, NextFunction } from 'express';
import { getCachedURL } from '../config/redis';
import { KafkaService } from '../services/kafka.service';

export class RedirectController {
  static redirect: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { code } = req.params;

      if (!code) {
        res.status(400).json({ error: 'Code is required' });
        return;
      }

      const originalUrl = await getCachedURL(code);

      if (!originalUrl) {
        res.status(404).json({ error: 'URL not found' });
        return;
      }

      // Emit click event before redirecting
      await KafkaService.emitClickEvent(code, req);

      // Send a 301 permanent redirect
      res.redirect(301, originalUrl);
    } catch (error) {
      console.error('Error redirecting:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static health: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get stats from Redis
      const stats = await getCachedURL('health-check');
      res.json({
        status: 'healthy',
        cache: stats ? 'connected' : 'disconnected'
      });
    } catch (error) {
      res.status(500).json({
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
} 
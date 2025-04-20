import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import db from './config/database';
import { initializeKafka } from './config/kafka';
import { URLService } from './services/url.service';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Health check endpoint
app.get('/health', async (req: Request, res: Response) => {
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
});

app.post('/shorten', async (req: Request, res: Response) => {
  const { url } = req.body;
  const newUrl = await URLService.createShortURL(url);

  res.status(200).json({
    status: 'success',
    url: newUrl
  });
  
});

// Initialize connections
async function initialize() {
  try {
    // Initialize Kafka (this will create topics and connect producer)
    await initializeKafka();
    
    // Start the server
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to initialize:', error);
    process.exit(1);
  }
}

initialize().catch(console.error); 
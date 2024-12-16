import { Application } from 'express';
import aiRoutes from './ai';
import contractRoutes from './contract';
import decoderRoutes from './decoder';

export function registerRoutes(app: Application) {
  // Register AI routes under /api/ai prefix
  app.use('/api/ai', aiRoutes);
  
  // Register contract routes under /api prefix
  app.use('/api', contractRoutes);

  // Register decoder routes under /api/decoder prefix
  app.use('/api/decoder', decoderRoutes);
}

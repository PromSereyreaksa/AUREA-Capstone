import express from 'express';
import cors from 'cors';
import testRoutes from './interfaces/routes/testRoutes';
import userRoutes from './interfaces/routes/userRoutes';
import pdfExtractRoutes from './interfaces/routes/pdfExtractRoutes';
import { errorHandler, requestLogger } from './shared/middleware';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    success: true,
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Routes
app.use('/api', testRoutes);
app.use('/api/users', userRoutes);
app.use('/api/pdf', pdfExtractRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: { message: `Route ${req.method} ${req.path} not found` }
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
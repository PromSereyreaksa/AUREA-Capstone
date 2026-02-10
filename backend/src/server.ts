import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger';
import testRoutes from './interfaces/routes/testRoutes';
import userRoutes from './interfaces/routes/userRoutes';
import pdfExtractRoutes from './interfaces/routes/pdfExtractRoutes';
import pricingRoutes from './interfaces/routes/pricingRoutes';
import profileRoutes from './interfaces/routes/profileRoutes';
import { errorHandler, requestLogger, versionMiddleware, versionCheck, restrictV0ToLocalhost } from './shared/middleware';

// Suppress dotenv logging in non-debug mode
dotenv.config({ debug: false });
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);
app.use(versionCheck);
app.use(restrictV0ToLocalhost); // Restrict v0 to localhost only

// Health check


app.get('/api/v0/health', (req, res) => {
  res.json({ 
    success: true,
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: 'v0'
  });
});

app.get('/api/v1/health', (req, res) => {
  res.json({ 
    success: true,
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: 'v1'
  });
});

// Swagger Documentation (accessible via v0/docs, shows v1 endpoints)
app.use('/api/v0/docs', swaggerUi.serve);
app.get('/api/v0/docs', swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'AUREA API Documentation',
  customfavIcon: '/favicon.ico'
}));

//for developer
app.use('/api/v0', versionMiddleware('v0'), testRoutes);
app.use('/api/v0/users', versionMiddleware('v0'), userRoutes);
app.use('/api/v0/profile', versionMiddleware('v0'), profileRoutes);
app.use('/api/v0/pdf', versionMiddleware('v0'), pdfExtractRoutes);
app.use('/api/v0/pricing', versionMiddleware('v0'), pricingRoutes);


//for users v1
app.use('/api/v1', versionMiddleware('v1'), testRoutes);
app.use('/api/v1/users', versionMiddleware('v1'), userRoutes);
app.use('/api/v1/profile', versionMiddleware('v1'), profileRoutes);
app.use('/api/v1/pdf', versionMiddleware('v1'), pdfExtractRoutes);
app.use('/api/v1/pricing', versionMiddleware('v1'), pricingRoutes);

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
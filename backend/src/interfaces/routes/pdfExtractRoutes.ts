import { Router } from 'express';
import {
  extractPdfController,
  testGeminiController,
  getProjectHistoryController,
  upload
} from '../controllers/PdfExtractController';

const router = Router();

// Extract PDF and create project
router.post('/extract', upload.single('pdf'), extractPdfController);

// Test Gemini connection
router.get('/test-gemini', testGeminiController);

// Get project history for user
router.get('/projects/:userId', getProjectHistoryController);

export default router;

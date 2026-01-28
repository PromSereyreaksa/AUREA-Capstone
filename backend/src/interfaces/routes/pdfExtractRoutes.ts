import { Router } from "express";
import {
  extractPdfController,
  testGeminiController,
  getProjectHistoryController,
  createProjectManuallyController,
  getProjectByIdController,
  updateProjectController,
  deleteProjectController,
  upload,
} from "../controllers/PdfExtractController";
import { conditionalAuth } from "../../shared/middleware";

const router = Router();

// Apply conditional authentication to all routes
router.use(conditionalAuth);

// Extract PDF and create project
router.post("/extract", upload.single("pdf"), extractPdfController);

// Create project manually without PDF
router.post("/create-project", createProjectManuallyController);

// Test Gemini connection
router.get("/test-gemini", testGeminiController);

// Get all projects for a user
router.get("/projects/:userId", getProjectHistoryController);

// Get single project by ID (with deliverables)
router.get("/projects/:userId/:projectId", getProjectByIdController);

// Update project
router.put("/projects/:userId/:projectId", updateProjectController);

// Delete project
router.delete("/projects/:userId/:projectId", deleteProjectController);

export default router;
export { upload };

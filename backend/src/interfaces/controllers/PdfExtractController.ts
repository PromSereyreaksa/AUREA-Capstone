import { Request, Response, NextFunction } from "express";
import { GeminiService } from "../../infrastructure/services/GeminiService";
import { PdfService } from "../../infrastructure/services/PdfService";
import { ProjectPriceRepository } from "../../infrastructure/repositories/ProjectPriceRepository";
import { ProjectDeliverableRepository } from "../../infrastructure/repositories/ProjectDeliverableRepository";
import { ExtractProjectFromPdf } from "../../application/use_cases/ExtractProjectFromPdf";
import multer from "multer";

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"));
    }
  },
});

const pdfService = new PdfService();
const geminiService = new GeminiService();
const projectPriceRepo = new ProjectPriceRepository();
const projectDeliverableRepo = new ProjectDeliverableRepository();
const extractProjectUseCase = new ExtractProjectFromPdf(
  projectPriceRepo,
  projectDeliverableRepo,
  pdfService,
  geminiService,
);

// Extract PDF and create project
export const extractPdfController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "PDF file is required" });
    }

    const userId = req.body.user_id;
    if (!userId) {
      return res.status(400).json({ 
        error: "user_id is required. Please provide a valid user ID or create a user first at POST /api/users/signup" 
      });
    }

    const result = await extractProjectUseCase.execute(req.file.buffer, userId);

    return res.status(201).json({
      message: "PDF extracted and project created successfully",
      data: result,
    });
  } catch (error: any) {
    
    if (error.message && error.message.includes('foreign key constraint')) {
      return res.status(400).json({
        error: "Invalid user_id. The user does not exist. Please create a user first at POST /api/users/signup"
      });
    }
    next(error);
  }
};

// Test Gemini connection
export const testGeminiController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const status = await geminiService.testConnection();
    return res.status(200).json(status);
  } catch (error) {
    next(error);
  }
};

// Get user's project history
export const getProjectHistoryController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = parseInt(
      Array.isArray(req.params.userId)
        ? req.params.userId[0]
        : req.params.userId,
    );
    const projects = await projectPriceRepo.findByUserId(userId);
    return res.status(200).json({ data: projects });
  } catch (error) {
    next(error);
  }
};

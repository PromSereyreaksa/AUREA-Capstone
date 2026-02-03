import { Request, Response, NextFunction } from 'express';
import { GeminiService } from '../../infrastructure/services/GeminiService';
import { ProjectPriceRepository } from '../../infrastructure/repositories/ProjectPriceRepository';
import { ProjectDeliverableRepository } from '../../infrastructure/repositories/ProjectDeliverableRepository';
import { ExtractProjectFromPdf } from '../../application/use_cases/ExtractProjectFromPdf';
import { CreateProjectManually } from '../../application/use_cases/CreateProjectManually';
import { ProjectValidator, UserValidator, PdfValidator } from '../../shared/validators';
import { ResponseHelper } from '../../shared/utils/responseHelper';
import { asyncHandler } from '../../shared/middleware';
import { ProjectDeliverable } from '../../domain/entities/ProjectDeliverable';
import multer from 'multer';

// Multer configuration
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

// Initialize dependencies
const geminiService = new GeminiService();
const projectPriceRepo = new ProjectPriceRepository();
const projectDeliverableRepo = new ProjectDeliverableRepository();
const extractProjectUseCase = new ExtractProjectFromPdf(
  projectPriceRepo,
  projectDeliverableRepo,
  geminiService
);
const createProjectManuallyUseCase = new CreateProjectManually(
  projectPriceRepo,
  projectDeliverableRepo
);

// Extract PDF and create project
export const extractPdfController = asyncHandler(async (req: Request, res: Response) => {
  PdfValidator.validatePdfFile(req.file);
  const userId = UserValidator.validateUserId(req.body.user_id);

  const result = await extractProjectUseCase.execute(req.file!.buffer, userId);

  return ResponseHelper.created(res, result, 'PDF extracted and project created successfully');
});

// Create project manually without PDF
export const createProjectManuallyController = asyncHandler(async (req: Request, res: Response) => {
  const userId = UserValidator.validateUserId(req.body.user_id);
  ProjectValidator.validateManualProjectInput(req.body);

  const sanitizedData = ProjectValidator.sanitizeProjectData(req.body);
  const result = await createProjectManuallyUseCase.execute(userId, sanitizedData as any);

  return ResponseHelper.created(res, result, 'Project created successfully');
});

// Test Gemini connection
export const testGeminiController = asyncHandler(async (req: Request, res: Response) => {
  const status = await geminiService.testConnection();
  return ResponseHelper.success(res, status);
});

// Get user's project history
export const getProjectHistoryController = asyncHandler(async (req: Request, res: Response) => {
  const userId = UserValidator.validateUserId(req.params.userId);
  const projects = await projectPriceRepo.findByUserId(userId);
  return ResponseHelper.success(res, projects);
});

// Get single project by ID with deliverables
export const getProjectByIdController = asyncHandler(async (req: Request, res: Response) => {
  const userId = UserValidator.validateUserId(req.params.userId);
  const projectId = ProjectValidator.validateProjectId(req.params.projectId);

  const project = await projectPriceRepo.findById(projectId);
  
  if (!project) {
    return ResponseHelper.notFound(res, 'Project not found');
  }

  // Verify ownership
  if (project.user_id !== userId) {
    return ResponseHelper.forbidden(res, 'You do not have access to this project');
  }

  const deliverables = await projectDeliverableRepo.findByProjectId(projectId);
  
  return ResponseHelper.success(res, {
    ...project,
    deliverables
  });
});

// Update project
export const updateProjectController = asyncHandler(async (req: Request, res: Response) => {
  const userId = UserValidator.validateUserId(req.params.userId);
  const projectId = ProjectValidator.validateProjectId(req.params.projectId);
  ProjectValidator.validateUpdateProjectInput(req.body);

  const project = await projectPriceRepo.findById(projectId);
  
  if (!project) {
    return ResponseHelper.notFound(res, 'Project not found');
  }

  // Verify ownership
  if (project.user_id !== userId) {
    return ResponseHelper.forbidden(res, 'You do not have access to this project');
  }

  const sanitizedData = ProjectValidator.sanitizeProjectData(req.body);
  const updatedProject = await projectPriceRepo.update(projectId, sanitizedData as any);

  // If deliverables are provided, add them (new deliverables only)
  if (req.body.deliverables && Array.isArray(req.body.deliverables)) {
    const newDeliverables = await Promise.all(
      req.body.deliverables.map((del: any) => {
        const deliverable = new ProjectDeliverable(0, projectId, del.deliverable_type, del.quantity);
        return projectDeliverableRepo.create(deliverable);
      })
    );
    
    return ResponseHelper.success(res, {
      ...updatedProject,
      deliverables: newDeliverables
    }, 'Project updated successfully');
  }

  const deliverables = await projectDeliverableRepo.findByProjectId(projectId);
  
  return ResponseHelper.success(res, {
    ...updatedProject,
    deliverables
  }, 'Project updated successfully');
});

// Delete project and associated deliverables
export const deleteProjectController = asyncHandler(async (req: Request, res: Response) => {
  const userId = UserValidator.validateUserId(req.params.userId);
  const projectId = ProjectValidator.validateProjectId(req.params.projectId);

  const project = await projectPriceRepo.findById(projectId);
  
  if (!project) {
    return ResponseHelper.notFound(res, 'Project not found');
  }

  // Verify ownership
  if (project.user_id !== userId) {
    return ResponseHelper.forbidden(res, 'You do not have access to this project');
  }

  // Delete all deliverables first
  await projectDeliverableRepo.deleteByProjectId(projectId);
  
  // Delete the project
  await projectPriceRepo.delete(projectId);

  return ResponseHelper.success(res, { projectId }, 'Project deleted successfully');
});
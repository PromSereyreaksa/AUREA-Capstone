import { IProjectPriceRepository } from '../../domain/repositories/IProjectPriceRepository';
import { IProjectDeliverableRepository } from '../../domain/repositories/IProjectDeliverableRepository';
import { ProjectPrice } from '../../domain/entities/ProjectPrice';
import { GeminiService } from '../../infrastructure/services/GeminiService';
import { PdfService } from '../../infrastructure/services/PdfService';

export class ExtractProjectFromPdf {
  constructor(
    private projectPriceRepo: IProjectPriceRepository,
    private projectDeliverableRepo: IProjectDeliverableRepository,
    private pdfService: PdfService,
    private geminiService: GeminiService
  ) {}

  async execute(pdfBuffer: Buffer, userId: number): Promise<{ project: ProjectPrice; extractedText: string }> {
    // Extract raw text from PDF
    const extractedText = await this.pdfService.extractText(pdfBuffer);

    // Use Gemini AI to analyze and extract project details
    const aiAnalysis = await this.geminiService.extractTextFromPdf(extractedText);

    // Create project price entity with extracted data
    const projectPrice = new ProjectPrice(
      0, 
      userId,
      'Extracted Project', 
      'PDF Extracted Project', 
      extractedText, // description (raw text)
      undefined, 
      undefined, 
      undefined, 
      undefined, 
      aiAnalysis // result (AI summary)
    );

    
    const savedProject = await this.projectPriceRepo.create(projectPrice);

    return {
      project: savedProject,
      extractedText
    };
  }
}

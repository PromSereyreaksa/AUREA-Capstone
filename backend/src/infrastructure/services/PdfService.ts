// Using require for CommonJS module
const { PDFParse } = require('pdf-parse');

export class PdfService {
  async extractText(buffer: Buffer): Promise<string> {
    try {
      const parser = new PDFParse({ data: buffer });
      const result = await parser.getText();
      return result.text;
    } catch (error: any) {
      throw new Error(`PDF parsing failed: ${error.message}`);
    }
  }
}

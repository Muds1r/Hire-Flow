import { Injectable, BadRequestException } from '@nestjs/common';
import { PDFParse } from 'pdf-parse';
import * as mammoth from 'mammoth';

@Injectable()
export class CvService {
  async extractText(buffer: Buffer, mimeType: string): Promise<string> {
    const mime = (mimeType || '').toLowerCase();
    if (mime.includes('pdf') || mime === 'application/pdf') {
      const parser = new PDFParse({ data: buffer });
      try {
        const result = await parser.getText();
        return (result.text || '').trim();
      } finally {
        await parser.destroy().catch(() => undefined);
      }
    }
    if (
      mime.includes('wordprocessingml') ||
      mime.includes('officedocument') ||
      mime.includes('msword')
    ) {
      const result = await mammoth.extractRawText({ buffer });
      return (result.value || '').trim();
    }
    throw new BadRequestException(
      'Unsupported file type. Upload PDF or DOCX only.',
    );
  }
}

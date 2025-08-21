declare module 'pdf-parse' {
export interface PDFParseResult {
numpages?: number;
numrender?: number;
info?: any;
metadata?: any;
text: string;
version?: string;
}
function pdfParse(
data: Buffer | Uint8Array | ArrayBuffer,
options?: Record<string, unknown>
): Promise<PDFParseResult>;
export default pdfParse;
}
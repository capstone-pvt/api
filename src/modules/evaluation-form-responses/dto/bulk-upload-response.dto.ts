export interface BulkUploadError {
  row: number;
  message: string;
  data: Record<string, unknown>;
}

export interface BulkUploadResult {
  totalRows: number;
  successfulResponses: number;
  skippedRows: number;
  errors: BulkUploadError[];
}

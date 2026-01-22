export interface BulkUploadResult {
  totalRows: number;
  successfulPersonnel: number;
  successfulEvaluations: number;
  skippedRows: number;
  errors: Array<{
    row: number;
    message: string;
    data?: unknown;
  }>;
}

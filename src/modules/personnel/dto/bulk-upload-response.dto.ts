export interface BulkUploadPersonnelResponse {
  success: boolean;
  created: number;
  skipped: number;
  failed: number;
  total: number;
  skippedRecords: SkippedPersonnelRecord[];
  failedRecords: FailedPersonnelRecord[];
}

export interface SkippedPersonnelRecord {
  row: number;
  email: string;
  firstName: string;
  lastName: string;
  reason: string;
}

export interface FailedPersonnelRecord {
  row: number;
  data: any;
  error: string;
}

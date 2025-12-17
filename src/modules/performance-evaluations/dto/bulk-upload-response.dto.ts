export interface BulkUploadResult {
  totalRows: number;
  successfulPersonnel: number;
  successfulEvaluations: number;
  skippedRows: number;
  errors: BulkUploadError[];
}

export interface BulkUploadError {
  row: number;
  field?: string;
  message: string;
  data?: any;
}

export interface ProcessedPersonnel {
  firstName: string;
  lastName: string;
  middleName?: string;
  email: string;
  department: string;
  jobTitle?: string;
  personnelId?: string;
}

export interface ProcessedEvaluation {
  personnelId: string;
  evaluationDate: Date;
  semester: string;
  scores: {
    PAA: number;
    KSM: number;
    TS: number;
    CM: number;
    AL: number;
    GO: number;
  };
  feedback?: string;
  evaluatedBy?: string;
}

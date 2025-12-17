# Bulk Upload Guide - Personnel and Performance Evaluations

This guide explains how to use the bulk upload feature to import personnel and their performance evaluations from an Excel file.

## Endpoint

```
POST /api/performance-evaluations/bulk-upload
Content-Type: multipart/form-data
```

## Excel File Format

The Excel file should contain the following columns (column names are case-insensitive and support various formats):

### Required Columns

#### Personnel Information
- **First Name** (or `FirstName`, `first_name`, `FIRST NAME`) - Employee's first name
- **Last Name** (or `LastName`, `last_name`, `LAST NAME`) - Employee's last name

#### Performance Scores (All Required)
- **PAA** - Performance Analysis & Assessment score (numeric)
- **KSM** - Knowledge & Skill Management score (numeric)
- **TS** - Technical Skills score (numeric)
- **CM** - Communication Management score (numeric)
- **AL** - Attitude & Leadership score (numeric)
- **GO** - Goal Orientation score (numeric)

### Optional Columns

#### Personnel Information
- **Middle Name** (or `MiddleName`, `middle_name`, `MIDDLE NAME`) - Employee's middle name
- **Email** (or `EMAIL`, `E-mail`) - Employee's email (auto-generated if not provided)
- **Department** (or `DEPARTMENT`, `Dept`) - Department name (defaults to "General")
- **Job Title** (or `JobTitle`, `Position`, `Title`) - Employee's job title

#### Evaluation Information
- **Evaluation Date** (or `Date`, `evaluation_date`) - Date of evaluation (defaults to current date)
- **Semester** (or `SEMESTER`) - Semester (auto-generated if not provided, e.g., "2025 - 2nd Semester")
- **Feedback** (or `feedback`, `Comments`) - Evaluation feedback/comments
- **Evaluated By** (or `evaluatedBy`, `Evaluator`) - Name of the evaluator

## Sample Excel Format

| First Name | Last Name | Middle Name | Email | Department | Job Title | PAA | KSM | TS | CM | AL | GO | Semester | Evaluation Date | Feedback | Evaluated By |
|------------|-----------|-------------|-------|------------|-----------|-----|-----|----|----|----|----|----------|-----------------|----------|--------------|
| John | Doe | A. | john.doe@example.com | IT | Senior Developer | 4.5 | 4.2 | 4.8 | 4.0 | 4.3 | 4.6 | 2025 - 2nd Semester | 2025-12-01 | Excellent performance | Jane Smith |
| Jane | Smith | B. | jane.smith@example.com | HR | HR Manager | 4.7 | 4.5 | 4.2 | 4.9 | 4.6 | 4.8 | 2025 - 2nd Semester | 2025-12-01 | Outstanding leader | Bob Johnson |

## How It Works

1. **Upload Excel File**: The system reads the Excel file and processes each row
2. **Personnel Creation/Lookup**:
   - For each row, the system checks if personnel exists (by email)
   - If personnel doesn't exist, creates a new personnel record
   - Auto-generates email if not provided: `firstname.lastname@example.com`
3. **Department Handling**:
   - Checks if department exists
   - Creates department if it doesn't exist
4. **Evaluation Creation**: Creates a performance evaluation record for each row
5. **Error Handling**: Returns detailed information about:
   - Total rows processed
   - Successful personnel created/found
   - Successful evaluations created
   - Skipped rows (missing required data)
   - Detailed errors with row numbers

## Response Format

```json
{
  "totalRows": 100,
  "successfulPersonnel": 95,
  "successfulEvaluations": 95,
  "skippedRows": 3,
  "errors": [
    {
      "row": 5,
      "message": "Missing required scores",
      "data": { ... }
    },
    {
      "row": 12,
      "field": "email",
      "message": "Duplicate email address",
      "data": { ... }
    }
  ]
}
```

## Usage Example with cURL

```bash
curl -X POST http://localhost:5000/api/performance-evaluations/bulk-upload \
  -F "file=@Teacher_Evaluation_Summary.xlsx" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Usage Example with Postman

1. Method: `POST`
2. URL: `http://localhost:5000/api/performance-evaluations/bulk-upload`
3. Headers:
   - `Authorization: Bearer YOUR_JWT_TOKEN`
4. Body:
   - Type: `form-data`
   - Key: `file`
   - Type: `File`
   - Value: Select your Excel file

## Features

### Smart Column Detection
- Supports multiple column name formats (camelCase, snake_case, UPPERCASE, Title Case)
- Flexible column ordering - columns can be in any order

### Auto-Generation
- **Email**: If not provided, generates from first and last name
- **Semester**: Auto-detects based on current date (Jan-Jun = 1st Semester, Jul-Dec = 2nd Semester)
- **Evaluation Date**: Defaults to current date if not provided

### Duplicate Handling
- Checks for existing personnel by email
- Updates existing personnel instead of creating duplicates
- Associates evaluations with existing personnel records

### Department Auto-Creation
- Automatically creates departments if they don't exist
- Maintains referential integrity between personnel and departments

## Supported File Formats

- `.xlsx` (Excel 2007+)
- `.xls` (Excel 97-2003)
- `.csv` (Comma-separated values)

## Best Practices

1. **Use Email Addresses**: Always include email addresses to avoid duplicate personnel
2. **Validate Scores**: Ensure all 6 performance scores (PAA, KSM, TS, CM, AL, GO) are numeric
3. **Date Format**: Use ISO format (YYYY-MM-DD) or Excel date format for evaluation dates
4. **Check Response**: Review the response for errors and skipped rows
5. **Backup Data**: Always backup your data before bulk operations

## Troubleshooting

### Common Issues

**"Missing required scores"**
- Ensure all 6 score columns (PAA, KSM, TS, CM, AL, GO) have numeric values

**"Duplicate email address"**
- The system found an existing personnel with the same email
- This is not an error - the evaluation will be linked to the existing personnel

**"Missing required fields"**
- First Name and Last Name are required for each row

**"Failed to process Excel file"**
- Check that the file is a valid Excel file (.xlsx, .xls)
- Ensure the file is not corrupted
- Verify that the file has a header row with column names

## Integration with ML Model

After bulk uploading personnel and evaluations:
1. Train the TensorFlow model using the uploaded data
2. Generate performance predictions for all personnel
3. View analytics and trends in the dashboard

## Notes

- The bulk upload creates both personnel records and evaluation records in a single operation
- Existing personnel (matched by email) will not be duplicated
- All operations are logged for audit purposes
- The upload is transactional - if a row fails, only that row is skipped

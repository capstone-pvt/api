# Database Migrations - Fake Data Generation

This directory contains database migrations using `migrate-mongo` to seed your database with realistic fake data using `@faker-js/faker`.

## Overview

The migration `20260202000000-seed-fake-data.js` generates comprehensive fake data for your application including:

### Data Generated

1. **Roles (6 total)**
   - super_admin (hierarchy: 1) - Full system access
   - admin (hierarchy: 2) - System administrator
   - department_head (hierarchy: 3) - Department management
   - evaluator (hierarchy: 4) - Evaluation permissions
   - faculty (hierarchy: 5) - Teaching faculty
   - staff (hierarchy: 6) - Non-teaching staff

2. **Departments (12 total)**
   - Academic departments: Computer Science, Mathematics, Engineering, Business Administration, English, Biology, Chemistry, Physics
   - Administrative departments: Human Resources, Finance, IT Support, Administration

3. **Teaching Personnel (50 records)**
   - Assigned to academic departments
   - Job titles: Professor, Associate Professor, Assistant Professor, Lecturer, Senior Lecturer, Instructor
   - Personnel type: "Teaching"
   - Includes performance tracking fields

4. **Non-Teaching Personnel (30 records)**
   - Assigned to administrative departments
   - Job titles: HR Manager, HR Assistant, Accountant, Finance Officer, IT Specialist, System Administrator, Administrative Assistant, Office Manager, Registrar, Administrative Clerk
   - Personnel type: "Non-Teaching"
   - Includes performance tracking fields

5. **Users (80 records)**
   - 1 Super Admin: `superadmin@jcd.edu`
   - 2 Admins: `admin1@jcd.edu`, `admin2@jcd.edu`
   - 12 Department Heads: `head.{department}@jcd.edu` (one per department)
   - 15 Evaluators: Various emails
   - 30 Faculty Users: Linked to teaching personnel
   - 20 Staff Users: Linked to non-teaching personnel
   - **Default password for all users: `password123`**
   - Passwords are hashed using bcrypt (cost factor: 12)

6. **Performance Evaluations (~170 records)**
   - For teaching personnel
   - 2-5 evaluations per person across multiple semesters
   - Scores for: PAA, KSM, TS, CM, AL, GO (scale 1-5)
   - Semesters covered: 2023-1st/2nd, 2024-1st/2nd, 2025-1st

7. **Non-Teaching Evaluations (~110 records)**
   - For non-teaching personnel
   - 2-5 evaluations per person across multiple semesters
   - Scores for: JK, WQ, PR, TW, RL, IN (scale 1-5)
   - Same semester coverage as teaching evaluations

8. **Evaluation Forms (2 records)**
   - Teaching Performance Evaluation Form - 2024
   - Non-Teaching Staff Evaluation Form - 2024
   - Includes evaluation scales, sections, and criteria

## User Fields Generated

Each user record includes:
- Authentication: email (unique), password (bcrypt hashed)
- Profile: firstName, lastName
- Status: isActive (boolean), isEmailVerified (boolean)
- Roles: Array of role ObjectId references
- Department: ObjectId reference to department
- Security tokens: emailVerificationToken, passwordResetToken, passwordResetExpires
- Session tracking: lastLoginAt, lastLoginIp, currentSessionId
- Timestamps: createdAt, updatedAt

### Default Login Credentials

| Email | Password | Role | Description |
|-------|----------|------|-------------|
| superadmin@jcd.edu | password123 | Super Admin | Full system access |
| admin1@jcd.edu | password123 | Admin | System administrator |
| admin2@jcd.edu | password123 | Admin | System administrator |
| head.computerscience@jcd.edu | password123 | Department Head + Evaluator | CS Department |
| head.mathematics@jcd.edu | password123 | Department Head + Evaluator | Math Department |
| ... (other department heads) | password123 | Department Head + Evaluator | Various departments |

All other users have randomly generated emails from their names with the same password `password123`.

## Personnel Fields Generated

Each personnel record includes:
- Basic info: firstName, lastName, middleName, email
- Contact: phoneNumber
- Demographics: gender
- Employment: department (ObjectId reference), jobTitle, hireDate
- Type: personnelType (Teaching/Non-Teaching)
- Performance tracking:
  - predictedPerformance (High/Medium/Low)
  - performanceStatus (Performing/Non-Performing)
  - excellenceStatus (Excellent/Good/Average/Below Average/Not Evaluated)
  - excellenceStartYear, excellenceEndYear (2018-2024)
  - excellenceThreshold (4.0)
  - lastExcellenceCalculation
  - sixYearAverage (2.5-5.0)
  - totalSemestersEvaluated (1-12)

## Evaluation Scores

### Teaching Personnel Scores (Performance Evaluations)
- **PAA**: Performance and Achievement
- **KSM**: Knowledge and Skills Mastery
- **TS**: Teaching Skills
- **CM**: Classroom Management
- **AL**: Attendance and Leave
- **GO**: Growth and Orientation

### Non-Teaching Personnel Scores (Non-Teaching Evaluations)
- **JK**: Job Knowledge
- **WQ**: Work Quality
- **PR**: Productivity
- **TW**: Teamwork
- **RL**: Reliability
- **IN**: Initiative

## Usage

### Run Migration (Populate Database)
```bash
npm run migrate
```

### Check Migration Status
```bash
npm run migrate:status
```

### Rollback Migration (Remove Fake Data)
```bash
npm run migrate:down
```

## Configuration

The migration uses the configuration from `migrate-mongo-config.js`:
- Database: `jcd`
- Connection: Uses `MONGODB_URI` from `.env` or defaults to `mongodb://localhost:27017`

## Data Characteristics

- All emails are unique and generated from names
- Phone numbers are randomly generated
- Hire dates range across the past 10 years
- Evaluation dates are within the past 2 years
- All scores are realistic (1.0-5.0 with 2 decimal places)
- 70% of evaluations include feedback comments
- Department assignments are logical (teaching staff to academic depts, non-teaching to admin depts)

## Collections Modified

The migration affects these MongoDB collections:
- `roles` - User roles and permissions
- `departments` - Academic and administrative departments
- `personnels` - Teaching and non-teaching staff
- `users` - System users with authentication
- `performanceevaluations` - Teaching staff evaluations
- `nonteachingevaluations` - Non-teaching staff evaluations
- `evaluationforms` - Evaluation templates and forms

## Notes

- Running the migration multiple times will create duplicate data (not idempotent)
- To reset, run `npm run migrate:down` then `npm run migrate` again
- All ObjectId references are properly linked between collections
- Timestamps (createdAt, updatedAt) are automatically generated

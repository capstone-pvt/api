# User Credentials Reference

This document contains the login credentials for all seeded users in the database.

## Default Password

**All users have the same password: `P@ssw0rd123`**

## User Accounts by Role

### Super Administrator (1 user)
- **Email:** superadmin@jcd.edu
- **Role:** Super Admin
- **Access:** Full system access with all permissions

### Administrators (2 users)
- **Email:** admin1@jcd.edu | **Role:** Admin
- **Email:** admin2@jcd.edu | **Role:** Admin
- **Access:** System administrator with elevated permissions

### Department Heads (12 users)
Each department has one head with both Department Head and Evaluator roles:

| Email | Department |
|-------|------------|
| head.computerscience@jcd.edu | Computer Science |
| head.mathematics@jcd.edu | Mathematics |
| head.engineering@jcd.edu | Engineering |
| head.businessadministration@jcd.edu | Business Administration |
| head.english@jcd.edu | English |
| head.biology@jcd.edu | Biology |
| head.chemistry@jcd.edu | Chemistry |
| head.physics@jcd.edu | Physics |
| head.humanresources@jcd.edu | Human Resources |
| head.finance@jcd.edu | Finance |
| head.itsupport@jcd.edu | IT Support |
| head.administration@jcd.edu | Administration |

### Evaluators (15 users)
- Randomly generated email addresses (e.g., firstname.lastname@example.com format)
- Can perform evaluations and view reports
- 90% are active, 85% have verified emails

### Faculty Members (30 users)
- Email addresses match teaching personnel records
- Linked to academic departments
- Have basic faculty access
- 95% are active, 80% have verified emails

### Staff Members (20 users)
- Email addresses match non-teaching personnel records
- Linked to administrative departments
- Have basic staff access
- 95% are active, 80% have verified emails

## Role Hierarchy

Roles are organized by hierarchy (lower number = higher authority):

1. **Super Admin** (hierarchy: 1) - Can manage everyone
2. **Admin** (hierarchy: 2) - Can manage department heads and below
3. **Department Head** (hierarchy: 3) - Can manage their department
4. **Evaluator** (hierarchy: 4) - Can perform evaluations
5. **Faculty** (hierarchy: 5) - Teaching staff with basic access
6. **Staff** (hierarchy: 6) - Non-teaching staff with basic access

## Quick Login Examples

### For Testing Admin Features:
```
Email: superadmin@jcd.edu
Password: P@ssw0rd123
```

### For Testing Department Management:
```
Email: head.computerscience@jcd.edu
Password: P@ssw0rd123
```

### For Testing Evaluator Features:
```
Email: head.mathematics@jcd.edu (also has evaluator role)
Password: P@ssw0rd123
```

## User Features

- **Authentication:** All passwords are hashed using bcrypt (cost factor: 12)
- **Email Verification:** Most users have verified emails
- **Active Status:** Most users are active (~90-95%)
- **Last Login:** Some users have recent login history
- **Department Assignment:** All users are assigned to departments
- **Multiple Roles:** Department heads have both department_head and evaluator roles

## Security Notes

⚠️ **Important:** These are test credentials for development/demo purposes only.
- Change the default password in production
- Implement proper password policies
- Use stronger passwords for real deployments
- Remove or deactivate test accounts before going live

## Getting User Information

To view all users in MongoDB:
```javascript
db.users.find({}, { email: 1, firstName: 1, lastName: 1, roles: 1 }).pretty()
```

To find users by role:
```javascript
// Get role ID first
const adminRole = db.roles.findOne({ name: 'admin' })

// Find users with that role
db.users.find({ roles: adminRole._id }, { email: 1, firstName: 1, lastName: 1 }).pretty()
```

To check a user's department:
```javascript
db.users.aggregate([
  { $match: { email: 'superadmin@jcd.edu' } },
  { $lookup: { from: 'departments', localField: 'department', foreignField: '_id', as: 'dept' } },
  { $unwind: '$dept' },
  { $project: { email: 1, firstName: 1, lastName: 1, 'dept.name': 1 } }
])
```

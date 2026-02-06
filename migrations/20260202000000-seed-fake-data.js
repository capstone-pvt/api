const { faker } = require('@faker-js/faker');
const { ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');

module.exports = {
  async up(db) {
    console.log('Starting fake data generation...');

    // 1. Generate Roles
    console.log('Generating roles...');
    const roles = [
      {
        _id: new ObjectId(),
        name: 'super_admin',
        displayName: 'Super Administrator',
        description: 'Full system access with all permissions',
        hierarchy: 1,
        permissions: [],
        isSystemRole: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: new ObjectId(),
        name: 'admin',
        displayName: 'Administrator',
        description: 'System administrator with elevated permissions',
        hierarchy: 2,
        permissions: [],
        isSystemRole: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: new ObjectId(),
        name: 'department_head',
        displayName: 'Department Head',
        description: 'Head of department with management permissions',
        hierarchy: 3,
        permissions: [],
        isSystemRole: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: new ObjectId(),
        name: 'evaluator',
        displayName: 'Evaluator',
        description: 'Can perform evaluations and view reports',
        hierarchy: 4,
        permissions: [],
        isSystemRole: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: new ObjectId(),
        name: 'faculty',
        displayName: 'Faculty Member',
        description: 'Teaching faculty with basic access',
        hierarchy: 5,
        permissions: [],
        isSystemRole: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: new ObjectId(),
        name: 'staff',
        displayName: 'Staff Member',
        description: 'Non-teaching staff with basic access',
        hierarchy: 6,
        permissions: [],
        isSystemRole: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    await db.collection('roles').insertMany(roles);
    console.log(`✓ Created ${roles.length} roles`);

    // 2. Generate Departments
    console.log('Generating departments...');
    const departments = [
      { name: 'Computer Science', description: 'Department of Computer Science and Information Technology' },
      { name: 'Mathematics', description: 'Department of Mathematics and Statistics' },
      { name: 'Engineering', description: 'Department of Engineering' },
      { name: 'Business Administration', description: 'Department of Business and Management' },
      { name: 'English', description: 'Department of English and Literature' },
      { name: 'Biology', description: 'Department of Biological Sciences' },
      { name: 'Chemistry', description: 'Department of Chemistry' },
      { name: 'Physics', description: 'Department of Physics' },
      { name: 'Human Resources', description: 'Human Resources Department' },
      { name: 'Finance', description: 'Finance and Accounting Department' },
      { name: 'IT Support', description: 'Information Technology Support' },
      { name: 'Administration', description: 'General Administration' },
    ];

    const departmentDocs = departments.map(dept => ({
      _id: new ObjectId(),
      name: dept.name,
      description: dept.description,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    await db.collection('departments').insertMany(departmentDocs);
    console.log(`✓ Created ${departmentDocs.length} departments`);

    // 3. Generate Teaching Personnel
    console.log('Generating teaching personnel...');
    const teachingPersonnel = [];
    const teachingDepts = departmentDocs.filter(d =>
      !['Human Resources', 'Finance', 'IT Support', 'Administration'].includes(d.name)
    );

    for (let i = 0; i < 50; i++) {
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      const email = faker.internet.email({ firstName, lastName }).toLowerCase();
      const hireDate = faker.date.past({ years: 10 });

      teachingPersonnel.push({
        _id: new ObjectId(),
        firstName,
        lastName,
        middleName: faker.helpers.maybe(() => faker.person.middleName(), { probability: 0.6 }),
        email,
        department: faker.helpers.arrayElement(teachingDepts)._id,
        jobTitle: faker.helpers.arrayElement([
          'Professor',
          'Associate Professor',
          'Assistant Professor',
          'Lecturer',
          'Senior Lecturer',
          'Instructor'
        ]),
        hireDate,
        phoneNumber: faker.phone.number(),
        gender: faker.helpers.arrayElement(['Male', 'Female', 'Other']),
        personnelType: 'Teaching',
        predictedPerformance: faker.helpers.arrayElement(['High', 'Medium', 'Low']),
        performanceStatus: faker.helpers.arrayElement(['Performing', 'Non-Performing']),
        excellenceStatus: faker.helpers.arrayElement(['Excellent', 'Good', 'Average', 'Below Average', 'Not Evaluated']),
        excellenceStartYear: 2018,
        excellenceEndYear: 2024,
        excellenceThreshold: 4.0,
        lastExcellenceCalculation: faker.date.recent({ days: 30 }),
        sixYearAverage: faker.number.float({ min: 2.5, max: 5.0, fractionDigits: 2 }),
        totalSemestersEvaluated: faker.number.int({ min: 1, max: 12 }),
        createdAt: hireDate,
        updatedAt: new Date(),
      });
    }

    await db.collection('personnels').insertMany(teachingPersonnel);
    console.log(`✓ Created ${teachingPersonnel.length} teaching personnel`);

    // 4. Generate Non-Teaching Personnel
    console.log('Generating non-teaching personnel...');
    const nonTeachingPersonnel = [];
    const nonTeachingDepts = departmentDocs.filter(d =>
      ['Human Resources', 'Finance', 'IT Support', 'Administration'].includes(d.name)
    );

    for (let i = 0; i < 30; i++) {
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      const email = faker.internet.email({ firstName, lastName }).toLowerCase();
      const hireDate = faker.date.past({ years: 10 });

      nonTeachingPersonnel.push({
        _id: new ObjectId(),
        firstName,
        lastName,
        middleName: faker.helpers.maybe(() => faker.person.middleName(), { probability: 0.6 }),
        email,
        department: faker.helpers.arrayElement(nonTeachingDepts)._id,
        jobTitle: faker.helpers.arrayElement([
          'HR Manager',
          'HR Assistant',
          'Accountant',
          'Finance Officer',
          'IT Specialist',
          'System Administrator',
          'Administrative Assistant',
          'Office Manager',
          'Registrar',
          'Administrative Clerk'
        ]),
        hireDate,
        phoneNumber: faker.phone.number(),
        gender: faker.helpers.arrayElement(['Male', 'Female', 'Other']),
        personnelType: 'Non-Teaching',
        predictedPerformance: faker.helpers.arrayElement(['High', 'Medium', 'Low']),
        performanceStatus: faker.helpers.arrayElement(['Performing', 'Non-Performing']),
        excellenceStatus: faker.helpers.arrayElement(['Excellent', 'Good', 'Average', 'Below Average', 'Not Evaluated']),
        excellenceStartYear: 2018,
        excellenceEndYear: 2024,
        excellenceThreshold: 4.0,
        lastExcellenceCalculation: faker.date.recent({ days: 30 }),
        sixYearAverage: faker.number.float({ min: 2.5, max: 5.0, fractionDigits: 2 }),
        totalSemestersEvaluated: faker.number.int({ min: 1, max: 12 }),
        createdAt: hireDate,
        updatedAt: new Date(),
      });
    }

    await db.collection('personnels').insertMany(nonTeachingPersonnel);
    console.log(`✓ Created ${nonTeachingPersonnel.length} non-teaching personnel`);

    // 5. Generate Users
    console.log('Generating users...');
    const users = [];
    const defaultPassword = await bcrypt.hash('password123', 12);

    // Get role references
    const superAdminRole = roles.find(r => r.name === 'super_admin');
    const adminRole = roles.find(r => r.name === 'admin');
    const departmentHeadRole = roles.find(r => r.name === 'department_head');
    const evaluatorRole = roles.find(r => r.name === 'evaluator');
    const facultyRole = roles.find(r => r.name === 'faculty');
    const staffRole = roles.find(r => r.name === 'staff');

    // Create 1 Super Admin
    users.push({
      _id: new ObjectId(),
      email: 'superadmin@jcd.edu',
      password: defaultPassword,
      firstName: 'Super',
      lastName: 'Admin',
      isActive: true,
      isEmailVerified: true,
      roles: [superAdminRole._id],
      department: faker.helpers.arrayElement(departmentDocs)._id,
      lastLoginAt: faker.date.recent({ days: 7 }),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Create 2 Admins
    for (let i = 1; i <= 2; i++) {
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      users.push({
        _id: new ObjectId(),
        email: `admin${i}@jcd.edu`,
        password: defaultPassword,
        firstName,
        lastName,
        isActive: true,
        isEmailVerified: true,
        roles: [adminRole._id],
        department: faker.helpers.arrayElement(departmentDocs)._id,
        lastLoginAt: faker.date.recent({ days: 30 }),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Create 12 Department Heads (one for each department)
    for (let i = 0; i < departmentDocs.length; i++) {
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      const deptName = departmentDocs[i].name.toLowerCase().replace(/\s+/g, '');
      users.push({
        _id: new ObjectId(),
        email: `head.${deptName}@jcd.edu`,
        password: defaultPassword,
        firstName,
        lastName,
        isActive: true,
        isEmailVerified: true,
        roles: [departmentHeadRole._id, evaluatorRole._id],
        department: departmentDocs[i]._id,
        lastLoginAt: faker.date.recent({ days: 14 }),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Create 15 Evaluators
    for (let i = 1; i <= 15; i++) {
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      const email = faker.internet.email({ firstName, lastName }).toLowerCase();
      users.push({
        _id: new ObjectId(),
        email,
        password: defaultPassword,
        firstName,
        lastName,
        isActive: faker.datatype.boolean(0.9), // 90% active
        isEmailVerified: faker.datatype.boolean(0.85),
        roles: [evaluatorRole._id],
        department: faker.helpers.arrayElement(departmentDocs)._id,
        lastLoginAt: faker.helpers.maybe(() => faker.date.recent({ days: 30 }), { probability: 0.7 }),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Create 30 Faculty Users (linked to teaching personnel)
    const teachingPersonnelSubset = faker.helpers.arrayElements(teachingPersonnel, 30);
    for (const person of teachingPersonnelSubset) {
      users.push({
        _id: new ObjectId(),
        email: person.email,
        password: defaultPassword,
        firstName: person.firstName,
        lastName: person.lastName,
        isActive: faker.datatype.boolean(0.95),
        isEmailVerified: faker.datatype.boolean(0.8),
        roles: [facultyRole._id],
        department: person.department,
        lastLoginAt: faker.helpers.maybe(() => faker.date.recent({ days: 60 }), { probability: 0.6 }),
        createdAt: person.createdAt,
        updatedAt: new Date(),
      });
    }

    // Create 20 Staff Users (linked to non-teaching personnel)
    const nonTeachingPersonnelSubset = faker.helpers.arrayElements(nonTeachingPersonnel, 20);
    for (const person of nonTeachingPersonnelSubset) {
      users.push({
        _id: new ObjectId(),
        email: person.email,
        password: defaultPassword,
        firstName: person.firstName,
        lastName: person.lastName,
        isActive: faker.datatype.boolean(0.95),
        isEmailVerified: faker.datatype.boolean(0.8),
        roles: [staffRole._id],
        department: person.department,
        lastLoginAt: faker.helpers.maybe(() => faker.date.recent({ days: 60 }), { probability: 0.6 }),
        createdAt: person.createdAt,
        updatedAt: new Date(),
      });
    }

    await db.collection('users').insertMany(users);
    console.log(`✓ Created ${users.length} users (password: password123)`);

    // 6. Generate Performance Evaluations for Teaching Personnel
    console.log('Generating performance evaluations for teaching personnel...');
    const performanceEvaluations = [];
    const semesters = [
      '2023-1st Semester',
      '2023-2nd Semester',
      '2024-1st Semester',
      '2024-2nd Semester',
      '2025-1st Semester',
    ];

    for (const person of teachingPersonnel) {
      // Generate 2-5 evaluations per teaching personnel
      const numEvaluations = faker.number.int({ min: 2, max: 5 });
      const selectedSemesters = faker.helpers.arrayElements(semesters, numEvaluations);

      for (const semester of selectedSemesters) {
        performanceEvaluations.push({
          _id: new ObjectId(),
          personnel: person._id,
          evaluationDate: faker.date.past({ years: 2 }),
          semester,
          scores: {
            PAA: faker.number.float({ min: 1, max: 5, fractionDigits: 2 }), // Performance and Achievement
            KSM: faker.number.float({ min: 1, max: 5, fractionDigits: 2 }), // Knowledge and Skills Mastery
            TS: faker.number.float({ min: 1, max: 5, fractionDigits: 2 }),  // Teaching Skills
            CM: faker.number.float({ min: 1, max: 5, fractionDigits: 2 }),  // Classroom Management
            AL: faker.number.float({ min: 1, max: 5, fractionDigits: 2 }),  // Attendance and Leave
            GO: faker.number.float({ min: 1, max: 5, fractionDigits: 2 }),  // Growth and Orientation
          },
          feedback: faker.helpers.maybe(() => faker.lorem.paragraph(), { probability: 0.7 }),
          evaluatedBy: faker.person.fullName(),
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }

    await db.collection('performanceevaluations').insertMany(performanceEvaluations);
    console.log(`✓ Created ${performanceEvaluations.length} performance evaluations`);

    // 7. Generate Non-Teaching Evaluations for Non-Teaching Personnel
    console.log('Generating non-teaching evaluations...');
    const nonTeachingEvaluations = [];

    for (const person of nonTeachingPersonnel) {
      // Generate 2-5 evaluations per non-teaching personnel
      const numEvaluations = faker.number.int({ min: 2, max: 5 });
      const selectedSemesters = faker.helpers.arrayElements(semesters, numEvaluations);

      for (const semester of selectedSemesters) {
        nonTeachingEvaluations.push({
          _id: new ObjectId(),
          personnel: person._id,
          evaluationDate: faker.date.past({ years: 2 }),
          semester,
          scores: {
            JK: faker.number.float({ min: 1, max: 5, fractionDigits: 2 }), // Job Knowledge
            WQ: faker.number.float({ min: 1, max: 5, fractionDigits: 2 }), // Work Quality
            PR: faker.number.float({ min: 1, max: 5, fractionDigits: 2 }), // Productivity
            TW: faker.number.float({ min: 1, max: 5, fractionDigits: 2 }), // Teamwork
            RL: faker.number.float({ min: 1, max: 5, fractionDigits: 2 }), // Reliability
            IN: faker.number.float({ min: 1, max: 5, fractionDigits: 2 }), // Initiative
          },
          feedback: faker.helpers.maybe(() => faker.lorem.paragraph(), { probability: 0.7 }),
          evaluatedBy: faker.person.fullName(),
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }

    await db.collection('nonteachingevaluations').insertMany(nonTeachingEvaluations);
    console.log(`✓ Created ${nonTeachingEvaluations.length} non-teaching evaluations`);

    // 8. Generate Evaluation Forms
    console.log('Generating evaluation forms...');
    const evaluationForms = [
      {
        _id: new ObjectId(),
        name: 'Teaching Performance Evaluation Form - 2024',
        audience: 'teaching',
        description: 'Standard teaching performance evaluation form for academic year 2024',
        evaluatorOptions: ['Department Head', 'Dean', 'Peer Review', 'Student Evaluation'],
        scale: [
          { value: 5, label: 'Outstanding' },
          { value: 4, label: 'Very Good' },
          { value: 3, label: 'Good' },
          { value: 2, label: 'Fair' },
          { value: 1, label: 'Needs Improvement' },
        ],
        sections: [
          {
            title: 'Performance and Achievement',
            items: [
              'Demonstrates excellent subject matter expertise',
              'Achieves learning outcomes consistently',
              'Shows innovation in teaching methods',
            ],
          },
          {
            title: 'Teaching Skills',
            items: [
              'Delivers clear and engaging lectures',
              'Uses appropriate teaching materials',
              'Encourages student participation',
            ],
          },
          {
            title: 'Classroom Management',
            items: [
              'Maintains discipline effectively',
              'Creates inclusive learning environment',
              'Manages time efficiently',
            ],
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: new ObjectId(),
        name: 'Non-Teaching Staff Evaluation Form - 2024',
        audience: 'non-teaching',
        description: 'Standard evaluation form for non-teaching staff members',
        evaluatorOptions: ['Direct Supervisor', 'Department Head', 'HR Manager'],
        scale: [
          { value: 5, label: 'Exceptional' },
          { value: 4, label: 'Exceeds Expectations' },
          { value: 3, label: 'Meets Expectations' },
          { value: 2, label: 'Below Expectations' },
          { value: 1, label: 'Unsatisfactory' },
        ],
        sections: [
          {
            title: 'Job Knowledge',
            items: [
              'Demonstrates thorough understanding of job requirements',
              'Keeps up-to-date with relevant procedures',
              'Applies knowledge effectively',
            ],
          },
          {
            title: 'Work Quality and Productivity',
            items: [
              'Produces accurate and high-quality work',
              'Completes tasks in timely manner',
              'Manages workload efficiently',
            ],
          },
          {
            title: 'Teamwork and Reliability',
            items: [
              'Collaborates well with colleagues',
              'Is dependable and punctual',
              'Shows initiative and takes ownership',
            ],
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    await db.collection('evaluationforms').insertMany(evaluationForms);
    console.log(`✓ Created ${evaluationForms.length} evaluation forms`);

    console.log('\n=== Fake Data Generation Complete ===');
    console.log(`Summary:`);
    console.log(`- Roles: ${roles.length}`);
    console.log(`- Departments: ${departmentDocs.length}`);
    console.log(`- Teaching Personnel: ${teachingPersonnel.length}`);
    console.log(`- Non-Teaching Personnel: ${nonTeachingPersonnel.length}`);
    console.log(`- Users: ${users.length} (default password: password123)`);
    console.log(`- Performance Evaluations: ${performanceEvaluations.length}`);
    console.log(`- Non-Teaching Evaluations: ${nonTeachingEvaluations.length}`);
    console.log(`- Evaluation Forms: ${evaluationForms.length}`);
    console.log(`\nUser Breakdown:`);
    console.log(`  - Super Admins: 1 (superadmin@jcd.edu)`);
    console.log(`  - Admins: 2 (admin1@jcd.edu, admin2@jcd.edu)`);
    console.log(`  - Department Heads: 12 (head.{department}@jcd.edu)`);
    console.log(`  - Evaluators: 15`);
    console.log(`  - Faculty: 30`);
    console.log(`  - Staff: 20`);
    console.log(`=====================================\n`);
  },

  async down(db) {
    console.log('Rolling back fake data...');

    // Remove all seeded data
    await db.collection('roles').deleteMany({});
    await db.collection('departments').deleteMany({});
    await db.collection('personnels').deleteMany({});
    await db.collection('users').deleteMany({});
    await db.collection('performanceevaluations').deleteMany({});
    await db.collection('nonteachingevaluations').deleteMany({});
    await db.collection('evaluationforms').deleteMany({});

    console.log('✓ Rollback complete');
  }
};

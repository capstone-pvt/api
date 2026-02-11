const { faker } = require('@faker-js/faker');
const { ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');

module.exports = {
  async up(db) {
    console.log('Starting data seeding...');

    // 1. Generate Roles
    console.log('Generating roles...');
    const roles = [
      {
        _id: new ObjectId(),
        name: 'super',
        displayName: 'Super Administrator',
        description: 'Full system access with all permissions',
        hierarchy: 0,
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
        hierarchy: 1,
        permissions: [],
        isSystemRole: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: new ObjectId(),
        name: 'president',
        displayName: 'President',
        description: 'University president with full administrative authority',
        hierarchy: 2,
        permissions: [],
        isSystemRole: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: new ObjectId(),
        name: 'vp-acad',
        displayName: 'VP Academic Affairs',
        description: 'Vice President for Academic Affairs',
        hierarchy: 3,
        permissions: [],
        isSystemRole: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: new ObjectId(),
        name: 'dean',
        displayName: 'Dean',
        description: 'College dean with department management permissions',
        hierarchy: 4,
        permissions: [],
        isSystemRole: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: new ObjectId(),
        name: 'hr',
        displayName: 'Human Resources',
        description: 'Human Resources personnel',
        hierarchy: 5,
        permissions: [],
        isSystemRole: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: new ObjectId(),
        name: 'teaching',
        displayName: 'Teaching',
        description: 'Teaching faculty member',
        hierarchy: 6,
        permissions: [],
        isSystemRole: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: new ObjectId(),
        name: 'non-teaching',
        displayName: 'Non-Teaching',
        description: 'Non-teaching staff member',
        hierarchy: 7,
        permissions: [],
        isSystemRole: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: new ObjectId(),
        name: 'student',
        displayName: 'Student',
        description: 'Student evaluator',
        hierarchy: 8,
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
    const departmentDocs = [
      {
        _id: new ObjectId(),
        name: 'College of Computing and Information Sciences',
        description: 'College of Computing and Information Sciences',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: new ObjectId(),
        name: 'College of Criminal Justice Education',
        description: 'College of Criminal Justice Education',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: new ObjectId(),
        name: 'College of Arts and Sciences',
        description: 'College of Arts and Sciences',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: new ObjectId(),
        name: 'College of Teachers Education',
        description: 'College of Teachers Education',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: new ObjectId(),
        name: 'College of Business and Accountancy',
        description: 'College of Business and Accountancy',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: new ObjectId(),
        name: 'College of Tourism and Hospitality Management',
        description: 'College of Tourism and Hospitality Management',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    await db.collection('departments').insertMany(departmentDocs);
    console.log(`✓ Created ${departmentDocs.length} departments`);

    // Helpers
    const getDept = (name) => departmentDocs.find((d) => d.name === name);
    const getRole = (name) => roles.find((r) => r.name === name);

    const makePersonnel = (firstName, lastName, middleName, email, deptId, jobTitle, gender, type) => ({
      _id: new ObjectId(),
      firstName,
      lastName,
      middleName: middleName || null,
      email,
      department: deptId,
      jobTitle,
      hireDate: new Date('2020-01-15'),
      phoneNumber: '',
      gender,
      personnelType: type,
      predictedPerformance: null,
      performanceStatus: null,
      excellenceStatus: 'Not Evaluated',
      excellenceStartYear: 2018,
      excellenceEndYear: 2024,
      excellenceThreshold: 4.0,
      lastExcellenceCalculation: null,
      sixYearAverage: null,
      totalSemestersEvaluated: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // 3. Generate Personnel
    console.log('Generating personnel...');

    // --- Named personnel (deans, HR, VP, president) ---
    const personnel = [
      makePersonnel('Daisa', 'Gupit', 'O.', 'daisa.gupit@jcd.edu', getDept('College of Computing and Information Sciences')._id, 'Dean', 'Female', 'Teaching'),
      makePersonnel('Jun', 'Villarima', null, 'jun.villarima@jcd.edu', getDept('College of Criminal Justice Education')._id, 'Dean', 'Male', 'Teaching'),
      makePersonnel('Rolly', 'Lianos', null, 'rolly.lianos@jcd.edu', getDept('College of Arts and Sciences')._id, 'Dean', 'Male', 'Teaching'),
      makePersonnel('Melissa', 'Maloloy-on', null, 'melissa.maloloyon@jcd.edu', getDept('College of Teachers Education')._id, 'Dean', 'Female', 'Teaching'),
      makePersonnel('Russel', 'Coraza', null, 'russel.coraza@jcd.edu', getDept('College of Business and Accountancy')._id, 'Dean', 'Male', 'Teaching'),
      makePersonnel('Angelyn', 'Paquera', null, 'angelyn.paquera@jcd.edu', getDept('College of Tourism and Hospitality Management')._id, 'Dean', 'Female', 'Teaching'),
      makePersonnel('Ricky', 'Destacamento', 'A.', 'ricky.destacamento@jcd.edu', null, 'HR Officer', 'Male', 'Non-Teaching'),
      makePersonnel('Beverly', 'Jaminal', null, 'beverly.jaminal@jcd.edu', null, 'VP for Academic Affairs', 'Female', 'Non-Teaching'),
      makePersonnel('Ronniel', 'Babano', null, 'ronniel.babano@jcd.edu', null, 'President', 'Male', 'Non-Teaching'),
    ];

    // --- 3 Teaching personnel per department (18 total) ---
    const teachingPersonnel = [];
    const teachingJobTitles = ['Professor', 'Associate Professor', 'Assistant Professor', 'Lecturer', 'Senior Lecturer', 'Instructor'];

    for (const dept of departmentDocs) {
      for (let i = 0; i < 3; i++) {
        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName();
        const gender = faker.helpers.arrayElement(['Male', 'Female']);
        const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@jcd.edu`.replace(/\s+/g, '');
        const p = makePersonnel(firstName, lastName, null, email, dept._id, faker.helpers.arrayElement(teachingJobTitles), gender, 'Teaching');
        teachingPersonnel.push(p);
        personnel.push(p);
      }
    }

    // --- 5 Non-teaching personnel ---
    const nonTeachingPersonnel = [];
    const nonTeachingJobTitles = ['Administrative Assistant', 'Registrar', 'Accounting Staff', 'IT Support', 'Library Staff'];

    for (let i = 0; i < 5; i++) {
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      const gender = faker.helpers.arrayElement(['Male', 'Female']);
      const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@jcd.edu`.replace(/\s+/g, '');
      const dept = faker.helpers.arrayElement(departmentDocs);
      const p = makePersonnel(firstName, lastName, null, email, dept._id, nonTeachingJobTitles[i], gender, 'Non-Teaching');
      nonTeachingPersonnel.push(p);
      personnel.push(p);
    }

    // --- 10 Students per department (60 total) ---
    const studentPersonnel = [];
    const gradeLevels = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

    for (const dept of departmentDocs) {
      for (let i = 0; i < 10; i++) {
        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName();
        const gender = faker.helpers.arrayElement(['Male', 'Female']);
        const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@jcd.edu`.replace(/\s+/g, '');
        const s = {
          _id: new ObjectId(),
          firstName,
          lastName,
          middleName: null,
          email,
          department: dept._id,
          jobTitle: 'Student',
          hireDate: null,
          phoneNumber: '',
          gender,
          personnelType: 'Student',
          predictedPerformance: null,
          performanceStatus: null,
          excellenceStatus: 'Not Evaluated',
          excellenceStartYear: null,
          excellenceEndYear: null,
          excellenceThreshold: null,
          lastExcellenceCalculation: null,
          sixYearAverage: null,
          totalSemestersEvaluated: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        studentPersonnel.push(s);
        personnel.push(s);
      }
    }

    await db.collection('personnels').insertMany(personnel);
    console.log(`✓ Created ${personnel.length} personnel (9 named + ${teachingPersonnel.length} teaching + ${nonTeachingPersonnel.length} non-teaching + ${studentPersonnel.length} students)`);

    // 4. Generate Users
    console.log('Generating users...');
    const defaultPassword = await bcrypt.hash('P@ssw0rd123', 12);

    const superRole = getRole('super');
    const adminRole = getRole('admin');
    const deanRole = getRole('dean');
    const hrRole = getRole('hr');
    const vpAcadRole = getRole('vp-acad');
    const presidentRole = getRole('president');
    const teachingRole = getRole('teaching');
    const nonTeachingRole = getRole('non-teaching');
    const studentRole = getRole('student');

    const makeUser = (email, firstName, lastName, roleIds, deptId) => ({
      _id: new ObjectId(),
      email,
      password: defaultPassword,
      firstName,
      lastName,
      isActive: true,
      isEmailVerified: true,
      roles: roleIds,
      department: deptId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const users = [
      // Super Admin
      makeUser('superadmin@jcd.edu', 'Super', 'Admin', [superRole._id], null),
      // Admin
      makeUser('admin@jcd.edu', 'System', 'Admin', [adminRole._id], null),
      // President
      makeUser('ronniel.babano@jcd.edu', 'Ronniel', 'Babano', [presidentRole._id], null),
      // VP Academic
      makeUser('beverly.jaminal@jcd.edu', 'Beverly', 'Jaminal', [vpAcadRole._id], null),
      // Deans
      makeUser('daisa.gupit@jcd.edu', 'Daisa', 'Gupit', [deanRole._id], getDept('College of Computing and Information Sciences')._id),
      makeUser('jun.villarima@jcd.edu', 'Jun', 'Villarima', [deanRole._id], getDept('College of Criminal Justice Education')._id),
      makeUser('rolly.lianos@jcd.edu', 'Rolly', 'Lianos', [deanRole._id], getDept('College of Arts and Sciences')._id),
      makeUser('melissa.maloloyon@jcd.edu', 'Melissa', 'Maloloy-on', [deanRole._id], getDept('College of Teachers Education')._id),
      makeUser('russel.coraza@jcd.edu', 'Russel', 'Coraza', [deanRole._id], getDept('College of Business and Accountancy')._id),
      makeUser('angelyn.paquera@jcd.edu', 'Angelyn', 'Paquera', [deanRole._id], getDept('College of Tourism and Hospitality Management')._id),
      // HR
      makeUser('ricky.destacamento@jcd.edu', 'Ricky', 'Destacamento', [hrRole._id], null),
    ];

    // Teaching users
    for (const p of teachingPersonnel) {
      users.push(makeUser(p.email, p.firstName, p.lastName, [teachingRole._id], p.department));
    }

    // Non-teaching users
    for (const p of nonTeachingPersonnel) {
      users.push(makeUser(p.email, p.firstName, p.lastName, [nonTeachingRole._id], p.department));
    }

    // Student users
    for (const s of studentPersonnel) {
      users.push(makeUser(s.email, s.firstName, s.lastName, [studentRole._id], s.department));
    }

    await db.collection('users').insertMany(users);
    console.log(`✓ Created ${users.length} users (password: P@ssw0rd123)`);

    // 5. Generate Evaluation Forms
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

    console.log('\n=== Data Seeding Complete ===');
    console.log(`Summary:`);
    console.log(`- Roles: ${roles.length} (super, admin, president, vp-acad, dean, hr, teaching, non-teaching, student)`);
    console.log(`- Departments: ${departmentDocs.length}`);
    console.log(`- Personnel: ${personnel.length} (9 named + 18 teaching + 5 non-teaching + 60 students)`);
    console.log(`- Users: ${users.length} (default password: P@ssw0rd123)`);
    console.log(`- Evaluation Forms: ${evaluationForms.length}`);
    console.log(`\nNamed User Accounts:`);
    console.log(`  - Super Admin: superadmin@jcd.edu`);
    console.log(`  - Admin: admin@jcd.edu`);
    console.log(`  - President: ronniel.babano@jcd.edu`);
    console.log(`  - VP Academic: beverly.jaminal@jcd.edu`);
    console.log(`  - Dean CCIS: daisa.gupit@jcd.edu`);
    console.log(`  - Dean CCJE: jun.villarima@jcd.edu`);
    console.log(`  - Dean CAS: rolly.lianos@jcd.edu`);
    console.log(`  - Dean CTE: melissa.maloloyon@jcd.edu`);
    console.log(`  - Dean CBA: russel.coraza@jcd.edu`);
    console.log(`  - Dean CTHM: angelyn.paquera@jcd.edu`);
    console.log(`  - HR: ricky.destacamento@jcd.edu`);
    console.log(`  + ${teachingPersonnel.length} teaching faculty users`);
    console.log(`  + ${nonTeachingPersonnel.length} non-teaching staff users`);
    console.log(`  + ${studentPersonnel.length} student users`);
    console.log(`=====================================\n`);
  },

  async down(db) {
    console.log('Rolling back seeded data...');

    await db.collection('roles').deleteMany({});
    await db.collection('departments').deleteMany({});
    await db.collection('personnels').deleteMany({});
    await db.collection('users').deleteMany({});
    await db.collection('performanceevaluations').deleteMany({});
    await db.collection('nonteachingevaluations').deleteMany({});
    await db.collection('evaluationforms').deleteMany({});

    console.log('✓ Rollback complete');
  },
};

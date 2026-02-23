const { faker } = require('@faker-js/faker');
const { ObjectId } = require('mongodb');

module.exports = {
  async up(db) {
    console.log('Adding teaching personnel (5 per department)...');

    // Get all departments
    const departments = await db.collection('departments').find().toArray();

    if (departments.length === 0) {
      console.log('No departments found, skipping...');
      return;
    }

    console.log(`Found ${departments.length} departments`);

    const teachingJobTitles = [
      'Professor',
      'Associate Professor',
      'Assistant Professor',
      'Lecturer',
      'Senior Lecturer',
      'Instructor',
    ];

    const personnel = [];

    // Add 5 teaching personnel per department
    for (const dept of departments) {
      console.log(`Adding teaching personnel for ${dept.name}...`);

      for (let i = 0; i < 5; i++) {
        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName();
        const gender = faker.helpers.arrayElement(['Male', 'Female']);
        const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@jcd.edu`.replace(/\s+/g, '');

        // Check if email already exists
        const existingPersonnel = await db.collection('personnels').findOne({ email });
        if (existingPersonnel) {
          console.log(`  - Skipping ${email} (already exists)`);
          continue;
        }

        const person = {
          _id: new ObjectId(),
          firstName,
          lastName,
          middleName: null,
          email,
          department: dept._id,
          jobTitle: faker.helpers.arrayElement(teachingJobTitles),
          hireDate: faker.date.past({ years: 5 }),
          phoneNumber: faker.phone.number(),
          gender,
          personnelType: 'Teaching',
          predictedPerformance: null,
          performanceStatus: null,
          excellenceStatus: 'Not Evaluated',
          excellenceStartYear: 2018,
          excellenceEndYear: 2024,
          excellenceThreshold: 4.0,
          lastExcellenceCalculation: null,
          sixYearAverage: null,
          totalSemestersEvaluated: 0,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        personnel.push(person);
      }
    }

    if (personnel.length > 0) {
      await db.collection('personnels').insertMany(personnel);
      console.log(`✓ Created ${personnel.length} teaching personnel`);
    } else {
      console.log('All teaching personnel already exist, no new records created');
    }

    // Summary
    const summary = {};
    for (const dept of departments) {
      const count = await db.collection('personnels').countDocuments({
        department: dept._id,
        personnelType: 'Teaching',
        jobTitle: { $ne: 'Dean' }, // Exclude Deans from the count
      });
      summary[dept.name] = count;
    }

    console.log('\nTeaching personnel per department (excluding Deans):');
    for (const [deptName, count] of Object.entries(summary)) {
      console.log(`  - ${deptName}: ${count} teaching personnel`);
    }
  },

  async down(db) {
    console.log('Removing teaching personnel added by this migration...');

    // This is a simple approach - remove all teaching personnel
    // In a real scenario, you might want to track which records were added by this migration
    console.log('Note: This will remove ALL teaching personnel except Deans');
    console.log('Skipping down migration to preserve data integrity');

    // If you really want to remove them, uncomment below:
    // const result = await db.collection('personnels').deleteMany({
    //   personnelType: 'Teaching',
    //   jobTitle: { $ne: 'Dean' },
    // });
    // console.log(`Removed ${result.deletedCount} teaching personnel`);
  }
};

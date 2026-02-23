const { ObjectId } = require('mongodb');

module.exports = {
  async up(db) {
    console.log('Cleaning up teaching personnel to keep only 5 per department...');

    // Get all departments
    const departments = await db.collection('departments').find().toArray();

    if (departments.length === 0) {
      console.log('No departments found, skipping...');
      return;
    }

    let totalRemoved = 0;

    for (const dept of departments) {
      console.log(`\nProcessing ${dept.name}...`);

      // Get all teaching personnel for this department (excluding Deans)
      const teachingPersonnel = await db.collection('personnels')
        .find({
          department: dept._id,
          personnelType: 'Teaching',
          jobTitle: { $ne: 'Dean' },
        })
        .sort({ createdAt: -1 }) // Keep the most recently created ones
        .toArray();

      console.log(`  Found ${teachingPersonnel.length} teaching personnel`);

      if (teachingPersonnel.length > 5) {
        // Keep only the first 5 (most recent), remove the rest
        const toKeep = teachingPersonnel.slice(0, 5);
        const toRemove = teachingPersonnel.slice(5);

        console.log(`  Keeping ${toKeep.length}, removing ${toRemove.length}`);

        // Get IDs to remove
        const idsToRemove = toRemove.map(p => p._id);

        // Remove the excess personnel
        const result = await db.collection('personnels').deleteMany({
          _id: { $in: idsToRemove }
        });

        console.log(`  ✓ Removed ${result.deletedCount} teaching personnel`);
        totalRemoved += result.deletedCount;

        // Log who we removed
        toRemove.forEach(p => {
          console.log(`    - ${p.firstName} ${p.lastName} (${p.jobTitle})`);
        });
      } else {
        console.log(`  No cleanup needed (already has ${teachingPersonnel.length} or fewer)`);
      }
    }

    console.log(`\n✓ Total teaching personnel removed: ${totalRemoved}`);

    // Final summary
    console.log('\nFinal teaching personnel per department (excluding Deans):');
    for (const dept of departments) {
      const count = await db.collection('personnels').countDocuments({
        department: dept._id,
        personnelType: 'Teaching',
        jobTitle: { $ne: 'Dean' },
      });
      console.log(`  - ${dept.name}: ${count} teaching personnel`);
    }
  },

  async down(db) {
    console.log('This migration cannot be rolled back as it removes data.');
    console.log('Please restore from backup if needed.');
  }
};

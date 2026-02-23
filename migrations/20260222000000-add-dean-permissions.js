module.exports = {
  async up(db) {
    console.log('Adding permissions to Dean role...');

    // Get the Dean role
    const deanRole = await db.collection('roles').findOne({ name: 'dean' });

    if (!deanRole) {
      console.log('Dean role not found, skipping...');
      return;
    }

    // Get permission IDs for the permissions we want to add (manage users in own department)
    const permissionNames = [
      'evaluation-forms.read',
      'subjects.create',
      'subjects.read',
      'subjects.update',
      'subjects.delete',
      'users.read',
      'users.create',
      'users.update',
      'users.delete',
    ];

    const permissions = await db.collection('permissions')
      .find({ name: { $in: permissionNames } })
      .toArray();

    if (permissions.length === 0) {
      console.log('No permissions found, they may need to be created first');
      return;
    }

    const permissionIds = permissions.map(p => p._id);

    // Update the Dean role with these permissions
    await db.collection('roles').updateOne(
      { name: 'dean' },
      {
        $addToSet: {
          permissions: { $each: permissionIds }
        },
        $set: {
          updatedAt: new Date()
        }
      }
    );

    console.log(`Added ${permissionIds.length} permissions to Dean role`);
  },

  async down(db) {
    console.log('Removing permissions from Dean role...');

    const permissionNames = [
      'evaluation-forms.read',
      'subjects.create',
      'subjects.read',
      'subjects.update',
      'subjects.delete',
      'users.read',
      'users.create',
      'users.update',
      'users.delete',
    ];

    const permissions = await db.collection('permissions')
      .find({ name: { $in: permissionNames } })
      .toArray();

    if (permissions.length === 0) {
      console.log('No permissions found to remove');
      return;
    }

    const permissionIds = permissions.map(p => p._id);

    await db.collection('roles').updateOne(
      { name: 'dean' },
      {
        $pull: {
          permissions: { $in: permissionIds }
        },
        $set: {
          updatedAt: new Date()
        }
      }
    );

    console.log(`Removed ${permissionIds.length} permissions from Dean role`);
  }
};

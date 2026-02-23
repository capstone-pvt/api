module.exports = {
  async up(db) {
    console.log('Adding users.create, users.update, users.delete to Dean role...');

    const deanRole = await db.collection('roles').findOne({ name: 'dean' });
    if (!deanRole) {
      console.log('Dean role not found, skipping.');
      return;
    }

    const permissionNames = ['users.create', 'users.update', 'users.delete'];
    const permissions = await db
      .collection('permissions')
      .find({ name: { $in: permissionNames } })
      .toArray();

    if (permissions.length === 0) {
      console.log('Permissions not found, run seed first.');
      return;
    }

    const permissionIds = permissions.map((p) => p._id);
    await db.collection('roles').updateOne(
      { name: 'dean' },
      {
        $addToSet: { permissions: { $each: permissionIds } },
        $set: { updatedAt: new Date() },
      },
    );
    console.log(`Added ${permissionIds.length} user-management permissions to Dean role.`);
  },

  async down(db) {
    const permissionNames = ['users.create', 'users.update', 'users.delete'];
    const permissions = await db
      .collection('permissions')
      .find({ name: { $in: permissionNames } })
      .toArray();
    if (permissions.length === 0) return;
    const permissionIds = permissions.map((p) => p._id);
    await db.collection('roles').updateOne(
      { name: 'dean' },
      {
        $pull: { permissions: { $in: permissionIds } },
        $set: { updatedAt: new Date() },
      },
    );
    console.log('Removed user-management permissions from Dean role.');
  },
};

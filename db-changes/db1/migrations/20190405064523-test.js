module.exports = {
  up(db) {
    // TODO write your migration here. Return a Promise (and/or use async & await).
    // See https://github.com/seppevs/migrate-mongo/#creating-a-new-migration-script
    // Example:
    return db.collection('users').insertOne({ firstName: 'John', lastName: 'Doe' });
  },

  down(db) {
    // TODO write the statements to rollback your migration (if possible)
    // Example:
    return db.collection('users').deleteOne({ firstName: 'John', lastName: 'Doe' });
  }
};

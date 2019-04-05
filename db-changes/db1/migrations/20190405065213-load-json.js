const fs = require('fs');
const path = require('path');
const userData = fs.readFileSync(path.resolve(__dirname, 'data.json'), 'utf8');
const users = JSON.parse(userData);

module.exports = {
  async up(db) {
    for (const user of users) {
      await db.collection('users').insertOne(user);
    }    
  },

  async down(db) {
    for (const user of users) {
      await db.collection('users').deleteOne(user);
    }
  }
};

# Mongo Nomad

This is a MongoDB database migration tool which builds on top of [`migrate-mongo`][migrate-mongo] node module.
With this tool, we can automated the following MongoDB migration related tasks:

- initializing migration configuration for a database
- generating migration script files
- showing migration configuration for all or one database
- running pending migration of all managed databases or a specific database
- rolling back the previously applied migrations in a database
- displaying migration status of all or one database

## Prerequisites

- Node.js

## Getting Started

```bash
npm install
npm run migration:up
```

## Naming Conventions

Under the `db-changes` folder, the sub-directories are named after MongoDB database names, which
can be on different MongoDB servers or clusters. Each database has its own migration configuration file
named `migration-mongo-config.js` in the database folder. Migration scripts are kept in the `migrations`
sub-directory under the database directory.

## Initializing the Configuration for a New Database

```bash
# Create new migration configuration in db-changes/db_name
npm run migration:init -- db_name
```

_Note: A space is **required** after `--`._

A file named `migration-mongo-config.js` will be created in `db-changes/db_name`. See the instructions
in that file to change the default configurations.

## Writing Migration Scripts

The migration scripts are written in JavaScript. A a new migration script can be generated
using the following command:

```bash
npm run migration:create -- db_name migration_script_name
```

A new migration script will be created in `db-changes/db_name/migrations` directory. The migration script name is
prefixed with a timestamp, e.g. `20190405080522-migration_script_name.js`.

A migration script consists of two callback function, one for up migration and the other for down migration.
Each callback function expects a MongoDB client reference as a parameter, which can be used to perform MongoDB
operations. The callback functions return a Promise, which is created using MongoDB client with the API similar
to Mongo CLI commands.

```JavaScript
module.exports = {
  up(db) {
    // TODO write your migration here. Return a Promise (and/or use async & await).
    // See https://github.com/seppevs/migrate-mongo/#creating-a-new-migration-script
    // Example:
    // return db.collection('albums').updateOne({artist: 'The Beatles'}, {$set: {blacklisted: true}});
  },

  down(db) {
    // TODO write the statements to rollback your migration (if possible)
    // Example:
    // return db.collection('albums').updateOne({artist: 'The Beatles'}, {$set: {blacklisted: false}});
  }
};
```

The callback functions can also be written in async/await fashion to perform multiple MongoDB operations
in one migration. For example,

```JavaScript
module.exports = {
  async up(db) {
    await db.collection('albums').updateOne({artist: 'The Beatles'}, {$set: {blacklisted: true}});
    await db.collection('albums').updateOne({artist: 'The Doors'}, {$set: {stars: 5}});
  },

  async down(db) {
    await db.collection('albums').updateOne({artist: 'The Doors'}, {$set: {stars: 0}});
    await db.collection('albums').updateOne({artist: 'The Beatles'}, {$set: {blacklisted: false}});
  },
};
```

_Gotcha: For iterative operations, don't use `forEach` function in async function; use regular `for of` loop instead._

## Running Migrations in All Databases

```bash
# Run pending migrations in all managed databases
npm run migration:up
```

## Running Migrations in One Database

```bash
# Run all pending migrations in db-changes/db_name
npm run migration:up -- db_name
```

## Reverting the Last Migration in a Database

```bash
# Roll back last migration in db-changes/db_name
npm run migration:down -- db_name
```

The above command can be run multiple times to revert several recently applied migrations.

## Displaying Migration Status

```bash
# Show migration status in all databases
npm run migration:status

# Show migration status in one database
npm run migration:status -- db_name
```

## Dry-Running Migrations in a Database

To dry run migrations, a local MongoDB instance needs to be running. A testing database named `dry_run`
will be created to store changelog and testing results. Use the following command to dry run migrations
in a database.

```bash
npm run migration:dryrun -- db_name
```

_Note: For update migrations, data initialization may be needed in `dry_run` database._

To rollback a dry-run migration,

```bash
npm run migration:dryrun -- db_name rollback
```

## Credits

[migrate-mongo]: (https://github.com/seppevs/migrate-mongo)

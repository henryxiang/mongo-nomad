#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const {
  database,
  config,
  create,
  init,
  up,
  down,
  status
} = require('migrate-mongo');

const commands = ['up', 'down', 'status', 'config', 'create', 'init', 'dryrun'];
const dbChangeBase = path.resolve(__dirname, '..', 'db-changes');
const configFile = 'migrate-mongo-config.js';
const [cmd, db, option] = process.argv.slice(2, 5);
const allDbs = [];
if (!db) {
  fs.readdirSync(dbChangeBase).forEach(d => allDbs.push(d)); 
} else {
  allDbs.push(db);
}
// console.log('Databases:', allDbs);
// console.log(database, config);

main();


/**
 *  The main routine
 */
async function main() {
  try {
    switch(cmd) {
      case commands[0]:  // run migration(s)
        for (const db of allDbs) {
          const dbDir = path.resolve(dbChangeBase, db);
          await runMigration(dbDir);
        }
        break;
      case commands[1]:  // rollback last migration
        if (!db) {
          throw new Error('No database specified');
        }
        await rollBackLastMigration(path.resolve(dbChangeBase, db));
        break;
      case commands[2]:  // show migration status
        for (const db of allDbs) {
          const dbDir = path.resolve(dbChangeBase, db);
          await showStatus(dbDir);
        }
        break;
      case commands[3]:  // show migration config
        for (const db of allDbs) {
          const dbDir = path.resolve(dbChangeBase, db);
          await showConfig(dbDir);
        }
        break;
      case commands[4]:  // create new migration
        if (!db) {
          throw new Error('No database specified');
        }
        await createNewMigration(path.resolve(dbChangeBase, db), option);
        break;
      case commands[5]:  // initialize migration configuration of a new database
        if (!db) {
          throw new Error('No database specified');
        }
        await initConfig(db);
        break;
      case commands[6]:  // dry run migration in a database
        if (!db) {
          throw new Error('No database specified');
        }
        await dryRun(db, option);
        break;
      default:
        console.error(`
          Unknown command: ${cmd}
          Allowed commands: [ ${commands.join(" | ")} ]
        `);
    }
  } catch (error) {
    console.log(error);
  }
  process.exit();
}

/**
 * Run MongoDB migration in the migration base directory
 * @param {string} baseDir - migration base directory
 */
async function runMigration(baseDir) {
  try {
    process.chdir(baseDir);
    console.log(`Running migrations in ${baseDir}`);
    const db = await database.connect();
    const migrated = await up(db);
    migrated.forEach(fileName => console.log('Migrated:', fileName));
    db.close();
  } catch (error) {
    console.error(error);
  }
}

/**
 * Roll back last migration in the migration base directory
 * @param {string} baseDir - migration base directory
 */
async function rollBackLastMigration(baseDir) {
  try {
    process.chdir(baseDir);
    console.info(`## Rolling back last migration in ${baseDir} ##`);
    const db = await database.connect();
    const migrated = await down(db);
    migrated.forEach(fileName => console.log('Migrated Down:', fileName));
    db.close();
  } catch (error) {
    console.error(error);
  }
}

/**
 * Show migration configuration in the base directory
 * @param {string} baseDir - migration base directory
 */
async function showConfig(baseDir) {
  try {
    process.chdir(baseDir);
    console.info(`## Migration configuration in ${baseDir} ##`);
    const configSettings = await config.read();
    console.info(configSettings);
  } catch (error) {
    console.error(error);
  }
}

/**
 * Show migration status in the base directory
 * @param {string} baseDir - migration base directory 
 */
async function showStatus(baseDir) {
  try {
    process.chdir(baseDir);
    console.info(`## Migration status in ${baseDir} ##`);
    const db = await database.connect();
    const migrationStatus = await status(db);
    if(!migrationStatus || migrationStatus.length === 0) {
      console.info("No migrations");
    }
    migrationStatus.forEach(status => console.info(JSON.stringify(status)));
    db.close();
  } catch (error) {
    console.error(error);
  }
}

/**
 * Create a new migration file in the base directory
 * @param {*} baseDir - migration base directory
 * @param {string} description - short description of migration
 */
async function createNewMigration(baseDir, description = '') {
  try {
    process.chdir(baseDir);
    console.info(`## Creating new migration file in ${baseDir} ##`);
    const fileName = await create(description);
    console.info('Created:', path.resolve(baseDir, fileName));
  } catch (error) {
    console.error(error);
  }
}

/**
 * Initialize the migration configuration for a new database
 * @param {string} dbName 
 */
async function initConfig(dbName) {
  const baseDir = path.resolve(dbChangeBase, dbName);
  if (fs.existsSync(baseDir)) {
    throw new Error(`Directory already exists: ${baseDir}`);
  }
  console.info(`## Initializing configuration in ${baseDir} ##`);
  fs.mkdirSync(baseDir);
  process.chdir(baseDir);
  await init();
  let config = fs.readFileSync(path.resolve(baseDir, configFile), 'utf8');
  config = config.replace(/YOURDATABASENAME/m, dbName);
  fs.writeFileSync(path.resolve(baseDir, configFile), config, 'utf8');
  console.info('Created:', fs.readdirSync(baseDir));
}

/**
 * Dry run migrations in a database
 * @param {string} dbName - database name
 * @param {string} rollback 
 */
async function dryRun(dbName, rollback = '') {
  const baseDir = path.resolve(dbChangeBase, dbName);
  process.chdir(baseDir);
  fs.copyFileSync(configFile, `${configFile}.orig`);
  let config = fs.readFileSync(configFile, 'utf8');
  config = config.replace(/databaseName:.+?,/m, 'databaseName: "dry_run",');
  config = config.replace(/url:.+?,/m, 'url: "mongodb://localhost:27017",');
  console.info('## Dry running migrations in ${baseDir} ##');
  fs.writeFileSync(configFile, config, 'utf8');

  if (!rollback) {
    await runMigration(baseDir);
  } else {
    await rollBackLastMigration(baseDir);  
  }
 
  fs.renameSync(`${configFile}.orig`, configFile);
}

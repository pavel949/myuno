#!/usr/bin/env node
// Restore only into an explicitly selected empty isolated database. Never merge.
import { restoreDatabase, connectionFromEnvironment } from './database-snapshot.mjs';
try {
  if (!process.env.SNAPSHOT_DIRECTORY) throw new Error('SNAPSHOT_DIRECTORY is required');
  await restoreDatabase({connection:connectionFromEnvironment('TARGET'),directory:process.env.SNAPSHOT_DIRECTORY,confirmation:process.env.RESTORE_CONFIRMATION});
  console.log('Restore verified: exact table content, schema and relationships match');
} catch (error) {console.error(error.message);process.exitCode=1;}

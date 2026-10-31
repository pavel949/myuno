#!/usr/bin/env node
// Native PostgreSQL snapshot. No REST fallback and no hardcoded production host.
import { exportDatabase, connectionFromEnvironment } from './database-snapshot.mjs';
const directory=process.env.SNAPSHOT_DIRECTORY;
if (!directory) {console.error('SNAPSHOT_DIRECTORY must name a new snapshot directory');process.exitCode=1;}
else {
  try {
    await exportDatabase({connection:connectionFromEnvironment('SOURCE'),directory,schemas:(process.env.SNAPSHOT_SCHEMAS||'public').split(',')});
    console.log('PostgreSQL snapshot and consistent schema/content manifest completed');
  } catch (error) {console.error(error.message);process.exitCode=1;}
}

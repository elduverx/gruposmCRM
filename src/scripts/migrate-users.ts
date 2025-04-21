import { migrateUsersFromJson } from '../lib/prisma-users';
import fs from 'fs';
import path from 'path';

async function migrateUsers() {
  try {
    // Read users from JSON file
    const usersPath = path.join(process.cwd(), 'data', 'users.json');
    const usersData = fs.readFileSync(usersPath, 'utf8');
    const users = JSON.parse(usersData);

    // Migrate users to Prisma
    const result = await migrateUsersFromJson(users);
    
    console.log('Migration results:', result);
    
    if (result.failed > 0) {
      console.error('Some users failed to migrate:', result.errors);
    }
    
    console.log(`Successfully migrated ${result.success} users`);
  } catch (error) {
    console.error('Error during migration:', error);
  }
}

// Run migration
migrateUsers(); 
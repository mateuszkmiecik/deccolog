import { input, password } from '@inquirer/prompts';
import db from '../db';
import { catalog } from '../db/schema';
import { MD5 } from 'bun';

const collectionName = await input({ message: 'Enter collection name' });
const passwordValue = await password({ message: 'Enter password' });

await db.insert(catalog).values({
  name: collectionName,
  password: MD5.hash(passwordValue, 'base64')
});

console.log('Collection inserted into database!');
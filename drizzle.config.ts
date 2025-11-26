import { defineConfig } from "drizzle-kit";
import * as schema from './db/schema'

const { DATABASE_URL = '' } = process.env;
export default defineConfig({
  dialect: "postgresql",
  dbCredentials: {
    url: DATABASE_URL
  },
  schema: "./db/schema.ts"
});
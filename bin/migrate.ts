import { migrate } from "drizzle-orm/neon-http/migrator";

import db from "../db";

migrate(db, { migrationsFolder: "./drizzle" });

import * as schema from "@shared/schema";
import { Pool as NeonPool, neonConfig } from "@neondatabase/serverless";
import { drizzle as neonDrizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import pg from "pg";
import { drizzle as pgDrizzle } from "drizzle-orm/node-postgres";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const connectionString = process.env.DATABASE_URL;
const isNeon = connectionString.includes("neon.tech") ||
               connectionString.includes("neon.database");

let pool: any;
let db: any;

if (isNeon) {
  neonConfig.webSocketConstructor = ws;
  pool = new NeonPool({ connectionString });
  db = neonDrizzle({ client: pool, schema });
} else {
  const { Pool } = pg;
  pool = new Pool({ connectionString });
  db = pgDrizzle({ client: pool, schema });
}

export { pool, db };

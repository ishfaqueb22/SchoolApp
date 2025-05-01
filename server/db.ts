import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configure WebSocket for Neon serverless
neonConfig.webSocketConstructor = ws;

// Set reasonable timeouts for database connections
const connectionOptions = {
  connectionString: process.env.DATABASE_URL,
  max: 10,                      // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,     // How long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: 5000, // How long to wait for a connection
  allowExitOnIdle: true
};

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Create the pool with enhanced error handling
export const pool = new Pool(connectionOptions);

// Add error handling for the pool
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle database client', err);
  // Don't throw errors here to prevent the entire application from crashing
});

// Create a wrapped Drizzle instance with error handling
let _db: ReturnType<typeof drizzle> | null = null;

try {
  _db = drizzle({ client: pool, schema });
} catch (err) {
  console.error('Failed to initialize Drizzle ORM:', err);
  // Continue with null db, app will handle it gracefully
}

export const db = _db as ReturnType<typeof drizzle>;
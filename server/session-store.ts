import session from "express-session";
import createMemoryStore from "memorystore";

// Use memorystore for a reliable in-memory session store
const MemoryStore = createMemoryStore(session);

// Create a memory store with a 24-hour cleanup cycle
export const sessionStore = new MemoryStore({
  checkPeriod: 86400000 // prune expired entries every 24h
});
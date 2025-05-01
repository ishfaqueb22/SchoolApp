// Script to update school approval status using tsx
console.log("Starting script to update school approval status...");

// This will be executed with tsx which handles TypeScript and ESM
export {};

// Set the DATABASE_URL environment variable
process.env.DATABASE_URL = "postgresql://neondb_owner:npg_3gRd1zByfxGi@ep-odd-cherry-a4ves20f-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require";

async function run() {
  try {
    // Dynamically import modules to avoid ESM issues
    const { db } = await import('./server/db.js');
    const { schools } = await import('./shared/schema.js');
    
    console.log("Updating all schools to 'approved' status...");
    
    // Update all schools to approved status
    const result = await db.update(schools)
      .set({ approvalStatus: 'approved' })
      .returning();
    
    console.log(`Successfully updated ${result.length} schools to 'approved' status`);
  } catch (error) {
    console.error("Error updating schools:", error);
  } finally {
    process.exit(0);
  }
}

run(); 
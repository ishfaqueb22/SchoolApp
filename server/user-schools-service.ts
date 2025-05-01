import { db } from './db';
import { userSchools, type UserSchool, type InsertUserSchool } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

export class UserSchoolsService {
  /**
   * Get user-school associations for a specific user
   */
  async getUserSchools(userId: number): Promise<UserSchool[]> {
    return await db.select().from(userSchools).where(eq(userSchools.userId, userId));
  }

  /**
   * Get user-school associations for a specific school
   */
  async getSchoolUsers(schoolId: number): Promise<UserSchool[]> {
    return await db.select().from(userSchools).where(eq(userSchools.schoolId, schoolId));
  }

  /**
   * Create a new user-school association
   */
  async createUserSchool(userSchool: InsertUserSchool): Promise<UserSchool> {
    const [result] = await db.insert(userSchools).values(userSchool).returning();
    return result;
  }

  /**
   * Update a user-school association
   */
  async updateUserSchool(
    userId: number, 
    schoolId: number, 
    updates: Partial<InsertUserSchool>
  ): Promise<UserSchool> {
    const [result] = await db
      .update(userSchools)
      .set(updates)
      .where(
        and(
          eq(userSchools.userId, userId),
          eq(userSchools.schoolId, schoolId)
        )
      )
      .returning();
    
    return result;
  }

  /**
   * Remove a user-school association
   */
  async removeUserSchool(userId: number, schoolId: number): Promise<boolean> {
    const result = await db
      .delete(userSchools)
      .where(
        and(
          eq(userSchools.userId, userId),
          eq(userSchools.schoolId, schoolId)
        )
      );
    
    return result.rowCount > 0;
  }

  /**
   * Check if a user is an admin of a school
   */
  async isSchoolAdmin(userId: number, schoolId: number): Promise<boolean> {
    const [result] = await db
      .select()
      .from(userSchools)
      .where(
        and(
          eq(userSchools.userId, userId),
          eq(userSchools.schoolId, schoolId)
        )
      );
    
    return !!result;
  }

  /**
   * Get schools associated with a user that they have admin access to
   */
  async getUserAdminSchools(userId: number): Promise<UserSchool[]> {
    return await db
      .select()
      .from(userSchools)
      .where(eq(userSchools.userId, userId));
  }
}
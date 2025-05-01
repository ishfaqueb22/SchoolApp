import { db } from "./server/db";
import { 
  schoolCategories, schoolCategoryRelations, schoolMedia,
  userPreferences, userNotifications, userProfiles,
  type SchoolCategory, type InsertSchoolCategory,
  type SchoolCategoryRelation, type InsertSchoolCategoryRelation,
  type SchoolMedia, type InsertSchoolMedia,
  type UserPreferences, type InsertUserPreferences,
  type UserNotification, type InsertUserNotification,
  type UserProfile, type InsertUserProfile
} from "./schema_improvements";
import { eq, and } from "drizzle-orm";

// These methods would be added to your existing IStorage interface and DatabaseStorage class

// SCHOOL CATEGORIES
async function getSchoolCategories(): Promise<SchoolCategory[]> {
  return await db.select().from(schoolCategories).orderBy(schoolCategories.name);
}

async function getSchoolCategory(id: number): Promise<SchoolCategory | undefined> {
  const [category] = await db.select().from(schoolCategories).where(eq(schoolCategories.id, id));
  return category || undefined;
}

async function createSchoolCategory(category: InsertSchoolCategory): Promise<SchoolCategory> {
  const [newCategory] = await db.insert(schoolCategories).values(category).returning();
  return newCategory;
}

async function updateSchoolCategory(id: number, category: Partial<InsertSchoolCategory>): Promise<SchoolCategory> {
  const [updatedCategory] = await db
    .update(schoolCategories)
    .set(category)
    .where(eq(schoolCategories.id, id))
    .returning();
  return updatedCategory;
}

async function deleteSchoolCategory(id: number): Promise<boolean> {
  try {
    await db.delete(schoolCategories).where(eq(schoolCategories.id, id));
    return true;
  } catch (error) {
    console.error(`Error deleting school category with id ${id}:`, error);
    return false;
  }
}

async function getSchoolCategoriesBySchoolId(schoolId: number): Promise<SchoolCategory[]> {
  const relations = await db
    .select({
      category: schoolCategories
    })
    .from(schoolCategoryRelations)
    .innerJoin(
      schoolCategories,
      eq(schoolCategoryRelations.categoryId, schoolCategories.id)
    )
    .where(eq(schoolCategoryRelations.schoolId, schoolId));
  
  return relations.map(r => r.category);
}

async function addCategoryToSchool(relation: InsertSchoolCategoryRelation): Promise<SchoolCategoryRelation> {
  // Check if relation already exists
  const [existingRelation] = await db
    .select()
    .from(schoolCategoryRelations)
    .where(
      and(
        eq(schoolCategoryRelations.schoolId, relation.schoolId),
        eq(schoolCategoryRelations.categoryId, relation.categoryId)
      )
    );
  
  if (existingRelation) {
    return existingRelation;
  }
  
  const [newRelation] = await db.insert(schoolCategoryRelations).values(relation).returning();
  return newRelation;
}

async function removeCategoryFromSchool(schoolId: number, categoryId: number): Promise<boolean> {
  try {
    await db
      .delete(schoolCategoryRelations)
      .where(
        and(
          eq(schoolCategoryRelations.schoolId, schoolId),
          eq(schoolCategoryRelations.categoryId, categoryId)
        )
      );
    return true;
  } catch (error) {
    console.error(`Error removing category ${categoryId} from school ${schoolId}:`, error);
    return false;
  }
}

// SCHOOL MEDIA
async function getSchoolMedia(schoolId: number): Promise<SchoolMedia[]> {
  return await db
    .select()
    .from(schoolMedia)
    .where(eq(schoolMedia.schoolId, schoolId))
    .orderBy(schoolMedia.order);
}

async function getSchoolMediaItem(id: number): Promise<SchoolMedia | undefined> {
  const [media] = await db.select().from(schoolMedia).where(eq(schoolMedia.id, id));
  return media || undefined;
}

async function createSchoolMedia(media: InsertSchoolMedia): Promise<SchoolMedia> {
  const [newMedia] = await db.insert(schoolMedia).values(media).returning();
  return newMedia;
}

async function updateSchoolMedia(id: number, media: Partial<InsertSchoolMedia>): Promise<SchoolMedia> {
  const [updatedMedia] = await db
    .update(schoolMedia)
    .set(media)
    .where(eq(schoolMedia.id, id))
    .returning();
  return updatedMedia;
}

async function deleteSchoolMedia(id: number): Promise<boolean> {
  try {
    await db.delete(schoolMedia).where(eq(schoolMedia.id, id));
    return true;
  } catch (error) {
    console.error(`Error deleting school media with id ${id}:`, error);
    return false;
  }
}

// USER PREFERENCES
async function getUserPreferences(userId: number): Promise<UserPreferences | undefined> {
  const [preferences] = await db.select().from(userPreferences).where(eq(userPreferences.userId, userId));
  return preferences || undefined;
}

async function createUserPreferences(preferences: InsertUserPreferences): Promise<UserPreferences> {
  const [newPreferences] = await db.insert(userPreferences).values(preferences).returning();
  return newPreferences;
}

async function updateUserPreferences(userId: number, preferences: Partial<InsertUserPreferences>): Promise<UserPreferences> {
  const [updatedPreferences] = await db
    .update(userPreferences)
    .set({ ...preferences, updatedAt: new Date() })
    .where(eq(userPreferences.userId, userId))
    .returning();
  return updatedPreferences;
}

// USER NOTIFICATIONS
async function getUserNotifications(userId: number): Promise<UserNotification[]> {
  return await db
    .select()
    .from(userNotifications)
    .where(eq(userNotifications.userId, userId))
    .orderBy(userNotifications.createdAt, "desc");
}

async function getUserNotification(id: number): Promise<UserNotification | undefined> {
  const [notification] = await db.select().from(userNotifications).where(eq(userNotifications.id, id));
  return notification || undefined;
}

async function createUserNotification(notification: InsertUserNotification): Promise<UserNotification> {
  const [newNotification] = await db.insert(userNotifications).values(notification).returning();
  return newNotification;
}

async function markNotificationAsRead(id: number): Promise<UserNotification> {
  const [updatedNotification] = await db
    .update(userNotifications)
    .set({ isRead: true })
    .where(eq(userNotifications.id, id))
    .returning();
  return updatedNotification;
}

async function markAllNotificationsAsRead(userId: number): Promise<boolean> {
  try {
    await db
      .update(userNotifications)
      .set({ isRead: true })
      .where(eq(userNotifications.userId, userId));
    return true;
  } catch (error) {
    console.error(`Error marking all notifications as read for user ${userId}:`, error);
    return false;
  }
}

// USER PROFILE
async function getUserProfile(userId: number): Promise<UserProfile | undefined> {
  const [profile] = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId));
  return profile || undefined;
}

async function createUserProfile(profile: InsertUserProfile): Promise<UserProfile> {
  const [newProfile] = await db.insert(userProfiles).values(profile).returning();
  return newProfile;
}

async function updateUserProfile(userId: number, profile: Partial<InsertUserProfile>): Promise<UserProfile> {
  const [updatedProfile] = await db
    .update(userProfiles)
    .set({ ...profile, updatedAt: new Date() })
    .where(eq(userProfiles.userId, userId))
    .returning();
  return updatedProfile;
}

async function getUserPublicProfile(userId: number): Promise<Partial<UserProfile> | undefined> {
  const [profile] = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId));
  
  if (!profile) {
    return undefined;
  }
  
  // Return only public fields
  return {
    userId: profile.userId,
    bio: profile.bio,
    occupation: profile.occupation,
    interests: profile.interests,
    educatorExperience: profile.educatorExperience,
  };
}

// Export all functions to be added to the storage interface and implementation
export const storageImprovements = {
  // School Categories
  getSchoolCategories,
  getSchoolCategory,
  createSchoolCategory,
  updateSchoolCategory,
  deleteSchoolCategory,
  getSchoolCategoriesBySchoolId,
  addCategoryToSchool,
  removeCategoryFromSchool,
  
  // School Media
  getSchoolMedia,
  getSchoolMediaItem,
  createSchoolMedia,
  updateSchoolMedia,
  deleteSchoolMedia,
  
  // User Preferences
  getUserPreferences,
  createUserPreferences,
  updateUserPreferences,
  
  // User Notifications
  getUserNotifications,
  getUserNotification,
  createUserNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  
  // User Profile
  getUserProfile,
  createUserProfile, 
  updateUserProfile,
  getUserPublicProfile
};
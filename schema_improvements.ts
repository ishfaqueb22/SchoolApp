import { pgTable, text, serial, integer, boolean, jsonb, timestamp, varchar, real, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users, schools } from "./shared/schema";

// 1. School Categories/Tags
export const schoolCategories = pgTable("school_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  color: text("color").default("#3498db"),
  icon: text("icon"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const schoolCategoryRelations = pgTable("school_category_relations", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").references(() => schools.id).notNull(),
  categoryId: integer("category_id").references(() => schoolCategories.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 2. Media Gallery for Schools
export const schoolMedia = pgTable("school_media", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").references(() => schools.id).notNull(),
  type: text("type").notNull(), // image, video, virtualTour
  title: text("title").notNull(),
  description: text("description"),
  url: text("url").notNull(),
  thumbnail: text("thumbnail"),
  order: integer("order").default(0),
  isPublic: boolean("is_public").default(true),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 3. User Preferences
export const userPreferences = pgTable("user_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  preferredLocation: text("preferred_location"),
  preferredSchoolTypes: jsonb("preferred_school_types").$type<string[]>(),
  preferredCurriculum: text("preferred_curriculum"),
  maxTuition: integer("max_tuition"),
  desiredClassSize: text("desired_class_size"),
  importantFeatures: jsonb("important_features").$type<string[]>(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// 4. User-specific Notifications (not just platform-wide)
export const userNotifications = pgTable("user_notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(), // system, inquiry, review, application
  entityType: text("entity_type"), // school, review, application
  entityId: integer("entity_id"),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 5. Extended User Profile
export const userProfiles = pgTable("user_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull().unique(),
  bio: text("bio"),
  occupation: text("occupation"),
  interests: jsonb("interests").$type<string[]>(),
  parentOf: jsonb("parent_of").$type<{age: number, grade: string}[]>(),
  educatorExperience: text("educator_experience"),
  preferredLanguage: text("preferred_language").default("en"),
  newsletterSubscribed: boolean("newsletter_subscribed").default(false),
  phoneNumber: text("phone_number"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  country: text("country"),
  zipCode: text("zip_code"),
  timezone: text("timezone"),
  lastActiveAt: timestamp("last_active_at"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Create insert schemas for the new tables
export const insertSchoolCategorySchema = createInsertSchema(schoolCategories).omit({
  id: true,
  createdAt: true,
});

export const insertSchoolCategoryRelationSchema = createInsertSchema(schoolCategoryRelations).omit({
  id: true,
  createdAt: true,
});

export const insertSchoolMediaSchema = createInsertSchema(schoolMedia).omit({
  id: true,
  createdAt: true,
});

export const insertUserPreferencesSchema = createInsertSchema(userPreferences).omit({
  id: true,
  updatedAt: true,
});

export const insertUserNotificationSchema = createInsertSchema(userNotifications).omit({
  id: true,
  createdAt: true,
});

export const insertUserProfileSchema = createInsertSchema(userProfiles).omit({
  id: true,
  updatedAt: true,
  lastActiveAt: true,
});

// Export types
export type SchoolCategory = typeof schoolCategories.$inferSelect;
export type InsertSchoolCategory = z.infer<typeof insertSchoolCategorySchema>;

export type SchoolCategoryRelation = typeof schoolCategoryRelations.$inferSelect;
export type InsertSchoolCategoryRelation = z.infer<typeof insertSchoolCategoryRelationSchema>;

export type SchoolMedia = typeof schoolMedia.$inferSelect;
export type InsertSchoolMedia = z.infer<typeof insertSchoolMediaSchema>;

export type UserPreferences = typeof userPreferences.$inferSelect;
export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;

export type UserNotification = typeof userNotifications.$inferSelect;
export type InsertUserNotification = z.infer<typeof insertUserNotificationSchema>;

export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;
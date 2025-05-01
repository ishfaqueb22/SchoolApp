import { pgTable, text, serial, integer, boolean, jsonb, timestamp, varchar, real, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  role: text("role").notNull().default("user"), // user, schoolAdmin, platformAdmin
  avatarUrl: text("avatar_url"),
  schoolId: integer("school_id").references(() => schools.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});

// Schools table
export const schools = pgTable("schools", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  location: text("location").notNull(),
  address: text("address").notNull(),
  type: text("type").notNull(), // Montessori, STEM, Arts, International
  imageUrl: text("image_url"),
  rating: integer("rating"),
  curriculumType: text("curriculum_type").notNull(),
  gradeRange: text("grade_range").notNull(),
  classSize: text("class_size"),
  tuitionRange: text("tuition_range"),
  hasFinancialAid: boolean("has_financial_aid").default(false),
  features: jsonb("features").$type<string[]>(),
  coordinates: jsonb("coordinates").$type<{lat: number, lng: number}>(),
  // School admin relationship
  admin_id: integer("admin_id").references(() => users.id),
  parentSchoolId: integer("parent_school_id").references(() => schools.id), // For subcampuses, references main school
  isSubCampus: boolean("is_sub_campus").default(false), // Is this a subcampus of a main school?
  // New fields for school admin features
  multiCampus: boolean("multi_campus").default(false),
  campusCount: integer("campus_count").default(1),
  campusLocations: jsonb("campus_locations").$type<string[]>(),
  establishedYear: text("established_year"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  website: text("website"),
  // New fields for platform admin approval
  approvalStatus: text("approval_status").default("pending").notNull(), // pending, approved, rejected
  verificationStatus: boolean("verification_status").default(false).notNull(), // verified flag
  lastVerifiedAt: timestamp("last_verified_at"),
  lastVerifiedBy: integer("last_verified_by").references(() => users.id),
});

// User-School associations - for school administrators managing multiple schools
export const userSchools = pgTable("user_schools", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  schoolId: integer("school_id").notNull().references(() => schools.id),
  isMainAdmin: boolean("is_main_admin").default(false), // Whether this user is the main admin for this school
  createdAt: timestamp("created_at").defaultNow().notNull(),
  role: text("role").default("editor"), // admin, editor, viewer - role specific to this school
  canEditPosts: boolean("can_edit_posts").default(true),
  canManageFaculty: boolean("can_manage_faculty").default(true),
  canManageInquiries: boolean("can_manage_inquiries").default(true),
  canManageSettings: boolean("can_manage_settings").default(false),
});

// User saved schools (for regular users)
export const savedSchools = pgTable("saved_schools", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  schoolId: integer("school_id").notNull().references(() => schools.id),
  savedAt: timestamp("saved_at").defaultNow().notNull(),
});

// School comparison
export const comparisons = pgTable("comparisons", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  schoolIds: jsonb("school_ids").$type<number[]>().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Reviews
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  schoolId: integer("school_id").notNull().references(() => schools.id),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  // New fields for platform admin moderation
  moderationStatus: text("moderation_status").default("pending").notNull(), // pending, approved, rejected
  moderationNotes: text("moderation_notes"),
  moderatedAt: timestamp("moderated_at"),
  moderatedBy: integer("moderated_by").references(() => users.id),
});

// Campuses table for multi-campus schools
export const campuses = pgTable("campuses", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").notNull().references(() => schools.id),
  name: text("name").notNull(),
  location: text("location").notNull(),
  address: text("address").notNull(),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  imageUrl: text("image_url"),
  isMainCampus: boolean("is_main_campus").default(false),
  description: text("description"),
  facilities: text("facilities").array(),
  studentCount: integer("student_count"),
  establishedYear: text("established_year"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// School change requests for approval by platform admins
export const schoolChangeRequests = pgTable("school_change_requests", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").references(() => schools.id), // Null for new school requests
  requestedById: integer("requested_by_id").notNull().references(() => users.id),
  requestType: text("request_type").notNull(), // 'create', 'update', 'delete'
  status: text("status").default("pending").notNull(), // 'pending', 'approved', 'rejected'
  requestData: jsonb("request_data").$type<any>(), // Contains the school data to create/update
  notes: text("notes"), // Admin notes about the request
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
  reviewedById: integer("reviewed_by_id").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  notificationSent: boolean("notification_sent").default(false),
  notificationSentAt: timestamp("notification_sent_at"),
});

// Schema for inserting school change requests
export const insertSchoolChangeRequestSchema = createInsertSchema(schoolChangeRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  reviewedAt: true,
  reviewedById: true,
  notificationSent: true,
  notificationSentAt: true,
});

export type SchoolChangeRequest = typeof schoolChangeRequests.$inferSelect;
export type InsertSchoolChangeRequest = z.infer<typeof insertSchoolChangeRequestSchema>;

// Campus change requests for approval by platform admins
export const campusChangeRequests = pgTable("campus_change_requests", {
  id: serial("id").primaryKey(),
  campusId: integer("campus_id").references(() => campuses.id),
  schoolId: integer("school_id").notNull().references(() => schools.id),
  requestedById: integer("requested_by_id").notNull().references(() => users.id),
  requestType: text("request_type").notNull(), // 'create', 'update', 'delete'
  status: text("status").default("pending").notNull(), // 'pending', 'approved', 'rejected'
  requestData: jsonb("request_data").$type<any>(), // Contains the campus data to create/update
  notes: text("notes"), // Admin notes about the request
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
  reviewedById: integer("reviewed_by_id").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  notificationSent: boolean("notification_sent").default(false),
  notificationSentAt: timestamp("notification_sent_at"),
});

// Schema for inserting campus change requests
export const insertCampusChangeRequestSchema = createInsertSchema(campusChangeRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  reviewedAt: true,
  reviewedById: true,
  notificationSent: true,
  notificationSentAt: true,
});

export type CampusChangeRequest = typeof campusChangeRequests.$inferSelect;
export type InsertCampusChangeRequest = z.infer<typeof insertCampusChangeRequestSchema>;

// Faculty table for school admin management
export const faculty = pgTable("faculty", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").notNull().references(() => schools.id),
  campusId: integer("campus_id").references(() => campuses.id), // Optional campus assignment
  name: text("name").notNull(),
  position: text("position").notNull(),
  department: text("department"),
  qualifications: text("qualifications"),
  bio: text("bio"),
  imageUrl: text("image_url"),
  email: text("email"),
  phone: text("phone"),
  joinedDate: timestamp("joined_date"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// School content posts for announcements, events, etc.
export const schoolPosts = pgTable("school_posts", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").notNull().references(() => schools.id),
  campusId: integer("campus_id").references(() => campuses.id), // Optional campus-specific post
  title: text("title").notNull(),
  content: text("content").notNull(),
  type: text("type").notNull(), // announcement, event, news, etc.
  imageUrl: text("image_url"),
  eventDate: timestamp("event_date"), // For events
  postedBy: integer("posted_by").references(() => users.id),
  isPublished: boolean("is_published").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Inquiries/Admission requests for schools to manage
export const inquiries = pgTable("inquiries", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").notNull().references(() => schools.id),
  userId: integer("user_id").references(() => users.id), // Link to user who submitted the inquiry
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  message: text("message").notNull(),
  forGrade: text("for_grade"),
  status: text("status").default("pending"), // pending, inProgress, completed
  response: text("response"),
  responseDate: timestamp("response_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  subject: text("subject").default("Inquiry"), // Added subject field for notifications
});

// Schema for inserting users
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  fullName: true,
  role: true,
  avatarUrl: true,
  schoolId: true,
  isActive: true,
});

// Schema for inserting schools
export const insertSchoolSchema = createInsertSchema(schools).pick({
  name: true,
  description: true,
  location: true,
  address: true,
  type: true,
  imageUrl: true,
  rating: true,
  curriculumType: true,
  gradeRange: true,
  classSize: true,
  tuitionRange: true,
  hasFinancialAid: true,
  features: true,
  coordinates: true,
  admin_id: true,
  parentSchoolId: true, // For subcampuses
  isSubCampus: true,
  multiCampus: true,
  campusCount: true,
  campusLocations: true,
  establishedYear: true,
  contactEmail: true,
  contactPhone: true,
  website: true,
});

// Schema for userSchools associations
export const insertUserSchoolSchema = createInsertSchema(userSchools).pick({
  userId: true,
  schoolId: true,
  isMainAdmin: true,
  role: true,
  canEditPosts: true,
  canManageFaculty: true,
  canManageInquiries: true,
  canManageSettings: true,
});

// Schema for inserting saved schools
export const insertSavedSchoolSchema = createInsertSchema(savedSchools).pick({
  userId: true,
  schoolId: true,
});

// Schema for inserting comparisons
export const insertComparisonSchema = createInsertSchema(comparisons).pick({
  userId: true,
  schoolIds: true,
});

// Schema for inserting reviews
export const insertReviewSchema = createInsertSchema(reviews).pick({
  userId: true,
  schoolId: true,
  rating: true,
  comment: true,
});

// Campus insert schema
export const insertCampusSchema = createInsertSchema(campuses).pick({
  schoolId: true,
  name: true,
  location: true,
  address: true,
  contactEmail: true,
  contactPhone: true,
  imageUrl: true,
  isMainCampus: true,
  description: true,
  facilities: true,
  studentCount: true,
  establishedYear: true,
});

// Faculty insert schema
export const insertFacultySchema = createInsertSchema(faculty).pick({
  schoolId: true,
  campusId: true,
  name: true,
  position: true,
  department: true,
  qualifications: true,
  bio: true,
  imageUrl: true,
  email: true,
  phone: true,
  joinedDate: true,
  isActive: true,
});

// School post insert schema
export const insertSchoolPostSchema = createInsertSchema(schoolPosts)
  .pick({
    schoolId: true,
    campusId: true,
    title: true,
    content: true,
    type: true,
    imageUrl: true,
    eventDate: true,
    postedBy: true,
    isPublished: true,
  })
  .extend({
    // Use preprocess to handle date strings
    eventDate: z.preprocess(
      // Convert string dates to Date objects
      (val) => (val ? new Date(val as string) : null),
      // Allow both dates and nulls (for non-event type posts)
      z.date().nullable()
    ),
  });

// Inquiry insert schema
export const insertInquirySchema = createInsertSchema(inquiries).pick({
  schoolId: true,
  userId: true,
  name: true,
  email: true,
  phone: true,
  message: true,
  forGrade: true,
  status: true,
  subject: true,
});

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type School = typeof schools.$inferSelect;
export type InsertSchool = z.infer<typeof insertSchoolSchema>;

export type SavedSchool = typeof savedSchools.$inferSelect;
export type InsertSavedSchool = z.infer<typeof insertSavedSchoolSchema>;

export type Comparison = typeof comparisons.$inferSelect;
export type InsertComparison = z.infer<typeof insertComparisonSchema>;

export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;

export type UserSchool = typeof userSchools.$inferSelect;
export type InsertUserSchool = z.infer<typeof insertUserSchoolSchema>;

export type Campus = typeof campuses.$inferSelect;
export type InsertCampus = z.infer<typeof insertCampusSchema>;

export type Faculty = typeof faculty.$inferSelect;
export type InsertFaculty = z.infer<typeof insertFacultySchema>;

export type SchoolPost = typeof schoolPosts.$inferSelect;
export type InsertSchoolPost = z.infer<typeof insertSchoolPostSchema>;

export type Inquiry = typeof inquiries.$inferSelect; 
export type InsertInquiry = z.infer<typeof insertInquirySchema>;

export type SchoolChangeRequest = typeof schoolChangeRequests.$inferSelect;
export type InsertSchoolChangeRequest = z.infer<typeof insertSchoolChangeRequestSchema>;

// User activity logs table
export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(), // school, review, comparison, etc.
  entityId: integer("entity_id").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Testimonials table
export const testimonials = pgTable("testimonials", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  role: text("role").notNull(), // e.g., "Parent", "Student", "Teacher"
  content: text("content").notNull(),
  rating: integer("rating").notNull(),
  avatarUrl: text("avatar_url"),
  isVerified: boolean("is_verified").default(true),
  schoolId: integer("school_id").references(() => schools.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});

export const teamProfiles = pgTable("team_profiles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  title: text("title").notNull(), // e.g., "CEO", "Education Specialist", "Senior Developer"
  bio: text("bio").notNull(),
  imageUrl: text("image_url"),
  socialLinks: jsonb("social_links"), // For storing social media links as JSON
  priority: integer("priority").default(0), // For ordering profiles
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
});

// Schema for inserting activity logs
export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({
  id: true,
  createdAt: true,
});

export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;

// Schema for inserting testimonials
export const insertTestimonialSchema = createInsertSchema(testimonials).omit({
  id: true,
  createdAt: true,
});

export type Testimonial = typeof testimonials.$inferSelect;
export type InsertTestimonial = z.infer<typeof insertTestimonialSchema>;

// Schema for inserting team profiles
export const insertTeamProfileSchema = createInsertSchema(teamProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type TeamProfile = typeof teamProfiles.$inferSelect;
export type InsertTeamProfile = z.infer<typeof insertTeamProfileSchema>;

// Support Requests
export const supportRequests = pgTable("support_requests", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  phone: text("phone"),
  userId: integer("user_id").references(() => users.id),
  status: text("status").default("open").notNull(), // open, in_progress, resolved, closed
  priority: text("priority").default("medium").notNull(), // low, medium, high, urgent
  category: text("category").notNull(), // general, technical, billing, suggestion, etc.
  response: text("response"),
  respondedBy: integer("responded_by").references(() => users.id),
  respondedAt: timestamp("responded_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
});

// Schema for inserting support requests
export const insertSupportRequestSchema = createInsertSchema(supportRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  respondedAt: true,
  respondedBy: true,
  response: true,
});

export type SupportRequest = typeof supportRequests.$inferSelect;
export type InsertSupportRequest = z.infer<typeof insertSupportRequestSchema>;

// School Categories
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

// Media Gallery for Schools
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

// User Preferences
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

// User-specific Notifications
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

// Extended User Profile
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

// Export types for the new tables
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

// Quiz questions for personalized school matching
export const quizQuestions = pgTable("quiz_questions", {
  id: serial("id").primaryKey(),
  questionText: text("question_text").notNull(),
  category: text("category").notNull(), // academic, extracurricular, environment, etc.
  order: integer("order").notNull(),
  answerType: text("answer_type").notNull(), // multiple-choice, slider, text, etc.
  choices: jsonb("choices").$type<string[]>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Quiz responses from users
export const quizResponses = pgTable("quiz_responses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  sessionId: text("session_id"), // For anonymous users
  response: jsonb("response").$type<Record<string, any>>().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  preferences: jsonb("preferences").$type<{
    schoolType: string[],
    curriculum: string[],
    location: string[],
    features: string[],
    extracurricular: string[],
    budget: string
  }>().notNull(),
});

// Quiz results and recommendations
export const quizResults = pgTable("quiz_results", {
  id: serial("id").primaryKey(),
  responseId: integer("response_id").references(() => quizResponses.id).notNull(),
  userId: integer("user_id").references(() => users.id),
  sessionId: text("session_id"), // For anonymous users
  schoolMatches: jsonb("school_matches").$type<{
    schoolId: number,
    matchScore: number,
    matchFactors: string[]
  }[]>().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Schema for inserting quiz questions
export const insertQuizQuestionSchema = createInsertSchema(quizQuestions).omit({
  id: true,
  createdAt: true,
});

// Schema for inserting quiz responses
export const insertQuizResponseSchema = createInsertSchema(quizResponses).omit({
  id: true,
  createdAt: true,
});

// Schema for inserting quiz results
export const insertQuizResultSchema = createInsertSchema(quizResults).omit({
  id: true,
  createdAt: true,
});

// Export quiz types
export type QuizQuestion = typeof quizQuestions.$inferSelect;
export type InsertQuizQuestion = z.infer<typeof insertQuizQuestionSchema>;

export type QuizResponse = typeof quizResponses.$inferSelect;
export type InsertQuizResponse = z.infer<typeof insertQuizResponseSchema>;

export type QuizResult = typeof quizResults.$inferSelect;
export type InsertQuizResult = z.infer<typeof insertQuizResultSchema>;

// Platform notifications for admin announcements
export const platformNotifications = pgTable("platform_notifications", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  type: text("type").notNull(), // system, update, alert, etc.
  targetGroup: text("target_group").notNull(), // all, users, schoolAdmins, etc.
  isActive: boolean("is_active").default(true),
  createdBy: integer("created_by").references(() => users.id).notNull(),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Schema for inserting platform notifications
export const insertPlatformNotificationSchema = createInsertSchema(platformNotifications).omit({
  id: true,
  createdAt: true, 
  updatedAt: true,
});

export type PlatformNotification = typeof platformNotifications.$inferSelect;
export type InsertPlatformNotification = z.infer<typeof insertPlatformNotificationSchema>;

// Content management tables
export const contentPages = pgTable("content_pages", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  content: text("content").notNull(),
  isPublished: boolean("is_published").default(false),
  metaDescription: text("meta_description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
  publishedAt: timestamp("published_at"),
});

export const blogPosts = pgTable("blog_posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  summary: text("summary"),
  content: text("content").notNull(),
  categoryId: integer("category_id").references(() => categories.id),
  isPublished: boolean("is_published").default(false),
  featuredImage: text("featured_image"),
  authorId: integer("author_id").references(() => users.id),
  views: integer("views").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
  publishedAt: timestamp("published_at"),
});

export const faqItems = pgTable("faq_items", {
  id: serial("id").primaryKey(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  categoryId: integer("category_id").references(() => categories.id),
  orderIndex: integer("order_index").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  slug: text("slug").notNull().unique(),
  parentId: integer("parent_id").references(() => categories.id),
  type: text("type").notNull(), // school, blog, faq
  color: text("color"), // color code for UI display
  icon: text("icon"),  // icon name for UI display
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Messages system
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").references(() => conversations.id).notNull(),
  senderId: integer("sender_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false),
  attachments: jsonb("attachments").$type<{url: string, name: string, type: string}[]>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  title: text("title"),
  isUrgent: boolean("is_urgent").default(false),
  isFlagged: boolean("is_flagged").default(false),
  status: text("status").default("active").notNull(), // active, pending, closed
  createdBy: integer("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
  lastMessageAt: timestamp("last_message_at").defaultNow(),
});

export const conversationParticipants = pgTable("conversation_participants", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").references(() => conversations.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  role: text("role").default("member").notNull(), // member, admin, support
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
  leftAt: timestamp("left_at"),
});

// System logs for analytics and administration
export const systemLogs = pgTable("system_logs", {
  id: serial("id").primaryKey(),
  level: text("level").notNull(), // info, warning, error, critical
  component: text("component").notNull(), // api, database, auth, etc.
  message: text("message").notNull(),
  details: jsonb("details"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: integer("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Site settings
export const siteSettings = pgTable("site_settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: jsonb("value").notNull(),
  description: text("description"),
  category: text("category").notNull(), // general, api, security, etc.
  isPublic: boolean("is_public").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
  updatedBy: integer("updated_by").references(() => users.id),
});

// Schema for inserting content pages
export const insertContentPageSchema = createInsertSchema(contentPages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  publishedAt: true,
});

// Schema for inserting blog posts
export const insertBlogPostSchema = createInsertSchema(blogPosts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  publishedAt: true,
});

// Schema for inserting FAQ items
export const insertFaqItemSchema = createInsertSchema(faqItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Schema for inserting categories
export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Schema for inserting messages
export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

// Schema for inserting conversations
export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastMessageAt: true,
});

// Schema for inserting conversation participants
export const insertConversationParticipantSchema = createInsertSchema(conversationParticipants).omit({
  id: true,
  joinedAt: true,
  leftAt: true,
});

// Schema for inserting system logs
export const insertSystemLogSchema = createInsertSchema(systemLogs).omit({
  id: true,
  createdAt: true,
});

// Schema for inserting site settings
export const insertSiteSettingSchema = createInsertSchema(siteSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Export types
export type ContentPage = typeof contentPages.$inferSelect;
export type InsertContentPage = z.infer<typeof insertContentPageSchema>;

export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;

export type FaqItem = typeof faqItems.$inferSelect;
export type InsertFaqItem = z.infer<typeof insertFaqItemSchema>;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;

export type ConversationParticipant = typeof conversationParticipants.$inferSelect;
export type InsertConversationParticipant = z.infer<typeof insertConversationParticipantSchema>;

export type SystemLog = typeof systemLogs.$inferSelect;
export type InsertSystemLog = z.infer<typeof insertSystemLogSchema>;

export type SiteSetting = typeof siteSettings.$inferSelect;
export type InsertSiteSetting = z.infer<typeof insertSiteSettingSchema>;

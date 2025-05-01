import { db } from "./db";
import { eq, and, like, gte, lte, sql, desc, asc, or, inArray, isNull, not } from "drizzle-orm";
import { 
  users, type User, type InsertUser,
  schools, type School, type InsertSchool,
  savedSchools, type SavedSchool, type InsertSavedSchool,
  comparisons, type Comparison, type InsertComparison,
  reviews, type Review, type InsertReview,
  campuses, type Campus, type InsertCampus,
  schoolChangeRequests, type SchoolChangeRequest, type InsertSchoolChangeRequest,
  campusChangeRequests, type CampusChangeRequest, type InsertCampusChangeRequest,
  faculty, type Faculty, type InsertFaculty,
  schoolPosts, type SchoolPost, type InsertSchoolPost,
  inquiries, type Inquiry, type InsertInquiry,
  activityLogs, type ActivityLog, type InsertActivityLog,
  testimonials, type Testimonial, type InsertTestimonial,
  supportRequests, type SupportRequest, type InsertSupportRequest,
  schoolCategories, type SchoolCategory, type InsertSchoolCategory,
  schoolCategoryRelations, type SchoolCategoryRelation, type InsertSchoolCategoryRelation,
  schoolMedia, type SchoolMedia, type InsertSchoolMedia,
  userPreferences, type UserPreferences, type InsertUserPreferences,
  userNotifications, type UserNotification, type InsertUserNotification,
  userProfiles, type UserProfile, type InsertUserProfile,
  userSchools, type UserSchool, type InsertUserSchool,
  teamProfiles, type TeamProfile, type InsertTeamProfile,
  // Quiz-related imports
  quizQuestions, type QuizQuestion, type InsertQuizQuestion,
  quizResponses, type QuizResponse, type InsertQuizResponse,
  quizResults, type QuizResult, type InsertQuizResult,
  // Content management imports
  categories, type Category, type InsertCategory,
  contentPages, type ContentPage, type InsertContentPage,
  blogPosts, type BlogPost, type InsertBlogPost,
  faqItems, type FaqItem, type InsertFaqItem,
} from "@shared/schema";
import { IStorage } from "./storage";

/**
 * DatabaseStorage implements the IStorage interface using a PostgreSQL database
 */
export class DatabaseStorage implements IStorage {
  //#region User Methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    try {
      console.log("Creating user in database with data:", user);
      
      // Ensure the data object matches the schema exactly
      const userData = {
        username: user.username,
        password: user.password,
        email: user.email,
        fullName: user.fullName,
        role: user.role || 'user',
        avatarUrl: user.avatarUrl,
        schoolId: user.schoolId,
        isActive: user.isActive !== undefined ? user.isActive : true
      };
      
      const [newUser] = await db.insert(users).values(userData).returning();
      
      if (!newUser) {
        throw new Error("User creation failed - no user returned from database");
      }
      
      console.log("User created successfully with ID:", newUser.id);
      return newUser;
    } catch (error) {
      console.error("Database error creating user:", error);
      throw error;
    }
  }

  async updateUser(id: number, user: Partial<InsertUser>): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set(user)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }
  //#endregion

  //#region School Methods
  async getSchool(id: number): Promise<School | undefined> {
    const [school] = await db.select().from(schools).where(eq(schools.id, id));
    return school || undefined;
  }

  async getSchools(limit?: number, offset?: number): Promise<School[]> {
    console.log(`Getting schools with limit: ${limit} offset: ${offset || 0} `);
    return await db
      .select()
      .from(schools)
      .limit(limit || 50)
      .offset(offset || 0)
      .orderBy(desc(schools.id));
  }

  async getSchoolsByType(type: string): Promise<School[]> {
    return await db
      .select()
      .from(schools)
      .where(eq(schools.type, type))
      .orderBy(desc(schools.id));
  }

  async getSchoolsByLocation(location: string): Promise<School[]> {
    return await db
      .select()
      .from(schools)
      .where(like(schools.location, `%${location}%`))
      .orderBy(desc(schools.id));
  }

  async searchSchools(params: {
    query?: string;
    type?: string;
    location?: string;
    curriculumType?: string;
    gradeLevel?: string;
    hasFinancialAid?: boolean;
    minRating?: number;
    maxTuition?: string;
    category?: string;
    featured?: boolean;
    features?: string[];
    limit?: number;
    offset?: number;
    sortField?: string;
    sortDirection?: 'asc' | 'desc';
    approvalStatus?: string; // Added for filtering by approval status
    verificationStatus?: boolean; // Added for filtering by verification status
  }): Promise<School[]> {
    try {
      console.log("Database searchSchools called with params:", JSON.stringify(params, null, 2));
      
      // Base query
      let query = db.select().from(schools);

      // Apply filters
      const whereConditions = [];
      
      // Text search
      if (params.query) {
        console.log(`Searching for text: "${params.query}" across all relevant school fields`);
        // Convert query to lowercase for case-insensitive search
        const searchTerm = params.query.toLowerCase();
        whereConditions.push(
          or(
            sql`LOWER(${schools.name}) LIKE ${`%${searchTerm}%`}`,
            sql`LOWER(${schools.description}) LIKE ${`%${searchTerm}%`}`,
            sql`LOWER(${schools.location}) LIKE ${`%${searchTerm}%`}`,
            sql`LOWER(${schools.address}) LIKE ${`%${searchTerm}%`}`,
            sql`LOWER(${schools.type}) LIKE ${`%${searchTerm}%`}`,
            sql`LOWER(${schools.curriculumType}) LIKE ${`%${searchTerm}%`}`,
            sql`LOWER(${schools.gradeRange}) LIKE ${`%${searchTerm}%`}`,
            sql`LOWER(${schools.website}) LIKE ${`%${searchTerm}%`}`,
            sql`LOWER(${schools.contactEmail}) LIKE ${`%${searchTerm}%`}`,
            sql`LOWER(${schools.contactPhone}) LIKE ${`%${searchTerm}%`}`
          )
        );
      }

      if (params.type) {
        whereConditions.push(eq(schools.type, params.type));
      }

      if (params.location) {
        // Use case-insensitive search for location
        whereConditions.push(
          sql`LOWER(${schools.location}) LIKE ${`%${params.location.toLowerCase()}%`}`
        );
      }

      if (params.curriculumType) {
        // Use case-insensitive search for curriculum type
        whereConditions.push(
          sql`LOWER(${schools.curriculumType}) LIKE ${`%${params.curriculumType.toLowerCase()}%`}`
        );
      }
      
      if (params.gradeLevel) {
        // For grade level, use case-insensitive search within the grade range field
        whereConditions.push(
          sql`LOWER(${schools.gradeRange}) LIKE ${`%${params.gradeLevel.toLowerCase()}%`}`
        );
      }

      if (params.hasFinancialAid !== undefined) {
        whereConditions.push(eq(schools.hasFinancialAid, params.hasFinancialAid));
      }

      if (params.minRating) {
        whereConditions.push(gte(schools.rating, params.minRating));
      }
      
      // Filter by approval status if specified
      if (params.approvalStatus) {
        console.log(`Filtering schools by approval status: ${params.approvalStatus}`);
        // Use case-insensitive search for approval status
        whereConditions.push(
          sql`LOWER(${schools.approvalStatus}) = ${params.approvalStatus.toLowerCase()}`
        );
      }
      
      // Filter by verification status if specified
      if (params.verificationStatus !== undefined) {
        console.log(`Filtering schools by verification status: ${params.verificationStatus}`);
        whereConditions.push(eq(schools.verificationStatus, params.verificationStatus));
      }

      // Apply all conditions
      if (whereConditions.length > 0) {
        try {
          query = query.where(and(...whereConditions));
        } catch (whereError) {
          console.error("Error applying where conditions:", whereError);
          // Continue with base query if where clause fails
        }
      }

      // Apply sorting
      try {
        if (params.sortField) {
          const sortDirection = params.sortDirection === 'desc' ? desc : asc;
          
          switch (params.sortField) {
            case 'name':
              query = query.orderBy(sortDirection(schools.name));
              break;
            case 'rating':
              query = query.orderBy(sortDirection(schools.rating));
              break;
            case 'location':
              query = query.orderBy(sortDirection(schools.location));
              break;
            default:
              query = query.orderBy(desc(schools.id));
          }
        } else {
          query = query.orderBy(desc(schools.id));
        }
      } catch (sortError) {
        console.error("Error applying sort:", sortError);
        // Continue without sorting if it fails
      }

      // Apply pagination
      try {
        query = query
          .limit(params.limit || 50)
          .offset(params.offset || 0);
      } catch (paginationError) {
        console.error("Error applying pagination:", paginationError);
        // Continue without pagination if it fails
      }

      // Log the SQL query before execution
      try {
        const sqlQuery = query.toSQL();
        console.log("Generated SQL Query:", sqlQuery.sql);
        console.log("Query Parameters:", sqlQuery.params);
      } catch (error) {
        console.error("Error generating SQL query:", error);
      }
      
      // Execute query
      let results = [];
      try {
        results = await query;
        console.log(`Search results count: ${results.length}`);
        if (results.length > 0) {
          console.log("First match name:", results[0].name, "ID:", results[0].id, "Approval status:", results[0].approvalStatus);
        } else {
          console.log("No matches found.");
        }
      } catch (queryError) {
        console.error("Database query execution error:", queryError);
        throw new Error(`Database query failed: ${queryError.message}`);
      }
      
      return results;
    } catch (error) {
      console.error("Critical error in searchSchools method:", error);
      // Return empty array on error instead of throwing
      return [];
    }
  }

  async createSchool(school: InsertSchool): Promise<School> {
    const [newSchool] = await db.insert(schools).values(school).returning();
    return newSchool;
  }

  async updateSchool(id: number, school: Partial<InsertSchool>): Promise<School> {
    const [updatedSchool] = await db
      .update(schools)
      .set(school)
      .where(eq(schools.id, id))
      .returning();
    return updatedSchool;
  }

  async getSchoolsByAdminId(adminId: number): Promise<School[]> {
    console.log(`[DB] Getting schools for admin ID: ${adminId}`);
    
    // Get schools that have this adminId directly in the admin_id field
    const directSchools = await db
      .select()
      .from(schools)
      .where(eq(schools.admin_id, adminId));
    
    console.log(`[DB] Found ${directSchools.length} schools with direct admin_id match: ${directSchools.map(s => s.id)}`);
    
    // Get user information to check schoolId
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, adminId))
      .limit(1);
    
    // Check if the user has a direct schoolId assignment
    let schoolIdSchools: any[] = [];
    if (user.length > 0 && user[0].schoolId) {
      schoolIdSchools = await db
        .select()
        .from(schools)
        .where(eq(schools.id, user[0].schoolId));
      
      console.log(`[DB] Found ${schoolIdSchools.length} schools from user.schoolId: ${schoolIdSchools.map(s => s.id)}`);
    }
    
    // Get schools from user_schools many-to-many relationship
    const userSchoolsData = await db
      .select({
        school: schools
      })
      .from(userSchools)
      .innerJoin(schools, eq(userSchools.schoolId, schools.id))
      .where(eq(userSchools.userId, adminId));
    
    const relatedSchools = userSchoolsData.map(item => item.school);
    console.log(`[DB] Found ${relatedSchools.length} schools from userSchools table: ${relatedSchools.map(s => s.id)}`);
    
    // Combine all school sources and remove duplicates
    const allSchools = [...directSchools, ...schoolIdSchools, ...relatedSchools];
    const uniqueSchools = allSchools.filter((school, index, self) => 
      index === self.findIndex((s) => s.id === school.id)
    );
    
    console.log(`[DB] Total unique schools for admin: ${uniqueSchools.length}, IDs: ${uniqueSchools.map(s => s.id)}`);
    
    return uniqueSchools;
  }
  //#endregion

  //#region User-School Association Methods
  async getUserSchools(userId: number): Promise<UserSchool[]> {
    return await db
      .select()
      .from(userSchools)
      .where(eq(userSchools.userId, userId));
  }

  async getSchoolUsers(schoolId: number): Promise<UserSchool[]> {
    return await db
      .select()
      .from(userSchools)
      .where(eq(userSchools.schoolId, schoolId));
  }

  async createUserSchool(userSchool: InsertUserSchool): Promise<UserSchool> {
    // Check if association already exists
    const [existing] = await db
      .select()
      .from(userSchools)
      .where(
        and(
          eq(userSchools.userId, userSchool.userId),
          eq(userSchools.schoolId, userSchool.schoolId)
        )
      );
    
    if (existing) {
      // If it exists, just return it
      return existing;
    }

    const [result] = await db
      .insert(userSchools)
      .values(userSchool)
      .returning();
    
    return result;
  }

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

  async removeUserSchool(userId: number, schoolId: number): Promise<boolean> {
    try {
      const result = await db
        .delete(userSchools)
        .where(
          and(
            eq(userSchools.userId, userId),
            eq(userSchools.schoolId, schoolId)
          )
        );
      
      return result.rowCount > 0;
    } catch (error) {
      console.error(`Error removing user-school association for user: ${userId}, school: ${schoolId}`, error);
      return false;
    }
  }
  //#endregion

  //#region Saved Schools Methods
  async getSavedSchools(userId: number): Promise<School[]> {
    const result = await db
      .select({ school: schools })
      .from(savedSchools)
      .innerJoin(schools, eq(savedSchools.schoolId, schools.id))
      .where(eq(savedSchools.userId, userId))
      .orderBy(desc(savedSchools.savedAt));
    
    return result.map(r => r.school);
  }

  async saveSchool(savedSchool: InsertSavedSchool): Promise<SavedSchool> {
    // Check if already saved
    const [existing] = await db
      .select()
      .from(savedSchools)
      .where(
        and(
          eq(savedSchools.userId, savedSchool.userId),
          eq(savedSchools.schoolId, savedSchool.schoolId)
        )
      );
    
    if (existing) {
      return existing;
    }
    
    const [newSavedSchool] = await db.insert(savedSchools).values(savedSchool).returning();
    return newSavedSchool;
  }

  async removeSavedSchool(userId: number, schoolId: number): Promise<boolean> {
    try {
      await db
        .delete(savedSchools)
        .where(
          and(
            eq(savedSchools.userId, userId),
            eq(savedSchools.schoolId, schoolId)
          )
        );
      return true;
    } catch (error) {
      console.error(`Error removing saved school: ${schoolId} for user: ${userId}`, error);
      return false;
    }
  }
  //#endregion

  //#region Comparison Methods
  async getComparisons(userId: number): Promise<Comparison[]> {
    return await db
      .select()
      .from(comparisons)
      .where(eq(comparisons.userId, userId))
      .orderBy(desc(comparisons.createdAt));
  }

  async createComparison(comparison: InsertComparison): Promise<Comparison> {
    const [newComparison] = await db.insert(comparisons).values(comparison).returning();
    return newComparison;
  }

  async deleteComparison(id: number): Promise<boolean> {
    try {
      await db.delete(comparisons).where(eq(comparisons.id, id));
      return true;
    } catch (error) {
      console.error(`Error deleting comparison with id ${id}:`, error);
      return false;
    }
  }
  //#endregion

  //#region Review Methods
  async getReviews(schoolId: number): Promise<Review[]> {
    return await db
      .select()
      .from(reviews)
      .where(eq(reviews.schoolId, schoolId))
      .orderBy(desc(reviews.createdAt));
  }

  async createReview(review: InsertReview): Promise<Review> {
    const [newReview] = await db
      .insert(reviews)
      .values({
        ...review,
        moderationStatus: "pending",
        moderationNotes: null,
        moderatedAt: null,
        moderatedBy: null
      })
      .returning();
    return newReview;
  }
  
  async getAllReviews(): Promise<Review[]> {
    return await db.select().from(reviews).orderBy(desc(reviews.createdAt));
  }
  
  async getReview(id: number): Promise<Review | undefined> {
    const [review] = await db
      .select()
      .from(reviews)
      .where(eq(reviews.id, id));
    return review;
  }

  async updateReview(id: number, reviewData: Partial<Review>): Promise<Review> {
    const [updatedReview] = await db
      .update(reviews)
      .set(reviewData)
      .where(eq(reviews.id, id))
      .returning();
    return updatedReview;
  }

  async deleteReview(id: number): Promise<boolean> {
    try {
      await db
        .delete(reviews)
        .where(eq(reviews.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting review:", error);
      return false;
    }
  }
  //#endregion

  //#region Faculty Methods
  async getFaculties(schoolId: number): Promise<Faculty[]> {
    return await db
      .select()
      .from(faculty)
      .where(eq(faculty.schoolId, schoolId))
      .orderBy(faculty.name);
  }

  async getFaculty(id: number): Promise<Faculty | undefined> {
    const [facultyMember] = await db.select().from(faculty).where(eq(faculty.id, id));
    return facultyMember || undefined;
  }

  async createFaculty(facultyMember: InsertFaculty): Promise<Faculty> {
    const [newFaculty] = await db.insert(faculty).values(facultyMember).returning();
    return newFaculty;
  }

  async updateFaculty(id: number, facultyMember: Partial<InsertFaculty>): Promise<Faculty> {
    const [updatedFaculty] = await db
      .update(faculty)
      .set(facultyMember)
      .where(eq(faculty.id, id))
      .returning();
    return updatedFaculty;
  }

  async deleteFaculty(id: number): Promise<boolean> {
    try {
      await db.delete(faculty).where(eq(faculty.id, id));
      return true;
    } catch (error) {
      console.error(`Error deleting faculty with id ${id}:`, error);
      return false;
    }
  }
  
  async getFacultiesByCampus(campusId: number): Promise<Faculty[]> {
    return await db
      .select()
      .from(faculty)
      .where(eq(faculty.campusId, campusId))
      .orderBy(faculty.name);
  }
  //#endregion

  //#region School Posts Methods
  async getSchoolPosts(schoolId: number, limit?: number, offset?: number): Promise<SchoolPost[]> {
    return await db
      .select()
      .from(schoolPosts)
      .where(eq(schoolPosts.schoolId, schoolId))
      .limit(limit || 50)
      .offset(offset || 0)
      .orderBy(desc(schoolPosts.createdAt));
  }

  async getSchoolPost(id: number): Promise<SchoolPost | undefined> {
    const [post] = await db.select().from(schoolPosts).where(eq(schoolPosts.id, id));
    return post || undefined;
  }

  async createSchoolPost(post: InsertSchoolPost): Promise<SchoolPost> {
    const [newPost] = await db.insert(schoolPosts).values(post).returning();
    return newPost;
  }

  async updateSchoolPost(id: number, post: Partial<InsertSchoolPost>): Promise<SchoolPost> {
    const [updatedPost] = await db
      .update(schoolPosts)
      .set(post)
      .where(eq(schoolPosts.id, id))
      .returning();
    return updatedPost;
  }

  async deleteSchoolPost(id: number): Promise<boolean> {
    try {
      await db.delete(schoolPosts).where(eq(schoolPosts.id, id));
      return true;
    } catch (error) {
      console.error(`Error deleting school post with id ${id}:`, error);
      return false;
    }
  }
  //#endregion

  //#region Campus Methods
  async getCampuses(schoolId: number): Promise<Campus[]> {
    return await db
      .select()
      .from(campuses)
      .where(eq(campuses.schoolId, schoolId))
      .orderBy(campuses.name);
  }

  async getCampus(id: number): Promise<Campus | undefined> {
    const [campus] = await db.select().from(campuses).where(eq(campuses.id, id));
    return campus || undefined;
  }

  async createCampus(campus: InsertCampus): Promise<Campus> {
    const [newCampus] = await db.insert(campuses).values(campus).returning();
    return newCampus;
  }

  async updateCampus(id: number, campus: Partial<InsertCampus>): Promise<Campus> {
    const [updatedCampus] = await db
      .update(campuses)
      .set(campus)
      .where(eq(campuses.id, id))
      .returning();
    return updatedCampus;
  }

  async deleteCampus(id: number): Promise<boolean> {
    try {
      await db.delete(campuses).where(eq(campuses.id, id));
      return true;
    } catch (error) {
      console.error(`Error deleting campus with id ${id}:`, error);
      return false;
    }
  }
  //#endregion
  
  //#region School Change Request Methods
  async createSchoolChangeRequest(request: InsertSchoolChangeRequest): Promise<SchoolChangeRequest> {
    const [newRequest] = await db.insert(schoolChangeRequests).values(request).returning();
    return newRequest;
  }

  async getSchoolChangeRequests(status?: string): Promise<SchoolChangeRequest[]> {
    let query = db.select().from(schoolChangeRequests);
    
    if (status) {
      query = query.where(eq(schoolChangeRequests.status, status));
    }
    
    return await query.orderBy(desc(schoolChangeRequests.createdAt));
  }

  async getSchoolChangeRequestsByAdmin(adminId: number, status?: string): Promise<SchoolChangeRequest[]> {
    let query = db.select()
      .from(schoolChangeRequests)
      .where(eq(schoolChangeRequests.requestedById, adminId));
    
    if (status) {
      query = query.where(eq(schoolChangeRequests.status, status));
    }
    
    return await query.orderBy(desc(schoolChangeRequests.createdAt));
  }

  async getSchoolChangeRequest(id: number): Promise<SchoolChangeRequest | undefined> {
    const [request] = await db.select().from(schoolChangeRequests).where(eq(schoolChangeRequests.id, id));
    return request || undefined;
  }

  async updateSchoolChangeRequestStatus(id: number, status: string, notes?: string, reviewedById?: number): Promise<SchoolChangeRequest> {
    const [updatedRequest] = await db
      .update(schoolChangeRequests)
      .set({
        status,
        notes,
        reviewedById,
        reviewedAt: new Date(),
        updatedAt: new Date(),
        notificationSent: false // Reset notification status when status changes
      })
      .where(eq(schoolChangeRequests.id, id))
      .returning();
    return updatedRequest;
  }
  
  async markSchoolChangeRequestNotificationSent(id: number): Promise<SchoolChangeRequest> {
    const [updatedRequest] = await db
      .update(schoolChangeRequests)
      .set({
        notificationSent: true,
        notificationSentAt: new Date()
      })
      .where(eq(schoolChangeRequests.id, id))
      .returning();
    return updatedRequest;
  }
  //#endregion

  //#region Campus Change Request Methods
  async createCampusChangeRequest(request: InsertCampusChangeRequest): Promise<CampusChangeRequest> {
    const [newRequest] = await db.insert(campusChangeRequests).values(request).returning();
    return newRequest;
  }

  async getCampusChangeRequests(schoolId?: number, status?: string): Promise<CampusChangeRequest[]> {
    let query = db.select().from(campusChangeRequests);
    
    if (schoolId) {
      query = query.where(eq(campusChangeRequests.schoolId, schoolId));
    }
    
    if (status) {
      query = query.where(eq(campusChangeRequests.status, status));
    }
    
    return await query.orderBy(desc(campusChangeRequests.createdAt));
  }

  async getCampusChangeRequest(id: number): Promise<CampusChangeRequest | undefined> {
    const [request] = await db.select().from(campusChangeRequests).where(eq(campusChangeRequests.id, id));
    return request || undefined;
  }

  async updateCampusChangeRequestStatus(id: number, status: string, notes?: string, reviewedById?: number): Promise<CampusChangeRequest> {
    const [updatedRequest] = await db
      .update(campusChangeRequests)
      .set({
        status,
        notes,
        reviewedById,
        reviewedAt: new Date(),
        updatedAt: new Date(),
        notificationSent: false // Reset notification status when status changes
      })
      .where(eq(campusChangeRequests.id, id))
      .returning();
    return updatedRequest;
  }
  
  async markCampusChangeRequestNotificationSent(id: number): Promise<CampusChangeRequest> {
    const [updatedRequest] = await db
      .update(campusChangeRequests)
      .set({
        notificationSent: true,
        notificationSentAt: new Date()
      })
      .where(eq(campusChangeRequests.id, id))
      .returning();
    return updatedRequest;
  }
  //#endregion

  //#region Inquiry Methods
  async getInquiries(schoolId: number): Promise<Inquiry[]> {
    return await db
      .select()
      .from(inquiries)
      .where(eq(inquiries.schoolId, schoolId))
      .orderBy(desc(inquiries.createdAt));
  }
  
  async getUserInquiries(userId: number): Promise<Inquiry[]> {
    // Get the user to match email
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    
    if (!user) return [];
    
    // Find inquiries by userId first
    const userIdInquiries = await db
      .select()
      .from(inquiries)
      .where(eq(inquiries.userId, userId))
      .orderBy(desc(inquiries.createdAt));
      
    // Also find inquiries by email if it exists
    let emailInquiries: any[] = [];
    if (user.email) {
      emailInquiries = await db
        .select()
        .from(inquiries)
        .where(eq(inquiries.email, user.email))
        .orderBy(desc(inquiries.createdAt));
    }
    
    // Combine and remove duplicates
    const combined = [...userIdInquiries, ...emailInquiries];
    const uniqueIds = new Set();
    return combined.filter(inquiry => {
      if (uniqueIds.has(inquiry.id)) return false;
      uniqueIds.add(inquiry.id);
      return true;
    });
  }

  async getInquiry(id: number): Promise<Inquiry | undefined> {
    const [inquiry] = await db.select().from(inquiries).where(eq(inquiries.id, id));
    return inquiry || undefined;
  }

  async createInquiry(inquiry: InsertInquiry): Promise<Inquiry> {
    const [newInquiry] = await db.insert(inquiries).values(inquiry).returning();
    return newInquiry;
  }

  async updateInquiry(id: number, inquiry: Partial<InsertInquiry>): Promise<Inquiry> {
    const [updatedInquiry] = await db
      .update(inquiries)
      .set(inquiry)
      .where(eq(inquiries.id, id))
      .returning();
    return updatedInquiry;
  }
  //#endregion

  //#region Activity Log Methods
  async createActivityLog(log: InsertActivityLog): Promise<ActivityLog> {
    const [newLog] = await db.insert(activityLogs).values(log).returning();
    return newLog;
  }

  async getUserActivityLogs(userId: number, limit?: number, offset?: number): Promise<ActivityLog[]> {
    return await db
      .select()
      .from(activityLogs)
      .where(eq(activityLogs.userId, userId))
      .limit(limit || 50)
      .offset(offset || 0)
      .orderBy(desc(activityLogs.createdAt));
  }

  async getActivityLogsByEntityType(entityType: string, entityId: number): Promise<ActivityLog[]> {
    return await db
      .select()
      .from(activityLogs)
      .where(
        and(
          eq(activityLogs.entityType, entityType),
          eq(activityLogs.entityId, entityId)
        )
      )
      .orderBy(desc(activityLogs.createdAt));
  }

  async getRecentActivityLogs(limit?: number): Promise<ActivityLog[]> {
    return await db
      .select()
      .from(activityLogs)
      .limit(limit || 50)
      .orderBy(desc(activityLogs.createdAt));
  }

  async getFilteredActivityLogs(
    type?: string,
    entityType?: string,
    fromDate?: Date,
    toDate?: Date,
    searchTerm?: string,
    limit?: number,
    offset?: number
  ): Promise<ActivityLog[]> {
    let query = db.select().from(activityLogs);
    const conditions = [];

    if (type) {
      conditions.push(eq(activityLogs.action, type));
    }

    if (entityType) {
      conditions.push(eq(activityLogs.entityType, entityType));
    }

    if (fromDate) {
      conditions.push(gte(activityLogs.createdAt, fromDate));
    }

    if (toDate) {
      conditions.push(lte(activityLogs.createdAt, toDate));
    }

    if (searchTerm) {
      conditions.push(
        like(
          sql`JSON_STRINGIFY(${activityLogs.metadata})`, 
          `%${searchTerm}%`
        )
      );
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    return await query
      .limit(limit || 50)
      .offset(offset || 0)
      .orderBy(desc(activityLogs.createdAt));
  }
  //#endregion

  //#region Platform Admin Methods
  async getAllUsers(limit?: number, offset?: number): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .limit(limit || 50)
      .offset(offset || 0)
      .orderBy(desc(users.createdAt));
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(eq(users.role, role))
      .orderBy(users.fullName);
  }

  async deactivateUser(id: number): Promise<boolean> {
    try {
      await db
        .update(users)
        .set({ isActive: false })
        .where(eq(users.id, id));
      return true;
    } catch (error) {
      console.error(`Error deactivating user with id ${id}:`, error);
      return false;
    }
  }

  async getPendingSchools(): Promise<School[]> {
    return await db
      .select()
      .from(schools)
      .where(eq(schools.approvalStatus, "pending"))
      .orderBy(desc(schools.id));
  }
  
  async getSchoolsByApprovalStatus(status: "pending" | "approved" | "rejected"): Promise<School[]> {
    return await db
      .select()
      .from(schools)
      .where(eq(schools.approvalStatus, status))
      .orderBy(desc(schools.id));
  }
  
  async getSchoolCountByStatus(status: "pending" | "approved" | "rejected"): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(schools)
      .where(eq(schools.approvalStatus, status));
    
    return result?.count || 0;
  }

  async updateSchoolApprovalStatus(id: number, status: string, adminId: number): Promise<School> {
    const [updatedSchool] = await db
      .update(schools)
      .set({
        approvalStatus: status,
        lastVerifiedAt: new Date(),
        lastVerifiedBy: adminId
      })
      .where(eq(schools.id, id))
      .returning();
    return updatedSchool;
  }
  
  async getAllSchoolChangeRequests(): Promise<SchoolChangeRequest[]> {
    return await db
      .select()
      .from(schoolChangeRequests)
      .orderBy(desc(schoolChangeRequests.createdAt));
  }
  
  async getSchoolChangeRequestsByStatus(status: "pending" | "approved" | "rejected"): Promise<SchoolChangeRequest[]> {
    return await db
      .select()
      .from(schoolChangeRequests)
      .where(eq(schoolChangeRequests.status, status))
      .orderBy(desc(schoolChangeRequests.createdAt));
  }
  
  async getSchoolChangeRequestCountByStatus(status: "pending" | "approved" | "rejected"): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(schoolChangeRequests)
      .where(eq(schoolChangeRequests.status, status));
    
    return result?.count || 0;
  }
  
  async reviewSchoolChangeRequest(
    id: number, 
    status: "approved" | "rejected", 
    reviewedById: number, 
    notes?: string
  ): Promise<SchoolChangeRequest> {
    const [updatedRequest] = await db
      .update(schoolChangeRequests)
      .set({
        status,
        reviewedById,
        reviewedAt: new Date(),
        notes: notes || null,
        updatedAt: new Date()
      })
      .where(eq(schoolChangeRequests.id, id))
      .returning();
    
    return updatedRequest;
  }

  async verifySchool(id: number, adminId: number): Promise<School> {
    const [updatedSchool] = await db
      .update(schools)
      .set({
        verificationStatus: true,
        lastVerifiedAt: new Date(),
        lastVerifiedBy: adminId
      })
      .where(eq(schools.id, id))
      .returning();
    return updatedSchool;
  }

  async getPendingReviews(): Promise<Review[]> {
    return await db
      .select()
      .from(reviews)
      .where(eq(reviews.moderationStatus, "pending"))
      .orderBy(desc(reviews.createdAt));
  }

  async moderateReview(id: number, status: string, notes: string, adminId: number): Promise<Review> {
    const [updatedReview] = await db
      .update(reviews)
      .set({
        moderationStatus: status,
        moderationNotes: notes,
        moderatedAt: new Date(),
        moderatedBy: adminId
      })
      .where(eq(reviews.id, id))
      .returning();
    return updatedReview;
  }
  //#endregion

  //#region Quiz Methods
  // Placeholders for quiz methods - these would need to be completed
  async getQuizQuestions() {
    try {
      console.log("Fetching quiz questions from database...");
      const questions = await db.select().from(quizQuestions).orderBy(asc(quizQuestions.order));
      console.log(`Retrieved ${questions.length} quiz questions successfully`);
      return questions;
    } catch (error) {
      console.error("Error fetching quiz questions:", error);
      return [];
    }
  }

  async getQuizQuestionsByCategory(category: string) {
    try {
      const questions = await db.select()
        .from(quizQuestions)
        .where(eq(quizQuestions.category, category))
        .orderBy(asc(quizQuestions.order));
      return questions;
    } catch (error) {
      console.error(`Error fetching quiz questions for category ${category}:`, error);
      return [];
    }
  }

  async createQuizQuestion(question: InsertQuizQuestion): Promise<QuizQuestion> {
    try {
      const [newQuestion] = await db.insert(quizQuestions)
        .values({
          ...question,
          createdAt: new Date()
        })
        .returning();
      return newQuestion;
    } catch (error) {
      console.error("Error creating quiz question:", error);
      throw error;
    }
  }

  async createQuizResponse(response: InsertQuizResponse) {
    try {
      const [newResponse] = await db.insert(quizResponses)
        .values({
          ...response,
          createdAt: new Date()
        })
        .returning();
      return newResponse;
    } catch (error) {
      console.error("Error creating quiz response:", error);
      throw error;
    }
  }

  async getQuizResponse(id: number) {
    try {
      const [response] = await db.select()
        .from(quizResponses)
        .where(eq(quizResponses.id, id));
      return response;
    } catch (error) {
      console.error(`Error fetching quiz response ${id}:`, error);
      return undefined;
    }
  }

  async createQuizResult(result: InsertQuizResult) {
    try {
      const [newResult] = await db.insert(quizResults)
        .values({
          ...result,
          createdAt: new Date()
        })
        .returning();
      return newResult;
    } catch (error) {
      console.error("Error creating quiz result:", error);
      throw error;
    }
  }

  async getQuizResultsByUserId(userId: number) {
    try {
      const results = await db.select()
        .from(quizResults)
        .where(eq(quizResults.userId, userId))
        .orderBy(desc(quizResults.createdAt));
      return results;
    } catch (error) {
      console.error(`Error fetching quiz results for user ${userId}:`, error);
      return [];
    }
  }

  async getQuizResultsBySessionId(sessionId: string) {
    try {
      const results = await db.select()
        .from(quizResults)
        .where(eq(quizResults.sessionId, sessionId))
        .orderBy(desc(quizResults.createdAt));
      return results;
    } catch (error) {
      console.error(`Error fetching quiz results for session ${sessionId}:`, error);
      return [];
    }
  }
  async getSchoolMatchesByPreferences(preferences: Record<string, any>) {
    try {
      console.log("Finding school matches based on user preferences:", JSON.stringify(preferences));
      
      // Get all approved schools to match against
      const allSchools = await db.select()
        .from(schools)
        .where(eq(sql`LOWER(${schools.approvalStatus})`, 'approved'));
      
      console.log(`Found ${allSchools.length} approved schools to match against`);
      
      let matchedSchools = [];
      
      // Extract preferences to match against
      const schoolTypes = preferences.schoolType || [];
      const locations = preferences.location || [];
      const curriculums = preferences.curriculum || [];
      const desiredFeatures = preferences.features || [];
      const hasFinancialAidNeed = preferences.budget?.includes('aid') || false;
      
      // Filter schools based on preferences
      for (const school of allSchools) {
        let score = 0;
        let matchFactors = [];
        
        // Match school type
        if (schoolTypes.length === 0 || 
            schoolTypes.some((type: string) => 
              school.type?.toLowerCase().includes(type.toLowerCase())
            )) {
          score += 2;
          matchFactors.push('school type');
        }
        
        // Match location
        if (locations.length === 0 || 
            locations.some((loc: string) => 
              school.location?.toLowerCase().includes(loc.toLowerCase())
            )) {
          score += 2;
          matchFactors.push('location');
        }
        
        // Match curriculum
        if (curriculums.length === 0 || 
            curriculums.some((curr: string) => 
              school.curriculum_type?.toLowerCase().includes(curr.toLowerCase())
            )) {
          score += 2;
          matchFactors.push('curriculum');
        }
        
        // Match financial aid
        if (!hasFinancialAidNeed || school.has_financial_aid) {
          score += 1;
          if (school.has_financial_aid) matchFactors.push('financial aid');
        }
        
        // Match features
        if (school.features) {
          let schoolFeatures: string[] = [];
          
          // Convert features to array if it's a string
          if (typeof school.features === 'string') {
            try {
              schoolFeatures = JSON.parse(school.features);
            } catch {
              // Handle the case where features is a string but not valid JSON
              schoolFeatures = school.features.split(',').map(f => f.trim());
            }
          } else if (Array.isArray(school.features)) {
            schoolFeatures = school.features;
          }
          
          // Count feature matches
          const featureMatches = desiredFeatures.filter(
            (feature: string) => schoolFeatures.some(f => 
              f.toLowerCase().includes(feature.toLowerCase())
            )
          ).length;
          
          score += featureMatches * 0.5;
          if (featureMatches > 0) matchFactors.push('facilities');
        }
        
        // Normalize match score to a 0-1 range (will be displayed as percentage)
        const normalizedScore = Math.min(score / 10, 1);
        
        // Add to matched schools if score is above threshold
        if (score >= 2) {
          matchedSchools.push({
            ...school,
            matchScore: normalizedScore,
            matchFactors
          });
        }
      }
      
      // Sort by match score descending
      matchedSchools = matchedSchools.sort((a, b) => b.matchScore - a.matchScore);
      
      console.log(`Found ${matchedSchools.length} matching schools based on user preferences`);
      
      // Limit to top 5 matches
      return matchedSchools.slice(0, 5);
    } catch (error) {
      console.error("Error finding school matches by preferences:", error);
      return [];
    }
  }
  
  async updateQuizQuestion(id: number, question: any) { return question; }
  async deleteQuizQuestion(id: number) { return true; }
  //#endregion

  //#region Platform Notification Methods
  // Placeholders for platform notification methods - would need to be implemented
  async createPlatformNotification(notification: any) { return notification; }
  async updatePlatformNotification(id: number, notification: any) { return notification; }
  async deletePlatformNotification(id: number) { return true; }
  async getPlatformNotifications(active?: boolean) { return []; }
  async getPlatformNotificationsByTarget(targetGroup: string) { return []; }
  //#endregion

  //#region Team Profile Methods
  async getTeamProfiles(options?: { includeInactive?: boolean }): Promise<TeamProfile[]> {
    let query = db.select().from(teamProfiles);
    
    // If includeInactive is not explicitly true, filter to only active profiles
    if (!options?.includeInactive) {
      query = query.where(eq(teamProfiles.isActive, true));
    }
    
    // Order by priority (higher numbers first)
    return await query.orderBy(desc(teamProfiles.priority));
  }
  
  async getTeamProfile(id: number): Promise<TeamProfile | undefined> {
    const [profile] = await db
      .select()
      .from(teamProfiles)
      .where(eq(teamProfiles.id, id));
    
    return profile;
  }
  
  async createTeamProfile(profile: any): Promise<TeamProfile> {
    const [newProfile] = await db
      .insert(teamProfiles)
      .values({
        ...profile,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    
    return newProfile;
  }
  
  async updateTeamProfile(id: number, profile: any): Promise<TeamProfile> {
    // Include the updated timestamp
    const updateData = {
      ...profile,
      updatedAt: new Date(),
    };
    
    const [updatedProfile] = await db
      .update(teamProfiles)
      .set(updateData)
      .where(eq(teamProfiles.id, id))
      .returning();
    
    return updatedProfile;
  }
  
  async deleteTeamProfile(id: number): Promise<boolean> {
    try {
      const result = await db
        .delete(teamProfiles)
        .where(eq(teamProfiles.id, id));
      
      return result.rowCount > 0;
    } catch (error) {
      console.error(`Error deleting team profile with id ${id}:`, error);
      return false;
    }
  }
  
  //#region Content Management Methods
  // Placeholders for content management methods - would need to be implemented
  async getContentPages(params?: { status?: string, limit?: number, offset?: number }): Promise<ContentPage[]> {
    try {
      let query = db.select().from(contentPages);
      
      // Filter by status if provided
      if (params?.status) {
        query = query.where(eq(contentPages.status, params.status));
      }
      
      // Apply pagination if provided
      if (params?.limit) {
        query = query.limit(params.limit);
        
        if (params.offset) {
          query = query.offset(params.offset);
        }
      }
      
      // Sort by most recently published/updated
      query = query.orderBy(desc(contentPages.updatedAt));
      
      const results = await query;
      return results;
    } catch (error) {
      console.error('Error getting content pages:', error);
      return [];
    }
  }
  
  async getContentPageBySlug(slug: string): Promise<ContentPage | undefined> {
    try {
      const [page] = await db
        .select()
        .from(contentPages)
        .where(eq(contentPages.slug, slug));
        
      return page;
    } catch (error) {
      console.error('Error getting content page by slug:', error);
      return undefined;
    }
  }
  
  async getContentPage(id: number): Promise<ContentPage | undefined> {
    try {
      const [page] = await db
        .select()
        .from(contentPages)
        .where(eq(contentPages.id, id));
        
      return page;
    } catch (error) {
      console.error('Error getting content page by ID:', error);
      return undefined;
    }
  }
  
  async createContentPage(page: InsertContentPage): Promise<ContentPage> {
    try {
      const [newPage] = await db
        .insert(contentPages)
        .values({
          ...page,
          updatedAt: new Date(),
          publishedAt: page.status === 'published' ? new Date() : null
        })
        .returning();
        
      return newPage;
    } catch (error) {
      console.error('Error creating content page:', error);
      throw error;
    }
  }
  
  async updateContentPage(id: number, page: Partial<InsertContentPage>): Promise<ContentPage> {
    try {
      // Check if we're changing status to published
      const [existingPage] = await db
        .select()
        .from(contentPages)
        .where(eq(contentPages.id, id));
      
      const publishDateUpdate = 
        (existingPage.status !== 'published' && page.status === 'published')
          ? { publishedAt: new Date() }
          : {};
          
      const [updatedPage] = await db
        .update(contentPages)
        .set({
          ...page,
          ...publishDateUpdate,
          updatedAt: new Date()
        })
        .where(eq(contentPages.id, id))
        .returning();
        
      return updatedPage;
    } catch (error) {
      console.error('Error updating content page:', error);
      throw error;
    }
  }
  
  async deleteContentPage(id: number): Promise<boolean> {
    try {
      await db
        .delete(contentPages)
        .where(eq(contentPages.id, id));
        
      return true;
    } catch (error) {
      console.error('Error deleting content page:', error);
      return false;
    }
  }

  async getBlogPosts(params?: { status?: string, category?: string, categoryId?: number, limit?: number, offset?: number, isPublished?: boolean }): Promise<BlogPost[]> {
    try {
      let query = db.select().from(blogPosts);
      
      // Filter by isPublished if provided
      if (params?.isPublished !== undefined) {
        query = query.where(eq(blogPosts.isPublished, params.isPublished));
      }
      
      // Filter by categoryId if provided
      if (params?.categoryId) {
        query = query.where(eq(blogPosts.categoryId, params.categoryId));
      }
      
      // Apply pagination if provided
      if (params?.limit) {
        query = query.limit(params.limit);
        
        if (params.offset) {
          query = query.offset(params.offset);
        }
      }
      
      // Sort by most recently created posts first
      query = query.orderBy(desc(blogPosts.createdAt));
      
      const results = await query;
      return results;
    } catch (error) {
      console.error('Error getting blog posts:', error);
      return [];
    }
  }
  
  async getBlogPostBySlug(slug: string): Promise<BlogPost | undefined> {
    try {
      const [post] = await db
        .select()
        .from(blogPosts)
        .where(eq(blogPosts.slug, slug));
        
      return post;
    } catch (error) {
      console.error('Error getting blog post by slug:', error);
      return undefined;
    }
  }
  
  async getBlogPost(id: number): Promise<BlogPost | undefined> {
    try {
      const [post] = await db
        .select()
        .from(blogPosts)
        .where(eq(blogPosts.id, id));
        
      return post;
    } catch (error) {
      console.error('Error getting blog post by ID:', error);
      return undefined;
    }
  }
  
  async createBlogPost(post: InsertBlogPost): Promise<BlogPost> {
    try {
      const [newPost] = await db
        .insert(blogPosts)
        .values({
          ...post,
          updatedAt: new Date(),
          publishedAt: post.isPublished ? new Date() : null
        })
        .returning();
        
      return newPost;
    } catch (error) {
      console.error('Error creating blog post:', error);
      throw error;
    }
  }
  
  async updateBlogPost(id: number, post: Partial<InsertBlogPost>): Promise<BlogPost> {
    try {
      // Check if we're changing isPublished from false to true
      const [existingPost] = await db
        .select()
        .from(blogPosts)
        .where(eq(blogPosts.id, id));
      
      // Set publishedAt to current date if we're publishing for the first time
      const publishDateUpdate = 
        (existingPost.isPublished === false && post.isPublished === true)
          ? { publishedAt: new Date() }
          : {};
          
      const [updatedPost] = await db
        .update(blogPosts)
        .set({
          ...post,
          ...publishDateUpdate,
          updatedAt: new Date()
        })
        .where(eq(blogPosts.id, id))
        .returning();
        
      return updatedPost;
    } catch (error) {
      console.error('Error updating blog post:', error);
      throw error;
    }
  }
  
  async deleteBlogPost(id: number): Promise<boolean> {
    try {
      await db
        .delete(blogPosts)
        .where(eq(blogPosts.id, id));
        
      return true;
    } catch (error) {
      console.error('Error deleting blog post:', error);
      return false;
    }
  }

  async getFaqItems(params?: { status?: string, category?: string }): Promise<FaqItem[]> {
    try {
      let query = db.select().from(faqItems);
      
      // Filter by status if provided
      if (params?.status) {
        query = query.where(eq(faqItems.status, params.status));
      }
      
      // Filter by category if provided
      if (params?.category) {
        query = query.where(eq(faqItems.category, params.category));
      }
      
      // Sort by orderIndex
      query = query.orderBy(faqItems.orderIndex);
      
      const results = await query;
      return results;
    } catch (error) {
      console.error('Error getting FAQ items:', error);
      return [];
    }
  }
  
  async getFaqItem(id: number): Promise<FaqItem | undefined> {
    try {
      const [item] = await db
        .select()
        .from(faqItems)
        .where(eq(faqItems.id, id));
        
      return item;
    } catch (error) {
      console.error('Error getting FAQ item by ID:', error);
      return undefined;
    }
  }
  
  async createFaqItem(item: InsertFaqItem): Promise<FaqItem> {
    try {
      // Find the highest orderIndex in the same category
      const [{ maxOrder } = { maxOrder: 0 }] = await db
        .select({ maxOrder: sql`max(${faqItems.orderIndex})` })
        .from(faqItems)
        .where(eq(faqItems.categoryId, item.categoryId));
        
      const [newItem] = await db
        .insert(faqItems)
        .values({
          ...item,
          orderIndex: (maxOrder || 0) + 1,
          updatedAt: new Date()
        })
        .returning();
        
      return newItem;
    } catch (error) {
      console.error('Error creating FAQ item:', error);
      throw error;
    }
  }
  
  async updateFaqItem(id: number, item: Partial<InsertFaqItem>): Promise<FaqItem> {
    try {
      const [updatedItem] = await db
        .update(faqItems)
        .set({
          ...item,
          updatedAt: new Date()
        })
        .where(eq(faqItems.id, id))
        .returning();
        
      return updatedItem;
    } catch (error) {
      console.error('Error updating FAQ item:', error);
      throw error;
    }
  }
  
  async deleteFaqItem(id: number): Promise<boolean> {
    try {
      await db
        .delete(faqItems)
        .where(eq(faqItems.id, id));
        
      return true;
    } catch (error) {
      console.error('Error deleting FAQ item:', error);
      return false;
    }
  }

  async getCategories(type?: string): Promise<Category[]> {
    try {
      let query = db.select().from(categories);
      
      // Filter by type if provided
      if (type) {
        query = query.where(eq(categories.type, type));
      }
      
      // Sort by name (alphabetically)
      query = query.orderBy(categories.name);
      
      const results = await query;
      return results;
    } catch (error) {
      console.error('Error getting categories:', error);
      return [];
    }
  }
  
  async getCategory(id: number): Promise<Category | undefined> {
    try {
      const [category] = await db
        .select()
        .from(categories)
        .where(eq(categories.id, id));
        
      return category;
    } catch (error) {
      console.error('Error getting category by ID:', error);
      return undefined;
    }
  }
  
  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    try {
      const [category] = await db
        .select()
        .from(categories)
        .where(eq(categories.slug, slug));
        
      return category;
    } catch (error) {
      console.error('Error getting category by slug:', error);
      return undefined;
    }
  }
  
  async createCategory(category: InsertCategory): Promise<Category> {
    try {
      const [newCategory] = await db
        .insert(categories)
        .values({
          ...category,
          updatedAt: new Date()
        })
        .returning();
        
      return newCategory;
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  }
  
  async updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category> {
    try {
      const [updatedCategory] = await db
        .update(categories)
        .set({
          ...category,
          updatedAt: new Date()
        })
        .where(eq(categories.id, id))
        .returning();
        
      return updatedCategory;
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  }
  
  async deleteCategory(id: number): Promise<boolean> {
    try {
      await db
        .delete(categories)
        .where(eq(categories.id, id));
        
      return true;
    } catch (error) {
      console.error('Error deleting category:', error);
      return false;
    }
  }
  //#endregion

  //#region Messaging System Methods
  // Placeholders for messaging system methods - would need to be implemented
  async getConversations() { return []; }
  async getConversation(id: number) { return undefined; }
  async createConversation(conversation: any) { return conversation; }
  async updateConversationStatus(id: number, status: string) { return { id, status }; }
  async addUserToConversation(conversationId: number, userId: number, role?: string) { return { conversationId, userId, role }; }
  async removeUserFromConversation(conversationId: number, userId: number) { return true; }

  async getMessages(conversationId: number) { return []; }
  async createMessage(message: any) { return message; }
  async markMessagesAsRead(conversationId: number, userId: number) { return true; }
  async getUnreadMessageCount(userId: number) { return 0; }
  //#endregion

  //#region System Logs and Site Settings
  // Placeholders for system logs and site settings methods - would need to be implemented
  async createSystemLog(log: any) { return log; }
  async getSystemLogs() { return []; }

  async getSiteSettings() { return []; }
  async getSiteSettingsByCategory(category: string) { return []; }
  async getSiteSetting(key: string) { return undefined; }
  async createSiteSetting(setting: any) { return setting; }
  async updateSiteSetting(key: string, value: any, updatedBy?: number) { return { key, value }; }
  async deleteSiteSetting(key: string) { return true; }
  //#endregion

  //#region School Categories
  async getSchoolCategories(): Promise<SchoolCategory[]> {
    return await db.select().from(schoolCategories).orderBy(schoolCategories.name);
  }

  async getSchoolCategory(id: number): Promise<SchoolCategory | undefined> {
    const [category] = await db.select().from(schoolCategories).where(eq(schoolCategories.id, id));
    return category || undefined;
  }

  async createSchoolCategory(category: InsertSchoolCategory): Promise<SchoolCategory> {
    const [newCategory] = await db.insert(schoolCategories).values(category).returning();
    return newCategory;
  }

  async updateSchoolCategory(id: number, category: Partial<InsertSchoolCategory>): Promise<SchoolCategory> {
    const [updatedCategory] = await db
      .update(schoolCategories)
      .set(category)
      .where(eq(schoolCategories.id, id))
      .returning();
    return updatedCategory;
  }

  async deleteSchoolCategory(id: number): Promise<boolean> {
    try {
      await db.delete(schoolCategories).where(eq(schoolCategories.id, id));
      return true;
    } catch (error) {
      console.error(`Error deleting school category with id ${id}:`, error);
      return false;
    }
  }

  async getSchoolCategoriesBySchoolId(schoolId: number): Promise<SchoolCategory[]> {
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

  async addCategoryToSchool(relation: InsertSchoolCategoryRelation): Promise<SchoolCategoryRelation> {
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

  async removeCategoryFromSchool(schoolId: number, categoryId: number): Promise<boolean> {
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
  //#endregion
  
  //#region School Media
  async getSchoolMedia(schoolId: number): Promise<SchoolMedia[]> {
    return await db
      .select()
      .from(schoolMedia)
      .where(eq(schoolMedia.schoolId, schoolId))
      .orderBy(schoolMedia.orderIndex);
  }

  async getSchoolMediaItem(id: number): Promise<SchoolMedia | undefined> {
    const [media] = await db.select().from(schoolMedia).where(eq(schoolMedia.id, id));
    return media || undefined;
  }

  async createSchoolMedia(media: InsertSchoolMedia): Promise<SchoolMedia> {
    const [newMedia] = await db.insert(schoolMedia).values(media).returning();
    return newMedia;
  }

  async updateSchoolMedia(id: number, media: Partial<InsertSchoolMedia>): Promise<SchoolMedia> {
    const [updatedMedia] = await db
      .update(schoolMedia)
      .set(media)
      .where(eq(schoolMedia.id, id))
      .returning();
    return updatedMedia;
  }

  async deleteSchoolMedia(id: number): Promise<boolean> {
    try {
      await db.delete(schoolMedia).where(eq(schoolMedia.id, id));
      return true;
    } catch (error) {
      console.error(`Error deleting school media with id ${id}:`, error);
      return false;
    }
  }
  //#endregion

  //#region User Preferences
  async getUserPreferences(userId: number): Promise<UserPreferences | undefined> {
    const [preferences] = await db.select().from(userPreferences).where(eq(userPreferences.userId, userId));
    return preferences || undefined;
  }

  async createUserPreferences(preferences: InsertUserPreferences): Promise<UserPreferences> {
    const [newPreferences] = await db.insert(userPreferences).values(preferences).returning();
    return newPreferences;
  }

  async updateUserPreferences(userId: number, preferences: Partial<InsertUserPreferences>): Promise<UserPreferences> {
    // Check if preferences exist
    const [existingPreferences] = await db.select().from(userPreferences).where(eq(userPreferences.userId, userId));
    
    if (!existingPreferences) {
      // Create new preferences if they don't exist
      return this.createUserPreferences({
        userId,
        ...preferences as InsertUserPreferences
      });
    }
    
    const [updatedPreferences] = await db
      .update(userPreferences)
      .set(preferences)
      .where(eq(userPreferences.userId, userId))
      .returning();
    return updatedPreferences;
  }
  //#endregion

  //#region User Notifications
  async getUserNotifications(userId: number): Promise<UserNotification[]> {
    return await db
      .select()
      .from(userNotifications)
      .where(eq(userNotifications.userId, userId))
      .orderBy(desc(userNotifications.createdAt));
  }

  async getUserNotification(id: number): Promise<UserNotification | undefined> {
    const [notification] = await db.select().from(userNotifications).where(eq(userNotifications.id, id));
    return notification || undefined;
  }

  async createUserNotification(notification: InsertUserNotification): Promise<UserNotification> {
    const [newNotification] = await db.insert(userNotifications).values(notification).returning();
    return newNotification;
  }

  async markNotificationAsRead(id: number): Promise<UserNotification> {
    const [updatedNotification] = await db
      .update(userNotifications)
      .set({ isRead: true })
      .where(eq(userNotifications.id, id))
      .returning();
    return updatedNotification;
  }

  async markAllNotificationsAsRead(userId: number): Promise<boolean> {
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
  //#endregion

  //#region User Profile
  async getUserProfile(userId: number): Promise<UserProfile | undefined> {
    const [profile] = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId));
    return profile || undefined;
  }

  async createUserProfile(profile: InsertUserProfile): Promise<UserProfile> {
    const [newProfile] = await db.insert(userProfiles).values(profile).returning();
    return newProfile;
  }

  async updateUserProfile(userId: number, profile: Partial<InsertUserProfile>): Promise<UserProfile> {
    // Check if profile exists
    const [existingProfile] = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId));
    
    if (!existingProfile) {
      // Create new profile if it doesn't exist
      return this.createUserProfile({
        userId,
        ...profile as InsertUserProfile
      });
    }
    
    const [updatedProfile] = await db
      .update(userProfiles)
      .set(profile)
      .where(eq(userProfiles.userId, userId))
      .returning();
    return updatedProfile;
  }

  async getUserPublicProfile(userId: number): Promise<Partial<UserProfile> | undefined> {
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
  //#endregion

  //#region Testimonials
  async getTestimonials(limit?: number): Promise<Testimonial[]> {
    return await db
      .select()
      .from(testimonials)
      .where(eq(testimonials.isActive, true))
      .limit(limit || 20)
      .orderBy(desc(testimonials.createdAt));
  }

  async getTestimonialById(id: number): Promise<Testimonial | undefined> {
    const [testimonial] = await db.select().from(testimonials).where(eq(testimonials.id, id));
    return testimonial || undefined;
  }

  async getTestimonialsBySchoolId(schoolId: number): Promise<Testimonial[]> {
    return await db
      .select()
      .from(testimonials)
      .where(
        and(
          eq(testimonials.schoolId, schoolId),
          eq(testimonials.isActive, true)
        )
      )
      .orderBy(desc(testimonials.createdAt));
  }

  async createTestimonial(testimonial: InsertTestimonial): Promise<Testimonial> {
    const [newTestimonial] = await db.insert(testimonials).values(testimonial).returning();
    return newTestimonial;
  }

  async updateTestimonial(id: number, testimonial: Partial<InsertTestimonial>): Promise<Testimonial | undefined> {
    const [updatedTestimonial] = await db
      .update(testimonials)
      .set(testimonial)
      .where(eq(testimonials.id, id))
      .returning();
    return updatedTestimonial;
  }

  async deleteTestimonial(id: number): Promise<boolean> {
    try {
      await db
        .update(testimonials)
        .set({ isActive: false })
        .where(eq(testimonials.id, id));
      return true;
    } catch (error) {
      console.error(`Error deleting testimonial with id ${id}:`, error);
      return false;
    }
  }
  //#endregion
  
  //#region Team Profiles
  async getTeamProfiles(options?: { includeInactive?: boolean }): Promise<TeamProfile[]> {
    let query = db.select().from(teamProfiles);
    
    if (!options?.includeInactive) {
      query = query.where(eq(teamProfiles.isActive, true));
    }
    
    return await query.orderBy(asc(teamProfiles.priority), asc(teamProfiles.name));
  }

  async getTeamProfile(id: number): Promise<TeamProfile | undefined> {
    const [profile] = await db.select().from(teamProfiles).where(eq(teamProfiles.id, id));
    return profile || undefined;
  }

  async createTeamProfile(profile: InsertTeamProfile): Promise<TeamProfile> {
    const [newProfile] = await db.insert(teamProfiles).values(profile).returning();
    return newProfile;
  }

  async updateTeamProfile(id: number, profile: Partial<InsertTeamProfile>): Promise<TeamProfile> {
    const [updatedProfile] = await db
      .update(teamProfiles)
      .set(profile)
      .where(eq(teamProfiles.id, id))
      .returning();
    
    if (!updatedProfile) {
      throw new Error("Team profile not found");
    }
    
    return updatedProfile;
  }

  async deleteTeamProfile(id: number): Promise<boolean> {
    try {
      await db.delete(teamProfiles).where(eq(teamProfiles.id, id));
      return true;
    } catch (error) {
      console.error(`Error deleting team profile with id ${id}:`, error);
      return false;
    }
  }
  //#endregion

  //#region Support Requests
  async getSupportRequests(limit?: number, offset?: number, status?: string): Promise<SupportRequest[]> {
    let query = db.select().from(supportRequests);
    
    if (status) {
      query = query.where(eq(supportRequests.status, status));
    }
    
    return await query
      .limit(limit || 50)
      .offset(offset || 0)
      .orderBy(desc(supportRequests.createdAt));
  }

  async getSupportRequest(id: number): Promise<SupportRequest | undefined> {
    const [request] = await db.select().from(supportRequests).where(eq(supportRequests.id, id));
    return request || undefined;
  }

  async getUserSupportRequests(userId: number): Promise<SupportRequest[]> {
    return await db
      .select()
      .from(supportRequests)
      .where(eq(supportRequests.userId, userId))
      .orderBy(desc(supportRequests.createdAt));
  }

  async createSupportRequest(request: InsertSupportRequest): Promise<SupportRequest> {
    const [newRequest] = await db.insert(supportRequests).values(request).returning();
    return newRequest;
  }

  async updateSupportRequest(id: number, request: Partial<SupportRequest>): Promise<SupportRequest> {
    const [updatedRequest] = await db
      .update(supportRequests)
      .set({
        ...request,
        updatedAt: new Date()
      })
      .where(eq(supportRequests.id, id))
      .returning();
    return updatedRequest;
  }

  async deleteSupportRequest(id: number): Promise<boolean> {
    try {
      await db.delete(supportRequests).where(eq(supportRequests.id, id));
      return true;
    } catch (error) {
      console.error(`Error deleting support request with id ${id}:`, error);
      return false;
    }
  }
  //#endregion

  // Add this method inside the class, around line 1005 near other school-related methods 
  
  async deleteSchool(id: number): Promise<boolean> {
    try {
      // Start a transaction to ensure all operations succeed or fail together
      return await db.transaction(async (tx) => {
        // 1. Delete related school media
        await tx
          .delete(schoolMedia)
          .where(eq(schoolMedia.schoolId, id));
          
        // 2. Delete related school category relations
        await tx
          .delete(schoolCategoryRelations)
          .where(eq(schoolCategoryRelations.schoolId, id));
          
        // 3. Delete related school posts
        await tx
          .delete(schoolPosts)
          .where(eq(schoolPosts.schoolId, id));
          
        // 4. Delete campuses associated with this school
        await tx
          .delete(campuses)
          .where(eq(campuses.schoolId, id));
          
        // 5. Delete faculties associated with this school
        await tx
          .delete(faculty)
          .where(eq(faculty.schoolId, id));
          
        // 6. Delete reviews for this school
        await tx
          .delete(reviews)
          .where(eq(reviews.schoolId, id));
          
        // 7. Delete user-school associations
        await tx
          .delete(userSchools)
          .where(eq(userSchools.schoolId, id));
          
        // 8. Delete saved schools entries
        await tx
          .delete(savedSchools)
          .where(eq(savedSchools.schoolId, id));
          
        // 9. Finally delete the school itself
        await tx
          .delete(schools)
          .where(eq(schools.id, id));
          
        return true;
      });
    } catch (error) {
      console.error(`Error deleting school with id ${id}:`, error);
      return false;
    }
  }
}
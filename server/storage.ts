import { 
  users, type User, type InsertUser,
  schools, type School, type InsertSchool,
  savedSchools, type SavedSchool, type InsertSavedSchool,
  comparisons, type Comparison, type InsertComparison,
  reviews, type Review, type InsertReview,
  campuses, type Campus, type InsertCampus,
  campusChangeRequests, type CampusChangeRequest, type InsertCampusChangeRequest,
  schoolChangeRequests, type SchoolChangeRequest, type InsertSchoolChangeRequest,
  faculty, type Faculty, type InsertFaculty,
  schoolPosts, type SchoolPost, type InsertSchoolPost,
  inquiries, type Inquiry, type InsertInquiry,
  activityLogs, type ActivityLog, type InsertActivityLog,
  quizQuestions, type QuizQuestion, type InsertQuizQuestion,
  quizResponses, type QuizResponse, type InsertQuizResponse,
  quizResults, type QuizResult, type InsertQuizResult,
  platformNotifications, type PlatformNotification, type InsertPlatformNotification,
  contentPages, type ContentPage, type InsertContentPage,
  blogPosts, type BlogPost, type InsertBlogPost,
  faqItems, type FaqItem, type InsertFaqItem,
  categories, type Category, type InsertCategory,
  messages, type Message, type InsertMessage,
  conversations, type Conversation, type InsertConversation,
  conversationParticipants, type ConversationParticipant, type InsertConversationParticipant,
  systemLogs, type SystemLog, type InsertSystemLog,
  siteSettings, type SiteSetting, type InsertSiteSetting,
  // New schema additions
  schoolCategories, type SchoolCategory, type InsertSchoolCategory,
  schoolCategoryRelations, type SchoolCategoryRelation, type InsertSchoolCategoryRelation,
  schoolMedia, type SchoolMedia, type InsertSchoolMedia,
  userPreferences, type UserPreferences, type InsertUserPreferences,
  userNotifications, type UserNotification, type InsertUserNotification,
  userProfiles, type UserProfile, type InsertUserProfile,
  testimonials, type Testimonial, type InsertTestimonial,
  supportRequests, type SupportRequest, type InsertSupportRequest,
  // Team profiles
  teamProfiles, type TeamProfile, type InsertTeamProfile,
  // Multiple schools per user
  userSchools, type UserSchool, type InsertUserSchool
} from "@shared/schema";
import { DatabaseStorage } from "./database-storage";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User>;
  
  // Team profiles methods
  getTeamProfiles(options?: { includeInactive?: boolean }): Promise<TeamProfile[]>;
  getTeamProfile(id: number): Promise<TeamProfile | undefined>;
  createTeamProfile(profile: any): Promise<TeamProfile>;
  updateTeamProfile(id: number, profile: any): Promise<TeamProfile>;
  deleteTeamProfile(id: number): Promise<boolean>;
  
  // School methods
  getSchool(id: number): Promise<School | undefined>;
  getSchools(limit?: number, offset?: number): Promise<School[]>;
  getSchoolsByType(type: string): Promise<School[]>;
  getSchoolsByLocation(location: string): Promise<School[]>;
  searchSchools(params: {
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
  }): Promise<School[]>;
  createSchool(school: InsertSchool): Promise<School>;
  updateSchool(id: number, school: Partial<InsertSchool>): Promise<School>;
  getSchoolsByAdminId(adminId: number): Promise<School[]>;
  
  // User-School association methods
  getUserSchools(userId: number): Promise<UserSchool[]>;
  getSchoolUsers(schoolId: number): Promise<UserSchool[]>;
  createUserSchool(userSchool: InsertUserSchool): Promise<UserSchool>;
  updateUserSchool(userId: number, schoolId: number, updates: Partial<InsertUserSchool>): Promise<UserSchool>;
  removeUserSchool(userId: number, schoolId: number): Promise<boolean>;
  
  // Saved schools methods
  getSavedSchools(userId: number): Promise<School[]>;
  saveSchool(savedSchool: InsertSavedSchool): Promise<SavedSchool>;
  removeSavedSchool(userId: number, schoolId: number): Promise<boolean>;
  
  // Comparison methods
  getComparisons(userId: number): Promise<Comparison[]>;
  createComparison(comparison: InsertComparison): Promise<Comparison>;
  deleteComparison(id: number): Promise<boolean>;
  
  // Review methods
  getReviews(schoolId: number): Promise<Review[]>;
  createReview(review: InsertReview): Promise<Review>;
  getAllReviews(): Promise<Review[]>;
  getReview(id: number): Promise<Review | undefined>;
  updateReview(id: number, review: Partial<Review>): Promise<Review>;
  deleteReview(id: number): Promise<boolean>;
  moderateReview(id: number, status: string, notes: string | null, moderatedBy: number): Promise<Review>;
  
  // Faculty methods (for school admins)
  getFaculties(schoolId: number): Promise<Faculty[]>;
  getFaculty(id: number): Promise<Faculty | undefined>;
  createFaculty(faculty: InsertFaculty): Promise<Faculty>;
  updateFaculty(id: number, faculty: Partial<InsertFaculty>): Promise<Faculty>;
  deleteFaculty(id: number): Promise<boolean>;
  
  // School posts methods (for school admins)
  getSchoolPosts(schoolId: number, limit?: number, offset?: number): Promise<SchoolPost[]>;
  getSchoolPost(id: number): Promise<SchoolPost | undefined>;
  createSchoolPost(post: InsertSchoolPost): Promise<SchoolPost>;
  updateSchoolPost(id: number, post: Partial<InsertSchoolPost>): Promise<SchoolPost>;
  deleteSchoolPost(id: number): Promise<boolean>;
  
  // Campus methods (for school admins)
  getCampuses(schoolId: number): Promise<Campus[]>;
  getCampus(id: number): Promise<Campus | undefined>;
  createCampus(campus: InsertCampus): Promise<Campus>;
  updateCampus(id: number, campus: Partial<InsertCampus>): Promise<Campus>;
  deleteCampus(id: number): Promise<boolean>;
  
  // School change request methods (for school admins and platform admins)
  createSchoolChangeRequest(request: InsertSchoolChangeRequest): Promise<SchoolChangeRequest>;
  getSchoolChangeRequests(status?: string): Promise<SchoolChangeRequest[]>;
  getSchoolChangeRequestsByAdmin(adminId: number, status?: string): Promise<SchoolChangeRequest[]>;
  getSchoolChangeRequest(id: number): Promise<SchoolChangeRequest | undefined>;
  updateSchoolChangeRequestStatus(id: number, status: string, notes?: string, reviewedById?: number): Promise<SchoolChangeRequest>;
  
  // Campus change request methods (for school admins and platform admins)
  createCampusChangeRequest(request: InsertCampusChangeRequest): Promise<CampusChangeRequest>;
  getCampusChangeRequests(schoolId?: number, status?: string): Promise<CampusChangeRequest[]>;
  getCampusChangeRequest(id: number): Promise<CampusChangeRequest | undefined>;
  updateCampusChangeRequestStatus(id: number, status: string, notes?: string, reviewedById?: number): Promise<CampusChangeRequest>;
  
  // Faculty methods by campus (for school admins)
  getFacultiesByCampus(campusId: number): Promise<Faculty[]>;
  
  // Inquiry methods (for school admins and users)
  getInquiries(schoolId: number): Promise<Inquiry[]>;
  getUserInquiries(userId: number): Promise<Inquiry[]>;
  getInquiry(id: number): Promise<Inquiry | undefined>;
  createInquiry(inquiry: InsertInquiry): Promise<Inquiry>;
  updateInquiry(id: number, inquiry: Partial<InsertInquiry>): Promise<Inquiry>;
  
  // Activity logs methods
  createActivityLog(log: InsertActivityLog): Promise<ActivityLog>;
  getUserActivityLogs(userId: number, limit?: number, offset?: number): Promise<ActivityLog[]>;
  getActivityLogsByEntityType(entityType: string, entityId: number): Promise<ActivityLog[]>;
  getRecentActivityLogs(limit?: number): Promise<ActivityLog[]>;
  getFilteredActivityLogs(
    type?: string,
    entityType?: string,
    fromDate?: Date,
    toDate?: Date,
    searchTerm?: string,
    limit?: number,
    offset?: number
  ): Promise<ActivityLog[]>;
  
  // Quiz methods
  getQuizQuestions(): Promise<QuizQuestion[]>;
  getQuizQuestionsByCategory(category: string): Promise<QuizQuestion[]>;
  createQuizResponse(response: InsertQuizResponse): Promise<QuizResponse>;
  getQuizResponse(id: number): Promise<QuizResponse | undefined>;
  createQuizResult(result: InsertQuizResult): Promise<QuizResult>;
  getQuizResultsByUserId(userId: number): Promise<QuizResult[]>;
  getQuizResultsBySessionId(sessionId: string): Promise<QuizResult[]>;
  getSchoolMatchesByPreferences(preferences: Record<string, any>): Promise<School[]>;
  
  // Platform Admin methods
  // User management
  getAllUsers(limit?: number, offset?: number): Promise<User[]>;
  getUsersByRole(role: string): Promise<User[]>;
  deactivateUser(id: number): Promise<boolean>;
  
  // School approval and verification
  getPendingSchools(): Promise<School[]>;
  updateSchoolApprovalStatus(id: number, status: string, adminId: number): Promise<School>;
  verifySchool(id: number, adminId: number): Promise<School>;
  
  // Review moderation
  getPendingReviews(): Promise<Review[]>;
  moderateReview(id: number, status: string, notes: string, adminId: number): Promise<Review>;
  
  // Platform notifications
  createPlatformNotification(notification: InsertPlatformNotification): Promise<PlatformNotification>;
  updatePlatformNotification(id: number, notification: Partial<InsertPlatformNotification>): Promise<PlatformNotification>;
  deletePlatformNotification(id: number): Promise<boolean>;
  getPlatformNotifications(active?: boolean): Promise<PlatformNotification[]>;
  getPlatformNotificationsByTarget(targetGroup: string): Promise<PlatformNotification[]>;
  
  // Quiz question management
  createQuizQuestion(question: InsertQuizQuestion): Promise<QuizQuestion>;
  updateQuizQuestion(id: number, question: Partial<InsertQuizQuestion>): Promise<QuizQuestion>;
  deleteQuizQuestion(id: number): Promise<boolean>;
  
  // Content management methods
  // Content pages
  getContentPages(limit?: number, offset?: number): Promise<ContentPage[]>;
  getContentPageBySlug(slug: string): Promise<ContentPage | undefined>;
  getContentPage(id: number): Promise<ContentPage | undefined>;
  createContentPage(page: InsertContentPage): Promise<ContentPage>;
  updateContentPage(id: number, page: Partial<InsertContentPage>): Promise<ContentPage>;
  deleteContentPage(id: number): Promise<boolean>;
  
  // Blog posts
  getBlogPosts(limit?: number, offset?: number): Promise<BlogPost[]>;
  getBlogPostBySlug(slug: string): Promise<BlogPost | undefined>;
  getBlogPost(id: number): Promise<BlogPost | undefined>;
  createBlogPost(post: InsertBlogPost): Promise<BlogPost>;
  updateBlogPost(id: number, post: Partial<InsertBlogPost>): Promise<BlogPost>;
  deleteBlogPost(id: number): Promise<boolean>;
  
  // FAQ items
  getFaqItems(category?: string): Promise<FaqItem[]>;
  getFaqItem(id: number): Promise<FaqItem | undefined>;
  createFaqItem(item: InsertFaqItem): Promise<FaqItem>;
  updateFaqItem(id: number, item: Partial<InsertFaqItem>): Promise<FaqItem>;
  deleteFaqItem(id: number): Promise<boolean>;
  
  // Categories
  getCategories(type?: string): Promise<Category[]>;
  getCategory(id: number): Promise<Category | undefined>;
  getCategoryBySlug(slug: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category>;
  deleteCategory(id: number): Promise<boolean>;
  
  // Messaging system methods
  // Conversations
  getConversations(userId?: number, status?: string): Promise<Conversation[]>;
  getConversation(id: number): Promise<Conversation | undefined>;
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  updateConversationStatus(id: number, status: string): Promise<Conversation>;
  addUserToConversation(conversationId: number, userId: number, role?: string): Promise<ConversationParticipant>;
  removeUserFromConversation(conversationId: number, userId: number): Promise<boolean>;
  
  // Messages
  getMessages(conversationId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessagesAsRead(conversationId: number, userId: number): Promise<boolean>;
  getUnreadMessageCount(userId: number): Promise<number>;
  
  // System logs
  createSystemLog(log: InsertSystemLog): Promise<SystemLog>;
  getSystemLogs(level?: string, component?: string, limit?: number, offset?: number): Promise<SystemLog[]>;
  
  // Site settings
  getSiteSettings(): Promise<SiteSetting[]>;
  getSiteSettingsByCategory(category: string): Promise<SiteSetting[]>;
  getSiteSetting(key: string): Promise<SiteSetting | undefined>;
  createSiteSetting(setting: InsertSiteSetting): Promise<SiteSetting>;
  updateSiteSetting(key: string, value: any, updatedBy?: number): Promise<SiteSetting>;
  deleteSiteSetting(key: string): Promise<boolean>;
  
  // School Categories
  getSchoolCategories(): Promise<SchoolCategory[]>;
  getSchoolCategory(id: number): Promise<SchoolCategory | undefined>;
  createSchoolCategory(category: InsertSchoolCategory): Promise<SchoolCategory>;
  updateSchoolCategory(id: number, category: Partial<InsertSchoolCategory>): Promise<SchoolCategory>;
  deleteSchoolCategory(id: number): Promise<boolean>;
  getSchoolCategoriesBySchoolId(schoolId: number): Promise<SchoolCategory[]>;
  addCategoryToSchool(relation: InsertSchoolCategoryRelation): Promise<SchoolCategoryRelation>;
  removeCategoryFromSchool(schoolId: number, categoryId: number): Promise<boolean>;
  
  // School Media
  getSchoolMedia(schoolId: number): Promise<SchoolMedia[]>;
  getSchoolMediaItem(id: number): Promise<SchoolMedia | undefined>;
  createSchoolMedia(media: InsertSchoolMedia): Promise<SchoolMedia>;
  updateSchoolMedia(id: number, media: Partial<InsertSchoolMedia>): Promise<SchoolMedia>;
  deleteSchoolMedia(id: number): Promise<boolean>;
  
  // User Preferences
  getUserPreferences(userId: number): Promise<UserPreferences | undefined>;
  createUserPreferences(preferences: InsertUserPreferences): Promise<UserPreferences>;
  updateUserPreferences(userId: number, preferences: Partial<InsertUserPreferences>): Promise<UserPreferences>;
  
  // User Notifications
  getUserNotifications(userId: number): Promise<UserNotification[]>;
  getUserNotification(id: number): Promise<UserNotification | undefined>;
  createUserNotification(notification: InsertUserNotification): Promise<UserNotification>;
  markNotificationAsRead(id: number): Promise<UserNotification>;
  markAllNotificationsAsRead(userId: number): Promise<boolean>;
  
  // User Profile
  getUserProfile(userId: number): Promise<UserProfile | undefined>;
  createUserProfile(profile: InsertUserProfile): Promise<UserProfile>;
  updateUserProfile(userId: number, profile: Partial<InsertUserProfile>): Promise<UserProfile>;
  getUserPublicProfile(userId: number): Promise<Partial<UserProfile> | undefined>;
  
  // Testimonials
  getTestimonials(limit?: number): Promise<Testimonial[]>;
  getTestimonialById(id: number): Promise<Testimonial | undefined>;
  getTestimonialsBySchoolId(schoolId: number): Promise<Testimonial[]>;
  createTestimonial(testimonial: InsertTestimonial): Promise<Testimonial>;
  updateTestimonial(id: number, testimonial: Partial<InsertTestimonial>): Promise<Testimonial | undefined>;
  deleteTestimonial(id: number): Promise<boolean>;
  
  // Team Profiles
  getTeamProfiles(options?: { includeInactive?: boolean }): Promise<TeamProfile[]>;
  getTeamProfile(id: number): Promise<TeamProfile | undefined>;
  createTeamProfile(profile: InsertTeamProfile): Promise<TeamProfile>;
  updateTeamProfile(id: number, profile: Partial<InsertTeamProfile>): Promise<TeamProfile>;
  deleteTeamProfile(id: number): Promise<boolean>;
  
  // Support Requests
  getSupportRequests(limit?: number, offset?: number, status?: string): Promise<SupportRequest[]>;
  getSupportRequest(id: number): Promise<SupportRequest | undefined>;
  getUserSupportRequests(userId: number): Promise<SupportRequest[]>;
  createSupportRequest(request: InsertSupportRequest): Promise<SupportRequest>;
  updateSupportRequest(id: number, request: Partial<SupportRequest>): Promise<SupportRequest>;
  deleteSupportRequest(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private schools: Map<number, School>;
  private savedSchools: Map<number, SavedSchool>;
  private comparisons: Map<number, Comparison>;
  private reviews: Map<number, Review>;
  private campuses: Map<number, Campus>;
  private teamProfiles: Map<number, TeamProfile>;
  private schoolChangeRequests: Map<number, SchoolChangeRequest>;
  private campusChangeRequests: Map<number, CampusChangeRequest>;
  private faculties: Map<number, Faculty>;
  private schoolPosts: Map<number, SchoolPost>;
  private inquiries: Map<number, Inquiry>;
  private activityLogs: Map<number, ActivityLog>;
  private userSchoolsMap: Map<number, UserSchool>;
  
  private userId: number = 1;
  private schoolId: number = 1;
  private savedSchoolId: number = 1;
  private comparisonId: number = 1;
  private reviewId: number = 1;
  private campusId: number = 1;
  private schoolChangeRequestId: number = 1;
  private campusChangeRequestId: number = 1;
  private facultyId: number = 1;
  private schoolPostId: number = 1;
  private inquiryId: number = 1;
  private activityLogId: number = 1;

  private testimonials: Map<number, Testimonial>;
  private testimonialId: number = 1;
  
  private supportRequests: Map<number, SupportRequest>;
  private supportRequestId: number = 1;
  
  private userSchoolId: number = 1;
  
  constructor() {
    this.users = new Map();
    this.schools = new Map();
    this.savedSchools = new Map();
    this.comparisons = new Map();
    this.reviews = new Map();
    this.campuses = new Map();
    this.schoolChangeRequests = new Map();
    this.campusChangeRequests = new Map();
    this.faculties = new Map();
    this.schoolPosts = new Map();
    this.inquiries = new Map();
    this.activityLogs = new Map();
    this.testimonials = new Map();
    this.supportRequests = new Map();
    this.userSchoolsMap = new Map();
    this.teamProfiles = new Map();
    
    // Initialize with some example data
    this.initializeData();
  }

  private teamProfileId: number = 1;

  private initializeData() {
    // Initialize example testimonials data
    const testimonialData: InsertTestimonial[] = [
      {
        schoolId: 1,
        authorName: "Ahmed K.",
        authorRole: "Father of two primary students",
        authorAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e",
        rating: 5,
        content: "SmartSchool Finder helped us discover a perfect Cambridge school in DHA Karachi that we didn't even know existed. The comparison tool made our decision so much easier!"
      },
      {
        schoolId: 2,
        authorName: "Sana M.",
        authorRole: "Mother of a middle school student",
        authorAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330",
        rating: 5,
        content: "The AI matching quiz recommended a STEM-focused school in Lahore that was perfect for my daughter who loves science. The detailed profiles and campus photos saved us so much time!"
      },
      {
        schoolId: 3,
        authorName: "Faisal A.",
        authorRole: "Father of a high school student",
        authorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d",
        rating: 4.5,
        content: "We were relocating from Karachi to Islamabad and needed to find a school quickly. SmartSchool Finder made the process so much less stressful. We found a great arts program for our creative son!"
      }
    ];
    
    testimonialData.forEach(testimonial => this.createTestimonial(testimonial));
    
    // Add initial schools from Pakistan
    const schoolsData: InsertSchool[] = [
      {
        name: "Aitchison College",
        description: "One of Pakistan's most prestigious academic institutions with a rich history and top-tier facilities",
        location: "Lahore",
        address: "Shahrah-e-Quaid-e-Azam, Mall Road, Lahore",
        type: "International",
        imageUrl: "https://images.unsplash.com/photo-1583306346437-f79b4a167d53",
        rating: 49, // out of 50
        curriculumType: "Cambridge",
        gradeRange: "Primary to College (K-12)",
        classSize: "18-25",
        tuitionRange: "PKR 120,000 - 350,000 per quarter",
        hasFinancialAid: true,
        features: ["Sports Facilities", "Science Lab", "Library", "Swimming Pool", "Cafeteria"],
        coordinates: { lat: 31.5565, lng: 74.3430 }
      },
      {
        name: "Karachi Grammar School",
        description: "One of the oldest and most prestigious schools in Pakistan offering Cambridge curriculum",
        location: "Karachi",
        address: "Clifton, Karachi",
        type: "International",
        imageUrl: "https://images.unsplash.com/photo-1623528653451-aacd9b50cc1a",
        rating: 48, // out of 50
        curriculumType: "Cambridge",
        gradeRange: "Playgroup to College (A-Levels)",
        classSize: "15-25",
        tuitionRange: "PKR 90,000 - 320,000 per quarter",
        hasFinancialAid: true,
        features: ["Science Lab", "Computer Lab", "Library", "Sports Facilities"],
        coordinates: { lat: 24.8307, lng: 67.0339 }
      },
      {
        name: "Lahore Grammar School",
        description: "Premier educational institution known for academic excellence and extra-curricular achievements",
        location: "Lahore",
        address: "Various branches in Lahore",
        type: "International",
        imageUrl: "https://images.unsplash.com/photo-1519452575417-564c1401ecc0",
        rating: 47, // out of 50
        curriculumType: "Cambridge",
        gradeRange: "Playgroup to College (A-Levels)",
        classSize: "20-30",
        tuitionRange: "PKR 80,000 - 280,000 per quarter",
        hasFinancialAid: true,
        features: ["Science Lab", "Computer Lab", "Library", "Sports Facilities", "Art Studio"],
        coordinates: { lat: 31.5204, lng: 74.3587 }
      },
      {
        name: "The City School",
        description: "Nationwide network of schools offering Cambridge curriculum with a strong focus on holistic development",
        location: "Multiple Cities",
        address: "Branches across Pakistan",
        type: "International",
        imageUrl: "https://images.unsplash.com/photo-1599687266725-44b888573afb",
        rating: 45, // out of 50
        curriculumType: "Cambridge",
        gradeRange: "Playgroup to College (A-Levels)",
        classSize: "25-35",
        tuitionRange: "PKR 60,000 - 240,000 per quarter",
        hasFinancialAid: true,
        features: ["Science Lab", "Computer Lab", "Library", "Sports Facilities", "Transportation"],
        coordinates: { lat: 30.1830, lng: 71.4233 }
      },
      {
        name: "Beaconhouse School System",
        description: "One of the largest private school networks in Pakistan with international standards",
        location: "Multiple Cities",
        address: "Branches across Pakistan",
        type: "International",
        imageUrl: "https://images.unsplash.com/photo-1594608661623-aa0bd3a69799",
        rating: 45, // out of 50
        curriculumType: "Cambridge",
        gradeRange: "Playgroup to College (O/A Levels)",
        classSize: "25-35",
        tuitionRange: "PKR 55,000 - 230,000 per quarter",
        hasFinancialAid: true,
        features: ["Science Lab", "Computer Lab", "Library", "Sports Facilities", "Transportation"],
        coordinates: { lat: 33.6844, lng: 73.0479 }
      },
      {
        name: "Roots Millennium Schools",
        description: "Forward-thinking educational institution with a focus on technology and innovation",
        location: "Islamabad",
        address: "Multiple branches in Islamabad",
        type: "STEM",
        imageUrl: "https://images.unsplash.com/photo-1610008885395-d4b47f72c264",
        rating: 44, // out of 50
        curriculumType: "Cambridge",
        gradeRange: "Playgroup to College (A-Levels)",
        classSize: "20-30",
        tuitionRange: "PKR 70,000 - 260,000 per quarter",
        hasFinancialAid: true,
        features: ["Robotics", "Coding", "Science Lab", "Computer Lab", "Sports Facilities"],
        coordinates: { lat: 33.7294, lng: 73.0931 }
      },
      {
        name: "Froebel's International School",
        description: "Progressive educational institution emphasizing critical thinking and creativity",
        location: "Islamabad",
        address: "F-7 Markaz, Islamabad",
        type: "International",
        imageUrl: "https://images.unsplash.com/photo-1580582932707-520aed937b7b",
        rating: 43, // out of 50
        curriculumType: "Cambridge",
        gradeRange: "Playgroup to College (A-Levels)",
        classSize: "20-25",
        tuitionRange: "PKR 75,000 - 250,000 per quarter",
        hasFinancialAid: true,
        features: ["Science Lab", "Computer Lab", "Library", "Arts and Crafts", "Music"],
        coordinates: { lat: 33.7155, lng: 73.0538 }
      },
      {
        name: "PECHS Girls' School",
        description: "An established all-girls institution known for academic excellence and character building",
        location: "Karachi",
        address: "PECHS, Karachi",
        type: "Matric/Federal",
        imageUrl: "https://images.unsplash.com/photo-1592280771190-3e2e4d571952",
        rating: 42, // out of 50
        curriculumType: "Matric/Federal",
        gradeRange: "Nursery to Matric",
        classSize: "30-40",
        tuitionRange: "PKR 40,000 - 130,000 per quarter",
        hasFinancialAid: true,
        features: ["Science Lab", "Computer Lab", "Library", "Sports Facilities", "Islamic Studies"],
        coordinates: { lat: 24.8673, lng: 67.0455 }
      },
      {
        name: "Islamabad Model College",
        description: "A federal government institution known for quality education at affordable rates",
        location: "Islamabad",
        address: "Various sectors in Islamabad",
        type: "Matric/Federal",
        imageUrl: "https://images.unsplash.com/photo-1613896527026-f195775d3dba",
        rating: 40, // out of 50
        curriculumType: "Matric/Federal",
        gradeRange: "Primary to Intermediate",
        classSize: "35-45",
        tuitionRange: "PKR 15,000 - 50,000 per quarter",
        hasFinancialAid: true,
        features: ["Science Lab", "Computer Lab", "Library", "Sports Facilities"],
        coordinates: { lat: 33.6938, lng: 73.0652 }
      },
      {
        name: "Dawood Public School",
        description: "An all-girls school with a blend of academic focus and extra-curricular activities",
        location: "Karachi",
        address: "Korangi Road, Karachi",
        type: "Cambridge",
        imageUrl: "https://images.unsplash.com/photo-1571491198112-24c15f19339c",
        rating: 41, // out of 50
        curriculumType: "Cambridge",
        gradeRange: "Playgroup to O-Levels",
        classSize: "25-35",
        tuitionRange: "PKR 55,000 - 200,000 per quarter",
        hasFinancialAid: true,
        features: ["Science Lab", "Computer Lab", "Library", "Sports Facilities", "Art Studio"],
        coordinates: { lat: 24.8724, lng: 67.0820 }
      }
    ];
    
    schoolsData.forEach(school => this.createSchool(school));
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase()
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase()
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const createdAt = new Date();
    const user: User = { ...insertUser, id, createdAt };
    this.users.set(id, user);
    return user;
  }

  // School methods
  async getSchool(id: number): Promise<School | undefined> {
    return this.schools.get(id);
  }
  
  async getSchools(limit: number = 10, offset: number = 0): Promise<School[]> {
    const allSchools = Array.from(this.schools.values());
    return allSchools.slice(offset, offset + limit);
  }
  
  async getSchoolsByType(type: string): Promise<School[]> {
    return Array.from(this.schools.values()).filter(
      (school) => school.type.toLowerCase() === type.toLowerCase()
    );
  }
  
  async getSchoolsByLocation(location: string): Promise<School[]> {
    return Array.from(this.schools.values()).filter(
      (school) => school.location.toLowerCase().includes(location.toLowerCase())
    );
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
    let filteredSchools = Array.from(this.schools.values());
    
    // Apply filters
    if (params.query) {
      const lowerQuery = params.query.toLowerCase();
      filteredSchools = filteredSchools.filter(
        (school) => 
          school.name.toLowerCase().includes(lowerQuery) ||
          school.location.toLowerCase().includes(lowerQuery) ||
          school.description.toLowerCase().includes(lowerQuery) ||
          (school.curriculumType && school.curriculumType.toLowerCase().includes(lowerQuery))
      );
    }
    
    if (params.type) {
      filteredSchools = filteredSchools.filter(
        (school) => school.type.toLowerCase() === params.type!.toLowerCase()
      );
    }
    
    if (params.location) {
      filteredSchools = filteredSchools.filter(
        (school) => school.location.toLowerCase().includes(params.location!.toLowerCase())
      );
    }
    
    if (params.curriculumType) {
      filteredSchools = filteredSchools.filter(
        (school) => school.curriculumType && school.curriculumType.toLowerCase() === params.curriculumType!.toLowerCase()
      );
    }
    
    if (params.hasFinancialAid !== undefined) {
      filteredSchools = filteredSchools.filter(
        (school) => school.hasFinancialAid === params.hasFinancialAid
      );
    }
    
    if (params.minRating !== undefined) {
      filteredSchools = filteredSchools.filter(
        (school) => school.rating >= params.minRating!
      );
    }
    
    if (params.maxTuition) {
      // Parse the max tuition value, assuming it's in format like "$5000"
      const maxTuitionValue = parseInt(params.maxTuition.replace(/[^0-9]/g, ''));
      
      if (!isNaN(maxTuitionValue)) {
        filteredSchools = filteredSchools.filter(school => {
          if (!school.tuitionRange) return true;
          
          // Parse tuition from format like "$3000 - $5000" or "$3000"
          const tuitionParts = school.tuitionRange.split('-').map(part => 
            parseInt(part.replace(/[^0-9]/g, ''))
          );
          
          // If there's a range, use the higher value, otherwise use the single value
          const schoolTuition = tuitionParts.length > 1 
            ? Math.max(...tuitionParts.filter(t => !isNaN(t)))
            : tuitionParts[0];
            
          return isNaN(schoolTuition) || schoolTuition <= maxTuitionValue;
        });
      }
    }
    
    if (params.category) {
      filteredSchools = filteredSchools.filter(
        (school) => {
          const categories = school.categories || [];
          return categories.some(c => c.toLowerCase() === params.category!.toLowerCase());
        }
      );
    }
    
    if (params.featured !== undefined) {
      filteredSchools = filteredSchools.filter(
        (school) => school.featured === params.featured
      );
    }
    
    if (params.features && params.features.length > 0) {
      filteredSchools = filteredSchools.filter(school => {
        const schoolFeatures = school.features || [];
        return params.features!.every(feature => 
          schoolFeatures.some(f => f.toLowerCase().includes(feature.toLowerCase()))
        );
      });
    }
    
    // Filter by approval status
    if (params.approvalStatus) {
      filteredSchools = filteredSchools.filter(
        (school) => school.approvalStatus === params.approvalStatus
      );
    }
    
    // Filter by verification status
    if (params.verificationStatus !== undefined) {
      filteredSchools = filteredSchools.filter(
        (school) => school.verificationStatus === params.verificationStatus
      );
    }
    
    // Apply sorting
    if (params.sortField) {
      const sortField = params.sortField;
      const direction = params.sortDirection || 'asc';
      
      filteredSchools.sort((a, b) => {
        let valueA, valueB;
        
        // Extract the values to compare based on the sort field
        switch (sortField) {
          case 'name':
            valueA = a.name.toLowerCase();
            valueB = b.name.toLowerCase();
            break;
          case 'rating':
            valueA = a.rating || 0;
            valueB = b.rating || 0;
            break;
          case 'tuition':
            // Extract numeric values from tuition range for sorting
            valueA = this.extractMinTuition(a.tuitionRange);
            valueB = this.extractMinTuition(b.tuitionRange);
            break;
          default:
            valueA = (a as any)[sortField];
            valueB = (b as any)[sortField];
        }
        
        // Handle null/undefined values
        if (valueA === undefined || valueA === null) return direction === 'asc' ? -1 : 1;
        if (valueB === undefined || valueB === null) return direction === 'asc' ? 1 : -1;
        
        // Compare values based on direction
        if (typeof valueA === 'string' && typeof valueB === 'string') {
          return direction === 'asc' 
            ? valueA.localeCompare(valueB)
            : valueB.localeCompare(valueA);
        } else {
          return direction === 'asc'
            ? valueA - valueB
            : valueB - valueA;
        }
      });
    }
    
    // Apply pagination
    if (params.limit !== undefined || params.offset !== undefined) {
      const limit = params.limit || 10;
      const offset = params.offset || 0;
      return filteredSchools.slice(offset, offset + limit);
    }
    
    return filteredSchools;
  }
  
  // Helper method to extract min tuition value for sorting
  private extractMinTuition(tuitionRange: string | undefined): number {
    if (!tuitionRange) return 0;
    
    // Extract first number from tuition range
    const match = tuitionRange.match(/\$?(\d[\d,]*)/);
    if (match && match[1]) {
      return parseInt(match[1].replace(/,/g, ''));
    }
    return 0;
  }
  
  async createSchool(insertSchool: InsertSchool): Promise<School> {
    const id = this.schoolId++;
    const school: School = { ...insertSchool, id };
    this.schools.set(id, school);
    return school;
  }

  // Saved schools methods
  async getSavedSchools(userId: number): Promise<School[]> {
    const userSavedSchools = Array.from(this.savedSchools.values()).filter(
      (savedSchool) => savedSchool.userId === userId
    );
    
    return userSavedSchools
      .map((savedSchool) => this.schools.get(savedSchool.schoolId))
      .filter((school): school is School => school !== undefined);
  }
  
  async saveSchool(insertSavedSchool: InsertSavedSchool): Promise<SavedSchool> {
    const id = this.savedSchoolId++;
    const savedAt = new Date();
    const savedSchool: SavedSchool = { ...insertSavedSchool, id, savedAt };
    this.savedSchools.set(id, savedSchool);
    return savedSchool;
  }
  
  async removeSavedSchool(userId: number, schoolId: number): Promise<boolean> {
    const savedSchoolEntry = Array.from(this.savedSchools.values()).find(
      (savedSchool) => savedSchool.userId === userId && savedSchool.schoolId === schoolId
    );
    
    if (savedSchoolEntry) {
      this.savedSchools.delete(savedSchoolEntry.id);
      return true;
    }
    
    return false;
  }

  // Comparison methods
  async getComparisons(userId: number): Promise<Comparison[]> {
    return Array.from(this.comparisons.values()).filter(
      (comparison) => comparison.userId === userId
    );
  }
  
  async createComparison(insertComparison: InsertComparison): Promise<Comparison> {
    const id = this.comparisonId++;
    const createdAt = new Date();
    const comparison: Comparison = { ...insertComparison, id, createdAt };
    this.comparisons.set(id, comparison);
    return comparison;
  }
  
  async deleteComparison(id: number): Promise<boolean> {
    if (this.comparisons.has(id)) {
      this.comparisons.delete(id);
      return true;
    }
    return false;
  }

  // Review methods
  async getReviews(schoolId: number): Promise<Review[]> {
    return Array.from(this.reviews.values()).filter(
      (review) => review.schoolId === schoolId
    );
  }

  async getAllReviews(): Promise<Review[]> {
    return Array.from(this.reviews.values());
  }
  
  async createReview(insertReview: InsertReview): Promise<Review> {
    const id = this.reviewId++;
    const createdAt = new Date();
    const review: Review = { ...insertReview, id, createdAt };
    this.reviews.set(id, review);
    return review;
  }

  // Missing methods for MemStorage implementation
  
  // User methods
  async updateUser(id: number, userUpdate: Partial<InsertUser>): Promise<User> {
    const existingUser = await this.getUser(id);
    if (!existingUser) {
      throw new Error(`User with id ${id} not found`);
    }
    
    const updatedUser: User = { ...existingUser, ...userUpdate };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  // School methods
  async updateSchool(id: number, schoolUpdate: Partial<InsertSchool>): Promise<School> {
    const existingSchool = await this.getSchool(id);
    if (!existingSchool) {
      throw new Error(`School with id ${id} not found`);
    }
    
    const updatedSchool: School = { ...existingSchool, ...schoolUpdate };
    this.schools.set(id, updatedSchool);
    return updatedSchool;
  }
  
  async getSchoolsByAdminId(adminId: number): Promise<School[]> {
    return Array.from(this.schools.values()).filter(
      (school) => school.adminId === adminId
    );
  }
  
  // Faculty methods
  async getFaculties(schoolId: number): Promise<Faculty[]> {
    return Array.from(this.faculties.values()).filter(
      (faculty) => faculty.schoolId === schoolId
    );
  }
  
  async getFaculty(id: number): Promise<Faculty | undefined> {
    return this.faculties.get(id);
  }
  
  async createFaculty(insertFaculty: InsertFaculty): Promise<Faculty> {
    const id = this.facultyId++;
    const createdAt = new Date();
    const faculty: Faculty = { ...insertFaculty, id, createdAt };
    this.faculties.set(id, faculty);
    return faculty;
  }
  
  async updateFaculty(id: number, facultyUpdate: Partial<InsertFaculty>): Promise<Faculty> {
    const existingFaculty = await this.getFaculty(id);
    if (!existingFaculty) {
      throw new Error(`Faculty with id ${id} not found`);
    }
    
    const updatedFaculty: Faculty = { ...existingFaculty, ...facultyUpdate };
    this.faculties.set(id, updatedFaculty);
    return updatedFaculty;
  }
  
  async deleteFaculty(id: number): Promise<boolean> {
    if (this.faculties.has(id)) {
      this.faculties.delete(id);
      return true;
    }
    return false;
  }
  
  // School post methods
  async getSchoolPosts(schoolId: number, limit: number = 10, offset: number = 0): Promise<SchoolPost[]> {
    const posts = Array.from(this.schoolPosts.values())
      .filter((post) => post.schoolId === schoolId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    return posts.slice(offset, offset + limit);
  }
  
  async getSchoolPost(id: number): Promise<SchoolPost | undefined> {
    return this.schoolPosts.get(id);
  }
  
  async createSchoolPost(insertPost: InsertSchoolPost): Promise<SchoolPost> {
    const id = this.schoolPostId++;
    const createdAt = new Date();
    const updatedAt = new Date();
    const post: SchoolPost = { ...insertPost, id, createdAt, updatedAt };
    this.schoolPosts.set(id, post);
    return post;
  }
  
  async updateSchoolPost(id: number, postUpdate: Partial<InsertSchoolPost>): Promise<SchoolPost> {
    const existingPost = await this.getSchoolPost(id);
    if (!existingPost) {
      throw new Error(`School post with id ${id} not found`);
    }
    
    const updatedPost: SchoolPost = { 
      ...existingPost, 
      ...postUpdate, 
      updatedAt: new Date() 
    };
    this.schoolPosts.set(id, updatedPost);
    return updatedPost;
  }
  
  async deleteSchoolPost(id: number): Promise<boolean> {
    if (this.schoolPosts.has(id)) {
      this.schoolPosts.delete(id);
      return true;
    }
    return false;
  }
  
  // Campus methods
  async getCampuses(schoolId: number): Promise<Campus[]> {
    return Array.from(this.campuses.values()).filter(
      (campus) => campus.schoolId === schoolId
    );
  }
  
  async getCampus(id: number): Promise<Campus | undefined> {
    return this.campuses.get(id);
  }
  
  async createCampus(insertCampus: InsertCampus): Promise<Campus> {
    const id = this.campusId++;
    const campus: Campus = { ...insertCampus, id };
    this.campuses.set(id, campus);
    return campus;
  }
  
  async updateCampus(id: number, campusUpdate: Partial<InsertCampus>): Promise<Campus> {
    const existingCampus = await this.getCampus(id);
    if (!existingCampus) {
      throw new Error(`Campus with id ${id} not found`);
    }
    
    const updatedCampus: Campus = { ...existingCampus, ...campusUpdate };
    this.campuses.set(id, updatedCampus);
    return updatedCampus;
  }
  
  async deleteCampus(id: number): Promise<boolean> {
    if (this.campuses.has(id)) {
      this.campuses.delete(id);
      return true;
    }
    return false;
  }
  
  // School change request methods (for school admins and platform admins)
  async createSchoolChangeRequest(request: InsertSchoolChangeRequest): Promise<SchoolChangeRequest> {
    const id = this.schoolChangeRequestId++;
    const createdAt = new Date();
    
    // Create the change request with default values and provided data
    const schoolChangeRequest: SchoolChangeRequest = {
      ...request,
      id,
      createdAt,
      updatedAt: null,
      reviewedAt: null,
      reviewedById: null,
      notificationSent: false,
      notificationSentAt: null
    };
    
    this.schoolChangeRequests.set(id, schoolChangeRequest);
    return schoolChangeRequest;
  }
  
  async getSchoolChangeRequests(status?: string): Promise<SchoolChangeRequest[]> {
    let requests = Array.from(this.schoolChangeRequests.values());
    
    // Filter by status if provided
    if (status !== undefined) {
      requests = requests.filter(request => request.status === status);
    }
    
    // Sort by created date (newest first)
    return requests.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async getSchoolChangeRequestsByAdmin(adminId: number, status?: string): Promise<SchoolChangeRequest[]> {
    let requests = Array.from(this.schoolChangeRequests.values())
      .filter(request => request.requestedById === adminId);
    
    // Filter by status if provided
    if (status !== undefined) {
      requests = requests.filter(request => request.status === status);
    }
    
    // Sort by created date (newest first)
    return requests.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async getSchoolChangeRequest(id: number): Promise<SchoolChangeRequest | undefined> {
    return this.schoolChangeRequests.get(id);
  }
  
  async updateSchoolChangeRequestStatus(
    id: number, 
    status: string, 
    notes?: string, 
    reviewedById?: number
  ): Promise<SchoolChangeRequest> {
    const request = await this.getSchoolChangeRequest(id);
    if (!request) {
      throw new Error(`School change request with id ${id} not found`);
    }
    
    const updatedRequest: SchoolChangeRequest = {
      ...request,
      status,
      notes: notes || request.notes,
      reviewedById: reviewedById || request.reviewedById,
      reviewedAt: new Date(),
      updatedAt: new Date()
    };
    
    this.schoolChangeRequests.set(id, updatedRequest);
    
    // If approved and it's a create/update request, apply the changes to the school
    if (status === 'approved') {
      if (request.requestType === 'create') {
        // Create a new school from the request data
        if (request.requestData) {
          await this.createSchool(request.requestData as InsertSchool);
        }
      } else if (request.requestType === 'update' && request.schoolId) {
        // Update the existing school with the request data
        if (request.requestData) {
          await this.updateSchool(request.schoolId, request.requestData as Partial<InsertSchool>);
        }
      } else if (request.requestType === 'delete' && request.schoolId) {
        // We don't implement actual deletion for schools due to dependencies
        // Instead, we could mark the school as inactive or archived
        const school = await this.getSchool(request.schoolId);
        if (school) {
          await this.updateSchool(request.schoolId, { isActive: false } as Partial<InsertSchool>);
        }
      }
    }
    
    return updatedRequest;
  }
  
  async markSchoolChangeRequestNotificationSent(id: number): Promise<SchoolChangeRequest> {
    const request = await this.getSchoolChangeRequest(id);
    if (!request) {
      throw new Error(`School change request with id ${id} not found`);
    }
    
    const updatedRequest: SchoolChangeRequest = {
      ...request,
      notificationSent: true,
      notificationSentAt: new Date()
    };
    
    this.schoolChangeRequests.set(id, updatedRequest);
    return updatedRequest;
  }
  
  // Campus change request methods (for school admins and platform admins)
  async createCampusChangeRequest(request: InsertCampusChangeRequest): Promise<CampusChangeRequest> {
    const id = this.campusChangeRequestId++;
    const createdAt = new Date();
    
    // Create the change request with default values and provided data
    const campusChangeRequest: CampusChangeRequest = {
      ...request,
      id,
      createdAt,
      updatedAt: null,
      reviewedAt: null,
      reviewedById: null,
      notificationSent: false,
      notificationSentAt: null
    };
    
    this.campusChangeRequests.set(id, campusChangeRequest);
    return campusChangeRequest;
  }
  
  async getCampusChangeRequests(schoolId?: number, status?: string): Promise<CampusChangeRequest[]> {
    let requests = Array.from(this.campusChangeRequests.values());
    
    // Filter by schoolId if provided
    if (schoolId !== undefined) {
      requests = requests.filter(request => request.schoolId === schoolId);
    }
    
    // Filter by status if provided
    if (status !== undefined) {
      requests = requests.filter(request => request.status === status);
    }
    
    // Sort by created date (newest first)
    return requests.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async getCampusChangeRequest(id: number): Promise<CampusChangeRequest | undefined> {
    return this.campusChangeRequests.get(id);
  }
  
  async updateCampusChangeRequestStatus(
    id: number, 
    status: string, 
    notes?: string, 
    reviewedById?: number
  ): Promise<CampusChangeRequest> {
    const request = await this.getCampusChangeRequest(id);
    if (!request) {
      throw new Error(`Campus change request with id ${id} not found`);
    }
    
    const updatedRequest: CampusChangeRequest = {
      ...request,
      status,
      notes: notes || request.notes,
      reviewedById: reviewedById || request.reviewedById,
      reviewedAt: new Date(),
      updatedAt: new Date(),
      notificationSent: false // Reset notification status when status changes
    };
    
    this.campusChangeRequests.set(id, updatedRequest);
    
    // If approved and it's a create/update request, apply the changes to the campus
    if (status === 'approved') {
      if (request.requestType === 'create') {
        // Create a new campus from the request data
        if (request.requestData) {
          await this.createCampus(request.requestData as InsertCampus);
        }
      } else if (request.requestType === 'update' && request.campusId) {
        // Update the existing campus with the request data
        if (request.requestData) {
          await this.updateCampus(request.campusId, request.requestData as Partial<InsertCampus>);
        }
      } else if (request.requestType === 'delete' && request.campusId) {
        // Delete the campus
        await this.deleteCampus(request.campusId);
      }
    }
    
    return updatedRequest;
  }
  
  async markCampusChangeRequestNotificationSent(id: number): Promise<CampusChangeRequest> {
    const request = await this.getCampusChangeRequest(id);
    if (!request) {
      throw new Error(`Campus change request with id ${id} not found`);
    }
    
    const updatedRequest: CampusChangeRequest = {
      ...request,
      notificationSent: true,
      notificationSentAt: new Date()
    };
    
    this.campusChangeRequests.set(id, updatedRequest);
    return updatedRequest;
  }
  
  // Faculty by campus methods
  async getFacultiesByCampus(campusId: number): Promise<Faculty[]> {
    return Array.from(this.faculties.values()).filter(
      (faculty) => faculty.campusId === campusId
    );
  }
  
  // Inquiry methods
  async getInquiries(schoolId: number): Promise<Inquiry[]> {
    return Array.from(this.inquiries.values())
      .filter((inquiry) => inquiry.schoolId === schoolId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getUserInquiries(userId: number): Promise<Inquiry[]> {
    // Get inquiries by user ID (using either userId field or matching user email)
    const user = await this.getUser(userId);
    if (!user) return [];
    
    return Array.from(this.inquiries.values())
      .filter((inquiry) => {
        // Match by either userId field or email
        return (inquiry.userId === userId || inquiry.email === user.email);
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async getInquiry(id: number): Promise<Inquiry | undefined> {
    return this.inquiries.get(id);
  }
  
  async createInquiry(insertInquiry: InsertInquiry): Promise<Inquiry> {
    const id = this.inquiryId++;
    const createdAt = new Date();
    const inquiry: Inquiry = { ...insertInquiry, id, createdAt };
    this.inquiries.set(id, inquiry);
    return inquiry;
  }
  
  async updateInquiry(id: number, inquiryUpdate: Partial<InsertInquiry>): Promise<Inquiry> {
    const existingInquiry = await this.getInquiry(id);
    if (!existingInquiry) {
      throw new Error(`Inquiry with id ${id} not found`);
    }
    
    // If inquiry is being responded to, set the response date
    const responseDate = inquiryUpdate.response ? new Date() : existingInquiry.responseDate;
    
    const updatedInquiry: Inquiry = { 
      ...existingInquiry, 
      ...inquiryUpdate,
      responseDate
    };
    this.inquiries.set(id, updatedInquiry);
    return updatedInquiry;
  }

  // Activity logs methods
  async createActivityLog(insertLog: InsertActivityLog): Promise<ActivityLog> {
    const id = this.activityLogId++;
    const createdAt = new Date();
    const activityLog: ActivityLog = { ...insertLog, id, createdAt };
    this.activityLogs.set(id, activityLog);
    return activityLog;
  }

  async getUserActivityLogs(userId: number, limit: number = 20, offset: number = 0): Promise<ActivityLog[]> {
    const userLogs = Array.from(this.activityLogs.values())
      .filter(log => log.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    return userLogs.slice(offset, offset + limit);
  }

  async getActivityLogsByEntityType(entityType: string, entityId: number): Promise<ActivityLog[]> {
    return Array.from(this.activityLogs.values())
      .filter(log => log.entityType === entityType && log.entityId === entityId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async getRecentActivityLogs(limit: number = 20): Promise<ActivityLog[]> {
    return Array.from(this.activityLogs.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }
  
  async getFilteredActivityLogs(
    type?: string,
    entityType?: string,
    fromDate?: Date,
    toDate?: Date,
    searchTerm?: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<ActivityLog[]> {
    let filteredLogs = Array.from(this.activityLogs.values());
    
    // Filter by type if provided
    if (type) {
      filteredLogs = filteredLogs.filter(log => log.action === type);
    }
    
    // Filter by entity type if provided
    if (entityType) {
      filteredLogs = filteredLogs.filter(log => log.entityType === entityType);
    }
    
    // Filter by date range if provided
    if (fromDate) {
      filteredLogs = filteredLogs.filter(log => log.createdAt >= fromDate);
    }
    
    if (toDate) {
      filteredLogs = filteredLogs.filter(log => log.createdAt <= toDate);
    }
    
    // Filter by search term if provided (search in action, entityType, or metadata)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filteredLogs = filteredLogs.filter(log => 
        log.action.toLowerCase().includes(term) ||
        log.entityType.toLowerCase().includes(term) ||
        JSON.stringify(log.metadata).toLowerCase().includes(term)
      );
    }
    
    // Sort by date (newest first)
    filteredLogs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    // Apply pagination
    return filteredLogs.slice(offset, offset + limit);
  }

  // Quiz methods
  private quizQuestions: Map<number, QuizQuestion> = new Map();
  private quizResponses: Map<number, QuizResponse> = new Map();
  private quizResults: Map<number, QuizResult> = new Map();
  private quizQuestionId: number = 1;
  private quizResponseId: number = 1;
  private quizResultId: number = 1;

  async getQuizQuestions(): Promise<QuizQuestion[]> {
    return Array.from(this.quizQuestions.values())
      .sort((a, b) => a.order - b.order);
  }

  async getQuizQuestionsByCategory(category: string): Promise<QuizQuestion[]> {
    return Array.from(this.quizQuestions.values())
      .filter(question => question.category === category)
      .sort((a, b) => a.order - b.order);
  }

  async createQuizResponse(insertResponse: InsertQuizResponse): Promise<QuizResponse> {
    const id = this.quizResponseId++;
    const createdAt = new Date();
    const response: QuizResponse = { ...insertResponse, id, createdAt };
    this.quizResponses.set(id, response);
    return response;
  }

  async getQuizResponse(id: number): Promise<QuizResponse | undefined> {
    return this.quizResponses.get(id);
  }

  async createQuizResult(insertResult: InsertQuizResult): Promise<QuizResult> {
    const id = this.quizResultId++;
    const createdAt = new Date();
    const result: QuizResult = { ...insertResult, id, createdAt };
    this.quizResults.set(id, result);
    return result;
  }

  async getQuizResultsByUserId(userId: number): Promise<QuizResult[]> {
    return Array.from(this.quizResults.values())
      .filter(result => result.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getQuizResultsBySessionId(sessionId: string): Promise<QuizResult[]> {
    return Array.from(this.quizResults.values())
      .filter(result => result.sessionId === sessionId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getSchoolMatchesByPreferences(preferences: Record<string, any>): Promise<School[]> {
    // This is where we would implement our matching algorithm
    // For now, we'll implement a simple matching based on school type and location
    let allSchools = Array.from(this.schools.values());
    let matchedSchools: School[] = [];
    
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
      if (schoolTypes.length === 0 || schoolTypes.some(type => school.type.toLowerCase().includes(type.toLowerCase()))) {
        score += 2;
        matchFactors.push('school type');
      }
      
      // Match location
      if (locations.length === 0 || locations.some(loc => school.location.toLowerCase().includes(loc.toLowerCase()))) {
        score += 2;
        matchFactors.push('location');
      }
      
      // Match curriculum
      if (curriculums.length === 0 || curriculums.some(curr => school.curriculumType.toLowerCase().includes(curr.toLowerCase()))) {
        score += 2;
        matchFactors.push('curriculum');
      }
      
      // Match financial aid
      if (!hasFinancialAidNeed || school.hasFinancialAid) {
        score += 1;
        if (school.hasFinancialAid) matchFactors.push('financial aid');
      }
      
      // Match features
      if (school.features) {
        const featureMatches = desiredFeatures.filter(
          feature => school.features?.some(f => f.toLowerCase().includes(feature.toLowerCase()))
        ).length;
        score += featureMatches * 0.5;
        if (featureMatches > 0) matchFactors.push('facilities');
      }
      
      // Add to matched schools if score is above threshold
      if (score >= 3) {
        matchedSchools.push({
          ...school,
          matchScore: score,
          matchFactors
        } as any);
      }
    }
    
    // Sort by match score descending
    return matchedSchools.sort((a: any, b: any) => b.matchScore - a.matchScore);
  }
  // --- New schema implementations ---
  
  // School Categories
  private schoolCategories: Map<number, SchoolCategory> = new Map();
  private schoolCategoryRelations: Map<number, SchoolCategoryRelation> = new Map();
  private schoolCategoryId: number = 1;
  private schoolCategoryRelationId: number = 1;
  
  async getSchoolCategories(): Promise<SchoolCategory[]> {
    return Array.from(this.schoolCategories.values());
  }
  
  async getSchoolCategory(id: number): Promise<SchoolCategory | undefined> {
    return this.schoolCategories.get(id);
  }
  
  async createSchoolCategory(category: InsertSchoolCategory): Promise<SchoolCategory> {
    const id = this.schoolCategoryId++;
    const newCategory: SchoolCategory = {
      ...category,
      id,
      createdAt: new Date(),
      updatedAt: null
    };
    this.schoolCategories.set(id, newCategory);
    return newCategory;
  }
  
  async updateSchoolCategory(id: number, category: Partial<InsertSchoolCategory>): Promise<SchoolCategory> {
    const existingCategory = this.schoolCategories.get(id);
    if (!existingCategory) {
      throw new Error(`School category with id ${id} not found`);
    }
    
    const updatedCategory: SchoolCategory = {
      ...existingCategory,
      ...category,
      updatedAt: new Date()
    };
    
    this.schoolCategories.set(id, updatedCategory);
    return updatedCategory;
  }
  
  async deleteSchoolCategory(id: number): Promise<boolean> {
    return this.schoolCategories.delete(id);
  }
  
  async getSchoolCategoriesBySchoolId(schoolId: number): Promise<SchoolCategory[]> {
    const relations = Array.from(this.schoolCategoryRelations.values())
      .filter(relation => relation.schoolId === schoolId);
    
    return relations.map(relation => 
      this.schoolCategories.get(relation.categoryId)
    ).filter(Boolean) as SchoolCategory[];
  }
  
  async addCategoryToSchool(relation: InsertSchoolCategoryRelation): Promise<SchoolCategoryRelation> {
    const id = this.schoolCategoryRelationId++;
    const newRelation: SchoolCategoryRelation = {
      ...relation,
      id,
      createdAt: new Date()
    };
    this.schoolCategoryRelations.set(id, newRelation);
    return newRelation;
  }
  
  async removeCategoryFromSchool(schoolId: number, categoryId: number): Promise<boolean> {
    const relationToRemove = Array.from(this.schoolCategoryRelations.entries())
      .find(([_, relation]) => 
        relation.schoolId === schoolId && relation.categoryId === categoryId
      );
    
    if (relationToRemove) {
      return this.schoolCategoryRelations.delete(relationToRemove[0]);
    }
    
    return false;
  }
  
  // School Media
  private schoolMedia: Map<number, SchoolMedia> = new Map();
  private schoolMediaId: number = 1;
  
  async getSchoolMedia(schoolId: number): Promise<SchoolMedia[]> {
    return Array.from(this.schoolMedia.values())
      .filter(media => media.schoolId === schoolId);
  }
  
  async getSchoolMediaItem(id: number): Promise<SchoolMedia | undefined> {
    return this.schoolMedia.get(id);
  }
  
  async createSchoolMedia(media: InsertSchoolMedia): Promise<SchoolMedia> {
    const id = this.schoolMediaId++;
    const newMedia: SchoolMedia = {
      ...media,
      id,
      createdAt: new Date()
    };
    this.schoolMedia.set(id, newMedia);
    return newMedia;
  }
  
  async updateSchoolMedia(id: number, media: Partial<InsertSchoolMedia>): Promise<SchoolMedia> {
    const existingMedia = this.schoolMedia.get(id);
    if (!existingMedia) {
      throw new Error(`School media with id ${id} not found`);
    }
    
    const updatedMedia: SchoolMedia = {
      ...existingMedia,
      ...media,
      updatedAt: new Date()
    };
    
    this.schoolMedia.set(id, updatedMedia);
    return updatedMedia;
  }
  
  async deleteSchoolMedia(id: number): Promise<boolean> {
    return this.schoolMedia.delete(id);
  }
  
  // User Preferences
  private userPreferences: Map<number, UserPreferences> = new Map();
  private userPreferencesId: number = 1;
  
  async getUserPreferences(userId: number): Promise<UserPreferences | undefined> {
    return Array.from(this.userPreferences.values())
      .find(prefs => prefs.userId === userId);
  }
  
  async createUserPreferences(preferences: InsertUserPreferences): Promise<UserPreferences> {
    const id = this.userPreferencesId++;
    const newPreferences: UserPreferences = {
      ...preferences,
      id,
      createdAt: new Date(),
      updatedAt: null
    };
    this.userPreferences.set(id, newPreferences);
    return newPreferences;
  }
  
  async updateUserPreferences(userId: number, preferences: Partial<InsertUserPreferences>): Promise<UserPreferences> {
    const existingPreferences = await this.getUserPreferences(userId);
    
    if (existingPreferences) {
      // Update existing preferences
      const updatedPreferences: UserPreferences = {
        ...existingPreferences,
        ...preferences,
        updatedAt: new Date()
      };
      
      this.userPreferences.set(existingPreferences.id, updatedPreferences);
      return updatedPreferences;
    } else {
      // Create new preferences
      return this.createUserPreferences({
        userId,
        ...preferences as InsertUserPreferences
      });
    }
  }
  
  // User Notifications
  private userNotifications: Map<number, UserNotification> = new Map();
  private userNotificationId: number = 1;
  
  async getUserNotifications(userId: number): Promise<UserNotification[]> {
    return Array.from(this.userNotifications.values())
      .filter(notification => notification.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async getUserNotification(id: number): Promise<UserNotification | undefined> {
    return this.userNotifications.get(id);
  }
  
  async createUserNotification(notification: InsertUserNotification): Promise<UserNotification> {
    const id = this.userNotificationId++;
    const newNotification: UserNotification = {
      ...notification,
      id,
      createdAt: new Date(),
      isRead: false
    };
    this.userNotifications.set(id, newNotification);
    return newNotification;
  }
  
  async markNotificationAsRead(id: number): Promise<UserNotification> {
    const notification = this.userNotifications.get(id);
    if (!notification) {
      throw new Error(`Notification with id ${id} not found`);
    }
    
    const updatedNotification: UserNotification = {
      ...notification,
      isRead: true
    };
    
    this.userNotifications.set(id, updatedNotification);
    return updatedNotification;
  }
  
  async markAllNotificationsAsRead(userId: number): Promise<boolean> {
    const userNotifications = Array.from(this.userNotifications.entries())
      .filter(([_, notification]) => notification.userId === userId && !notification.isRead);
    
    for (const [id, notification] of userNotifications) {
      this.userNotifications.set(id, {
        ...notification,
        isRead: true
      });
    }
    
    return true;
  }
  
  // User Profile
  private userProfiles: Map<number, UserProfile> = new Map();
  private userProfileId: number = 1;
  
  async getUserProfile(userId: number): Promise<UserProfile | undefined> {
    return Array.from(this.userProfiles.values())
      .find(profile => profile.userId === userId);
  }
  
  async createUserProfile(profile: InsertUserProfile): Promise<UserProfile> {
    const id = this.userProfileId++;
    const newProfile: UserProfile = {
      ...profile,
      id,
      createdAt: new Date(),
      updatedAt: null
    };
    this.userProfiles.set(id, newProfile);
    return newProfile;
  }
  
  async updateUserProfile(userId: number, profile: Partial<InsertUserProfile>): Promise<UserProfile> {
    const existingProfile = await this.getUserProfile(userId);
    
    if (existingProfile) {
      // Update existing profile
      const updatedProfile: UserProfile = {
        ...existingProfile,
        ...profile,
        updatedAt: new Date()
      };
      
      this.userProfiles.set(existingProfile.id, updatedProfile);
      return updatedProfile;
    } else {
      // Create new profile
      return this.createUserProfile({
        userId,
        ...profile as InsertUserProfile
      });
    }
  }
  
  async getUserPublicProfile(userId: number): Promise<Partial<UserProfile> | undefined> {
    const profile = await this.getUserProfile(userId);
    if (!profile) return undefined;
    
    // Return only fields that should be public
    return {
      userId: profile.userId,
      displayName: profile.displayName,
      bio: profile.bio,
      location: profile.location,
      avatarUrl: profile.avatarUrl,
      socialLinks: profile.socialLinks,
      // Exclude private fields like contactPreferences
    };
  }

  // Testimonial methods
  async getTestimonials(limit: number = 10): Promise<Testimonial[]> {
    const testimonials = Array.from(this.testimonials.values());
    return testimonials.slice(0, limit);
  }
  
  async getTestimonialById(id: number): Promise<Testimonial | undefined> {
    return this.testimonials.get(id);
  }
  
  async getTestimonialsBySchoolId(schoolId: number): Promise<Testimonial[]> {
    return Array.from(this.testimonials.values()).filter(
      testimonial => testimonial.schoolId === schoolId
    );
  }
  
  async createTestimonial(testimonial: InsertTestimonial): Promise<Testimonial> {
    const id = this.testimonialId++;
    const createdAt = new Date();
    
    const newTestimonial: Testimonial = {
      ...testimonial,
      id,
      createdAt
    };
    
    this.testimonials.set(id, newTestimonial);
    return newTestimonial;
  }
  
  async updateTestimonial(id: number, testimonialData: Partial<InsertTestimonial>): Promise<Testimonial | undefined> {
    const testimonial = this.testimonials.get(id);
    if (!testimonial) return undefined;
    
    const updatedTestimonial = { ...testimonial, ...testimonialData };
    this.testimonials.set(id, updatedTestimonial);
    return updatedTestimonial;
  }
  
  async deleteTestimonial(id: number): Promise<boolean> {
    if (!this.testimonials.has(id)) return false;
    return this.testimonials.delete(id);
  }
  
  // Team profiles methods
  async getTeamProfiles(options?: { includeInactive?: boolean }): Promise<TeamProfile[]> {
    const profiles = Array.from(this.teamProfiles.values());
    if (options?.includeInactive) {
      return profiles;
    }
    return profiles.filter(profile => profile.isActive);
  }

  async getTeamProfile(id: number): Promise<TeamProfile | undefined> {
    return this.teamProfiles.get(id);
  }

  async createTeamProfile(profile: InsertTeamProfile): Promise<TeamProfile> {
    const id = this.teamProfileId++;
    const createdAt = new Date();
    const newProfile: TeamProfile = {
      id,
      createdAt,
      name: profile.name,
      position: profile.position,
      bio: profile.bio || null,
      imageUrl: profile.imageUrl || null,
      socialLinks: profile.socialLinks || null,
      order: profile.order || 0,
      isActive: profile.isActive !== undefined ? profile.isActive : true
    };
    this.teamProfiles.set(id, newProfile);
    return newProfile;
  }

  async updateTeamProfile(id: number, profile: Partial<InsertTeamProfile>): Promise<TeamProfile> {
    const existingProfile = await this.getTeamProfile(id);
    if (!existingProfile) {
      throw new Error("Team profile not found");
    }
    
    const updatedProfile = { ...existingProfile, ...profile };
    this.teamProfiles.set(id, updatedProfile);
    return updatedProfile;
  }

  async deleteTeamProfile(id: number): Promise<boolean> {
    const profile = await this.getTeamProfile(id);
    if (!profile) {
      return false;
    }
    return this.teamProfiles.delete(id);
  }
  
  // Support Requests methods
  async getSupportRequests(limit: number = 10, offset: number = 0, status?: string): Promise<SupportRequest[]> {
    let filteredRequests = Array.from(this.supportRequests.values());
    
    if (status) {
      filteredRequests = filteredRequests.filter(request => request.status === status);
    }
    
    return filteredRequests.slice(offset, offset + limit);
  }
  
  async getSupportRequest(id: number): Promise<SupportRequest | undefined> {
    return this.supportRequests.get(id);
  }
  
  async createSupportRequest(request: InsertSupportRequest): Promise<SupportRequest> {
    const id = this.supportRequestId++;
    const createdAt = new Date();
    const status = 'pending';
    
    const newSupportRequest: SupportRequest = {
      id,
      createdAt,
      name: request.name,
      email: request.email,
      subject: request.subject,
      message: request.message,
      status,
      userId: request.userId ?? null,
      category: request.category ?? null,
      priority: request.priority ?? 'medium',
      attachmentUrl: request.attachmentUrl ?? null,
      assignedTo: null,
      resolvedAt: null,
      responseMessage: null
    };
    
    this.supportRequests.set(id, newSupportRequest);
    return newSupportRequest;
  }
  
  async updateSupportRequest(id: number, request: Partial<SupportRequest>): Promise<SupportRequest> {
    const existingRequest = this.supportRequests.get(id);
    if (!existingRequest) {
      throw new Error(`Support request with ID ${id} not found`);
    }
    
    const updatedRequest = {
      ...existingRequest,
      ...request,
      // Preserve immutable fields
      id: existingRequest.id,
      createdAt: existingRequest.createdAt
    };
    
    this.supportRequests.set(id, updatedRequest);
    return updatedRequest;
  }
  
  async deleteSupportRequest(id: number): Promise<boolean> {
    if (!this.supportRequests.has(id)) return false;
    return this.supportRequests.delete(id);
  }
  
  async getUserSupportRequests(userId: number): Promise<SupportRequest[]> {
    return Array.from(this.supportRequests.values())
      .filter(request => request.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async deleteSchool(id: number): Promise<boolean> {
    try {
      // Check if the school exists
      if (!this.schools.has(id)) {
        return false;
      }
      
      // Delete related entities
      
      // 1. Delete school media
      const mediaToDelete = Array.from(this.schoolMedia.values())
        .filter(media => media.schoolId === id);
      for (const media of mediaToDelete) {
        this.schoolMedia.delete(media.id);
      }
      
      // 2. Delete school category relations
      const schoolCategoryRelationsToDelete = Array.from(this.schoolCategoryRelations.values())
        .filter(relation => relation.schoolId === id);
      for (const relation of schoolCategoryRelationsToDelete) {
        this.schoolCategoryRelations.delete(relation.id);
      }
      
      // 3. Delete school posts
      const postsToDelete = Array.from(this.schoolPosts.values())
        .filter(post => post.schoolId === id);
      for (const post of postsToDelete) {
        this.schoolPosts.delete(post.id);
      }
      
      // 4. Delete campuses
      const campusesToDelete = Array.from(this.campuses.values())
        .filter(campus => campus.schoolId === id);
      for (const campus of campusesToDelete) {
        this.campuses.delete(campus.id);
      }
      
      // 5. Delete faculty
      const facultyToDelete = Array.from(this.faculties.values())
        .filter(faculty => faculty.schoolId === id);
      for (const faculty of facultyToDelete) {
        this.faculties.delete(faculty.id);
      }
      
      // 6. Delete reviews
      const reviewsToDelete = Array.from(this.reviews.values())
        .filter(review => review.schoolId === id);
      for (const review of reviewsToDelete) {
        this.reviews.delete(review.id);
      }
      
      // 7. Delete user-school associations
      const userSchoolsToDelete = Array.from(this.userSchoolsMap.values())
        .filter(userSchool => userSchool.schoolId === id);
      for (const userSchool of userSchoolsToDelete) {
        this.userSchoolsMap.delete(userSchool.id);
      }
      
      // 8. Delete saved schools entries
      const savedSchoolsToDelete = Array.from(this.savedSchools.values())
        .filter(savedSchool => savedSchool.schoolId === id);
      for (const savedSchool of savedSchoolsToDelete) {
        this.savedSchools.delete(savedSchool.id);
      }
      
      // 9. Finally delete the school itself
      this.schools.delete(id);
      
      return true;
    } catch (error) {
      console.error(`Error deleting school with id ${id}:`, error);
      return false;
    }
  }
}

// Import the DatabaseStorage
import { DatabaseStorage } from "./database-storage";

// Create the storage instance
// Use DatabaseStorage with the database or fallback to MemStorage
export const storage = new DatabaseStorage();

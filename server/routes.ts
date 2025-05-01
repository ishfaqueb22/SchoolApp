import type { Express, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage, type IStorage } from "./storage";
import { db } from "./db";
import { aiService } from "./ai-service";
import { WebSocketServer, WebSocket } from 'ws';
import { schoolApprovalRouter } from "./routes/admin-school-approval";
import { userSchoolsRouter } from "./routes/user-schools";
import { userInquiriesRouter } from "./routes/user-inquiries";
import contentManagementRouter from "./routes/content-management";
import { categoriesCountRouter } from "./routes/categories-count";
import { filterDataRouter } from "./routes/filter-data";
import categoryRouter from "./routes/school-categories";
import mediaRouter from "./routes/school-media";
import dashboardRouter from "./routes/dashboard";
import { teamProfilesRouter } from "./routes/team-profiles";
import { 
  insertUserSchema,
  insertSchoolSchema, 
  insertSavedSchoolSchema, 
  insertComparisonSchema,
  insertReviewSchema,
  insertCampusSchema,
  insertFacultySchema,
  insertSchoolPostSchema,
  insertInquirySchema,
  insertQuizResponseSchema,
  insertQuizResultSchema,
  insertContentPageSchema,
  insertBlogPostSchema,
  insertFaqItemSchema,
  insertCategorySchema,
  insertMessageSchema,
  insertConversationSchema,
  insertSystemLogSchema,
  insertSiteSettingSchema,
  insertSupportRequestSchema,
  faculty,
  schoolPosts,
  inquiries,
  schools,
  type User,
  type ContentPage,
  type BlogPost,
  type FaqItem,
  type Category,
  type Message,
  type Conversation,
  type SystemLog,
  type SiteSetting,
  type SupportRequest,
  type InsertSupportRequest
} from "@shared/schema";
import { createInsertSchema } from "drizzle-zod";
import { ZodError, z } from "zod";
import express, { Request } from "express";
import { v4 as uuidv4 } from 'uuid';

// Import the schema improvements
import {
  insertSchoolCategorySchema,
  insertSchoolCategoryRelationSchema,
  insertSchoolMediaSchema,
  insertUserPreferencesSchema,
  insertUserNotificationSchema,
  insertUserProfileSchema,
  type SchoolCategory,
  type SchoolCategoryRelation,
  type SchoolMedia,
  type UserPreferences,
  type UserNotification,
  type UserProfile
} from "../schema_improvements";

// Import extended router
import { extendedRouter } from "../api_routes_improvements";

// Extend the Express Request type to include user property
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}
import session from "express-session";
import { sessionStore } from "./session-store";

// Utility function to group data by month
function groupByMonthFromDate(items: any[], referenceDate: Date): number[] {
  const grouped = Array(6).fill(0);
  
  items.forEach(item => {
    const date = new Date(item.createdAt);
    const monthsAgo = (referenceDate.getFullYear() - date.getFullYear()) * 12 + 
                      referenceDate.getMonth() - date.getMonth();
    
    if (monthsAgo >= 0 && monthsAgo < 6) {
      grouped[5 - monthsAgo]++;
    }
  });
  
  return grouped;
}

// Declare session data type
declare module 'express-session' {
  interface SessionData {
    userId?: number;
    userRole?: string;
  }
}

// Helper function to handle Zod validation errors
function handleZodError(error: ZodError, res: Response) {
  return res.status(400).json({
    error: "Validation error",
    details: error.errors.map(err => ({
      path: err.path.join('.'),
      message: err.message
    }))
  });
}

// Helper function to get the total count of schools based on search params
async function getSchoolsCount(storage: IStorage, searchParams: any): Promise<number> {
  try {
    console.log("Getting total count with search params:", searchParams);
    
    // Make a copy of search params to avoid modifying the original
    const countParams = { ...searchParams };
    
    // Remove pagination parameters as we want the total count
    delete countParams.limit;
    delete countParams.offset;
    
    // First try to use searchSchools to get the count with current filters
    try {
      console.log("Fetching school count with these params:", JSON.stringify(countParams));
      const allMatchingSchools = await storage.searchSchools(countParams);
      console.log(`Found ${allMatchingSchools.length} matching schools`);
      return allMatchingSchools.length;
    } catch (searchError) {
      console.error("Error in searchSchools for count:", searchError);
      
      // If that fails, try to get all schools as a fallback
      try {
        console.log("Falling back to getSchools method for count");
        const schools = await storage.getSchools(1000, 0);
        console.log(`Fallback count from getSchools: ${schools.length} total schools`);
        
        // If there are approval status filters, apply them manually
        if (countParams.approvalStatus) {
          const filteredSchools = schools.filter(
            school => school.approvalStatus === countParams.approvalStatus
          );
          console.log(`After filtering by approval status: ${filteredSchools.length} matching schools`);
          return filteredSchools.length;
        }
        
        return schools.length;
      } catch (fallbackError) {
        console.error("Fallback count method also failed:", fallbackError);
        return 0;
      }
    }
  } catch (error) {
    console.error("Error in getSchoolsCount:", error);
    return 0;
  }
}

// Authentication middleware - checks if any user is authenticated
function requireAuth(req: Request, res: Response, next: Function) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Authentication required" });
  }
  
  // No role check needed here - just verify a user is authenticated
  // Role-specific checks are done in separate middlewares like requireSchoolAdmin
  console.log("User authenticated:", req.session.userId, "with role:", req.session.userRole);
  next();
}

// School admin authentication middleware
function requireSchoolAdmin(req: Request, res: Response, next: Function) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Authentication required" });
  }
  
  // Strict role-based check - only schoolAdmin role allowed
  if (req.session.userRole !== 'schoolAdmin') {
    return res.status(403).json({ error: "School administrator access required" });
  }
  
  console.log("School admin access granted to user:", req.session.userId, "with role:", req.session.userRole);
  next();
}

// Platform admin authentication middleware
function requireAdminRole(req: Request, res: Response, next: Function) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Authentication required" });
  }
  
  if (req.session.userRole !== 'platformAdmin') {
    return res.status(403).json({ error: "Platform administrator access required" });
  }
  
  next();
}

// Helper function to check if a user has access to a school
// This handles both direct schoolId links and adminId relationships
async function checkSchoolAccess(userId: number, schoolId: number): Promise<boolean> {
  try {
    console.log(`[ACCESS CHECK] Checking if user ${userId} has access to school ${schoolId}`);
    
    if (!userId || !schoolId) {
      console.log(`[ACCESS CHECK] Invalid parameters - userId: ${userId}, schoolId: ${schoolId}`);
      return false;
    }
    
    // Get the user details
    let user;
    try {
      user = await storage.getUser(userId);
    } catch (error) {
      console.error(`[ACCESS CHECK] Database error fetching user ${userId}:`, error);
      // Retry once after a short delay - helps with transient DB connection issues
      try {
        await new Promise(resolve => setTimeout(resolve, 500));
        user = await storage.getUser(userId);
        console.log(`[ACCESS CHECK] User fetch retry successful for user ${userId}`);
      } catch (retryError) {
        console.error(`[ACCESS CHECK] Failed to fetch user ${userId} even after retry:`, retryError);
        return false;
      }
    }
    
    if (!user) {
      console.log(`[ACCESS CHECK] User ${userId} not found`);
      return false;
    }
    
    console.log(`[ACCESS CHECK] User data:`, {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      schoolId: user.schoolId
    });
    
    // If the user is the school admin via direct schoolId reference
    if (user.schoolId === schoolId) {
      console.log(`[ACCESS CHECK] User ${userId} has direct access to school ${schoolId} via schoolId field`);
      return true;
    }
    
    // If user is a platformAdmin, they have access to all schools
    if (user.role === 'platformAdmin') {
      console.log(`[ACCESS CHECK] User ${userId} has access to school ${schoolId} as a platform admin`);
      return true;
    }
    
    // Get the requested school details to check the adminId
    let school;
    try {
      school = await storage.getSchool(schoolId);
    } catch (error) {
      console.error(`[ACCESS CHECK] Database error fetching school ${schoolId}:`, error);
      // Retry once after a short delay
      try {
        await new Promise(resolve => setTimeout(resolve, 500));
        school = await storage.getSchool(schoolId);
        console.log(`[ACCESS CHECK] School fetch retry successful for school ${schoolId}`);
      } catch (retryError) {
        console.error(`[ACCESS CHECK] Failed to fetch school ${schoolId} even after retry:`, retryError);
        return false;
      }
    }
    
    if (!school) {
      console.log(`[ACCESS CHECK] School ${schoolId} not found`);
      return false;
    }
    
    console.log(`[ACCESS CHECK] School data:`, {
      id: school.id,
      name: school.name,
      adminId: school.admin_id,
      associatedWithUser: school.admin_id === userId
    });
    
    if (school.admin_id === userId) {
      console.log(`[ACCESS CHECK] User ${userId} has direct access to school ${schoolId} as the admin (adminId match)`);
      return true;
    }
    
    // Fallback check with getSchoolsByAdminId
    const schools = await storage.getSchoolsByAdminId(userId);
    console.log(`[ACCESS CHECK] User ${userId} admin of schools:`, schools.map(s => s.id));
    
    const hasAccess = schools.some(s => s.id === schoolId);
    
    if (!hasAccess) {
      console.log(`[ACCESS CHECK] User ${userId} denied access to school ${schoolId}. User's schoolId: ${user.schoolId}`);
    } else {
      console.log(`[ACCESS CHECK] User ${userId} has access to school ${schoolId} via adminId relationship`);
    }
    
    return hasAccess;
  } catch (error) {
    console.error(`[ACCESS CHECK] Error checking school access for user ${userId} to school ${schoolId}:`, error);
    return false;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Create HTTP server
  const httpServer = createServer(app);
  
  // Create WebSocket server on a distinct path
  const wss = new WebSocketServer({ 
    server: httpServer, 
    path: '/ws' 
  });

  // Create map to track connections by user ID
  const userConnections = new Map<number, Set<WebSocket>>();
  
  // WebSocket connection handling
  wss.on('connection', (ws: WebSocket) => {
    console.log('WebSocket client connected');
    let userId: number | null = null;
    
    ws.on('message', (message: string) => {
      try {
        const data = JSON.parse(message.toString());
        
        // Handle authentication message to associate connection with user
        if (data.type === 'authenticate' && data.userId) {
          userId = parseInt(data.userId);
          if (!userConnections.has(userId)) {
            userConnections.set(userId, new Set());
          }
          userConnections.get(userId)?.add(ws);
          console.log(`WebSocket: User ${userId} authenticated`);
          
          // Send confirmation
          ws.send(JSON.stringify({ 
            type: 'authenticated', 
            success: true,
            userId
          }));
        }
      } catch (error) {
        console.error('WebSocket message parsing error:', error);
      }
    });
    
    // Handle disconnection
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
      if (userId && userConnections.has(userId)) {
        userConnections.get(userId)?.delete(ws);
        // Clean up the map if no connections left for this user
        if (userConnections.get(userId)?.size === 0) {
          userConnections.delete(userId);
        }
      }
    });
  });
  
  // Add sendNotificationToUser function to global app context
  app.locals.sendUserNotification = (userId: number, data: any) => {
    if (userConnections.has(userId)) {
      const connections = userConnections.get(userId);
      if (connections) {
        const message = JSON.stringify({
          type: 'notification',
          data
        });
        
        connections.forEach(connection => {
          if (connection.readyState === WebSocket.OPEN) {
            connection.send(message);
          }
        });
      }
    }
  };
  
  // Setup session middleware
  app.use(
    session({
      cookie: { 
        maxAge: 86400000, // 24 hours
        secure: false,    // Set to false for development (no HTTPS required)
        httpOnly: true,   // Prevent client-side JS from reading the cookie
        sameSite: 'lax'   // Prevents CSRF attacks
      },
      store: sessionStore,
      resave: false,
      saveUninitialized: false,
      secret: "smartschool-finder-secret"
    })
  );
  
  // Register the extended router with new API routes
  app.use('/api', extendedRouter);
  
  // Register user-schools routes
  app.use('/api/user-schools', userSchoolsRouter);
  
  // Register user inquiries routes
  app.use('/api/user/inquiries', userInquiriesRouter);
  
  // Register school approval routes for platform admins
  app.use('/api/admin/approval', schoolApprovalRouter);
  
  // Register content management routes
  app.use('/api/content', contentManagementRouter);
  
  // Register categories count route
  app.use('/api/categories-count', categoriesCountRouter);
  
  // Register filter data routes
  app.use('/api/filter-data', filterDataRouter);
  
  // Register school categories routes
  app.use('/api', categoryRouter);
  
  // Register school media routes
  app.use('/api', mediaRouter);
  
  // Register improved dashboard routes
  app.use('/api', dashboardRouter);
  
  // Register team profiles routes
  app.use('/api', teamProfilesRouter);
  
  // Auth routes
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      console.log("Received registration data:", req.body);
      
      // Set default role to 'user' if not provided
      const userDataWithRole = {
        ...req.body,
        role: req.body.role || 'user'
      };
      
      // Parse and validate the input data
      const validatedData = insertUserSchema.parse(userDataWithRole);
      
      // Check if email already exists
      const existingUserEmail = await storage.getUserByEmail(validatedData.email);
      if (existingUserEmail) {
        return res.status(400).json({ error: "Email already in use" });
      }
      
      // Check if username already exists
      const existingUsername = await storage.getUserByUsername(validatedData.username);
      if (existingUsername) {
        return res.status(400).json({ error: "Username already in use" });
      }
      
      // Create the user with the validated data
      console.log("Creating user with data:", validatedData);
      const user = await storage.createUser(validatedData);
      
      // Set user session
      req.session.userId = user.id;
      req.session.userRole = user.role; // Store user role in session
      
      // Return user without password
      const { password, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error("Registration error:", error);
      
      if (error instanceof ZodError) {
        return handleZodError(error, res);
      }
      
      res.status(500).json({ error: "Failed to register user" });
    }
  });
  
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      console.log("Received login request with body:", {
        username: req.body.username,
        body: req.body,
        headers: req.headers
      });
      
      const { username, password } = req.body;
      
      if (!username || !password) {
        console.log("Missing username or password in request");
        return res.status(400).json({ error: "Username and password are required" });
      }
      
      console.log(`Looking up user with username: ${username}`);
      const user = await storage.getUserByUsername(username);
      
      if (!user) {
        console.log(`User not found with username: ${username}`);
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      console.log(`User found: ${user.id} (${user.role})`);
      if (user.password !== password) {
        console.log("Password mismatch");
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      // Set user session
      req.session.userId = user.id;
      req.session.userRole = user.role; // Store user role in session
      
      console.log("Session data set:", {
        userId: req.session.userId,
        userRole: req.session.userRole
      });
      
      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      console.log("Sending user data in response:", userWithoutPassword);
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed", message: error instanceof Error ? error.message : "Unknown error" });
    }
  });
  
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Failed to logout" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });
  
  app.get("/api/auth/me", async (req: Request, res: Response) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    try {
      console.log("Fetching user data for userId:", req.session.userId);
      const user = await storage.getUser(req.session.userId);
      
      if (!user) {
        console.log("User not found for userId:", req.session.userId);
        return res.status(404).json({ error: "User not found" });
      }
      
      // Return user without password
      const { password, ...userWithoutPassword } = user;
      console.log("User found:", userWithoutPassword);
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error fetching user data:", error);
      res.status(500).json({ error: "Failed to get user data" });
    }
  });
  
  // Update user profile (including avatar)
  app.put("/api/auth/profile", requireAuth, async (req: Request, res: Response) => {
    try {
      const { fullName, email, avatarUrl } = req.body;
      
      // Validate the request body
      const updateProfileSchema = z.object({
        fullName: z.string().min(2, "Name must be at least 2 characters"),
        email: z.string().email("Must be a valid email address"),
        avatarUrl: z.string().nullable().optional(),
      });
      
      try {
        updateProfileSchema.parse(req.body);
      } catch (error) {
        if (error instanceof ZodError) {
          return handleZodError(error, res);
        }
        throw error;
      }
      
      // Update the user in the database
      const userId = req.session.userId!;
      const updatedUser = await storage.updateUser(userId, {
        fullName,
        email,
        avatarUrl,
      });
      
      // Return the updated user without password
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Failed to update profile:", error);
      res.status(500).json({ 
        error: "Failed to update profile", 
        details: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  // Update password
  app.put("/api/auth/password", requireAuth, async (req: Request, res: Response) => {
    try {
      const { currentPassword, newPassword } = req.body;
      
      // Validate the request body
      const updatePasswordSchema = z.object({
        currentPassword: z.string().min(6, "Current password is required"),
        newPassword: z.string().min(8, "New password must be at least 8 characters"),
      });
      
      try {
        updatePasswordSchema.parse(req.body);
      } catch (error) {
        if (error instanceof ZodError) {
          return handleZodError(error, res);
        }
        throw error;
      }
      
      // Get the user from the database
      const userId = req.session.userId!;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Check if the current password is correct
      // In a real app, you would hash the password and compare with the stored hash
      if (user.password !== currentPassword) {
        return res.status(401).json({ error: "Current password is incorrect" });
      }
      
      // Update the user's password
      const updatedUser = await storage.updateUser(userId, {
        password: newPassword,
      });
      
      // Return success message
      res.json({ message: "Password updated successfully" });
    } catch (error) {
      console.error("Failed to update password:", error);
      res.status(500).json({ 
        error: "Failed to update password", 
        details: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  // User notification preferences
  app.get("/api/user/notifications/preferences", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Get notification preferences - in a production app, this would be a separate table
      // For now, return default preferences if none are stored
      const preferences = user.notificationPreferences || {
        emailUpdates: true,
        newSchoolAlerts: true,
        eventReminders: true,
        applicationUpdates: true,
        marketingEmails: false
      };
      
      res.json(preferences);
    } catch (error) {
      console.error("Failed to fetch notification preferences:", error);
      res.status(500).json({ 
        error: "Failed to fetch notification preferences", 
        details: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  app.put("/api/user/notifications/preferences", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      
      // Validate the request body
      const notificationPreferencesSchema = z.object({
        emailUpdates: z.boolean(),
        newSchoolAlerts: z.boolean(),
        eventReminders: z.boolean(),
        applicationUpdates: z.boolean(),
        marketingEmails: z.boolean()
      });
      
      try {
        notificationPreferencesSchema.parse(req.body);
      } catch (error) {
        if (error instanceof ZodError) {
          return handleZodError(error, res);
        }
        throw error;
      }
      
      // Update the user's notification preferences
      const updatedUser = await storage.updateUser(userId, {
        notificationPreferences: req.body
      });
      
      res.json({
        message: "Notification preferences updated successfully",
        preferences: updatedUser.notificationPreferences || req.body
      });
    } catch (error) {
      console.error("Failed to update notification preferences:", error);
      res.status(500).json({ 
        error: "Failed to update notification preferences", 
        details: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  // School Categories route
  app.get("/api/school-categories", async (req: Request, res: Response) => {
    try {
      const categories = await storage.getSchoolCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching school categories:", error);
      res.status(500).json({ error: "Failed to fetch school categories" });
    }
  });
  
  // Schools routes
  app.get("/api/schools", async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
      const featured = req.query.featured === 'true';
      
      console.log("Getting schools with limit:", limit, "offset:", offset, featured ? "(featured only)" : "");
      
      let schools;
      if (featured) {
        // For featured schools, we search schools with higher ratings first
        // Only show approved schools for featured sections
        schools = await storage.searchSchools({
          featured: true,
          approvalStatus: "approved", // Only show approved schools in featured section
          limit,
          offset,
          sortField: "rating",
          sortDirection: "desc"
        });
      } else {
        // For regular listings, also filter by approval status
        schools = await storage.searchSchools({
          approvalStatus: "approved", // Only show approved schools
          limit,
          offset
        });
      }
      
      // Fetch campuses for each school
      const schoolsWithCampuses = await Promise.all(schools.map(async (school) => {
        const campuses = await storage.getCampuses(school.id);
        return {
          ...school,
          campuses
        };
      }));
      
      console.log("Successfully retrieved schools:", schools.length);
      res.json(schoolsWithCampuses);
    } catch (error) {
      console.error("Failed to fetch schools:", error);
      res.status(500).json({ 
        error: "Failed to fetch schools", 
        details: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  // Get schools with map coordinates
  app.get("/api/schools/map", async (req: Request, res: Response) => {
    try {
      const type = req.query.type as string; // "public", "private", "charter", etc.
      const radius = req.query.radius as string; // "5 miles", "10 miles", etc.
      const center = req.query.center as string; // lat,lng format
      
      // Parse radius to get the distance in miles
      let distance = 10; // Default 10 miles
      let skipDistanceFilter = false;
      
      if (radius) {
        if (radius === 'all') {
          // Special value 'all' means no distance filtering
          skipDistanceFilter = true; 
          distance = 0; // Set to 0 to indicate no distance filtering
          console.log('Distance filtering disabled - showing all schools');
        } else {
          // For values like "5 miles", extract just the number
          const match = radius.match(/(\d+)/);
          if (match && match[1]) {
            distance = parseInt(match[1]);
          }
        }
      }
      
      console.log(`Getting schools for map view with type: ${type || 'all'}, radius: ${distance} miles`);
      
      // Get schools with potential filter by type - show only approved schools
      let schools = await storage.searchSchools({
        limit: 100,
        approvalStatus: "approved" // Only show approved schools on map
      });
      
      // Filter by school type if specified
      if (type && type !== 'all') {
        // Handle comma-separated list of types
        const typeArray = type.split(',');
        console.log(`Filtering by school types: ${typeArray.join(', ')}`);
        
        // Add debugging to see actual school types
        schools.forEach(school => {
          console.log(`School ${school.id}: ${school.name}, type=${school.type}, curriculumType=${school.curriculumType}`);
        });
        
        schools = schools.filter(school => 
          // Check both type and curriculumType since schools could have either or both fields
          (school.type && typeArray.some(t => school.type.toLowerCase() === t.toLowerCase())) ||
          (school.curriculumType && typeArray.some(t => school.curriculumType.toLowerCase() === t.toLowerCase()))
        );
      }
      
      // Add location filtering based on center point and radius if provided
      if (skipDistanceFilter) {
        console.log('Distance filtering disabled - showing all matching schools regardless of location');
      } else if (center && distance > 0) { // Only filter by distance if we have a positive radius and not "all"
        try {
          console.log(`Filtering by location with center=${center}, radius=${distance} miles`);
          
          const [lat, lng] = center.split(',').map(Number);
          if (!isNaN(lat) && !isNaN(lng)) {
            console.log(`Parsed coordinates: lat=${lat}, lng=${lng}`);
            
            // Debug schools coordinates
            schools.forEach(school => {
              console.log(`School ${school.id}: ${school.name}, coordinates=${JSON.stringify(school.coordinates)}`);
            });
            
            // This would be a simple implementation for distance filtering
            // In a real app, you'd use a proper geospatial query
            schools = schools.filter(school => {
              if (!school.coordinates) {
                console.log(`School ${school.id} has no coordinates, skipping`);
                return false;
              }
              
              // Calculate rough distance in miles using Haversine formula
              const schoolLat = school.coordinates.lat;
              const schoolLng = school.coordinates.lng;
              
              const R = 3958.8; // Earth's radius in miles
              const dLat = (schoolLat - lat) * Math.PI / 180;
              const dLon = (schoolLng - lng) * Math.PI / 180;
              const a = 
                Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat * Math.PI / 180) * Math.cos(schoolLat * Math.PI / 180) * 
                Math.sin(dLon/2) * Math.sin(dLon/2);
              const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
              const d = R * c; // Distance in miles
              
              console.log(`School ${school.id}: distance = ${d.toFixed(2)} miles, within radius: ${d <= distance}`);
              return d <= distance;
            });
          } else {
            console.log("Invalid coordinates format");
          }
        } catch (parseError) {
          console.error("Error parsing center coordinates:", parseError);
          // Continue without filtering by location
        }
      }
      
      // Format the response to include only necessary data for the map
      const mapSchools = schools.map(school => ({
        id: school.id,
        name: school.name,
        location: school.location,
        address: school.address,
        type: school.type,
        rating: school.rating,
        curriculumType: school.curriculumType,
        imageUrl: school.imageUrl,
        coordinates: school.coordinates || null,
      }));
      
      console.log(`Found ${mapSchools.length} schools for map view`);
      res.json(mapSchools);
    } catch (error) {
      console.error("Failed to fetch schools for map:", error);
      res.status(500).json({ 
        error: "Failed to fetch schools for map", 
        details: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  // Route for getting schools by category
  app.get("/api/schools/category/:categoryName", async (req: Request, res: Response) => {
    try {
      const { categoryName } = req.params;
      const { limit = 6, offset = 0 } = req.query;
      
      console.log(`Getting schools for category: ${categoryName} with limit: ${limit}, offset: ${offset}`);
      
      // Fetch approved schools first - users should only see approved schools
      const allSchools = await storage.searchSchools({
        approvalStatus: "approved"
      });
      
      // TODO: In a real implementation, this would use a proper database query with joins
      // For now, we'll filter based on the category name (case-insensitive)
      // This is a simplified implementation that won't scale well but works for demo purposes
      const matchingSchools = allSchools.filter(school => {
        // Check if school type, name, or curriculum type contains the category name
        return (
          school.type.toLowerCase().includes(categoryName.toLowerCase()) ||
          school.curriculumType?.toLowerCase().includes(categoryName.toLowerCase()) ||
          school.name.toLowerCase().includes(categoryName.toLowerCase())
        );
      });
      
      // Get total count before pagination
      const totalCount = matchingSchools.length;
      
      // Apply pagination
      const paginatedSchools = matchingSchools.slice(
        parseInt(offset as string), 
        parseInt(offset as string) + parseInt(limit as string)
      );
      
      console.log(`Found ${totalCount} schools for category ${categoryName}, returning ${paginatedSchools.length}`);
      
      res.json({
        schools: paginatedSchools,
        meta: {
          total: totalCount,
          limit: parseInt(limit as string),
          offset: parseInt(offset as string)
        }
      });
    } catch (error) {
      console.error(`Error fetching schools by category: ${error}`);
      res.status(500).json({ 
        error: "Failed to fetch schools by category", 
        details: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  app.get("/api/schools/search", async (req: Request, res: Response) => {
    try {
      console.log("Raw query params:", req.query);
      
      // Extract all possible query parameters
      const {
        q: query,
        type,
        location,
        curriculum_type: curriculumType,
        grade_level: gradeLevel,
        has_financial_aid,
        min_rating,
        max_tuition,
        category,
        featured,
        limit,
        offset,
        features,
        sort_field,
        sort_direction
      } = req.query;
      
      console.log("Extracted search query:", query);
      
      // Create search params object
      const searchParams: {
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
        limit?: number;
        offset?: number;
        features?: string[];
        sortField?: string;
        sortDirection?: 'asc' | 'desc';
      } = {};
      
      // Add parameters if they exist
      if (query) searchParams.query = query as string;
      if (type) searchParams.type = type as string;
      if (location) searchParams.location = location as string;
      if (curriculumType) searchParams.curriculumType = curriculumType as string;
      if (gradeLevel) searchParams.gradeLevel = gradeLevel as string;
      if (category) searchParams.category = category as string;
      
      // Convert string boolean to actual boolean
      if (has_financial_aid !== undefined) {
        searchParams.hasFinancialAid = has_financial_aid === 'true';
      }
      
      if (featured !== undefined) {
        searchParams.featured = featured === 'true';
      }
      
      // Convert string numbers to actual numbers
      if (min_rating !== undefined) {
        searchParams.minRating = parseFloat(min_rating as string);
      }
      
      if (limit !== undefined) {
        searchParams.limit = parseInt(limit as string);
      } else {
        // Default limit
        searchParams.limit = 20;
      }
      
      if (offset !== undefined) {
        searchParams.offset = parseInt(offset as string);
      } else {
        // Default offset
        searchParams.offset = 0;
      }
      
      // Add max tuition if provided
      if (max_tuition) {
        searchParams.maxTuition = max_tuition as string;
      }
      
      // Handle features (comma-separated list)
      if (features) {
        try {
          searchParams.features = (features as string).split(',').map(f => f.trim());
        } catch (error) {
          console.error("Error parsing features:", error);
          // If features can't be parsed, skip this filter
        }
      }
      
      // Add sorting parameters
      if (sort_field) {
        searchParams.sortField = sort_field as string;
        
        if (sort_direction && ['asc', 'desc'].includes(sort_direction as string)) {
          searchParams.sortDirection = sort_direction as 'asc' | 'desc';
        } else {
          // Default to ascending order
          searchParams.sortDirection = 'asc';
        }
      }
      
      // Check if user is admin (platform admin or school admin can see all schools)
      const isAdmin = req.user && (req.user.role === 'platformAdmin' || req.user.role === 'schoolAdmin');
      
      // For regular users or non-authenticated users, only show approved schools
      if (!isAdmin) {
        searchParams.approvalStatus = "approved";
      }
      
      console.log("School search with params:", searchParams);
      
      // DEBUG: Before running the search, let's check if we have data and their approval statuses
      try {
        const debugSchools = await db.select({
          id: schools.id, 
          name: schools.name, 
          status: schools.approvalStatus
        }).from(schools).limit(5);
        
        console.log("DEBUG - School sample data:", JSON.stringify(debugSchools));
      } catch (error) {
        console.error("Error retrieving debug school data:", error);
      }
      
      let schoolResults = [];
      try {
        schoolResults = await storage.searchSchools(searchParams);
      } catch (error) {
        console.error("Error during searchSchools:", error);
        return res.status(500).json({ 
          error: "Search failed", 
          details: error instanceof Error ? error.message : String(error) 
        });
      }
      
      // Fetch campuses for each school
      let schoolsWithCampuses = [];
      try {
        schoolsWithCampuses = await Promise.all(schoolResults.map(async (school) => {
          try {
            const campuses = await storage.getCampuses(school.id);
            return {
              ...school,
              campuses
            };
          } catch (error) {
            console.error(`Error fetching campuses for school ${school.id}:`, error);
            return {
              ...school,
              campuses: []
            };
          }
        }));
      } catch (error) {
        console.error("Error during campus data fetching:", error);
        // Continue with the schools without campus data
        schoolsWithCampuses = schoolResults.map(school => ({
          ...school,
          campuses: []
        }));
      }
      
      // For better frontend pagination support, include metadata
      let totalCount = 0;
      try {
        totalCount = await getSchoolsCount(storage, searchParams);
      } catch (error) {
        console.error("Error getting total count:", error);
        totalCount = schoolResults.length;
      }
      
      res.json({
        schools: schoolsWithCampuses,
        meta: {
          total: totalCount,
          limit: searchParams.limit,
          offset: searchParams.offset
        }
      });
    } catch (error) {
      console.error("Search failed:", error);
      res.status(500).json({ 
        error: "Search failed", 
        details: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  app.get("/api/schools/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid school ID" });
      }
      
      const school = await storage.getSchool(id);
      
      if (!school) {
        return res.status(404).json({ error: "School not found" });
      }
      
      res.json(school);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch school" });
    }
  });
  
  app.get("/api/schools/type/:type", async (req: Request, res: Response) => {
    try {
      const type = req.params.type;
      
      // Check if user is admin to determine if we should filter by approval status
      const isAdmin = req.user && (req.user.role === 'platformAdmin' || req.user.role === 'schoolAdmin');
      
      // For regular users, use searchSchools with approvalStatus filter
      if (!isAdmin) {
        const schools = await storage.searchSchools({
          type,
          approvalStatus: "approved"
        });
        return res.json(schools);
      }
      
      // For admins, show all schools by type
      const schools = await storage.getSchoolsByType(type);
      res.json(schools);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch schools by type" });
    }
  });
  
  app.get("/api/schools/location/:location", async (req: Request, res: Response) => {
    try {
      const location = req.params.location;
      
      // Check if user is admin to determine if we should filter by approval status
      const isAdmin = req.user && (req.user.role === 'platformAdmin' || req.user.role === 'schoolAdmin');
      
      // For regular users, use searchSchools with approvalStatus filter
      if (!isAdmin) {
        const schools = await storage.searchSchools({
          location,
          approvalStatus: "approved"
        });
        return res.json(schools);
      }
      
      // For admins, show all schools by location
      const schools = await storage.getSchoolsByLocation(location);
      res.json(schools);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch schools by location" });
    }
  });
  
  // Get schools by category
  app.get("/api/schools/category/:category", async (req: Request, res: Response) => {
    try {
      const category = req.params.category;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
      
      console.log(`Getting schools by category: ${category}, limit: ${limit}, offset: ${offset}`);
      
      // Get approved schools first
      const allSchools = await storage.searchSchools({
        approvalStatus: "approved"
      });
      
      // Filter schools based on category (case-insensitive substring match)
      // This is a simplified implementation; in a production app, this would use proper database queries with joins
      const matchingSchools = allSchools.filter(school => {
        // Match schools where type or curriculumType contains the category name
        return (
          (school.type && school.type.toLowerCase().includes(category.toLowerCase())) ||
          (school.curriculumType && school.curriculumType.toLowerCase().includes(category.toLowerCase()))
        );
      });
      
      // Apply pagination
      const paginatedSchools = matchingSchools.slice(offset, offset + limit);
      const totalCount = matchingSchools.length;
      
      console.log(`Found ${totalCount} schools matching category '${category}', returning ${paginatedSchools.length}`);
      
      res.json({
        schools: paginatedSchools,
        meta: {
          total: totalCount,
          limit,
          offset
        }
      });
    } catch (error) {
      console.error("Failed to fetch schools by category:", error);
      res.status(500).json({ error: "Failed to fetch schools by category" });
    }
  });
  
  // Admin routes to create new schools
  app.post("/api/admin/schools", requireAuth, async (req: Request, res: Response) => {
    try {
      // Get user to check role
      const user = await storage.getUser(req.session.userId!);
      
      if (!user || user.role !== "platformAdmin") {
        return res.status(403).json({ error: "Insufficient permissions" });
      }
      
      const schoolDataRaw = insertSchoolSchema.parse(req.body);
      
      // Always set admin_id to current user's ID if not explicitly provided
      const schoolData = {
        ...schoolDataRaw,
        admin_id: schoolDataRaw.admin_id || user.id
      };
      
      console.log("Creating school with admin_id:", schoolData.admin_id);
      const school = await storage.createSchool(schoolData);
      
      res.status(201).json(school);
    } catch (error) {
      if (error instanceof ZodError) {
        return handleZodError(error, res);
      }
      res.status(500).json({ error: "Failed to create school" });
    }
  });
  
  // Route for school admin to create their school
  app.post("/api/schools/register", requireAuth, async (req: Request, res: Response) => {
    try {
      console.log("School registration request received from session:", {
        userId: req.session.userId,
        userRole: req.session.userRole
      });
      
      // Get user to check role
      const user = await storage.getUser(req.session.userId!);
      
      console.log("School registration attempt by user:", {
        userId: user?.id,
        username: user?.username,
        role: user?.role,
        email: user?.email,
        hasSchoolId: !!user?.schoolId
      });
      
      if (!user) {
        console.log("Authentication failed - user not found with ID:", req.session.userId);
        return res.status(403).json({ error: "Authentication required" });
      }
      
      if (user.role !== "schoolAdmin") {
        console.log(`Access denied: User role is ${user.role}, not schoolAdmin`);
        return res.status(403).json({ error: "Only school administrators can register schools" });
      }
      
      // Check if user already has a school
      if (user.schoolId) {
        console.log(`User ${user.id} already has a school: ${user.schoolId}`);
        return res.status(400).json({ error: "User already has a registered school" });
      }
      
      // Parse and validate the school data
      let parsedSchoolData;
      try {
        parsedSchoolData = insertSchoolSchema.parse(req.body);
        console.log("School data validation successful");
      } catch (parseError) {
        if (parseError instanceof ZodError) {
          console.log("School data validation failed:", parseError.errors);
          return handleZodError(parseError, res);
        }
        throw parseError;
      }
      
      // Add the admin ID to the school data
      const schoolData = {
        ...parsedSchoolData,
        admin_id: user.id,
        approvalStatus: "pending", // New schools need approval
        verificationStatus: false
      };
      
      console.log("Creating school with data:", {
        name: schoolData.name,
        location: schoolData.location,
        adminId: schoolData.admin_id
      });
      
      // Create the school
      const school = await storage.createSchool(schoolData);
      
      if (!school) {
        console.log("Failed to create school - storage.createSchool returned null or undefined");
        return res.status(500).json({ error: "Failed to create school - database error" });
      }
      
      console.log(`School created successfully with ID: ${school.id}`);
      
      // Update the user with the school ID - THIS IS CRITICAL for proper association
      console.log(`Updating user ${user.id} with schoolId: ${school.id}`);
      try {
        const updatedUser = await storage.updateUser(user.id, { schoolId: school.id });
        console.log("User updated successfully with schoolId:", {
          userId: updatedUser.id,
          schoolId: updatedUser.schoolId
        });
      } catch (updateError) {
        console.error("Failed to update user with schoolId:", updateError);
        // Continue despite this error, but log it clearly
      }
      
      // Create activity log for school creation
      try {
        await storage.createActivityLog({
          userId: user.id,
          action: "create_school",
          entityType: "school",
          entityId: school.id,
          metadata: { schoolName: school.name }
        });
        console.log("Activity log created for school creation");
      } catch (logError) {
        console.error("Failed to create activity log:", logError);
        // Continue despite this error
      }
      
      res.status(201).json(school);
    } catch (error) {
      console.error("Failed to register school:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ 
        error: "Failed to register school", 
        details: errorMessage
      });
    }
  });
  
  // Saved schools routes
  app.get("/api/user/saved-schools", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      const savedSchools = await storage.getSavedSchools(userId);
      res.json(savedSchools);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch saved schools" });
    }
  });
  
  app.post("/api/user/saved-schools", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      const { schoolId } = req.body;
      
      if (!schoolId) {
        return res.status(400).json({ error: "School ID is required" });
      }
      
      // Check if school exists
      const school = await storage.getSchool(schoolId);
      
      if (!school) {
        return res.status(404).json({ error: "School not found" });
      }
      
      const savedSchoolData = insertSavedSchoolSchema.parse({ userId, schoolId });
      const savedSchool = await storage.saveSchool(savedSchoolData);
      
      res.status(201).json(savedSchool);
    } catch (error) {
      if (error instanceof ZodError) {
        return handleZodError(error, res);
      }
      res.status(500).json({ error: "Failed to save school" });
    }
  });
  
  app.delete("/api/user/saved-schools/:schoolId", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      const schoolId = parseInt(req.params.schoolId);
      
      if (isNaN(schoolId)) {
        return res.status(400).json({ error: "Invalid school ID" });
      }
      
      const success = await storage.removeSavedSchool(userId, schoolId);
      
      if (!success) {
        return res.status(404).json({ error: "Saved school not found" });
      }
      
      res.json({ message: "School removed from saved list" });
    } catch (error) {
      res.status(500).json({ error: "Failed to remove saved school" });
    }
  });
  
  // Comparison routes
  app.get("/api/user/comparisons", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      const comparisons = await storage.getComparisons(userId);
      res.json(comparisons);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch comparisons" });
    }
  });
  
  app.post("/api/user/comparisons", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      const { schoolIds } = req.body;
      
      if (!schoolIds || !Array.isArray(schoolIds) || schoolIds.length < 2) {
        return res.status(400).json({ 
          error: "At least two school IDs are required for comparison" 
        });
      }
      
      // Verify all schools exist
      for (const id of schoolIds) {
        const school = await storage.getSchool(id);
        if (!school) {
          return res.status(404).json({ error: `School with ID ${id} not found` });
        }
      }
      
      const comparisonData = insertComparisonSchema.parse({ userId, schoolIds });
      const comparison = await storage.createComparison(comparisonData);
      
      res.status(201).json(comparison);
    } catch (error) {
      if (error instanceof ZodError) {
        return handleZodError(error, res);
      }
      res.status(500).json({ error: "Failed to create comparison" });
    }
  });
  
  app.delete("/api/user/comparisons/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid comparison ID" });
      }
      
      const success = await storage.deleteComparison(id);
      
      if (!success) {
        return res.status(404).json({ error: "Comparison not found" });
      }
      
      res.json({ message: "Comparison deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete comparison" });
    }
  });
  
  // Review routes
  app.get("/api/schools/:schoolId/reviews", async (req: Request, res: Response) => {
    try {
      const schoolId = parseInt(req.params.schoolId);
      
      if (isNaN(schoolId)) {
        return res.status(400).json({ error: "Invalid school ID" });
      }
      
      const reviews = await storage.getReviews(schoolId);
      res.json(reviews);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch reviews" });
    }
  });
  
  app.post("/api/schools/:schoolId/reviews", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      const schoolId = parseInt(req.params.schoolId);
      
      if (isNaN(schoolId)) {
        return res.status(400).json({ error: "Invalid school ID" });
      }
      
      // Check if school exists
      const school = await storage.getSchool(schoolId);
      
      if (!school) {
        return res.status(404).json({ error: "School not found" });
      }
      
      const { rating, comment } = req.body;
      
      if (rating === undefined) {
        return res.status(400).json({ error: "Rating is required" });
      }
      
      const reviewData = insertReviewSchema.parse({ 
        userId, 
        schoolId, 
        rating, 
        comment 
      });
      
      const review = await storage.createReview(reviewData);
      res.status(201).json(review);
    } catch (error) {
      if (error instanceof ZodError) {
        return handleZodError(error, res);
      }
      res.status(500).json({ error: "Failed to create review" });
    }
  });

  // School Admin routes
  app.get("/api/admin/schools", requireSchoolAdmin, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      console.log("Getting schools for admin user:", userId);
      const schools = await storage.getSchoolsByAdminId(userId);
      
      console.log("Successfully retrieved schools for admin:", schools.length);
      res.json(schools);
    } catch (error) {
      console.error("Failed to fetch admin schools:", error);
      res.status(500).json({ 
        error: "Failed to fetch schools", 
        details: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  // School Admin Dashboard metrics route
  app.get("/api/admin/schools/:schoolId/metrics", requireSchoolAdmin, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      const schoolId = parseInt(req.params.schoolId);
      
      // Verify the school belongs to this admin
      if (!(await checkSchoolAccess(userId, schoolId))) {
        return res.status(403).json({ error: "You don't have access to this school" });
      }

      // Get school metrics
      const school = await storage.getSchool(schoolId);
      if (!school) {
        return res.status(404).json({ error: "School not found" });
      }

      // Get all inquiries for this school
      const inquiries = await storage.getInquiries(schoolId);
      
      // Get all faculty for this school
      const faculty = await storage.getFaculties(schoolId);
      
      // Get all campuses for this school
      const campuses = await storage.getCampuses(schoolId);
      
      // Get all posts for this school
      const posts = await storage.getSchoolPosts(schoolId, 100);
      
      // Get all reviews for this school
      const reviews = await storage.getReviews(schoolId);
      
      // Calculate statistics
      const stats = {
        totalInquiries: inquiries.length,
        newInquiries: inquiries.filter(i => i.status === 'new' || i.status === 'pending').length,
        totalStudents: campuses.reduce((total, campus) => total + (campus.studentCount || 0), 0),
        totalFaculty: faculty.length,
        totalPosts: posts.length,
        campuses: campuses.length,
        totalReviews: reviews.length,
        averageRating: reviews.length > 0 
          ? parseFloat((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)) 
          : 0,
      };

      // Get monthly inquiry data (last 4 months)
      const now = new Date();
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const monthlyInquiriesData = [];
      
      for (let i = 3; i >= 0; i--) {
        const month = new Date(now);
        month.setMonth(now.getMonth() - i);
        const monthName = monthNames[month.getMonth()];
        
        // Count inquiries for this month
        const inquiriesForMonth = inquiries.filter(inquiry => {
          const inquiryDate = new Date(inquiry.createdAt);
          return inquiryDate.getMonth() === month.getMonth() && 
                 inquiryDate.getFullYear() === month.getFullYear();
        });
        
        monthlyInquiriesData.push({
          month: monthName,
          inquiries: inquiriesForMonth.length
        });
      }

      // Get inquiry status distribution
      const inquiryPieData = [
        { name: 'New', value: inquiries.filter(i => i.status === 'new' || i.status === 'pending').length, color: '#8884d8' },
        { name: 'In Progress', value: inquiries.filter(i => i.status === 'inProgress').length, color: '#82ca9d' },
        { name: 'Completed', value: inquiries.filter(i => i.status === 'completed').length, color: '#ffc658' },
      ];

      // Compile the metrics data
      const metricsData = {
        stats,
        monthlyInquiries: monthlyInquiriesData,
        inquiryStatus: inquiryPieData,
        recentPosts: posts.slice(0, 2).map(post => ({
          id: post.id,
          title: post.title,
          createdAt: post.createdAt,
          type: post.type
        }))
      };
      
      res.json(metricsData);
    } catch (error) {
      console.error("Failed to fetch school metrics:", error);
      res.status(500).json({ 
        error: "Failed to fetch school metrics", 
        details: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  // Get a specific school's details (for admin)
  app.get("/api/admin/schools/:schoolId", requireSchoolAdmin, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      const schoolId = parseInt(req.params.schoolId);
      
      if (isNaN(schoolId)) {
        return res.status(400).json({ error: "Invalid school ID" });
      }
      
      // Check if the user has access to this school
      const hasAccess = await checkSchoolAccess(userId, schoolId);
      if (!hasAccess) {
        return res.status(403).json({ error: "You don't have access to this school" });
      }
      
      // Get the school details
      const school = await storage.getSchool(schoolId);
      
      if (!school) {
        return res.status(404).json({ error: "School not found" });
      }
      
      res.json(school);
    } catch (error) {
      console.error('Error getting school details:', error);
      res.status(500).json({ error: "Failed to fetch school details" });
    }
  });
  
  // Get list of schools for the current admin
  app.get("/api/admin/schools", requireSchoolAdmin, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      console.log(`[DB] Getting schools for admin ID: ${userId}`);
      
      // Get list of schools the admin has access to
      const schools = await storage.getSchoolsByAdminId(userId);
      
      console.log(`[DB] Found ${schools.length} schools for admin with ID ${userId}`);
      
      res.json(schools);
    } catch (error) {
      console.error('Error getting admin schools:', error);
      res.status(500).json({ error: "Failed to fetch schools for admin" });
    }
  });
  
  // School Admin Dashboard routes
  app.get("/api/admin/dashboard/:schoolId", requireSchoolAdmin, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      const schoolId = parseInt(req.params.schoolId);
      
      if (isNaN(schoolId)) {
        return res.status(400).json({ error: "Invalid school ID" });
      }
      
      // Check if the user has access to this school
      const hasAccess = await checkSchoolAccess(userId, schoolId);
      if (!hasAccess) {
        return res.status(403).json({ error: "You don't have access to this school" });
      }
      
      // Get the school details
      const school = await storage.getSchool(schoolId);
      
      if (!school) {
        return res.status(404).json({ error: "School not found" });
      }
      
      // Get all the data needed for the dashboard
      const [
        campuses,
        faculty,
        inquiries,
        reviews,
        posts
      ] = await Promise.all([
        storage.getCampuses(schoolId),
        storage.getFaculties(schoolId),
        storage.getInquiries(schoolId),
        storage.getReviews(schoolId),
        storage.getSchoolPosts(schoolId)
      ]);
      
      // Calculate statistics
      const totalInquiries = inquiries.length;
      const newInquiriesCount = inquiries.filter(inquiry => 
        inquiry.status === 'new' || inquiry.status === null
      ).length;
      const totalFaculty = faculty.length;
      const activeFacultyCount = faculty.filter(f => 
        f.isActive === true || f.isActive === null
      ).length;
      const totalCampuses = campuses.length;
      const totalReviews = reviews.length;
      const averageRating = totalReviews > 0 
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews 
        : 0;
      const totalPosts = posts.length;
      const publishedPostsCount = posts.filter(post => 
        post.isPublished === true || post.isPublished === null
      ).length;
      
      // Create trend data by grouping by month (for last 6 months)
      const now = new Date();
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(now.getMonth() - 6);
      
      // Filter data for last 6 months
      const recentInquiriesData = inquiries.filter(i => new Date(i.createdAt) >= sixMonthsAgo);
      const recentReviewsData = reviews.filter(r => new Date(r.createdAt) >= sixMonthsAgo);
      
      // Group by month
      const inquiriesByMonth = groupByMonthFromDate(recentInquiriesData, now);
      const reviewsByMonth = groupByMonthFromDate(recentReviewsData, now);
      
      // Generate monthly labels for the last 6 months
      const monthLabels = Array.from({ length: 6 }, (_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        return `${d.toLocaleString('default', { month: 'short' })} ${d.getFullYear()}`;
      }).reverse();
      

      
      // Return the dashboard data
      res.json({
        school,
        stats: {
          totalCampuses,
          totalFaculty,
          activeFacultyCount,
          totalInquiries,
          newInquiriesCount,
          totalReviews,
          averageRating,
          totalPosts,
          publishedPostsCount
        },
        trends: {
          inquiries: {
            labels: monthLabels,
            data: inquiriesByMonth
          },
          reviews: {
            labels: monthLabels,
            data: reviewsByMonth
          }
        },
        recentInquiries: inquiries.slice(0, 5),
        recentReviews: reviews.slice(0, 5),
        recentPosts: posts.slice(0, 5)
      });
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      res.status(500).json({ 
        error: "Failed to fetch dashboard data", 
        details: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  // School Admin Dashboard Update endpoint
  app.post("/api/admin/dashboard/:schoolId", requireSchoolAdmin, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      const schoolId = parseInt(req.params.schoolId);
      
      if (isNaN(schoolId)) {
        return res.status(400).json({ error: "Invalid school ID" });
      }

      // Check if the user has access to this school
      const hasAccess = await checkSchoolAccess(userId, schoolId);
      if (!hasAccess) {
        return res.status(403).json({ error: "You don't have permission to update this school's dashboard" });
      }
      
      // Validate the dashboard updates
      const { name, description, type, location, curriculumType, gradeRange, classSize, website, imageUrl } = req.body;
      
      // Update the school with the provided data
      const updatedSchool = await storage.updateSchool(schoolId, {
        name,
        description,
        type,
        location,
        curriculumType,
        gradeRange,
        classSize,
        website,
        imageUrl
      });
      
      res.json(updatedSchool);
    } catch (error) {
      console.error("Failed to update dashboard data:", error);
      res.status(500).json({ 
        error: "Failed to update dashboard data", 
        details: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  // School Admin Faculty routes
  app.get("/api/admin/schools/:schoolId/faculty", requireSchoolAdmin, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      const schoolId = parseInt(req.params.schoolId);
      
      if (isNaN(schoolId)) {
        return res.status(400).json({ error: "Invalid school ID" });
      }

      // Check if the user has access to this school
      const hasAccess = await checkSchoolAccess(userId, schoolId);
      if (!hasAccess) {
        return res.status(403).json({ error: "You don't have permission to access this school's faculty" });
      }
      
      const faculty = await storage.getFaculties(schoolId);
      res.json(faculty);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch faculty members" });
    }
  });
  
  app.post("/api/admin/schools/:schoolId/faculty", requireSchoolAdmin, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      const schoolId = parseInt(req.params.schoolId);
      
      if (isNaN(schoolId)) {
        return res.status(400).json({ error: "Invalid school ID" });
      }

      // Check if the user has access to this school
      const hasAccess = await checkSchoolAccess(userId, schoolId);
      if (!hasAccess) {
        return res.status(403).json({ error: "You don't have permission to add faculty to this school" });
      }
      
      const facultyData = { ...req.body, schoolId };
      const insertFacultySchema = createInsertSchema(faculty);
      const validatedData = insertFacultySchema.parse(facultyData);
      
      const newFaculty = await storage.createFaculty(validatedData);
      res.status(201).json(newFaculty);
    } catch (error) {
      if (error instanceof ZodError) {
        return handleZodError(error, res);
      }
      res.status(500).json({ error: "Failed to create faculty member" });
    }
  });
  
  app.put("/api/admin/faculty/:id", requireSchoolAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.session.userId!;
      
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid faculty ID" });
      }
      
      // Get the faculty member
      const facultyMember = await storage.getFaculty(id);
      
      if (!facultyMember) {
        return res.status(404).json({ error: "Faculty member not found" });
      }
      
      // Verify the user has access to this school using the checkSchoolAccess function
      const hasAccess = await checkSchoolAccess(userId, facultyMember.schoolId);
      
      if (!hasAccess) {
        return res.status(403).json({ error: "You don't have permission to update this faculty member" });
      }
      
      // Prevent changing the schoolId through update API
      const updateData = { ...req.body };
      delete updateData.schoolId;
      
      // Update faculty member
      const updatedFaculty = await storage.updateFaculty(id, updateData);
      
      if (!updatedFaculty) {
        return res.status(500).json({ error: "Failed to update faculty member" });
      }
      
      // Log the update action
      await storage.createActivityLog({
        userId,
        action: 'update_faculty',
        entityType: 'faculty',
        entityId: id,
        metadata: { schoolId: facultyMember.schoolId }
      }).catch(err => console.error('Failed to log faculty update:', err));
      
      res.json(updatedFaculty);
    } catch (error) {
      console.error('Error updating faculty member:', error);
      res.status(500).json({ error: "Failed to update faculty member" });
    }
  });
  
  // Campus management routes
  app.get("/api/admin/schools/:schoolId/campuses", requireSchoolAdmin, async (req: Request, res: Response) => {
    try {
      const schoolId = parseInt(req.params.schoolId);
      
      if (isNaN(schoolId)) {
        return res.status(400).json({ error: "Invalid school ID" });
      }

      // Verify the school belongs to this admin
      const user = await storage.getUser(req.session.userId!);
      const schools = await storage.getSchoolsByAdminId(user!.id);
      const hasAccess = schools.some(school => school.id === schoolId);
      
      if (!hasAccess) {
        return res.status(403).json({ error: "You don't have permission to access this school's campuses" });
      }
      
      const campuses = await storage.getCampuses(schoolId);
      res.json(campuses);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch campuses" });
    }
  });
  
  app.get("/api/admin/campuses/:id", requireSchoolAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid campus ID" });
      }
      
      // Get the campus
      const campus = await storage.getCampus(id);
      
      if (!campus) {
        return res.status(404).json({ error: "Campus not found" });
      }
      
      // Verify the school belongs to this admin
      const user = await storage.getUser(req.session.userId!);
      const schools = await storage.getSchoolsByAdminId(user!.id);
      const hasAccess = schools.some(school => school.id === campus.schoolId);
      
      if (!hasAccess) {
        return res.status(403).json({ error: "You don't have permission to access this campus" });
      }
      
      res.json(campus);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch campus" });
    }
  });
  
  app.post("/api/admin/schools/:schoolId/campuses", requireSchoolAdmin, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      const schoolId = parseInt(req.params.schoolId);
      
      if (isNaN(schoolId)) {
        return res.status(400).json({ error: "Invalid school ID" });
      }

      // Check if the user has access to this school
      const hasAccess = await checkSchoolAccess(userId, schoolId);
      if (!hasAccess) {
        return res.status(403).json({ error: "You don't have permission to add campuses to this school" });
      }
      
      // Make sure facilities is an array if provided
      let campusData = { ...req.body, schoolId };
      
      // Convert or ensure facilities is properly formatted as an array
      if (campusData.facilities) {
        if (typeof campusData.facilities === 'string') {
          try {
            // If it's a JSON string, parse it
            const parsedFacilities = JSON.parse(campusData.facilities);
            // Make sure the parsed result is an array
            campusData.facilities = Array.isArray(parsedFacilities) ? parsedFacilities : [campusData.facilities];
          } catch (e) {
            // If parsing fails, treat it as a single item array
            console.warn("Facilities parse failed, treating as single string:", e);
            campusData.facilities = [campusData.facilities];
          }
        } else if (!Array.isArray(campusData.facilities)) {
          // If it's not a string and not an array, make it an array with one item
          campusData.facilities = [String(campusData.facilities)];
        }
      } else {
        // Ensure facilities is either a valid array or null, not undefined
        campusData.facilities = null;
      }
      
      const validatedData = insertCampusSchema.parse(campusData);
      console.log("Sending campus data to storage:", validatedData);
      
      const newCampus = await storage.createCampus(validatedData);
      res.status(201).json(newCampus);
    } catch (error) {
      console.error("Error creating campus:", error);
      if (error instanceof ZodError) {
        return handleZodError(error, res);
      }
      res.status(500).json({ 
        error: "Failed to create campus", 
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  app.put("/api/admin/campuses/:id", requireSchoolAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.session.userId!;
      
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid campus ID" });
      }
      
      // Get the campus
      const campus = await storage.getCampus(id);
      
      if (!campus) {
        return res.status(404).json({ error: "Campus not found" });
      }
      
      // Verify the user has access to this school
      const hasAccess = await checkSchoolAccess(userId, campus.schoolId);
      if (!hasAccess) {
        return res.status(403).json({ error: "You don't have permission to update this campus" });
      }
      
      // Make sure facilities is properly formatted
      let campusData = { ...req.body };
      
      // Convert or ensure facilities is properly formatted as an array
      if (campusData.facilities) {
        if (typeof campusData.facilities === 'string') {
          try {
            // If it's a JSON string, parse it
            const parsedFacilities = JSON.parse(campusData.facilities);
            // Make sure the parsed result is an array
            campusData.facilities = Array.isArray(parsedFacilities) ? parsedFacilities : [campusData.facilities];
          } catch (e) {
            // If parsing fails, treat it as a single item array
            console.warn("Facilities parse failed, treating as single string:", e);
            campusData.facilities = [campusData.facilities];
          }
        } else if (!Array.isArray(campusData.facilities)) {
          // If it's not a string and not an array, make it an array with one item
          campusData.facilities = [String(campusData.facilities)];
        }
      } else {
        // Ensure facilities is either a valid array or null, not undefined
        campusData.facilities = null;
      }
      
      console.log("Updating campus with data:", campusData);
      const updatedCampus = await storage.updateCampus(id, campusData);
      res.json(updatedCampus);
    } catch (error) {
      console.error("Error updating campus:", error);
      if (error instanceof ZodError) {
        return handleZodError(error, res);
      }
      res.status(500).json({ 
        error: "Failed to update campus",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  app.delete("/api/admin/campuses/:id", requireSchoolAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.session.userId!;
      
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid campus ID" });
      }
      
      // Get the campus
      const campus = await storage.getCampus(id);
      
      if (!campus) {
        return res.status(404).json({ error: "Campus not found" });
      }
      
      // Verify the user has access to this school using the checkSchoolAccess function
      const hasAccess = await checkSchoolAccess(userId, campus.schoolId);
      
      if (!hasAccess) {
        return res.status(403).json({ error: "You don't have permission to delete this campus" });
      }
      
      const success = await storage.deleteCampus(id);
      
      if (!success) {
        return res.status(404).json({ error: "Campus not found" });
      }
      
      res.json({ message: "Campus deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete campus" });
    }
  });

  // School requests endpoint for new school submissions
  app.post("/api/admin/school-requests", requireSchoolAdmin, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      
      // Prepare the change request data
      const requestData = {
        requestedById: userId,
        requestType: 'create',
        status: 'pending',
        requestData: req.body,
        schoolId: null, // New school, so no ID yet
        notes: null
      };
      
      // Create the school change request
      const request = await storage.createSchoolChangeRequest(requestData);
      
      // Log the activity
      await storage.createActivityLog({
        userId,
        action: 'create',
        entityType: 'school_request',
        entityId: request.id,
        metadata: { schoolName: req.body.name }
      });
      
      res.status(200).json({ 
        message: "School registration submitted for approval", 
        requestId: request.id 
      });
    } catch (error) {
      console.error("Error creating school request:", error);
      res.status(500).json({ 
        error: "Failed to submit school registration",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
// Campus change request routes
  app.post("/api/admin/schools/:schoolId/campus-change-requests", requireSchoolAdmin, async (req: Request, res: Response) => {
    try {
      const schoolId = parseInt(req.params.schoolId);
      const userId = req.session.userId!;
      
      if (isNaN(schoolId)) {
        return res.status(400).json({ error: "Invalid school ID" });
      }
      
      // Check if the user has access to this school
      const hasAccess = await checkSchoolAccess(userId, schoolId);
      if (!hasAccess) {
        return res.status(403).json({ error: "You don't have permission to create change requests for this school" });
      }
      
      // Process the request data
      const requestData = {
        ...req.body,
        schoolId,
        requestedById: userId,
        status: 'pending'
      };
      
      // Handle facilities if this is a create or update request with facilities data
      if ((requestData.requestType === 'create' || requestData.requestType === 'update') && 
          requestData.requestData && 
          requestData.requestData.facilities) {
        
        let facilitiesData = requestData.requestData.facilities;
        
        if (typeof facilitiesData === 'string') {
          try {
            // If it's a JSON string, parse it
            const parsedFacilities = JSON.parse(facilitiesData);
            // Make sure the parsed result is an array
            requestData.requestData.facilities = Array.isArray(parsedFacilities) ? parsedFacilities : [facilitiesData];
          } catch (e) {
            // If parsing fails, treat it as a single item array
            console.warn("Facilities parse failed, treating as single string:", e);
            requestData.requestData.facilities = [facilitiesData];
          }
        } else if (!Array.isArray(facilitiesData)) {
          // If it's not a string and not an array, make it an array with one item
          requestData.requestData.facilities = [String(facilitiesData)];
        }
      }
      
      // Create the change request
      const newRequest = await storage.createCampusChangeRequest(requestData);
      
      // Create activity log
      await storage.createActivityLog({
        userId,
        action: 'create',
        entityType: 'campus_change_request',
        entityId: newRequest.id,
        metadata: { 
          schoolId,
          requestType: requestData.requestType,
          campusId: requestData.campusId || null
        }
      });
      
      res.status(201).json(newRequest);
    } catch (error) {
      console.error("Error creating campus change request:", error);
      if (error instanceof ZodError) {
        return handleZodError(error, res);
      }
      res.status(500).json({ error: "Failed to create campus change request" });
    }
  });
  
  app.get("/api/admin/schools/:schoolId/campus-change-requests", requireSchoolAdmin, async (req: Request, res: Response) => {
    try {
      const schoolId = parseInt(req.params.schoolId);
      const status = req.query.status as string | undefined;
      
      if (isNaN(schoolId)) {
        return res.status(400).json({ error: "Invalid school ID" });
      }
      
      // Check if the user has access to this school
      const user = await storage.getUser(req.session.userId!);
      const schools = await storage.getSchoolsByAdminId(user!.id);
      const hasAccess = schools.some(school => school.id === schoolId);
      
      if (!hasAccess) {
        return res.status(403).json({ error: "You don't have permission to view change requests for this school" });
      }
      
      const requests = await storage.getCampusChangeRequests(schoolId, status);
      res.json(requests);
    } catch (error) {
      console.error("Error fetching campus change requests:", error);
      res.status(500).json({ error: "Failed to fetch campus change requests" });
    }
  });
  
  app.get("/api/admin/campus-change-requests/:id", requireSchoolAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid request ID" });
      }
      
      const request = await storage.getCampusChangeRequest(id);
      
      if (!request) {
        return res.status(404).json({ error: "Campus change request not found" });
      }
      
      // Verify the school belongs to this admin
      const user = await storage.getUser(req.session.userId!);
      const schools = await storage.getSchoolsByAdminId(user!.id);
      const hasAccess = schools.some(school => school.id === request.schoolId);
      
      if (!hasAccess) {
        return res.status(403).json({ error: "You don't have permission to view this change request" });
      }
      
      res.json(request);
    } catch (error) {
      console.error("Error fetching campus change request:", error);
      res.status(500).json({ error: "Failed to fetch campus change request" });
    }
  });
  
  // Platform admin routes for handling campus change requests
  app.get("/api/platform-admin/campus-change-requests", requireAdminRole, async (req: Request, res: Response) => {
    try {
      const status = req.query.status as string | undefined;
      const schoolId = req.query.schoolId ? parseInt(req.query.schoolId as string) : undefined;
      
      if (schoolId !== undefined && isNaN(schoolId)) {
        return res.status(400).json({ error: "Invalid school ID" });
      }
      
      const requests = await storage.getCampusChangeRequests(schoolId, status);
      res.json(requests);
    } catch (error) {
      console.error("Error fetching campus change requests:", error);
      res.status(500).json({ error: "Failed to fetch campus change requests" });
    }
  });
  
  app.patch("/api/platform-admin/campus-change-requests/:id/status", requireAdminRole, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { status, notes } = req.body;
      const userId = req.session.userId!;
      
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid request ID" });
      }
      
      if (!status || !['approved', 'rejected', 'pending'].includes(status)) {
        return res.status(400).json({ error: "Invalid status. Must be 'approved', 'rejected', or 'pending'" });
      }
      
      // Get the current request before updating
      const originalRequest = await storage.getCampusChangeRequest(id);
      if (!originalRequest) {
        return res.status(404).json({ error: "Campus change request not found" });
      }
      
      // Update the request status
      const updatedRequest = await storage.updateCampusChangeRequestStatus(id, status, notes, userId);
      
      // Create activity log
      await storage.createActivityLog({
        userId,
        action: 'update',
        entityType: 'campus_change_request',
        entityId: id,
        metadata: { 
          schoolId: updatedRequest.schoolId,
          previousStatus: originalRequest.status,
          newStatus: status,
          notes: notes || null
        }
      });
      
      res.json(updatedRequest);
    } catch (error) {
      console.error("Error updating campus change request status:", error);
      res.status(500).json({ error: "Failed to update campus change request status" });
    }
  });
  
  app.get("/api/platform-admin/campus-change-requests/:id", requireAdminRole, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid request ID" });
      }
      
      const request = await storage.getCampusChangeRequest(id);
      
      if (!request) {
        return res.status(404).json({ error: "Campus change request not found" });
      }
      
      res.json(request);
    } catch (error) {
      console.error("Error fetching campus change request:", error);
      res.status(500).json({ error: "Failed to fetch campus change request" });
    }
  });
  
  app.get("/api/admin/campuses/:campusId/faculty", requireSchoolAdmin, async (req: Request, res: Response) => {
    try {
      const campusId = parseInt(req.params.campusId);
      
      if (isNaN(campusId)) {
        return res.status(400).json({ error: "Invalid campus ID" });
      }
      
      // Get the campus
      const campus = await storage.getCampus(campusId);
      
      if (!campus) {
        return res.status(404).json({ error: "Campus not found" });
      }
      
      // Verify the school belongs to this admin
      const user = await storage.getUser(req.session.userId!);
      const schools = await storage.getSchoolsByAdminId(user!.id);
      const hasAccess = schools.some(school => school.id === campus.schoolId);
      
      if (!hasAccess) {
        return res.status(403).json({ error: "You don't have permission to access this campus" });
      }
      
      const faculty = await storage.getFacultiesByCampus(campusId);
      res.json(faculty);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch faculty members for this campus" });
    }
  });

  // Faculty management routes
  app.put("/api/admin/faculty/:id", requireSchoolAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.session.userId!;
      
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid faculty ID" });
      }
      
      // Get the faculty member
      const facultyMember = await storage.getFaculty(id);
      
      if (!facultyMember) {
        return res.status(404).json({ error: "Faculty member not found" });
      }
      
      // Verify the user has access to this school using the checkSchoolAccess function
      const hasAccess = await checkSchoolAccess(userId, facultyMember.schoolId);
      
      if (!hasAccess) {
        return res.status(403).json({ error: "You don't have permission to update this faculty member" });
      }
      
      // Prevent changing the schoolId through update API
      const updateData = { ...req.body };
      delete updateData.schoolId;
      
      // Update faculty member
      const updatedFaculty = await storage.updateFaculty(id, updateData);
      
      if (!updatedFaculty) {
        return res.status(500).json({ error: "Failed to update faculty member" });
      }
      
      // Log the update action
      await storage.createActivityLog({
        userId,
        action: 'update_faculty',
        entityType: 'faculty',
        entityId: id,
        metadata: { schoolId: facultyMember.schoolId }
      }).catch(err => console.error('Failed to log faculty update:', err));
      
      res.json(updatedFaculty);
    } catch (error) {
      console.error('Error updating faculty member:', error);
      res.status(500).json({ error: "Failed to update faculty member" });
    }
  });

  app.delete("/api/admin/faculty/:id", requireSchoolAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.session.userId!;
      
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid faculty ID" });
      }
      
      // Get the faculty member
      const facultyMember = await storage.getFaculty(id);
      
      if (!facultyMember) {
        return res.status(404).json({ error: "Faculty member not found" });
      }
      
      // Verify the user has access to this school using the checkSchoolAccess function
      const hasAccess = await checkSchoolAccess(userId, facultyMember.schoolId);
      
      if (!hasAccess) {
        return res.status(403).json({ error: "You don't have permission to delete this faculty member" });
      }
      
      const success = await storage.deleteFaculty(id);
      
      if (!success) {
        return res.status(404).json({ error: "Faculty member not found" });
      }
      
      // Log the delete action
      await storage.createActivityLog({
        userId,
        action: 'delete_faculty',
        entityType: 'faculty',
        entityId: id,
        metadata: { schoolId: facultyMember.schoolId }
      }).catch(err => console.error('Failed to log faculty deletion:', err));
      
      res.json({ message: "Faculty member deleted successfully" });
    } catch (error) {
      console.error('Error deleting faculty member:', error);
      res.status(500).json({ error: "Failed to delete faculty member" });
    }
  });
  
  // School Admin Posts routes
  app.get("/api/admin/schools/:schoolId/posts", requireSchoolAdmin, async (req: Request, res: Response) => {
    try {
      const schoolId = parseInt(req.params.schoolId);
      
      if (isNaN(schoolId)) {
        return res.status(400).json({ error: "Invalid school ID" });
      }

      // Verify the school belongs to this admin
      const user = await storage.getUser(req.session.userId!);
      const schools = await storage.getSchoolsByAdminId(user!.id);
      const hasAccess = schools.some(school => school.id === schoolId);
      
      if (!hasAccess) {
        return res.status(403).json({ error: "You don't have permission to access this school's posts" });
      }
      
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
      
      const posts = await storage.getSchoolPosts(schoolId, limit, offset);
      res.json(posts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch school posts" });
    }
  });
  
  app.post("/api/admin/schools/:schoolId/posts", requireSchoolAdmin, async (req: Request, res: Response) => {
    try {
      const schoolId = parseInt(req.params.schoolId);
      
      if (isNaN(schoolId)) {
        return res.status(400).json({ error: "Invalid school ID" });
      }

      // Verify the school belongs to this admin
      const user = await storage.getUser(req.session.userId!);
      const schools = await storage.getSchoolsByAdminId(user!.id);
      const hasAccess = schools.some(school => school.id === schoolId);
      
      if (!hasAccess) {
        return res.status(403).json({ error: "You don't have permission to create posts for this school" });
      }
      
      // Process the request body to handle the date format
      const requestData = { ...req.body };
      
      // Convert eventDate from string to Date object if it exists
      if (requestData.eventDate) {
        try {
          requestData.eventDate = new Date(requestData.eventDate);
        } catch (err) {
          return res.status(400).json({ error: "Invalid event date format" });
        }
      }
      
      const postData = { ...requestData, schoolId, postedBy: user!.id };
      const validatedData = insertSchoolPostSchema.parse(postData);
      
      const newPost = await storage.createSchoolPost(validatedData);
      res.status(201).json(newPost);
    } catch (error) {
      if (error instanceof ZodError) {
        return handleZodError(error, res);
      }
      res.status(500).json({ error: "Failed to create school post" });
    }
  });
  
  app.put("/api/admin/posts/:id", requireSchoolAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid post ID" });
      }
      
      // Get the post
      const post = await storage.getSchoolPost(id);
      
      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }
      
      // Verify the school belongs to this admin
      const user = await storage.getUser(req.session.userId!);
      const schools = await storage.getSchoolsByAdminId(user!.id);
      const hasAccess = schools.some(school => school.id === post.schoolId);
      
      if (!hasAccess) {
        return res.status(403).json({ error: "You don't have permission to update this post" });
      }
      
      // Process the request body to handle the date format
      const requestData = { ...req.body };
      
      try {
        // Validate using the schema which handles date conversion automatically
        const validatedData = insertSchoolPostSchema.partial().parse(requestData);
        
        const updatedPost = await storage.updateSchoolPost(id, validatedData);
        res.json(updatedPost);
      } catch (e) {
        if (e instanceof ZodError) {
          return handleZodError(e, res);
        }
        throw e;
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to update post" });
    }
  });
  
  app.delete("/api/admin/posts/:id", requireSchoolAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid post ID" });
      }
      
      // Get the post
      const post = await storage.getSchoolPost(id);
      
      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }
      
      // Verify the school belongs to this admin
      const user = await storage.getUser(req.session.userId!);
      const schools = await storage.getSchoolsByAdminId(user!.id);
      const hasAccess = schools.some(school => school.id === post.schoolId);
      
      if (!hasAccess) {
        return res.status(403).json({ error: "You don't have permission to delete this post" });
      }
      
      const success = await storage.deleteSchoolPost(id);
      
      if (!success) {
        return res.status(404).json({ error: "Post not found" });
      }
      
      res.json({ message: "Post deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete post" });
    }
  });
  
  // School Admin Inquiries routes
  app.get("/api/admin/schools/:schoolId/inquiries", requireSchoolAdmin, async (req: Request, res: Response) => {
    try {
      const schoolId = parseInt(req.params.schoolId);
      
      if (isNaN(schoolId)) {
        return res.status(400).json({ error: "Invalid school ID" });
      }

      // Verify the school belongs to this admin
      const user = await storage.getUser(req.session.userId!);
      const schools = await storage.getSchoolsByAdminId(user!.id);
      const hasAccess = schools.some(school => school.id === schoolId);
      
      if (!hasAccess) {
        return res.status(403).json({ error: "You don't have permission to access this school's inquiries" });
      }
      
      const inquiries = await storage.getInquiries(schoolId);
      res.json(inquiries);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch inquiries" });
    }
  });
  
  app.put("/api/admin/inquiries/:id", requireSchoolAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid inquiry ID" });
      }
      
      // Get the inquiry
      const inquiry = await storage.getInquiry(id);
      
      if (!inquiry) {
        return res.status(404).json({ error: "Inquiry not found" });
      }
      
      // Verify the school belongs to this admin
      const user = await storage.getUser(req.session.userId!);
      const schools = await storage.getSchoolsByAdminId(user!.id);
      const hasAccess = schools.some(school => school.id === inquiry.schoolId);
      
      if (!hasAccess) {
        return res.status(403).json({ error: "You don't have permission to update this inquiry" });
      }
      
      // Only proceed with notification if response field is being updated
      const updatedInquiry = await storage.updateInquiry(id, req.body);
      
      // If this is a response update (new response or status change)
      if (req.body.response || (req.body.status && req.body.status !== inquiry.status)) {
        // Get the school name for the notification
        const school = await storage.getSchool(inquiry.schoolId);
        const schoolName = school ? school.name : 'A school';
        
        // Check if the inquiry has a userId
        if (inquiry.userId) {
          console.log(`Sending WebSocket notification to user ${inquiry.userId} for inquiry response`);
          
          // Send real-time notification via WebSocket
          app.locals.sendUserNotification(inquiry.userId, {
            type: 'inquiry_update',
            message: `${schoolName} has responded to your inquiry`,
            inquiryId: inquiry.id,
            schoolId: inquiry.schoolId,
            schoolName,
            subject: inquiry.subject,
            status: updatedInquiry.status
          });
        }
      }
      
      res.json(updatedInquiry);
    } catch (error) {
      res.status(500).json({ error: "Failed to update inquiry" });
    }
  });
  
  // User Inquiry submission endpoint
  app.post("/api/schools/:schoolId/inquiries", async (req: Request, res: Response) => {
    try {
      const schoolId = parseInt(req.params.schoolId);
      
      if (isNaN(schoolId)) {
        return res.status(400).json({ error: "Invalid school ID" });
      }
      
      // Check if school exists
      const school = await storage.getSchool(schoolId);
      
      if (!school) {
        return res.status(404).json({ error: "School not found" });
      }
      
      // Create the inquiry
      const inquiryData = { ...req.body, schoolId, status: "New" };
      const insertInquirySchema = createInsertSchema(inquiries);
      const validatedData = insertInquirySchema.parse(inquiryData);
      
      const newInquiry = await storage.createInquiry(validatedData);
      res.status(201).json(newInquiry);
    } catch (error) {
      if (error instanceof ZodError) {
        return handleZodError(error, res);
      }
      res.status(500).json({ error: "Failed to submit inquiry" });
    }
  });

  // Public school content access endpoint
  app.get("/api/schools/:schoolId/posts", async (req: Request, res: Response) => {
    try {
      const schoolId = parseInt(req.params.schoolId);
      
      if (isNaN(schoolId)) {
        return res.status(400).json({ error: "Invalid school ID" });
      }
      
      // Check if school exists
      const school = await storage.getSchool(schoolId);
      
      if (!school) {
        return res.status(404).json({ error: "School not found" });
      }
      
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
      
      // Get only published posts for public access
      const posts = await storage.getSchoolPosts(schoolId, limit, offset);
      const publishedPosts = posts.filter(post => post.isPublished);
      
      res.json(publishedPosts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch school posts" });
    }
  });
  
  // Public faculty listing endpoint
  app.get("/api/schools/:schoolId/faculty", async (req: Request, res: Response) => {
    try {
      const schoolId = parseInt(req.params.schoolId);
      
      if (isNaN(schoolId)) {
        return res.status(400).json({ error: "Invalid school ID" });
      }
      
      // Check if school exists
      const school = await storage.getSchool(schoolId);
      
      if (!school) {
        return res.status(404).json({ error: "School not found" });
      }
      
      // Get only active faculty for public access
      const faculty = await storage.getFaculties(schoolId);
      const activeFaculty = faculty.filter(member => member.isActive);
      
      res.json(activeFaculty);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch faculty members" });
    }
  });

  // Public campus listing endpoint
  app.get("/api/schools/:schoolId/campuses", async (req: Request, res: Response) => {
    try {
      const schoolId = parseInt(req.params.schoolId);
      
      if (isNaN(schoolId)) {
        return res.status(400).json({ error: "Invalid school ID" });
      }
      
      // Check if school exists
      const school = await storage.getSchool(schoolId);
      
      if (!school) {
        return res.status(404).json({ error: "School not found" });
      }
      
      // Get campus data
      const campuses = await storage.getCampuses(schoolId);
      
      res.json(campuses);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch campus data" });
    }
  });

  // FAQ and Testimonials endpoints
  // Redirect to the content management router which serves data from the database
  app.get("/api/faqs", async (req: Request, res: Response) => {
    res.redirect("/api/content/faqs");
  });
  
  // Public blog posts API endpoint
  app.get("/api/content/blog", async (req: Request, res: Response) => {
    try {
      // Get all published blog posts
      const blogPosts = await storage.getBlogPosts({ isPublished: true });
      
      // Fetch author information for each blog post
      const postsWithAuthors = await Promise.all(
        blogPosts.map(async (post) => {
          if (post.authorId) {
            const author = await storage.getUser(post.authorId);
            return {
              ...post,
              author: author ? {
                id: author.id,
                fullName: author.fullName,
                role: author.role,
                avatarUrl: author.avatarUrl
              } : null
            };
          }
          return { ...post, author: null };
        })
      );
      
      res.json(postsWithAuthors);
    } catch (error) {
      console.error("Failed to fetch blog posts:", error);
      res.status(500).json({ error: "Failed to fetch blog posts" });
    }
  });
  
  // Public single blog post API endpoint
  app.get("/api/content/blog/:slug", async (req: Request, res: Response) => {
    try {
      const slug = req.params.slug;
      const blogPost = await storage.getBlogPostBySlug(slug);
      
      // Check if blog post exists and is published
      if (!blogPost || !blogPost.isPublished) {
        return res.status(404).json({ error: "Blog post not found" });
      }
      
      // Fetch author information
      let authorInfo = null;
      if (blogPost.authorId) {
        const author = await storage.getUser(blogPost.authorId);
        if (author) {
          authorInfo = {
            id: author.id,
            fullName: author.fullName,
            role: author.role,
            avatarUrl: author.avatarUrl
          };
        }
      }
      
      res.json({
        ...blogPost,
        author: authorInfo
      });
    } catch (error) {
      console.error("Failed to fetch blog post:", error);
      res.status(500).json({ error: "Failed to fetch blog post" });
    }
  });

  // Testimonials routes
  app.get("/api/testimonials", async (_req: Request, res: Response) => {
    try {
      // Use the storage implementation to get testimonials from the database
      const testimonials = await storage.getTestimonials(10);
      res.json(testimonials);
    } catch (error) {
      console.error("Failed to fetch testimonials:", error);
      res.status(500).json({ error: "Failed to fetch testimonials" });
    }
  });
  
  app.get("/api/testimonials/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }
      
      const testimonial = await storage.getTestimonialById(id);
      if (!testimonial) {
        return res.status(404).json({ error: "Testimonial not found" });
      }
      
      res.json(testimonial);
    } catch (error) {
      console.error(`Failed to fetch testimonial with ID ${req.params.id}:`, error);
      res.status(500).json({ error: "Failed to fetch testimonial" });
    }
  });
  
  app.get("/api/schools/:schoolId/testimonials", async (req: Request, res: Response) => {
    try {
      const schoolId = parseInt(req.params.schoolId);
      if (isNaN(schoolId)) {
        return res.status(400).json({ error: "Invalid school ID format" });
      }
      
      const testimonials = await storage.getTestimonialsBySchoolId(schoolId);
      res.json(testimonials);
    } catch (error) {
      console.error(`Failed to fetch testimonials for school ID ${req.params.schoolId}:`, error);
      res.status(500).json({ error: "Failed to fetch school testimonials" });
    }
  });
  
  // Protected routes for testimonial management
  app.post("/api/testimonials", requireAuth, async (req: Request, res: Response) => {
    try {
      const testimonialData = req.body;
      
      // Validate testimonial data
      if (!testimonialData.name || !testimonialData.role || !testimonialData.content || !testimonialData.rating || !testimonialData.schoolId) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      
      // Create the testimonial
      const newTestimonial = await storage.createTestimonial(testimonialData);
      
      // Log the activity
      if (req.user) {
        await storage.createActivityLog({
          userId: req.user.id,
          action: "create",
          entityType: "testimonial",
          entityId: newTestimonial.id,
          metadata: { schoolId: testimonialData.schoolId }
        });
      }
      
      res.status(201).json(newTestimonial);
    } catch (error) {
      console.error("Failed to create testimonial:", error);
      res.status(500).json({ error: "Failed to create testimonial" });
    }
  });
  
  app.put("/api/testimonials/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }
      
      // Ensure testimonial exists
      const testimonial = await storage.getTestimonialById(id);
      if (!testimonial) {
        return res.status(404).json({ error: "Testimonial not found" });
      }
      
      // Update the testimonial
      const updatedTestimonial = await storage.updateTestimonial(id, req.body);
      
      // Log the activity
      if (req.user) {
        await storage.createActivityLog({
          userId: req.user.id,
          action: "update",
          entityType: "testimonial",
          entityId: id,
          metadata: { schoolId: updatedTestimonial?.schoolId }
        });
      }
      
      res.json(updatedTestimonial);
    } catch (error) {
      console.error(`Failed to update testimonial with ID ${req.params.id}:`, error);
      res.status(500).json({ error: "Failed to update testimonial" });
    }
  });
  
  app.delete("/api/testimonials/:id", requireAuth, requireAdminRole, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }
      
      // Ensure testimonial exists
      const testimonial = await storage.getTestimonialById(id);
      if (!testimonial) {
        return res.status(404).json({ error: "Testimonial not found" });
      }
      
      // Delete the testimonial
      const success = await storage.deleteTestimonial(id);
      
      if (!success) {
        return res.status(500).json({ error: "Failed to delete testimonial" });
      }
      
      // Log the activity
      if (req.user) {
        await storage.createActivityLog({
          userId: req.user.id,
          action: "delete",
          entityType: "testimonial",
          entityId: id,
          metadata: { schoolId: testimonial.schoolId }
        });
      }
      
      res.status(200).json({ success: true, message: "Testimonial deleted successfully" });
    } catch (error) {
      console.error(`Failed to delete testimonial with ID ${req.params.id}:`, error);
      res.status(500).json({ error: "Failed to delete testimonial" });
    }
  });

  // Activity logs routes
  app.post("/api/activity-logs", requireAuth, async (req: Request, res: Response) => {
    try {
      const { action, entityType, entityId, metadata } = req.body;
      const userId = (req.session as SessionData).userId!;
      
      // Create a new activity log
      const activityLog = await storage.createActivityLog({
        userId,
        action,
        entityType,
        entityId,
        metadata: metadata || null
      });
      
      res.status(201).json(activityLog);
    } catch (error) {
      console.error("Error creating activity log:", error);
      res.status(500).json({ error: "Failed to create activity log" });
    }
  });

  // Get user activity logs (for user's own activities)
  app.get("/api/user/activity-logs", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req.session as SessionData).userId!;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
      
      const activityLogs = await storage.getUserActivityLogs(userId, limit, offset);
      res.json(activityLogs);
    } catch (error) {
      console.error("Error fetching user activity logs:", error);
      res.status(500).json({ error: "Failed to fetch activity logs" });
    }
  });

  // Get activity logs for a specific entity (e.g., a school, a post, etc.)
  app.get("/api/activity-logs/:entityType/:entityId", async (req: Request, res: Response) => {
    try {
      const { entityType, entityId } = req.params;
      
      // Convert entityId to number
      const numericEntityId = parseInt(entityId);
      if (isNaN(numericEntityId)) {
        return res.status(400).json({ error: "Invalid entity ID" });
      }
      
      const activityLogs = await storage.getActivityLogsByEntityType(entityType, numericEntityId);
      res.json(activityLogs);
    } catch (error) {
      console.error("Error fetching entity activity logs:", error);
      res.status(500).json({ error: "Failed to fetch activity logs" });
    }
  });

  // Quiz System Routes
  
  // Get all quiz questions - publicly accessible
  app.get("/api/quiz/questions", async (req, res) => {
    try {
      // If user is authenticated, log it, but don't require authentication
      if (req.user) {
        console.log("Fetching quiz questions for authenticated user:", req.user.id);
      } else {
        console.log("Fetching quiz questions for anonymous user");
      }
      
      const questions = await storage.getQuizQuestions();
      res.json(questions);
    } catch (error) {
      console.error("Error fetching quiz questions:", error);
      res.status(500).json({ error: "Failed to fetch quiz questions" });
    }
  });

  // Get quiz questions by category - publicly accessible
  app.get("/api/quiz/questions/category/:category", async (req, res) => {
    try {
      const { category } = req.params;
      
      // If user is authenticated, log it, but don't require authentication
      if (req.user) {
        console.log(`Fetching quiz questions in category '${category}' for authenticated user:`, req.user.id);
      } else {
        console.log(`Fetching quiz questions in category '${category}' for anonymous user`);
      }
      
      const questions = await storage.getQuizQuestionsByCategory(category);
      res.json(questions);
    } catch (error) {
      console.error("Error fetching quiz questions by category:", error);
      res.status(500).json({ error: "Failed to fetch quiz questions" });
    }
  });

  // Submit quiz response - publicly accessible but with enhanced features for logged-in users
  app.post("/api/quiz/response", async (req, res) => {
    try {
      const { sessionId, response, preferences } = req.body;
      
      // Generate a session ID if not provided
      const finalSessionId = sessionId || uuidv4();
      
      // Check if user is authenticated
      const user = req.user as User;
      const userId = user?.id || null;
      
      // Log user status
      if (userId) {
        console.log(`Processing quiz submission for authenticated user: ${userId}`);
      } else {
        console.log(`Processing quiz submission for anonymous user with session: ${finalSessionId}`);
      }
      
      // Create the response in the database
      const quizResponse = await storage.createQuizResponse({
        userId,
        sessionId: finalSessionId,
        response,
        preferences
      });
      
      // Find school matches based on preferences
      const schoolMatches = await storage.getSchoolMatchesByPreferences(preferences);
      
      // Store the results
      const quizResult = await storage.createQuizResult({
        userId,
        sessionId: finalSessionId,
        responseId: quizResponse.id,
        schoolMatches: schoolMatches.map(school => ({
          schoolId: school.id,
          matchScore: (school as any).matchScore || 0,
          matchFactors: (school as any).matchFactors || []
        }))
      });
      
      // If the user is logged in, log this activity
      if (userId) {
        await storage.createActivityLog({
          userId,
          action: "COMPLETED_QUIZ",
          entityType: "quiz_response",
          entityId: quizResponse.id,
          metadata: { 
            matchCount: schoolMatches.length,
            topSchoolId: schoolMatches.length > 0 ? schoolMatches[0].id : null
          }
        });
      }
      
      // Generate AI analysis of the quiz results using Gemini
      try {
        console.log("Generating AI analysis for quiz results...");
        const aiAnalysis = await aiService.analyzeQuizResults({
          preferences,
          matchedSchools: schoolMatches,
          userId
        });
        
        console.log("AI analysis generated successfully");
        
        // Return the results with AI analysis
        res.json({ 
          response: quizResponse,
          result: quizResult,
          schoolMatches,
          aiAnalysis
        });
      } catch (aiError) {
        console.error("Error generating AI analysis:", aiError);
        // Still return the school matches even if AI analysis failed
        res.json({
          response: quizResponse,
          result: quizResult,
          schoolMatches,
          aiAnalysis: {
            insights: "Based on your preferences, we've found schools that match your criteria.",
            recommendations: [],
            nextSteps: [],
            personalizedAdvice: ""
          }
        });
      }
    } catch (error) {
      console.error("Error submitting quiz response:", error);
      res.status(500).json({ error: "Failed to process quiz response" });
    }
  });

  // Get quiz results for a user
  app.get("/api/quiz/results", async (req, res) => {
    try {
      const user = req.user as User;
      if (!user) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      const results = await storage.getQuizResultsByUserId(user.id);
      res.json(results);
    } catch (error) {
      console.error("Error fetching quiz results:", error);
      res.status(500).json({ error: "Failed to fetch quiz results" });
    }
  });

  // Get quiz results by session ID (for anonymous users)
  app.get("/api/quiz/results/session/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const results = await storage.getQuizResultsBySessionId(sessionId);
      res.json(results);
    } catch (error) {
      console.error("Error fetching quiz results by session:", error);
      res.status(500).json({ error: "Failed to fetch quiz results" });
    }
  });

  // Platform Admin API Routes
  // -------------------------

  // Platform admin dashboard data
  app.get("/api/platform-admin/dashboard", requireAdminRole, async (req: Request, res: Response) => {
    try {
      // Get platform statistics
      const allSchools = await storage.getSchools(1000, 0);
      const pendingSchools = allSchools.filter(school => school.approvalStatus === 'pending');
      
      // Get all users
      const allUsers = await storage.getAllUsers();
      
      // Get reviews that need moderation
      const allReviews = await storage.getAllReviews();
      const reviewsNeedingModeration = allReviews.filter(review => review.moderationStatus === 'pending');
      
      // Get recent activity logs
      const activityLogs = await storage.getRecentActivityLogs(20);
      
      // Format activity logs
      const recentActivity = activityLogs.map(log => {
        let entityName = '';
        switch(log.entityType) {
          case 'school':
            entityName = 'School with ID ' + log.entityId;
            break;
          case 'user':
            entityName = 'User with ID ' + log.entityId;
            break;
          case 'review':
            entityName = 'Review with ID ' + log.entityId;
            break;
          default:
            entityName = log.entityType + ' with ID ' + log.entityId;
        }
        
        return {
          id: log.id,
          action: log.action,
          user: 'Platform Admin',
          entityName,
          timestamp: log.createdAt
        };
      });
      
      res.json({
        stats: {
          totalSchools: allSchools.length,
          pendingApprovals: pendingSchools.length,
          totalUsers: allUsers.length,
          totalReviews: allReviews.length,
          reviewsNeedingModeration: reviewsNeedingModeration.length
        },
        recentActivity,
        pendingSchools: pendingSchools.map(school => ({
          id: school.id,
          name: school.name,
          location: school.location,
          submittedBy: "School Admin", // Replace with actual user data in production
          submittedDate: school.createdAt,
          type: school.type
        }))
      });
    } catch (error) {
      console.error("Error fetching platform admin dashboard data:", error);
      res.status(500).json({ error: "Failed to fetch dashboard data" });
    }
  });

  // Platform admin - Schools Management
  app.get("/api/platform-admin/schools", requireAdminRole, async (req: Request, res: Response) => {
    try {
      const schools = await storage.getSchools(1000, 0);
      res.json(schools);
    } catch (error) {
      console.error("Error fetching all schools:", error);
      res.status(500).json({ error: "Failed to fetch schools" });
    }
  });
  
  app.get("/api/platform-admin/schools/:id", requireAdminRole, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid school ID" });
      }
      
      const school = await storage.getSchool(id);
      if (!school) {
        return res.status(404).json({ error: "School not found" });
      }
      
      res.json(school);
    } catch (error) {
      console.error("Error fetching school:", error);
      res.status(500).json({ error: "Failed to fetch school" });
    }
  });
  
  app.put("/api/platform-admin/schools/:id", requireAdminRole, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid school ID" });
      }
      
      const schoolData = req.body;
      const school = await storage.updateSchool(id, schoolData);
      
      // Log this action
      await storage.createActivityLog({
        userId: req.session.userId!,
        action: "update_school",
        entityType: "school",
        entityId: id,
        metadata: { updatedFields: Object.keys(schoolData) }
      });
      
      res.json(school);
    } catch (error) {
      console.error("Error updating school:", error);
      res.status(500).json({ error: "Failed to update school" });
    }
  });
  
  app.put("/api/platform-admin/schools/:id/approve", requireAdminRole, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid school ID" });
      }
      
      const updateData = {
        approvalStatus: 'approved',
        lastVerifiedAt: new Date(),
        lastVerifiedBy: req.session.userId
      };
      
      const school = await storage.updateSchool(id, updateData);
      
      // Log this action
      await storage.createActivityLog({
        userId: req.session.userId!,
        action: "approve_school",
        entityType: "school",
        entityId: id,
        metadata: { status: 'approved' }
      });
      
      res.json(school);
    } catch (error) {
      console.error("Error approving school:", error);
      res.status(500).json({ error: "Failed to approve school" });
    }
  });
  
  app.put("/api/platform-admin/schools/:id/reject", requireAdminRole, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid school ID" });
      }
      
      const updateData = {
        approvalStatus: 'rejected',
        lastVerifiedAt: new Date(),
        lastVerifiedBy: req.session.userId
      };
      
      const school = await storage.updateSchool(id, updateData);
      
      // Log this action
      await storage.createActivityLog({
        userId: req.session.userId!,
        action: "reject_school",
        entityType: "school",
        entityId: id,
        metadata: { status: 'rejected' }
      });
      
      res.json(school);
    } catch (error) {
      console.error("Error rejecting school:", error);
      res.status(500).json({ error: "Failed to reject school" });
    }
  });
  
  // Toggle verification status
  app.put("/api/platform-admin/schools/:id/verify", requireAdminRole, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid school ID" });
      }
      
      // First get the current school to check its verification status
      const currentSchool = await storage.getSchool(id);
      if (!currentSchool) {
        return res.status(404).json({ error: "School not found" });
      }
      
      // Toggle the verification status
      const updateData = {
        verificationStatus: !currentSchool.verificationStatus,
        lastVerifiedAt: new Date(),
        lastVerifiedBy: req.session.userId
      };
      
      const school = await storage.updateSchool(id, updateData);
      
      // Log this action
      await storage.createActivityLog({
        userId: req.session.userId!,
        action: updateData.verificationStatus ? "verify_school" : "unverify_school",
        entityType: "school",
        entityId: id,
        metadata: { verificationStatus: updateData.verificationStatus }
      });
      
      res.json(school);
    } catch (error) {
      console.error("Error updating school verification status:", error);
      res.status(500).json({ error: "Failed to update verification status" });
    }
  });
  
  app.delete("/api/platform-admin/schools/:id", requireAdminRole, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid school ID" });
      }
      
      const result = await storage.deleteSchool(id);
      
      // Log this action
      await storage.createActivityLog({
        userId: req.session.userId!,
        action: "delete_school",
        entityType: "school",
        entityId: id,
        metadata: {}
      });
      
      res.json({ success: result });
    } catch (error) {
      console.error("Error deleting school:", error);
      res.status(500).json({ error: "Failed to delete school" });
    }
  });
  
  // Platform admin - User Management
  app.get("/api/platform-admin/users", requireAdminRole, async (req: Request, res: Response) => {
    try {
      const role = req.query.role as string;
      let users;

      if (role) {
        // If role is specified, filter users by role
        users = await storage.getUsersByRole(role);
      } else {
        // Otherwise get all users
        users = await storage.getAllUsers();
      }
      
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });
  
  app.get("/api/platform-admin/users/:id", requireAdminRole, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }
      
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });
  
  app.put("/api/platform-admin/users/:id", requireAdminRole, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }
      
      const userData = req.body;
      
      // Don't allow changing the userId of the platform admin account
      if (userData.role && userData.role !== 'platformAdmin' && id === req.session.userId) {
        return res.status(400).json({ error: "Cannot change your own platform admin role" });
      }
      
      const user = await storage.updateUser(id, userData);
      
      // Log this action
      await storage.createActivityLog({
        userId: req.session.userId!,
        action: "update_user",
        entityType: "user",
        entityId: id,
        metadata: { updatedFields: Object.keys(userData) }
      });
      
      res.json(user);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ error: "Failed to update user" });
    }
  });
  
  app.put("/api/platform-admin/users/:id/status", requireAdminRole, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }
      
      const { isActive } = req.body;
      
      // Don't allow deactivating your own account
      if (isActive === false && id === req.session.userId) {
        return res.status(400).json({ error: "Cannot deactivate your own account" });
      }
      
      const user = await storage.updateUserStatus(id, isActive);
      
      // Log this action
      await storage.createActivityLog({
        userId: req.session.userId!,
        action: isActive ? "activate_user" : "deactivate_user",
        entityType: "user",
        entityId: id,
        metadata: { status: isActive ? 'active' : 'inactive' }
      });
      
      res.json(user);
    } catch (error) {
      console.error("Error updating user status:", error);
      res.status(500).json({ error: "Failed to update user status" });
    }
  });
  
  app.delete("/api/platform-admin/users/:id", requireAdminRole, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }
      
      // Don't allow deleting your own account
      if (id === req.session.userId) {
        return res.status(400).json({ error: "Cannot delete your own account" });
      }
      
      const result = await storage.deleteUser(id);
      
      // Log this action
      await storage.createActivityLog({
        userId: req.session.userId!,
        action: "delete_user",
        entityType: "user",
        entityId: id,
        metadata: {}
      });
      
      res.json({ success: result });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ error: "Failed to delete user" });
    }
  });
  
  // Platform admin - Review Moderation and CRUD
  app.get("/api/platform-admin/reviews", requireAdminRole, async (req: Request, res: Response) => {
    try {
      const reviews = await storage.getAllReviews();
      
      // Enhance reviews with user and school information
      const enhancedReviews = await Promise.all(reviews.map(async (review) => {
        const user = await storage.getUser(review.userId);
        const school = await storage.getSchool(review.schoolId);
        
        return {
          ...review,
          user: user ? {
            id: user.id,
            fullName: user.fullName,
            username: user.username,
            email: user.email,
            avatarUrl: user.avatarUrl
          } : undefined,
          school: school ? {
            id: school.id,
            name: school.name,
            location: school.location,
            type: school.type,
            imageUrl: school.imageUrl
          } : undefined
        };
      }));
      
      res.json(enhancedReviews);
    } catch (error) {
      console.error("Error fetching all reviews:", error);
      res.status(500).json({ error: "Failed to fetch reviews" });
    }
  });
  
  // Get a single review by ID
  app.get("/api/platform-admin/reviews/:id", requireAdminRole, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid review ID" });
      }
      
      const review = await storage.getReview(id);
      if (!review) {
        return res.status(404).json({ error: "Review not found" });
      }
      
      // Enhance review with user and school information
      const user = await storage.getUser(review.userId);
      const school = await storage.getSchool(review.schoolId);
      
      const enhancedReview = {
        ...review,
        user: user ? {
          id: user.id,
          fullName: user.fullName,
          username: user.username,
          email: user.email,
          avatarUrl: user.avatarUrl
        } : undefined,
        school: school ? {
          id: school.id,
          name: school.name,
          location: school.location,
          type: school.type,
          imageUrl: school.imageUrl
        } : undefined
      };
      
      res.json(enhancedReview);
    } catch (error) {
      console.error(`Error fetching review with ID ${req.params.id}:`, error);
      res.status(500).json({ error: "Failed to fetch review" });
    }
  });
  
  // Create a new review
  app.post("/api/platform-admin/reviews", requireAdminRole, async (req: Request, res: Response) => {
    try {
      const { userId, schoolId, rating, comment } = req.body;
      
      if (!userId || !schoolId || !rating) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      
      // Validate user and school existence
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(400).json({ error: "User not found" });
      }
      
      const school = await storage.getSchool(schoolId);
      if (!school) {
        return res.status(400).json({ error: "School not found" });
      }
      
      const newReview = await storage.createReview({
        userId,
        schoolId,
        rating,
        comment: comment || null
      });
      
      // Log this action
      await storage.createActivityLog({
        userId: req.session.userId!,
        action: "create_review",
        entityType: "review",
        entityId: newReview.id,
        metadata: { rating, schoolId }
      });
      
      res.status(201).json(newReview);
    } catch (error) {
      console.error("Error creating review:", error);
      res.status(500).json({ error: "Failed to create review" });
    }
  });
  
  // Update a review
  app.put("/api/platform-admin/reviews/:id", requireAdminRole, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid review ID" });
      }
      
      const { rating, comment } = req.body;
      
      if (!rating) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      
      const existingReview = await storage.getReview(id);
      if (!existingReview) {
        return res.status(404).json({ error: "Review not found" });
      }
      
      const updatedReview = await storage.updateReview(id, {
        rating,
        comment: comment || null
      });
      
      // Log this action
      await storage.createActivityLog({
        userId: req.session.userId!,
        action: "update_review",
        entityType: "review",
        entityId: updatedReview.id,
        metadata: { rating }
      });
      
      res.json(updatedReview);
    } catch (error) {
      console.error(`Error updating review with ID ${req.params.id}:`, error);
      res.status(500).json({ error: "Failed to update review" });
    }
  });
  
  // Delete a review
  app.delete("/api/platform-admin/reviews/:id", requireAdminRole, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid review ID" });
      }
      
      const existingReview = await storage.getReview(id);
      if (!existingReview) {
        return res.status(404).json({ error: "Review not found" });
      }
      
      const result = await storage.deleteReview(id);
      
      if (result) {
        // Log this action
        await storage.createActivityLog({
          userId: req.session.userId!,
          action: "delete_review",
          entityType: "review",
          entityId: id,
          metadata: { schoolId: existingReview.schoolId }
        });
        
        res.json({ success: true });
      } else {
        res.status(500).json({ error: "Failed to delete review" });
      }
    } catch (error) {
      console.error(`Error deleting review with ID ${req.params.id}:`, error);
      res.status(500).json({ error: "Failed to delete review" });
    }
  });
  
  // Moderate a review
  app.put("/api/platform-admin/reviews/:id/moderate", requireAdminRole, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid review ID" });
      }
      
      const { status, notes } = req.body;
      
      if (!status || !['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ error: "Invalid moderation status" });
      }
      
      const moderatedReview = await storage.moderateReview(id, status, notes, req.session.userId!);
      
      // Log this action
      await storage.createActivityLog({
        userId: req.session.userId!,
        action: `${status}_review`,
        entityType: "review",
        entityId: id,
        metadata: { status, hasNotes: !!notes }
      });
      
      res.json(moderatedReview);
    } catch (error) {
      console.error("Error moderating review:", error);
      res.status(500).json({ error: "Failed to moderate review" });
    }
  });
  
  // Platform admin - Quiz Management
  app.get("/api/platform-admin/quiz-questions", requireAdminRole, async (req: Request, res: Response) => {
    try {
      const questions = await storage.getQuizQuestions();
      res.json(questions);
    } catch (error) {
      console.error("Error fetching quiz questions:", error);
      res.status(500).json({ error: "Failed to fetch quiz questions" });
    }
  });
  
  app.post("/api/platform-admin/quiz-questions", requireAdminRole, async (req: Request, res: Response) => {
    try {
      const questionData = req.body;
      const question = await storage.createQuizQuestion(questionData);
      
      // Log this action
      await storage.createActivityLog({
        userId: req.session.userId!,
        action: "create_quiz_question",
        entityType: "quiz_question",
        entityId: question.id,
        metadata: { category: question.category }
      });
      
      res.status(201).json(question);
    } catch (error) {
      console.error("Error creating quiz question:", error);
      res.status(500).json({ error: "Failed to create quiz question" });
    }
  });
  
  app.put("/api/platform-admin/quiz-questions/:id", requireAdminRole, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid question ID" });
      }
      
      const questionData = req.body;
      const question = await storage.updateQuizQuestion(id, questionData);
      
      // Log this action
      await storage.createActivityLog({
        userId: req.session.userId!,
        action: "update_quiz_question",
        entityType: "quiz_question",
        entityId: id,
        metadata: { updatedFields: Object.keys(questionData) }
      });
      
      res.json(question);
    } catch (error) {
      console.error("Error updating quiz question:", error);
      res.status(500).json({ error: "Failed to update quiz question" });
    }
  });
  
  app.delete("/api/platform-admin/quiz-questions/:id", requireAdminRole, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid question ID" });
      }
      
      const result = await storage.deleteQuizQuestion(id);
      
      // Log this action
      await storage.createActivityLog({
        userId: req.session.userId!,
        action: "delete_quiz_question",
        entityType: "quiz_question",
        entityId: id,
        metadata: {}
      });
      
      res.json({ success: result });
    } catch (error) {
      console.error("Error deleting quiz question:", error);
      res.status(500).json({ error: "Failed to delete quiz question" });
    }
  });
  
  app.put("/api/platform-admin/quiz-questions/:id/move", requireAdminRole, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid question ID" });
      }
      
      const { direction } = req.body;
      if (!direction || !['up', 'down'].includes(direction)) {
        return res.status(400).json({ error: "Invalid direction" });
      }
      
      const result = await storage.reorderQuizQuestion(id, direction);
      
      res.json({ success: true, ...result });
    } catch (error) {
      console.error("Error reordering quiz question:", error);
      res.status(500).json({ error: "Failed to reorder quiz question" });
    }
  });
  
  // Platform admin - Notifications
  app.get("/api/platform-admin/notifications", requireAdminRole, async (req: Request, res: Response) => {
    try {
      const notifications = await storage.getPlatformNotifications();
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });
  
  app.post("/api/platform-admin/notifications", requireAdminRole, async (req: Request, res: Response) => {
    try {
      const notificationData = {
        ...req.body,
        createdBy: req.session.userId
      };
      
      const notification = await storage.createPlatformNotification(notificationData);
      
      // Log this action
      await storage.createActivityLog({
        userId: req.session.userId!,
        action: "create_notification",
        entityType: "notification",
        entityId: notification.id,
        metadata: { type: notification.type, targetGroup: notification.targetGroup }
      });
      
      res.status(201).json(notification);
    } catch (error) {
      console.error("Error creating notification:", error);
      res.status(500).json({ error: "Failed to create notification" });
    }
  });
  
  app.put("/api/platform-admin/notifications/:id", requireAdminRole, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid notification ID" });
      }
      
      const notificationData = req.body;
      const notification = await storage.updatePlatformNotification(id, notificationData);
      
      // Log this action
      await storage.createActivityLog({
        userId: req.session.userId!,
        action: "update_notification",
        entityType: "notification",
        entityId: id,
        metadata: { updatedFields: Object.keys(notificationData) }
      });
      
      res.json(notification);
    } catch (error) {
      console.error("Error updating notification:", error);
      res.status(500).json({ error: "Failed to update notification" });
    }
  });
  
  app.put("/api/platform-admin/notifications/:id/toggle-status", requireAdminRole, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid notification ID" });
      }
      
      const { isActive } = req.body;
      if (typeof isActive !== 'boolean') {
        return res.status(400).json({ error: "isActive must be a boolean" });
      }
      
      const notification = await storage.updatePlatformNotification(id, { isActive });
      
      // Log this action
      await storage.createActivityLog({
        userId: req.session.userId!,
        action: isActive ? "activate_notification" : "deactivate_notification",
        entityType: "notification",
        entityId: id,
        metadata: { status: isActive ? 'active' : 'inactive' }
      });
      
      res.json(notification);
    } catch (error) {
      console.error("Error toggling notification status:", error);
      res.status(500).json({ error: "Failed to toggle notification status" });
    }
  });
  
  // Get activity logs with filtering
  app.get("/api/platform-admin/activity-logs", requireAdminRole, async (req: Request, res: Response) => {
    try {
      const { type, entityType, from, to, search, limit, offset } = req.query;
      
      // Parse date strings to Date objects if provided
      let fromDate: Date | undefined;
      let toDate: Date | undefined;
      
      if (from && typeof from === 'string') {
        fromDate = new Date(from);
      }
      
      if (to && typeof to === 'string') {
        toDate = new Date(to);
        // Set to end of day for inclusive filtering
        toDate.setHours(23, 59, 59, 999);
      }
      
      // Get filtered logs
      const logs = await storage.getFilteredActivityLogs(
        typeof type === 'string' ? type : undefined,
        typeof entityType === 'string' ? entityType : undefined,
        fromDate,
        toDate,
        typeof search === 'string' ? search : undefined,
        typeof limit === 'string' ? parseInt(limit) : 100,
        typeof offset === 'string' ? parseInt(offset) : 0
      );
      
      res.json(logs);
    } catch (error) {
      console.error("Error fetching activity logs:", error);
      res.status(500).json({ error: "Failed to fetch activity logs" });
    }
  });

  app.delete("/api/platform-admin/notifications/:id", requireAdminRole, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid notification ID" });
      }
      
      const result = await storage.deletePlatformNotification(id);
      
      // Log this action
      await storage.createActivityLog({
        userId: req.session.userId!,
        action: "delete_notification",
        entityType: "notification",
        entityId: id,
        metadata: {}
      });
      
      res.json({ success: result });
    } catch (error) {
      console.error("Error deleting notification:", error);
      res.status(500).json({ error: "Failed to delete notification" });
    }
  });

  // School settings endpoint for school admins
  // School Admin Settings routes
  app.get("/api/admin/schools/:schoolId/settings", requireSchoolAdmin, async (req: Request, res: Response) => {
    try {
      console.log("GET school settings request for schoolId:", req.params.schoolId);
      const schoolId = parseInt(req.params.schoolId);
      
      if (isNaN(schoolId)) {
        console.log("Invalid school ID provided:", req.params.schoolId);
        return res.status(400).json({ error: "Invalid school ID" });
      }
      
      // Check if the user has access to this school
      const userId = req.session.userId!;
      console.log(`Checking if user ${userId} has access to school ${schoolId} settings`);
      
      const hasAccess = await checkSchoolAccess(userId, schoolId);
      
      if (!hasAccess) {
        console.log(`Access denied for user ${userId} to school ${schoolId} settings`);
        return res.status(403).json({ error: "You don't have access to this school" });
      }
      
      console.log(`Access granted for user ${userId} to school ${schoolId} settings`);
      
      // Get the school details
      const school = await storage.getSchool(schoolId);
      
      if (!school) {
        console.log(`School not found with ID ${schoolId}`);
        return res.status(404).json({ error: "School not found" });
      }
      
      console.log(`Retrieved school settings for school ${schoolId}:`, {
        id: school.id,
        name: school.name,
        adminId: school.admin_id
      });
      
      res.json(school);
    } catch (error) {
      console.error("Error retrieving school settings:", error);
      res.status(500).json({ 
        error: "Failed to retrieve school settings", 
        details: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  // Update school settings endpoint for school admins
  app.put("/api/admin/schools/:schoolId/settings", requireSchoolAdmin, async (req: Request, res: Response) => {
    try {
      console.log("PUT update school settings request for schoolId:", req.params.schoolId);
      const schoolId = parseInt(req.params.schoolId);
      
      if (isNaN(schoolId)) {
        console.log("Invalid school ID provided:", req.params.schoolId);
        return res.status(400).json({ error: "Invalid school ID" });
      }
      
      // Check if the user has access to this school
      const userId = req.session.userId!;
      console.log(`Checking if user ${userId} has access to update school ${schoolId} settings`);
      
      const hasAccess = await checkSchoolAccess(userId, schoolId);
      
      if (!hasAccess) {
        console.log(`Access denied for user ${userId} to update school ${schoolId} settings`);
        return res.status(403).json({ error: "You don't have access to this school" });
      }
      
      console.log(`Access granted for user ${userId} to update school ${schoolId} settings`);
      
      // Validate the request body
      const schoolData = req.body;
      console.log(`School update data:`, { 
        schoolId, 
        userId,
        updatedFields: Object.keys(schoolData)
      });
      
      // Update the school
      const updatedSchool = await storage.updateSchool(schoolId, schoolData);
      
      if (!updatedSchool) {
        console.log(`Failed to update school ${schoolId}`);
        return res.status(500).json({ error: "Failed to update school settings" });
      }
      
      console.log(`Successfully updated school ${schoolId}`);
      
      // Create activity log for the update
      await storage.createActivityLog({
        userId,
        action: "update_school_settings",
        entityType: "school",
        entityId: schoolId,
        metadata: { updatedFields: Object.keys(schoolData) }
      });
      
      res.json(updatedSchool);
    } catch (error) {
      console.error("Error updating school settings:", error);
      res.status(500).json({ 
        error: "Failed to update school settings", 
        details: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  // AI Assistant chat endpoint
  app.post("/api/ai/chat", async (req: Request, res: Response) => {
    console.log("=== AI CHAT REQUEST RECEIVED ===");
    try {
      const { prompt, context } = req.body;
      
      // Validate input
      const chatSchema = z.object({
        prompt: z.string().min(1, "Prompt is required"),
        context: z.record(z.any()).optional()
      });
      
      try {
        chatSchema.parse(req.body);
      } catch (error) {
        if (error instanceof ZodError) {
          return handleZodError(error, res);
        }
        throw error;
      }
      
      console.log("AI Chat prompt:", prompt);
      
      // Get context data for better responses
      const contextData: any = { ...context };
      
      // If user is logged in, add their information to context
      if (req.session.userId) {
        const user = await storage.getUser(req.session.userId);
        if (user) {
          contextData.user = {
            fullName: user.fullName,
            role: user.role
          };
          console.log("Added user context data for user:", user.id);
        }
      }
      
      // Fetch real school data to enhance responses
      try {
        console.log("Fetching school data for contextual enhancement...");
        // Get school types from database
        const schools = await storage.getSchools(20);
        const schoolTypes = [...new Set(schools.map(school => school.type))];
        contextData.schoolTypes = schoolTypes.filter(type => type); // Filter out empty values
        
        // Get curriculum types from database
        const curriculumTypes = [...new Set(schools.map(school => school.curriculumType))];
        contextData.curriculums = curriculumTypes.filter(type => type);
        
        // Get locations from database
        const locations = [...new Set(schools.map(school => school.location))];
        contextData.locations = locations.filter(loc => loc);
        
        // Add a sample of featured schools
        const featuredSchools = schools
          .filter(school => school.rating >= 4)
          .slice(0, 5)
          .map(school => ({
            name: school.name,
            type: school.type,
            curriculum: school.curriculumType,
            location: school.location
          }));
        
        if (featuredSchools.length > 0) {
          contextData.featuredSchools = featuredSchools;
        }
        
        console.log("AI chat context enhanced with real data:", {
          schoolTypes: contextData.schoolTypes,
          curriculums: contextData.curriculums, 
          locations: contextData.locations,
          featuredSchoolsCount: featuredSchools.length
        });
      } catch (dataError) {
        console.error("Error fetching school data for AI context:", dataError);
        // Continue even if we fail to get the additional context
      }
      
      console.log("Sending request to Gemini AI with enhanced context...");
      
      // Get response from AI service with enhanced real-time database access
      const start = Date.now();
      const response = await aiService.getResponse(prompt, contextData);
      const end = Date.now();
      
      console.log(`Gemini AI response received in ${end - start}ms`);
      
      // Log this interaction
      if (req.session.userId) {
        await storage.createActivityLog({
          userId: req.session.userId,
          action: "ai_chat",
          entityType: "ai_assistant",
          entityId: 0,
          metadata: { prompt }
        });
        console.log("Logged AI chat interaction for user:", req.session.userId);
      }
      
      // Return the AI response
      res.json({ 
        response,
        timestamp: new Date().toISOString()
      });
      
      console.log("=== AI CHAT REQUEST COMPLETED ===");
    } catch (error) {
      console.error("AI chat error:", error);
      res.status(500).json({ 
        error: "Failed to get AI response",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Content Management API - Platform Admin
  // Content Pages
  app.get("/api/platform-admin/content/pages", requireAdminRole, async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = parseInt(req.query.offset as string) || 0;
      
      const pages = await storage.getContentPages(limit, offset);
      res.json(pages);
    } catch (error) {
      console.error("Error fetching content pages:", error);
      res.status(500).json({ error: "Failed to fetch content pages" });
    }
  });
  
  app.get("/api/platform-admin/content/pages/:id", requireAdminRole, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const page = await storage.getContentPage(id);
      
      if (!page) {
        return res.status(404).json({ error: "Content page not found" });
      }
      
      res.json(page);
    } catch (error) {
      console.error("Error fetching content page:", error);
      res.status(500).json({ error: "Failed to fetch content page" });
    }
  });
  
  app.post("/api/platform-admin/content/pages", requireAdminRole, async (req: Request, res: Response) => {
    try {
      const pageData = insertContentPageSchema.parse(req.body);
      const newPage = await storage.createContentPage(pageData);
      res.status(201).json(newPage);
    } catch (error) {
      if (error instanceof ZodError) {
        return handleZodError(error, res);
      }
      console.error("Error creating content page:", error);
      res.status(500).json({ error: "Failed to create content page" });
    }
  });
  
  app.put("/api/platform-admin/content/pages/:id", requireAdminRole, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const pageData = req.body;
      
      // Validate that at least some of the required fields are present
      const updatePageSchema = z.object({
        title: z.string().min(1).optional(),
        slug: z.string().min(1).optional(),
        content: z.string().min(1).optional(),
        status: z.string().optional(),
        metaTitle: z.string().optional(),
        metaDescription: z.string().optional(),
        publishedAt: z.string().or(z.date()).optional().nullable()
      });
      
      updatePageSchema.parse(pageData);
      
      const updatedPage = await storage.updateContentPage(id, pageData);
      
      if (!updatedPage) {
        return res.status(404).json({ error: "Content page not found" });
      }
      
      res.json(updatedPage);
    } catch (error) {
      if (error instanceof ZodError) {
        return handleZodError(error, res);
      }
      console.error("Error updating content page:", error);
      res.status(500).json({ error: "Failed to update content page" });
    }
  });
  
  app.delete("/api/platform-admin/content/pages/:id", requireAdminRole, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteContentPage(id);
      
      if (!success) {
        return res.status(404).json({ error: "Content page not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting content page:", error);
      res.status(500).json({ error: "Failed to delete content page" });
    }
  });
  
  // Blog Posts
  app.get("/api/platform-admin/content/blog", requireAdminRole, async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = parseInt(req.query.offset as string) || 0;
      const category = req.query.category as string || undefined;
      const status = req.query.status as string || undefined;
      
      const posts = await storage.getBlogPosts({
        limit,
        offset,
        category,
        status
      });
      
      // Fetch author information for each blog post
      const postsWithAuthors = await Promise.all(
        posts.map(async (post) => {
          if (post.authorId) {
            const author = await storage.getUser(post.authorId);
            return {
              ...post,
              author: author ? {
                id: author.id,
                fullName: author.fullName,
                role: author.role,
                avatarUrl: author.avatarUrl
              } : null
            };
          }
          return { ...post, author: null };
        })
      );
      
      res.json(postsWithAuthors);
    } catch (error) {
      console.error("Error fetching blog posts:", error);
      res.status(500).json({ error: "Failed to fetch blog posts" });
    }
  });
  
  app.get("/api/platform-admin/content/blog/:id", requireAdminRole, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const post = await storage.getBlogPost(id);
      
      if (!post) {
        return res.status(404).json({ error: "Blog post not found" });
      }
      
      res.json(post);
    } catch (error) {
      console.error("Error fetching blog post:", error);
      res.status(500).json({ error: "Failed to fetch blog post" });
    }
  });
  
  app.post("/api/platform-admin/content/blog", requireAdminRole, async (req: Request, res: Response) => {
    try {
      const postData = insertBlogPostSchema.parse(req.body);
      const newPost = await storage.createBlogPost(postData);
      res.status(201).json(newPost);
    } catch (error) {
      if (error instanceof ZodError) {
        return handleZodError(error, res);
      }
      console.error("Error creating blog post:", error);
      res.status(500).json({ error: "Failed to create blog post" });
    }
  });
  
  app.put("/api/platform-admin/content/blog/:id", requireAdminRole, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const postData = req.body;
      
      // Validate that at least some of the required fields are present
      const updatePostSchema = z.object({
        title: z.string().min(1).optional(),
        slug: z.string().min(1).optional(),
        content: z.string().min(1).optional(),
        summary: z.string().optional(),
        featuredImage: z.string().optional().nullable(),
        categoryId: z.number().optional(),
        isPublished: z.boolean().optional(),
        views: z.number().optional(),
        authorId: z.number().optional()
      });
      
      updatePostSchema.parse(postData);
      
      const updatedPost = await storage.updateBlogPost(id, postData);
      
      if (!updatedPost) {
        return res.status(404).json({ error: "Blog post not found" });
      }
      
      // Get author for updated post
      let result = updatedPost;
      if (updatedPost.authorId) {
        const author = await storage.getUser(updatedPost.authorId);
        if (author) {
          result = {
            ...updatedPost,
            author: {
              id: author.id,
              fullName: author.fullName,
              role: author.role,
              avatarUrl: author.avatarUrl
            }
          };
        }
      }
      
      res.json(result);
    } catch (error) {
      if (error instanceof ZodError) {
        return handleZodError(error, res);
      }
      console.error("Error updating blog post:", error);
      res.status(500).json({ error: "Failed to update blog post" });
    }
  });
  
  app.delete("/api/platform-admin/content/blog/:id", requireAdminRole, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteBlogPost(id);
      
      if (!success) {
        return res.status(404).json({ error: "Blog post not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting blog post:", error);
      res.status(500).json({ error: "Failed to delete blog post" });
    }
  });
  
  // FAQ Items
  app.get("/api/platform-admin/content/faqs", requireAdminRole, async (req: Request, res: Response) => {
    try {
      const category = req.query.category as string;
      const faqItems = await storage.getFaqItems(category);
      res.json(faqItems);
    } catch (error) {
      console.error("Error fetching FAQ items:", error);
      res.status(500).json({ error: "Failed to fetch FAQ items" });
    }
  });
  
  app.get("/api/platform-admin/content/faqs/:id", requireAdminRole, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const faq = await storage.getFaqItem(id);
      
      if (!faq) {
        return res.status(404).json({ error: "FAQ item not found" });
      }
      
      res.json(faq);
    } catch (error) {
      console.error("Error fetching FAQ item:", error);
      res.status(500).json({ error: "Failed to fetch FAQ item" });
    }
  });
  
  app.post("/api/platform-admin/content/faqs", requireAdminRole, async (req: Request, res: Response) => {
    try {
      const faqData = insertFaqItemSchema.parse(req.body);
      const newFaq = await storage.createFaqItem(faqData);
      res.status(201).json(newFaq);
    } catch (error) {
      if (error instanceof ZodError) {
        return handleZodError(error, res);
      }
      console.error("Error creating FAQ item:", error);
      res.status(500).json({ error: "Failed to create FAQ item" });
    }
  });
  
  app.put("/api/platform-admin/content/faqs/:id", requireAdminRole, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const faqData = req.body;
      
      // Validate that at least some of the required fields are present
      const updateFaqSchema = z.object({
        question: z.string().min(1).optional(),
        answer: z.string().min(1).optional(),
        category: z.string().optional(),
        order: z.number().optional()
      });
      
      updateFaqSchema.parse(faqData);
      
      const updatedFaq = await storage.updateFaqItem(id, faqData);
      
      if (!updatedFaq) {
        return res.status(404).json({ error: "FAQ item not found" });
      }
      
      res.json(updatedFaq);
    } catch (error) {
      if (error instanceof ZodError) {
        return handleZodError(error, res);
      }
      console.error("Error updating FAQ item:", error);
      res.status(500).json({ error: "Failed to update FAQ item" });
    }
  });
  
  app.delete("/api/platform-admin/content/faqs/:id", requireAdminRole, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteFaqItem(id);
      
      if (!success) {
        return res.status(404).json({ error: "FAQ item not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting FAQ item:", error);
      res.status(500).json({ error: "Failed to delete FAQ item" });
    }
  });
  
  // Categories
  app.get("/api/platform-admin/content/categories", requireAdminRole, async (req: Request, res: Response) => {
    try {
      const type = req.query.type as string;
      const categories = await storage.getCategories(type);
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });
  
  app.get("/api/platform-admin/content/categories/:id", requireAdminRole, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const category = await storage.getCategory(id);
      
      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }
      
      res.json(category);
    } catch (error) {
      console.error("Error fetching category:", error);
      res.status(500).json({ error: "Failed to fetch category" });
    }
  });
  
  app.post("/api/platform-admin/content/categories", requireAdminRole, async (req: Request, res: Response) => {
    try {
      const categoryData = insertCategorySchema.parse(req.body);
      const newCategory = await storage.createCategory(categoryData);
      res.status(201).json(newCategory);
    } catch (error) {
      if (error instanceof ZodError) {
        return handleZodError(error, res);
      }
      console.error("Error creating category:", error);
      res.status(500).json({ error: "Failed to create category" });
    }
  });
  
  app.put("/api/platform-admin/content/categories/:id", requireAdminRole, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const categoryData = req.body;
      
      // Validate that at least some of the required fields are present
      const updateCategorySchema = z.object({
        name: z.string().min(1).optional(),
        slug: z.string().min(1).optional(),
        description: z.string().optional(),
        type: z.string().optional(),
        parentId: z.number().optional().nullable()
      });
      
      updateCategorySchema.parse(categoryData);
      
      const updatedCategory = await storage.updateCategory(id, categoryData);
      
      if (!updatedCategory) {
        return res.status(404).json({ error: "Category not found" });
      }
      
      res.json(updatedCategory);
    } catch (error) {
      if (error instanceof ZodError) {
        return handleZodError(error, res);
      }
      console.error("Error updating category:", error);
      res.status(500).json({ error: "Failed to update category" });
    }
  });
  
  app.delete("/api/platform-admin/content/categories/:id", requireAdminRole, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteCategory(id);
      
      if (!success) {
        return res.status(404).json({ error: "Category not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting category:", error);
      res.status(500).json({ error: "Failed to delete category" });
    }
  });
  
  // Messaging System - Platform Admin
  app.get("/api/platform-admin/messages/conversations", requireAdminRole, async (req: Request, res: Response) => {
    try {
      const status = req.query.status as string;
      const conversations = await storage.getConversations(undefined, status);
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });
  
  app.get("/api/platform-admin/messages/conversations/:id", requireAdminRole, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const conversation = await storage.getConversation(id);
      
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      
      // Get messages for this conversation
      const messages = await storage.getMessages(id);
      
      // Mark messages as read for the admin user
      if (messages.length > 0) {
        await storage.markMessagesAsRead(id, req.session.userId!);
      }
      
      res.json({
        conversation,
        messages
      });
    } catch (error) {
      console.error("Error fetching conversation details:", error);
      res.status(500).json({ error: "Failed to fetch conversation details" });
    }
  });
  
  app.post("/api/platform-admin/messages/conversations/:id/reply", requireAdminRole, async (req: Request, res: Response) => {
    try {
      const conversationId = parseInt(req.params.id);
      const { content } = req.body;
      
      if (!content || typeof content !== 'string' || content.trim() === '') {
        return res.status(400).json({ error: "Message content is required" });
      }
      
      // Get the conversation to make sure it exists
      const conversation = await storage.getConversation(conversationId);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      
      // Create a new message
      const newMessage = await storage.createMessage({
        conversationId,
        senderId: req.session.userId!,
        content,
        isRead: false
      });
      
      // Update conversation status if needed
      if (conversation.status === 'unread' || conversation.status === 'pending') {
        await storage.updateConversationStatus(conversationId, 'active');
      }
      
      res.status(201).json(newMessage);
    } catch (error) {
      console.error("Error replying to conversation:", error);
      res.status(500).json({ error: "Failed to send reply" });
    }
  });
  
  app.put("/api/platform-admin/messages/conversations/:id/status", requireAdminRole, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!status || typeof status !== 'string') {
        return res.status(400).json({ error: "Status is required" });
      }
      
      const allowedStatuses = ['active', 'pending', 'closed', 'archived'];
      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ error: `Status must be one of: ${allowedStatuses.join(', ')}` });
      }
      
      const updatedConversation = await storage.updateConversationStatus(id, status);
      
      if (!updatedConversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      
      res.json(updatedConversation);
    } catch (error) {
      console.error("Error updating conversation status:", error);
      res.status(500).json({ error: "Failed to update conversation status" });
    }
  });
  
  // Site Settings
  app.get("/api/platform-admin/settings", requireAdminRole, async (req: Request, res: Response) => {
    try {
      const category = req.query.category as string;
      let settings;
      
      if (category) {
        settings = await storage.getSiteSettingsByCategory(category);
      } else {
        settings = await storage.getSiteSettings();
      }
      
      // Transform settings into a more usable format for the frontend
      const settingsMap = settings.reduce((acc, setting) => {
        acc[setting.key] = {
          value: setting.value,
          category: setting.category,
          description: setting.description,
          type: setting.type,
          updatedAt: setting.updatedAt,
          updatedBy: setting.updatedBy
        };
        return acc;
      }, {} as Record<string, any>);
      
      res.json(settingsMap);
    } catch (error) {
      console.error("Error fetching site settings:", error);
      res.status(500).json({ error: "Failed to fetch site settings" });
    }
  });
  
  app.get("/api/platform-admin/settings/:key", requireAdminRole, async (req: Request, res: Response) => {
    try {
      const key = req.params.key;
      const setting = await storage.getSiteSetting(key);
      
      if (!setting) {
        return res.status(404).json({ error: "Setting not found" });
      }
      
      res.json(setting);
    } catch (error) {
      console.error(`Error fetching site setting '${req.params.key}':`, error);
      res.status(500).json({ error: "Failed to fetch site setting" });
    }
  });
  
  app.post("/api/platform-admin/settings", requireAdminRole, async (req: Request, res: Response) => {
    try {
      const settingData = insertSiteSettingSchema.parse(req.body);
      const newSetting = await storage.createSiteSetting(settingData);
      res.status(201).json(newSetting);
    } catch (error) {
      if (error instanceof ZodError) {
        return handleZodError(error, res);
      }
      console.error("Error creating site setting:", error);
      res.status(500).json({ error: "Failed to create site setting" });
    }
  });
  
  app.put("/api/platform-admin/settings/:key", requireAdminRole, async (req: Request, res: Response) => {
    try {
      const key = req.params.key;
      const { value } = req.body;
      
      if (value === undefined) {
        return res.status(400).json({ error: "Value is required" });
      }
      
      const updatedSetting = await storage.updateSiteSetting(key, value, req.session.userId);
      
      if (!updatedSetting) {
        return res.status(404).json({ error: "Setting not found" });
      }
      
      res.json(updatedSetting);
    } catch (error) {
      console.error(`Error updating site setting '${req.params.key}':`, error);
      res.status(500).json({ error: "Failed to update site setting" });
    }
  });
  
  app.delete("/api/platform-admin/settings/:key", requireAdminRole, async (req: Request, res: Response) => {
    try {
      const key = req.params.key;
      const success = await storage.deleteSiteSetting(key);
      
      if (!success) {
        return res.status(404).json({ error: "Setting not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error(`Error deleting site setting '${req.params.key}':`, error);
      res.status(500).json({ error: "Failed to delete site setting" });
    }
  });
  
  // System Logs 
  app.get("/api/platform-admin/system-logs", requireAdminRole, async (req: Request, res: Response) => {
    try {
      const level = req.query.level as string;
      const component = req.query.component as string;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      
      const logs = await storage.getSystemLogs(level, component, limit, offset);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching system logs:", error);
      res.status(500).json({ error: "Failed to fetch system logs" });
    }
  });
  
  app.post("/api/platform-admin/system-logs", requireAdminRole, async (req: Request, res: Response) => {
    try {
      const logData = insertSystemLogSchema.parse(req.body);
      const newLog = await storage.createSystemLog(logData);
      res.status(201).json(newLog);
    } catch (error) {
      if (error instanceof ZodError) {
        return handleZodError(error, res);
      }
      console.error("Error creating system log:", error);
      res.status(500).json({ error: "Failed to create system log" });
    }
  });

  // ======================================================================
  // ADDITIONAL SCHEMA IMPROVEMENT ROUTES
  // ======================================================================

  // SCHOOL CATEGORIES ROUTES

  // Get all school categories
  app.get("/api/school-categories", async (req: Request, res: Response) => {
    try {
      const categories = await storage.getSchoolCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching school categories:", error);
      res.status(500).json({ error: "Failed to fetch school categories" });
    }
  });

  // Create school category (platform admin only)
  app.post(
    "/api/school-categories",
    requireAdminRole,
    async (req: Request, res: Response) => {
      try {
        const validatedData = insertSchoolCategorySchema.parse(req.body);
        const category = await storage.createSchoolCategory(validatedData);
        res.status(201).json(category);
      } catch (error) {
        if (error instanceof ZodError) {
          return handleZodError(error, res);
        }
        console.error("Error creating school category:", error);
        res.status(400).json({ error: "Invalid category data" });
      }
    }
  );

  // Get school categories for a specific school
  app.get("/api/schools/:schoolId/categories", async (req: Request, res: Response) => {
    try {
      // Make sure we have a valid schoolId
      const schoolIdStr = req.params.schoolId;
      if (!schoolIdStr || isNaN(Number(schoolIdStr))) {
        return res.status(400).json({ error: "Invalid school ID" });
      }
      
      const schoolId = parseInt(schoolIdStr);
      
      // First verify that the school exists
      const school = await storage.getSchool(schoolId);
      if (!school) {
        return res.status(404).json({ error: "School not found" });
      }
      
      const categories = await storage.getSchoolCategoriesBySchoolId(schoolId);
      res.json(categories);
    } catch (error) {
      console.error("Error fetching school categories:", error);
      res.status(500).json({ error: "Failed to fetch school categories" });
    }
  });

  // Add category to school (school admin or platform admin)
  app.post(
    "/api/schools/:schoolId/categories",
    requireSchoolAdmin,
    async (req: Request, res: Response) => {
      try {
        const schoolId = parseInt(req.params.schoolId);
        const { categoryId } = req.body;
        
        // Check if the user is authorized for this school
        const userId = req.session.userId!;
        const hasAccess = await checkSchoolAccess(userId, schoolId);
        
        if (!hasAccess) {
          return res.status(403).json({ error: "Unauthorized access to this school" });
        }
        
        const relation = await storage.addCategoryToSchool({
          schoolId,
          categoryId,
        });
        
        res.status(201).json(relation);
      } catch (error) {
        console.error("Error adding category to school:", error);
        res.status(400).json({ error: "Invalid request" });
      }
    }
  );

  // Remove category from school
  app.delete(
    "/api/schools/:schoolId/categories/:categoryId",
    requireSchoolAdmin,
    async (req: Request, res: Response) => {
      try {
        const schoolId = parseInt(req.params.schoolId);
        const categoryId = parseInt(req.params.categoryId);
        
        // Check if the user is authorized for this school
        const userId = req.session.userId!;
        const hasAccess = await checkSchoolAccess(userId, schoolId);
        
        if (!hasAccess) {
          return res.status(403).json({ error: "Unauthorized access to this school" });
        }
        
        const success = await storage.removeCategoryFromSchool(schoolId, categoryId);
        
        if (success) {
          res.json({ success: true });
        } else {
          res.status(404).json({ error: "Category relation not found" });
        }
      } catch (error) {
        console.error("Error removing category from school:", error);
        res.status(500).json({ error: "Server error" });
      }
    }
  );

  // SCHOOL MEDIA ROUTES

  // Get all media for a school
  app.get("/api/schools/:schoolId/media", async (req: Request, res: Response) => {
    try {
      const schoolId = parseInt(req.params.schoolId);
      const media = await storage.getSchoolMedia(schoolId);
      res.json(media);
    } catch (error) {
      console.error("Error fetching school media:", error);
      res.status(500).json({ error: "Failed to fetch school media" });
    }
  });

  // Add media to school (school admin or platform admin)
  app.post(
    "/api/schools/:schoolId/media",
    requireSchoolAdmin,
    async (req: Request, res: Response) => {
      try {
        const schoolId = parseInt(req.params.schoolId);
        const userId = req.session.userId!;
        
        // Check if the user is authorized for this school
        const hasAccess = await checkSchoolAccess(userId, schoolId);
        
        if (!hasAccess) {
          return res.status(403).json({ error: "Unauthorized access to this school" });
        }
        
        const validatedData = insertSchoolMediaSchema.parse({
          ...req.body,
          schoolId,
          createdBy: userId
        });
        
        const media = await storage.createSchoolMedia(validatedData);
        res.status(201).json(media);
      } catch (error) {
        if (error instanceof ZodError) {
          return handleZodError(error, res);
        }
        console.error("Error adding media to school:", error);
        res.status(400).json({ error: "Invalid media data" });
      }
    }
  );

  // Delete media from school
  app.delete(
    "/api/schools/:schoolId/media/:mediaId",
    requireSchoolAdmin,
    async (req: Request, res: Response) => {
      try {
        const schoolId = parseInt(req.params.schoolId);
        const mediaId = parseInt(req.params.mediaId);
        const userId = req.session.userId!;
        
        // Check if the user is authorized for this school
        const hasAccess = await checkSchoolAccess(userId, schoolId);
        
        if (!hasAccess) {
          return res.status(403).json({ error: "Unauthorized access to this school" });
        }
        
        const success = await storage.deleteSchoolMedia(mediaId);
        
        if (success) {
          res.json({ success: true });
        } else {
          res.status(404).json({ error: "Media not found" });
        }
      } catch (error) {
        console.error("Error deleting school media:", error);
        res.status(500).json({ error: "Server error" });
      }
    }
  );

  // USER PREFERENCES ROUTES

  // Get user preferences
  app.get("/api/user/preferences", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      const preferences = await storage.getUserPreferences(userId);
      res.json(preferences || {});
    } catch (error) {
      console.error("Error fetching user preferences:", error);
      res.status(500).json({ error: "Failed to fetch user preferences" });
    }
  });

  // Update user preferences
  app.post("/api/user/preferences", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      
      const validatedData = insertUserPreferencesSchema.parse({
        ...req.body,
        userId
      });
      
      // Check if preferences already exist
      const existingPrefs = await storage.getUserPreferences(userId);
      
      let preferences;
      if (existingPrefs) {
        preferences = await storage.updateUserPreferences(userId, validatedData);
      } else {
        preferences = await storage.createUserPreferences(validatedData);
      }
      
      res.json(preferences);
    } catch (error) {
      if (error instanceof ZodError) {
        return handleZodError(error, res);
      }
      console.error("Error updating user preferences:", error);
      res.status(400).json({ error: "Invalid preference data" });
    }
  });

  // USER NOTIFICATIONS ROUTES

  // Get user notifications
  app.get("/api/user/notifications", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      const notifications = await storage.getUserNotifications(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching user notifications:", error);
      res.status(500).json({ error: "Failed to fetch user notifications" });
    }
  });

  // Mark notification as read
  app.patch(
    "/api/user/notifications/:notificationId",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const userId = req.session.userId!;
        const notificationId = parseInt(req.params.notificationId);
        
        const notification = await storage.getUserNotification(notificationId);
        
        if (!notification) {
          return res.status(404).json({ error: "Notification not found" });
        }
        
        if (notification.userId !== userId) {
          return res.status(403).json({ error: "Unauthorized access to this notification" });
        }
        
        const updated = await storage.markNotificationAsRead(notificationId);
        res.json(updated);
      } catch (error) {
        console.error("Error marking notification as read:", error);
        res.status(500).json({ error: "Server error" });
      }
    }
  );

  // Mark all notifications as read
  app.post(
    "/api/user/notifications/read-all",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const userId = req.session.userId!;
        await storage.markAllNotificationsAsRead(userId);
        res.json({ success: true });
      } catch (error) {
        console.error("Error marking all notifications as read:", error);
        res.status(500).json({ error: "Server error" });
      }
    }
  );
  
  // USER PROFILE ROUTES

  // Get user profile
  app.get("/api/user/profile", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      const profile = await storage.getUserProfile(userId);
      res.json(profile || {});
    } catch (error) {
      console.error("Error fetching user profile:", error);
      res.status(500).json({ error: "Failed to fetch user profile" });
    }
  });

  // Update user profile
  app.post("/api/user/profile", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      
      const validatedData = insertUserProfileSchema.parse({
        ...req.body,
        userId
      });
      
      // Check if profile already exists
      const existingProfile = await storage.getUserProfile(userId);
      
      let profile;
      if (existingProfile) {
        profile = await storage.updateUserProfile(userId, validatedData);
      } else {
        profile = await storage.createUserProfile(validatedData);
      }
      
      res.json(profile);
    } catch (error) {
      if (error instanceof ZodError) {
        return handleZodError(error, res);
      }
      console.error("Error updating user profile:", error);
      res.status(400).json({ error: "Invalid profile data" });
    }
  });

  // Get another user's public profile
  app.get("/api/users/:userId/profile", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const profile = await storage.getUserPublicProfile(userId);
      
      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }
      
      res.json(profile);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      res.status(500).json({ error: "Failed to fetch user profile" });
    }
  });

  // SUPPORT REQUEST ROUTES
  
  // Get all support requests (admin only)
  app.get("/api/support", requireAdminRole, async (req: Request, res: Response) => {
    try {
      const limit = Number(req.query.limit) || 20;
      const offset = Number(req.query.offset) || 0;
      const status = req.query.status as string | undefined;
      
      const supportRequests = await storage.getSupportRequests(limit, offset, status);
      res.json(supportRequests);
    } catch (error) {
      console.error("Failed to fetch support requests:", error);
      res.status(500).json({ error: "Failed to fetch support requests" });
    }
  });
  
  // Get a specific support request (admin or requesting user)
  app.get("/api/support/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }
      
      const supportRequest = await storage.getSupportRequest(id);
      if (!supportRequest) {
        return res.status(404).json({ error: "Support request not found" });
      }
      
      // Check if user is authorized (admin or the requesting user)
      const userId = req.session.userId;
      const userRole = req.session.userRole;
      
      if (userId && (userRole === 'platformAdmin' || supportRequest.userId === userId)) {
        res.json(supportRequest);
      } else {
        res.status(403).json({ error: "Not authorized to view this support request" });
      }
    } catch (error) {
      console.error("Failed to fetch support request:", error);
      res.status(500).json({ error: "Failed to fetch support request" });
    }
  });
  
  // Create a new support request (any user)
  app.post("/api/support", async (req: Request, res: Response) => {
    try {
      // Validate with Zod schema
      const supportRequestData = insertSupportRequestSchema.parse({
        ...req.body,
        userId: req.session.userId || null
      });
      
      const newSupportRequest = await storage.createSupportRequest(supportRequestData);
      
      // Send confirmation email to user
      try {
        const { sendEmail } = await import('./utils/email-service');
        
        await sendEmail({
          to: supportRequestData.email,
          from: 'support@smartschoolfinder.com',
          subject: 'Your Support Request - SmartSchool Finder',
          text: `Dear ${supportRequestData.name},\n\nThank you for contacting SmartSchool Finder support. We have received your request with the subject "${supportRequestData.subject}".\n\nOur team will review your message and respond as soon as possible. Your request has been assigned the following priority: ${supportRequestData.priority || 'medium'}.\n\nBest regards,\nThe SmartSchool Finder Team`,
          html: `
            <p>Dear ${supportRequestData.name},</p>
            <p>Thank you for contacting SmartSchool Finder support. We have received your request with the subject <strong>${supportRequestData.subject}</strong>.</p>
            <p>Our team will review your message and respond as soon as possible. Your request has been assigned the following priority: <strong>${supportRequestData.priority || 'medium'}</strong>.</p>
            <p>Best regards,<br>The SmartSchool Finder Team</p>
          `
        });
        console.log(`Confirmation email sent to ${supportRequestData.email}`);
      } catch (emailError) {
        console.error("Failed to send confirmation email:", emailError);
        // Continue even if email fails
      }
      
      // Send notification to admin(s)
      try {
        const { sendEmail } = await import('./utils/email-service');
        
        await sendEmail({
          to: 'admin@smartschoolfinder.com',
          from: 'notifications@smartschoolfinder.com',
          subject: `New Support Request: ${supportRequestData.subject}`,
          text: `A new support request has been submitted.\n\nFrom: ${supportRequestData.name} (${supportRequestData.email})\nCategory: ${supportRequestData.category}\nPriority: ${supportRequestData.priority || 'medium'}\nSubject: ${supportRequestData.subject}\n\nMessage:\n${supportRequestData.message}\n\nPlease log in to the admin dashboard to respond.`,
          html: `
            <h2>New Support Request</h2>
            <p><strong>From:</strong> ${supportRequestData.name} (${supportRequestData.email})</p>
            <p><strong>Category:</strong> ${supportRequestData.category}</p>
            <p><strong>Priority:</strong> ${supportRequestData.priority || 'medium'}</p>
            <p><strong>Subject:</strong> ${supportRequestData.subject}</p>
            <p><strong>Message:</strong></p>
            <div style="padding: 15px; background-color: #f5f5f5; border-radius: 4px;">
              ${supportRequestData.message.replace(/\n/g, '<br>')}
            </div>
            <p><a href="${process.env.BASE_URL || 'https://smartschoolfinder.replit.app'}/dashboard/platform-admin/messages">Log in to the admin dashboard</a> to respond.</p>
          `
        });
        console.log('Admin notification email sent');
      } catch (emailError) {
        console.error("Failed to send admin notification email:", emailError);
        // Continue even if email fails
      }
      
      res.status(201).json(newSupportRequest);
    } catch (error) {
      if (error instanceof ZodError) {
        return handleZodError(error, res);
      }
      console.error("Failed to create support request:", error);
      res.status(500).json({ error: "Failed to create support request" });
    }
  });
  
  // Update a support request (admin only)
  app.patch("/api/support/:id", requireAdminRole, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }
      
      const updateData: Partial<InsertSupportRequest> = {};
      
      // Only allow specific fields to be updated
      if (req.body.status) updateData.status = req.body.status;
      if (req.body.priority) updateData.priority = req.body.priority;
      
      // Add response if present (with respondedBy and respondedAt handled in storage)
      if (req.body.response) {
        updateData.response = req.body.response;
        updateData.respondedAt = new Date();
        // Mark as resolved when responding
        if (!updateData.status) {
          updateData.status = 'resolved';
        }
        
        // Add code to send email notification when responding
        try {
          // Get the existing support request to get the user's email
          const supportRequest = await storage.getSupportRequest(id);
          if (supportRequest && supportRequest.email) {
            // Import email service
            const { sendEmail } = await import('./utils/email-service');
            
            await sendEmail({
              to: supportRequest.email,
              from: 'support@smartschoolfinder.com',
              subject: `Re: ${supportRequest.subject} - Response from SmartSchool Finder`,
              text: `Dear ${supportRequest.name},\n\nThank you for contacting SmartSchool Finder. Here is our response to your inquiry:\n\n${req.body.response}\n\nBest regards,\nThe SmartSchool Finder Team`,
              html: `
                <p>Dear ${supportRequest.name},</p>
                <p>Thank you for contacting SmartSchool Finder. Here is our response to your inquiry:</p>
                <blockquote style="border-left: 2px solid #ccc; padding-left: 15px; margin-left: 0;">
                  ${req.body.response.replace(/\n/g, '<br>')}
                </blockquote>
                <p>Best regards,<br>The SmartSchool Finder Team</p>
              `
            });
            console.log(`Response email sent to ${supportRequest.email}`);
          }
        } catch (emailError) {
          console.error("Failed to send response email:", emailError);
          // Continue with the response even if email fails
        }
      }
      
      const updatedSupportRequest = await storage.updateSupportRequest(id, {
        ...updateData,
        respondedBy: req.session.userId
      });
      
      if (!updatedSupportRequest) {
        return res.status(404).json({ error: "Support request not found" });
      }
      
      res.json(updatedSupportRequest);
    } catch (error) {
      console.error("Failed to update support request:", error);
      res.status(500).json({ error: "Failed to update support request" });
    }
  });
  
  // Delete a support request (admin only)
  app.delete("/api/support/:id", requireAdminRole, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }
      
      const success = await storage.deleteSupportRequest(id);
      if (!success) {
        return res.status(404).json({ error: "Support request not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Failed to delete support request:", error);
      res.status(500).json({ error: "Failed to delete support request" });
    }
  });
  
  // Get support requests for the current user
  app.get("/api/user/support", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      const supportRequests = await storage.getUserSupportRequests(userId);
      res.json(supportRequests);
    } catch (error) {
      console.error("Failed to fetch user support requests:", error);
      res.status(500).json({ error: "Failed to fetch user support requests" });
    }
  });

  // SCHOOL CATEGORIES ROUTES
  
  // Get all school categories
  app.get("/api/school-categories", async (req: Request, res: Response) => {
    try {
      const categories = await storage.getSchoolCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching school categories:", error);
      res.status(500).json({ error: "Failed to fetch school categories" });
    }
  });
  
  // Get a specific school category
  app.get("/api/school-categories/:id", async (req: Request, res: Response) => {
    try {
      const categoryId = parseInt(req.params.id);
      if (isNaN(categoryId)) {
        return res.status(400).json({ error: "Invalid category ID" });
      }
      
      const category = await storage.getSchoolCategory(categoryId);
      
      if (!category) {
        return res.status(404).json({ error: "School category not found" });
      }
      
      res.json(category);
    } catch (error) {
      console.error(`Error fetching school category with id ${req.params.id}:`, error);
      res.status(500).json({ error: "Failed to fetch school category" });
    }
  });
  
  // Create a new school category (platform admin only)
  app.post("/api/school-categories", requireAdminRole, async (req: Request, res: Response) => {
    try {
      const validatedData = insertSchoolCategorySchema.parse(req.body);
      const newCategory = await storage.createSchoolCategory(validatedData);
      res.status(201).json(newCategory);
    } catch (error) {
      console.error("Error creating school category:", error);
      if (error instanceof ZodError) {
        return handleZodError(error, res);
      }
      res.status(500).json({ error: "Failed to create school category" });
    }
  });
  
  // Update a school category (platform admin only)
  app.patch("/api/school-categories/:id", requireAdminRole, async (req: Request, res: Response) => {
    try {
      const categoryId = parseInt(req.params.id);
      if (isNaN(categoryId)) {
        return res.status(400).json({ error: "Invalid category ID" });
      }
      
      const category = await storage.getSchoolCategory(categoryId);
      
      if (!category) {
        return res.status(404).json({ error: "School category not found" });
      }
      
      const validatedData = insertSchoolCategorySchema.partial().parse(req.body);
      const updatedCategory = await storage.updateSchoolCategory(categoryId, validatedData);
      res.json(updatedCategory);
    } catch (error) {
      console.error(`Error updating school category with id ${req.params.id}:`, error);
      if (error instanceof ZodError) {
        return handleZodError(error, res);
      }
      res.status(500).json({ error: "Failed to update school category" });
    }
  });
  
  // Delete a school category (platform admin only)
  app.delete("/api/school-categories/:id", requireAdminRole, async (req: Request, res: Response) => {
    try {
      const categoryId = parseInt(req.params.id);
      if (isNaN(categoryId)) {
        return res.status(400).json({ error: "Invalid category ID" });
      }
      
      const category = await storage.getSchoolCategory(categoryId);
      
      if (!category) {
        return res.status(404).json({ error: "School category not found" });
      }
      
      const result = await storage.deleteSchoolCategory(categoryId);
      if (result) {
        res.status(204).end();
      } else {
        res.status(500).json({ error: "Failed to delete school category" });
      }
    } catch (error) {
      console.error(`Error deleting school category with id ${req.params.id}:`, error);
      res.status(500).json({ error: "Failed to delete school category" });
    }
  });
  
  // Get categories for a specific school
  app.get("/api/schools/:schoolId/categories", async (req: Request, res: Response) => {
    try {
      const schoolId = parseInt(req.params.schoolId);
      if (isNaN(schoolId)) {
        return res.status(400).json({ error: "Invalid school ID" });
      }
      
      const categories = await storage.getSchoolCategoriesBySchoolId(schoolId);
      res.json(categories);
    } catch (error) {
      console.error(`Error fetching categories for school with id ${req.params.schoolId}:`, error);
      res.status(500).json({ error: "Failed to fetch school categories" });
    }
  });
  
  // Add a category to a school (school admin or platform admin)
  app.post("/api/schools/:schoolId/categories", requireAuth, async (req: Request, res: Response) => {
    try {
      const schoolId = parseInt(req.params.schoolId);
      if (isNaN(schoolId)) {
        return res.status(400).json({ error: "Invalid school ID" });
      }
      
      const userId = req.session.userId!;
      const user = await storage.getUser(userId);
      
      // Check if user is platform admin or admin of this school
      const school = await storage.getSchool(schoolId);
      if (!school) {
        return res.status(404).json({ error: "School not found" });
      }
      
      if (user!.role !== 'platformAdmin' && school.admin_id !== userId) {
        return res.status(403).json({ error: "Not authorized to manage this school's categories" });
      }
      
      const { categoryId } = req.body;
      if (!categoryId) {
        return res.status(400).json({ error: "Category ID is required" });
      }
      
      const category = await storage.getSchoolCategory(parseInt(categoryId));
      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }
      
      const relation = await storage.addCategoryToSchool({
        schoolId,
        categoryId: parseInt(categoryId)
      });
      
      res.status(201).json(relation);
    } catch (error) {
      console.error(`Error adding category to school with id ${req.params.schoolId}:`, error);
      res.status(500).json({ error: "Failed to add category to school" });
    }
  });
  
  // Remove a category from a school (school admin or platform admin)
  app.delete("/api/schools/:schoolId/categories/:categoryId", requireAuth, async (req: Request, res: Response) => {
    try {
      const schoolId = parseInt(req.params.schoolId);
      const categoryId = parseInt(req.params.categoryId);
      if (isNaN(schoolId) || isNaN(categoryId)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }
      
      const userId = req.session.userId!;
      const user = await storage.getUser(userId);
      
      // Check if user is platform admin or admin of this school
      const school = await storage.getSchool(schoolId);
      if (!school) {
        return res.status(404).json({ error: "School not found" });
      }
      
      if (user!.role !== 'platformAdmin' && school.admin_id !== userId) {
        return res.status(403).json({ error: "Not authorized to manage this school's categories" });
      }
      
      const result = await storage.removeCategoryFromSchool(schoolId, categoryId);
      if (result) {
        res.status(204).end();
      } else {
        res.status(500).json({ error: "Failed to remove category from school" });
      }
    } catch (error) {
      console.error(`Error removing category from school:`, error);
      res.status(500).json({ error: "Failed to remove category from school" });
    }
  });
  
  // SCHOOL MEDIA ROUTES
  
  // Get media for a specific school
  app.get("/api/schools/:schoolId/media", async (req: Request, res: Response) => {
    try {
      const schoolId = parseInt(req.params.schoolId);
      if (isNaN(schoolId)) {
        return res.status(400).json({ error: "Invalid school ID" });
      }
      
      const media = await storage.getSchoolMedia(schoolId);
      res.json(media);
    } catch (error) {
      console.error(`Error fetching media for school with id ${req.params.schoolId}:`, error);
      res.status(500).json({ error: "Failed to fetch school media" });
    }
  });
  
  // Get a specific media item
  app.get("/api/schools/media/:id", async (req: Request, res: Response) => {
    try {
      const mediaId = parseInt(req.params.id);
      if (isNaN(mediaId)) {
        return res.status(400).json({ error: "Invalid media ID" });
      }
      
      const media = await storage.getSchoolMediaItem(mediaId);
      
      if (!media) {
        return res.status(404).json({ error: "School media not found" });
      }
      
      res.json(media);
    } catch (error) {
      console.error(`Error fetching school media with id ${req.params.id}:`, error);
      res.status(500).json({ error: "Failed to fetch school media" });
    }
  });
  
  // Add media to a school (school admin or platform admin)
  app.post("/api/schools/:schoolId/media", requireAuth, async (req: Request, res: Response) => {
    try {
      const schoolId = parseInt(req.params.schoolId);
      if (isNaN(schoolId)) {
        return res.status(400).json({ error: "Invalid school ID" });
      }
      
      const userId = req.session.userId!;
      const user = await storage.getUser(userId);
      
      // Check if user is platform admin or admin of this school
      const school = await storage.getSchool(schoolId);
      if (!school) {
        return res.status(404).json({ error: "School not found" });
      }
      
      if (user!.role !== 'platformAdmin' && school.admin_id !== userId) {
        return res.status(403).json({ error: "Not authorized to manage this school's media" });
      }
      
      const validatedData = insertSchoolMediaSchema.parse({
        ...req.body,
        schoolId,
        createdBy: userId
      });
      
      const newMedia = await storage.createSchoolMedia(validatedData);
      res.status(201).json(newMedia);
    } catch (error) {
      console.error(`Error adding media to school with id ${req.params.schoolId}:`, error);
      if (error instanceof ZodError) {
        return handleZodError(error, res);
      }
      res.status(500).json({ error: "Failed to add media to school" });
    }
  });
  
  // Update a media item (school admin or platform admin)
  app.patch("/api/schools/media/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const mediaId = parseInt(req.params.id);
      if (isNaN(mediaId)) {
        return res.status(400).json({ error: "Invalid media ID" });
      }
      
      const userId = req.session.userId!;
      const user = await storage.getUser(userId);
      
      const media = await storage.getSchoolMediaItem(mediaId);
      if (!media) {
        return res.status(404).json({ error: "School media not found" });
      }
      
      // Check if user is platform admin or admin of this school
      const school = await storage.getSchool(media.schoolId);
      if (!school) {
        return res.status(404).json({ error: "School not found" });
      }
      
      if (user!.role !== 'platformAdmin' && school.admin_id !== userId) {
        return res.status(403).json({ error: "Not authorized to manage this school's media" });
      }
      
      const validatedData = insertSchoolMediaSchema.partial().parse(req.body);
      const updatedMedia = await storage.updateSchoolMedia(mediaId, validatedData);
      res.json(updatedMedia);
    } catch (error) {
      console.error(`Error updating school media with id ${req.params.id}:`, error);
      if (error instanceof ZodError) {
        return handleZodError(error, res);
      }
      res.status(500).json({ error: "Failed to update school media" });
    }
  });
  
  // Delete a media item (school admin or platform admin)
  app.delete("/api/schools/media/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const mediaId = parseInt(req.params.id);
      if (isNaN(mediaId)) {
        return res.status(400).json({ error: "Invalid media ID" });
      }
      
      const userId = req.session.userId!;
      const user = await storage.getUser(userId);
      
      const media = await storage.getSchoolMediaItem(mediaId);
      if (!media) {
        return res.status(404).json({ error: "School media not found" });
      }
      
      // Check if user is platform admin or admin of this school
      const school = await storage.getSchool(media.schoolId);
      if (!school) {
        return res.status(404).json({ error: "School not found" });
      }
      
      if (user!.role !== 'platformAdmin' && school.admin_id !== userId) {
        return res.status(403).json({ error: "Not authorized to manage this school's media" });
      }
      
      const result = await storage.deleteSchoolMedia(mediaId);
      if (result) {
        res.status(204).end();
      } else {
        res.status(500).json({ error: "Failed to delete school media" });
      }
    } catch (error) {
      console.error(`Error deleting school media with id ${req.params.id}:`, error);
      res.status(500).json({ error: "Failed to delete school media" });
    }
  });

  return httpServer;
}

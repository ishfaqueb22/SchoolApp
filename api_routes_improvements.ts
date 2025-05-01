import { Router, Request, Response } from "express";
import { storage } from "./server/storage";
import { openaiService } from "./server/openai-service";
import { 
  insertSchoolCategorySchema,
  insertSchoolCategoryRelationSchema,
  insertSchoolMediaSchema,
  insertUserPreferencesSchema,
  insertUserNotificationSchema,
  insertUserProfileSchema
} from "./schema_improvements";
import session from 'express-session';

// Declare session data type to make TypeScript happy
declare module 'express-session' {
  interface SessionData {
    userId?: number;
    userRole?: string;
  }
}

// Extend Express Request type to include session
declare global {
  namespace Express {
    interface Request {
      session: session.Session & Partial<session.SessionData>;
    }
  }
}

// We need to define these middleware functions here since they're not exported from routes.ts
const requireAuth = (req: Request, res: Response, next: Function) => {
  if (!req.session?.userId) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
};

const requireSchoolAdminAuth = (req: Request, res: Response, next: Function) => {
  if (!req.session?.userId) {
    return res.status(401).json({ error: "Authentication required" });
  }
  
  if (req.session.userRole !== 'schoolAdmin' && req.session.userRole !== 'platformAdmin') {
    return res.status(403).json({ error: "School administrator access required" });
  }
  
  next();
};

const requirePlatformAdminAuth = (req: Request, res: Response, next: Function) => {
  if (!req.session?.userId) {
    return res.status(401).json({ error: "Authentication required" });
  }
  
  if (req.session.userRole !== 'platformAdmin') {
    return res.status(403).json({ error: "Platform administrator access required" });
  }
  
  next();
};

export const extendedRouter = Router();

// SCHOOL CATEGORIES ROUTES

// Get all school categories
extendedRouter.get("/school-categories", async (req: Request, res: Response) => {
  try {
    const categories = await storage.getSchoolCategories();
    res.json(categories);
  } catch (error) {
    console.error("Error fetching school categories:", error);
    res.status(500).json({ error: "Failed to fetch school categories" });
  }
});

// Create school category (platform admin only)
extendedRouter.post(
  "/school-categories",
  requirePlatformAdminAuth,
  async (req: Request, res: Response) => {
    try {
      const validatedData = insertSchoolCategorySchema.parse(req.body);
      const category = await storage.createSchoolCategory(validatedData);
      res.status(201).json(category);
    } catch (error) {
      console.error("Error creating school category:", error);
      res.status(400).json({ error: "Invalid category data" });
    }
  }
);

// Get school categories for a specific school
extendedRouter.get("/schools/:schoolId/categories", async (req: Request, res: Response) => {
  try {
    const schoolId = parseInt(req.params.schoolId);
    const categories = await storage.getSchoolCategoriesBySchoolId(schoolId);
    res.json(categories);
  } catch (error) {
    console.error("Error fetching school categories:", error);
    res.status(500).json({ error: "Failed to fetch school categories" });
  }
});

// Add category to school (school admin or platform admin)
extendedRouter.post(
  "/schools/:schoolId/categories",
  requireSchoolAdminAuth,
  async (req: Request, res: Response) => {
    try {
      const schoolId = parseInt(req.params.schoolId);
      const { categoryId } = req.body;
      
      // Check if user is authorized for this school
      const userId = req.session.userId!;
      const school = await storage.getSchool(schoolId);
      
      if (!school) {
        return res.status(404).json({ error: "School not found" });
      }
      
      if (req.session.userRole !== "platformAdmin" && school.adminId !== userId) {
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
extendedRouter.delete(
  "/schools/:schoolId/categories/:categoryId",
  requireSchoolAdminAuth,
  async (req: Request, res: Response) => {
    try {
      const schoolId = parseInt(req.params.schoolId);
      const categoryId = parseInt(req.params.categoryId);
      
      // Check if user is authorized for this school
      const userId = req.session.userId!;
      const school = await storage.getSchool(schoolId);
      
      if (!school) {
        return res.status(404).json({ error: "School not found" });
      }
      
      if (req.session.userRole !== "platformAdmin" && school.adminId !== userId) {
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
extendedRouter.get("/schools/:schoolId/media", async (req: Request, res: Response) => {
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
extendedRouter.post(
  "/schools/:schoolId/media",
  requireSchoolAdminAuth,
  async (req: Request, res: Response) => {
    try {
      const schoolId = parseInt(req.params.schoolId);
      const userId = req.session.userId!;
      
      // Check if user is authorized for this school
      const school = await storage.getSchool(schoolId);
      
      if (!school) {
        return res.status(404).json({ error: "School not found" });
      }
      
      if (req.session.userRole !== "platformAdmin" && school.adminId !== userId) {
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
      console.error("Error adding media to school:", error);
      res.status(400).json({ error: "Invalid media data" });
    }
  }
);

// Delete media from school
extendedRouter.delete(
  "/schools/:schoolId/media/:mediaId",
  requireSchoolAdminAuth,
  async (req: Request, res: Response) => {
    try {
      const schoolId = parseInt(req.params.schoolId);
      const mediaId = parseInt(req.params.mediaId);
      const userId = req.session.userId!;
      
      // Check if user is authorized for this school
      const school = await storage.getSchool(schoolId);
      
      if (!school) {
        return res.status(404).json({ error: "School not found" });
      }
      
      if (req.session.userRole !== "platformAdmin" && school.adminId !== userId) {
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
extendedRouter.get(
  "/user/preferences",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      const preferences = await storage.getUserPreferences(userId);
      res.json(preferences || {});
    } catch (error) {
      console.error("Error fetching user preferences:", error);
      res.status(500).json({ error: "Failed to fetch user preferences" });
    }
  }
);

// Update user preferences
extendedRouter.post(
  "/user/preferences",
  requireAuth,
  async (req: Request, res: Response) => {
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
      console.error("Error updating user preferences:", error);
      res.status(400).json({ error: "Invalid preference data" });
    }
  }
);

// USER NOTIFICATIONS ROUTES

// Get user notifications
extendedRouter.get(
  "/user/notifications",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      const notifications = await storage.getUserNotifications(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching user notifications:", error);
      res.status(500).json({ error: "Failed to fetch user notifications" });
    }
  }
);

// Mark notification as read
extendedRouter.patch(
  "/user/notifications/:notificationId",
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
extendedRouter.post(
  "/user/notifications/read-all",
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

// AI DESCRIPTION GENERATION

// Generate a school description using OpenAI
extendedRouter.post(
  "/ai/generate-school-description",
  requireSchoolAdminAuth,
  async (req: Request, res: Response) => {
    try {
      const {
        name,
        type,
        curriculumType,
        gradeRange,
        location,
        features,
        establishedYear,
        classSize
      } = req.body;
      
      // Validate required fields
      if (!name || !type || !curriculumType || !gradeRange || !location) {
        return res.status(400).json({
          error: "Missing required fields. Please provide name, type, curriculumType, gradeRange, and location."
        });
      }
      
      // Check if categories were provided
      let categories: { name: string; description: string }[] = [];
      if (req.body.schoolId) {
        const schoolId = parseInt(req.body.schoolId);
        const schoolCategories = await storage.getSchoolCategoriesBySchoolId(schoolId);
        
        // Map to simplified structure with only the fields we need
        categories = schoolCategories.map(cat => ({
          name: cat.name,
          description: cat.description || '' // Convert null descriptions to empty string
        }));
      }
      
      // Generate description
      const description = await openaiService.generateSchoolDescription({
        name,
        type,
        curriculumType,
        gradeRange,
        location,
        features,
        establishedYear,
        classSize,
        categories
      });
      
      res.json({ description });
    } catch (error) {
      console.error("Error generating school description:", error);
      res.status(500).json({ error: "Failed to generate description" });
    }
  }
);

// Analyze a school description
extendedRouter.post(
  "/ai/analyze-school-description",
  requireSchoolAdminAuth,
  async (req: Request, res: Response) => {
    try {
      const { description } = req.body;
      
      if (!description || typeof description !== 'string') {
        return res.status(400).json({
          error: "Missing or invalid description field"
        });
      }
      
      const analysis = await openaiService.analyzeSchoolDescription(description);
      res.json(analysis);
    } catch (error) {
      console.error("Error analyzing school description:", error);
      res.status(500).json({ error: "Failed to analyze description" });
    }
  }
);

// USER PROFILE ROUTES

// Get user profile
extendedRouter.get(
  "/user/profile",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      const profile = await storage.getUserProfile(userId);
      res.json(profile || {});
    } catch (error) {
      console.error("Error fetching user profile:", error);
      res.status(500).json({ error: "Failed to fetch user profile" });
    }
  }
);

// Update user profile
extendedRouter.post(
  "/user/profile",
  requireAuth,
  async (req: Request, res: Response) => {
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
      console.error("Error updating user profile:", error);
      res.status(400).json({ error: "Invalid profile data" });
    }
  }
);

// Get another user's public profile
extendedRouter.get(
  "/users/:userId/profile",
  async (req: Request, res: Response) => {
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
  }
);
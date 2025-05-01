import { Router, Request, Response } from "express";
import { storage } from "../storage";
import { UserSchoolsService } from "../user-schools-service";
import { insertUserSchoolSchema } from "@shared/schema";
import { requireAuth, requireAdminRole, requireSchoolAdminRole } from "../middlewares/auth";
import { z } from "zod";

const userSchoolsService = new UserSchoolsService();
export const userSchoolsRouter = Router();

// Get schools managed by the authenticated user
userSchoolsRouter.get(
  "/managed-schools",
  requireAuth,
  requireSchoolAdminRole,
  async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      
      // Get user-school associations
      const userSchools = await userSchoolsService.getUserSchools(userId);
      
      // Get the actual school data for each association
      const schoolPromises = userSchools.map(async (userSchool) => {
        const school = await storage.getSchool(userSchool.schoolId);
        if (school) {
          return {
            ...school,
            userSchoolRelation: userSchool
          };
        }
        return null;
      });
      
      const schools = (await Promise.all(schoolPromises)).filter(Boolean);
      
      res.json(schools);
    } catch (error) {
      console.error("Error fetching managed schools:", error);
      res.status(500).json({ error: "Failed to fetch managed schools" });
    }
  }
);

// Add user as admin to a school (platform admin only)
userSchoolsRouter.post(
  "/assign",
  requireAuth,
  requireAdminRole,
  async (req: Request, res: Response) => {
    try {
      const { userId, schoolId, isMainAdmin, role, permissions } = req.body;
      
      // Validate input
      const assignSchema = z.object({
        userId: z.number(),
        schoolId: z.number(),
        isMainAdmin: z.boolean().optional(),
        role: z.string().optional(),
        permissions: z.object({
          canEditPosts: z.boolean().optional(),
          canManageFaculty: z.boolean().optional(),
          canManageInquiries: z.boolean().optional(),
          canManageSettings: z.boolean().optional()
        }).optional()
      });
      
      const validatedData = assignSchema.parse(req.body);
      
      // Check if school exists
      const school = await storage.getSchool(validatedData.schoolId);
      if (!school) {
        return res.status(404).json({ error: "School not found" });
      }
      
      // Check if user exists
      const user = await storage.getUser(validatedData.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Check if user is already associated with this school
      const existingAssociation = await userSchoolsService.isSchoolAdmin(
        validatedData.userId, 
        validatedData.schoolId
      );
      
      if (existingAssociation) {
        return res.status(400).json({ 
          error: "User is already associated with this school" 
        });
      }
      
      // Create the association
      const userSchool = await userSchoolsService.createUserSchool({
        userId: validatedData.userId,
        schoolId: validatedData.schoolId,
        isMainAdmin: validatedData.isMainAdmin || false,
        role: validatedData.role || "editor",
        canEditPosts: validatedData.permissions?.canEditPosts ?? true,
        canManageFaculty: validatedData.permissions?.canManageFaculty ?? true,
        canManageInquiries: validatedData.permissions?.canManageInquiries ?? true,
        canManageSettings: validatedData.permissions?.canManageSettings ?? false
      });
      
      res.status(201).json(userSchool);
    } catch (error) {
      console.error("Error assigning user to school:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid input data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to assign user to school" });
    }
  }
);

// Update user-school association
userSchoolsRouter.patch(
  "/:userId/:schoolId",
  requireAuth,
  requireAdminRole,
  async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const schoolId = parseInt(req.params.schoolId);
      
      // Validate input
      const updateSchema = insertUserSchoolSchema.partial().omit({ userId: true, schoolId: true });
      const validatedData = updateSchema.parse(req.body);
      
      // Check if association exists
      const exists = await userSchoolsService.isSchoolAdmin(userId, schoolId);
      if (!exists) {
        return res.status(404).json({ 
          error: "User-school association not found" 
        });
      }
      
      // Update the association
      const userSchool = await userSchoolsService.updateUserSchool(
        userId, 
        schoolId, 
        validatedData
      );
      
      res.json(userSchool);
    } catch (error) {
      console.error("Error updating user-school association:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid input data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update user-school association" });
    }
  }
);

// Remove user from school
userSchoolsRouter.delete(
  "/:userId/:schoolId",
  requireAuth,
  requireAdminRole,
  async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const schoolId = parseInt(req.params.schoolId);
      
      // Check if association exists
      const exists = await userSchoolsService.isSchoolAdmin(userId, schoolId);
      if (!exists) {
        return res.status(404).json({ 
          error: "User-school association not found" 
        });
      }
      
      // Remove the association
      const success = await userSchoolsService.removeUserSchool(userId, schoolId);
      
      if (success) {
        res.json({ success: true });
      } else {
        res.status(500).json({ error: "Failed to remove user from school" });
      }
    } catch (error) {
      console.error("Error removing user from school:", error);
      res.status(500).json({ error: "Failed to remove user from school" });
    }
  }
);

// Get users associated with a school
userSchoolsRouter.get(
  "/school/:schoolId/users",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const schoolId = parseInt(req.params.schoolId);
      
      // Check if school exists
      const school = await storage.getSchool(schoolId);
      if (!school) {
        return res.status(404).json({ error: "School not found" });
      }
      
      // Check if user is authorized to access this school's data
      // Platform admins can access any school's data
      // School admins can only access data for schools they manage
      if (req.session.userRole !== "admin") {
        const isSchoolAdmin = await userSchoolsService.isSchoolAdmin(
          req.session.userId!, 
          schoolId
        );
        
        if (!isSchoolAdmin) {
          return res.status(403).json({ 
            error: "Not authorized to access this school's data" 
          });
        }
      }
      
      // Get user-school associations
      const userSchools = await userSchoolsService.getSchoolUsers(schoolId);
      
      // Get the actual user data for each association
      const userPromises = userSchools.map(async (userSchool) => {
        const user = await storage.getUser(userSchool.userId);
        if (user) {
          // Remove sensitive data before sending
          const { password, ...userWithoutPassword } = user;
          
          return {
            ...userWithoutPassword,
            userSchoolRelation: userSchool
          };
        }
        return null;
      });
      
      const users = (await Promise.all(userPromises)).filter(Boolean);
      
      res.json(users);
    } catch (error) {
      console.error("Error fetching school users:", error);
      res.status(500).json({ error: "Failed to fetch school users" });
    }
  }
);

// Check if current user is admin of a school
userSchoolsRouter.get(
  "/check-admin/:schoolId",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const schoolId = parseInt(req.params.schoolId);
      const userId = req.session.userId!;
      
      // Platform admins have access to all schools
      if (req.session.userRole === "admin") {
        return res.json({ isAdmin: true, isPlatformAdmin: true });
      }
      
      // Check if user is admin of this school
      const isSchoolAdmin = await userSchoolsService.isSchoolAdmin(userId, schoolId);
      
      if (isSchoolAdmin) {
        // Get the specific user-school association
        const userSchools = await userSchoolsService.getUserSchools(userId);
        const schoolAssociation = userSchools.find(us => us.schoolId === schoolId);
        
        return res.json({ 
          isAdmin: true, 
          isPlatformAdmin: false,
          isMainAdmin: schoolAssociation?.isMainAdmin || false,
          permissions: {
            canEditPosts: schoolAssociation?.canEditPosts,
            canManageFaculty: schoolAssociation?.canManageFaculty,
            canManageInquiries: schoolAssociation?.canManageInquiries,
            canManageSettings: schoolAssociation?.canManageSettings
          }
        });
      }
      
      res.json({ isAdmin: false, isPlatformAdmin: false });
    } catch (error) {
      console.error("Error checking admin status:", error);
      res.status(500).json({ error: "Failed to check admin status" });
    }
  }
);
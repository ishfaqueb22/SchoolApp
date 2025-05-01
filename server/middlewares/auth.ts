import { Request, Response, NextFunction } from "express";
import { UserSchoolsService } from "../user-schools-service";

const userSchoolsService = new UserSchoolsService();

// Declare session data type to match our application
declare module 'express-session' {
  interface SessionData {
    userId?: number;
    userRole?: string;
  }
}

/**
 * Authentication middleware to ensure user is logged in
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  next();
};

/**
 * Authorization middleware to ensure user has school admin role
 */
export const requireSchoolAdminRole = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  
  if (req.session.userRole !== "schoolAdmin" && req.session.userRole !== "admin") {
    return res.status(403).json({ error: "Not authorized for school management" });
  }
  
  next();
};

/**
 * Authorization middleware to ensure user has platform admin role
 */
export const requireAdminRole = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  
  if (req.session.userRole !== "admin" && req.session.userRole !== "platformAdmin") {
    return res.status(403).json({ error: "Not authorized - Platform Admin access required" });
  }
  
  next();
};

/**
 * Check if user is admin of a specific school using userSchools service
 */
export const requireSchoolOwnership = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  
  // Platform admins have access to all schools
  if (req.session.userRole === "admin" || req.session.userRole === "platformAdmin") {
    return next();
  }
  
  // For school admins, check if they own this school
  if (req.session.userRole === "schoolAdmin") {
    const schoolId = parseInt(req.params.schoolId, 10);
    
    if (isNaN(schoolId)) {
      return res.status(400).json({ error: "Invalid school ID" });
    }
    
    // Check if the user is associated with this school
    const isSchoolAdmin = await userSchoolsService.isSchoolAdmin(req.session.userId, schoolId);
    
    if (isSchoolAdmin) {
      return next();
    }
  }
  
  return res.status(403).json({ error: "Not authorized for this school" });
};
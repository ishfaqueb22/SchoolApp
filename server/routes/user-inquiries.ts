import { Router, Request, Response } from "express";
import { storage } from "../storage";
import { requireAuth } from "../middlewares/auth";

export const userInquiriesRouter = Router();

// Get all inquiries for the authenticated user
userInquiriesRouter.get("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Get user's inquiries
    const userInquiries = await storage.getUserInquiries(userId);
    
    // Enhance inquiries with school names
    const enhancedInquiries = await Promise.all(
      userInquiries.map(async (inquiry) => {
        const school = await storage.getSchool(inquiry.schoolId);
        return {
          ...inquiry,
          schoolName: school ? school.name : "Unknown School"
        };
      })
    );
    
    res.json(enhancedInquiries);
  } catch (error) {
    console.error("Error fetching user inquiries:", error);
    res.status(500).json({ error: "Failed to fetch inquiries" });
  }
});
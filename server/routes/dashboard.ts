import { Router, Request, Response } from "express";
import { storage } from "../storage";
import { z } from "zod";
import { checkSchoolAccess } from "../utils/auth-helpers";
import { requireSchoolAdmin } from "./middleware";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";

const dashboardRouter = Router();

// Get dashboard data for a school
dashboardRouter.get("/admin/dashboard/:schoolId", requireSchoolAdmin, async (req: Request, res: Response) => {
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
    const totalCampuses = campuses.length;
    const totalFaculty = faculty.length;
    const activeFacultyCount = faculty.filter(f => f.isActive).length;
    const totalInquiries = inquiries.length;
    const newInquiriesCount = inquiries.filter(inquiry => 
      inquiry.status === 'new' || inquiry.status === null || inquiry.status === 'pending'
    ).length;
    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0 
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews 
      : 0;
    const totalPosts = posts.length;
    const publishedPostsCount = posts.filter(post => post.isPublished).length;
    
    // Generate monthly trend data for the last 6 months
    const monthLabels = [];
    const inquiriesByMonth = [];
    const reviewsByMonth = [];
    
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const month = subMonths(now, i);
      const monthLabel = format(month, 'MMM');
      monthLabels.push(monthLabel);
      
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      
      const monthInquiries = inquiries.filter(inquiry => {
        const inquiryDate = new Date(inquiry.createdAt);
        return inquiryDate >= monthStart && inquiryDate <= monthEnd;
      }).length;
      
      const monthReviews = reviews.filter(review => {
        const reviewDate = new Date(review.createdAt);
        return reviewDate >= monthStart && reviewDate <= monthEnd;
      }).length;
      
      inquiriesByMonth.push(monthInquiries);
      reviewsByMonth.push(monthReviews);
    }
    
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

// Update school details from dashboard
dashboardRouter.post("/admin/dashboard/:schoolId", requireSchoolAdmin, async (req: Request, res: Response) => {
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
    const { 
      name, 
      description, 
      type, 
      location, 
      address,
      curriculumType, 
      gradeRange, 
      classSize, 
      website, 
      imageUrl,
      contactEmail,
      contactPhone,
      establishedYear,
      features,
      multiCampus,
      hasFinancialAid
    } = req.body;
    
    // Update the school with the provided data
    const updatedSchool = await storage.updateSchool(schoolId, {
      name,
      description,
      type,
      location,
      address,
      curriculumType,
      gradeRange,
      classSize,
      website,
      imageUrl,
      contactEmail,
      contactPhone,
      establishedYear,
      features,
      multiCampus,
      hasFinancialAid
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

export default dashboardRouter;
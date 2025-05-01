import { Router, Request, Response } from "express";
import { storage } from "../storage";
import { z } from "zod";
import { insertSchoolMediaSchema } from "@shared/schema";
import { checkSchoolAccess } from "../utils/auth-helpers";

const mediaRouter = Router();

// Media upload schema with validation
const uploadMediaSchema = insertSchoolMediaSchema.extend({
  schoolId: z.number({ required_error: "School ID is required" }),
});

// Update media schema
const updateMediaSchema = uploadMediaSchema.partial().required({
  schoolId: true,
});

// Get all media for a school
mediaRouter.get("/schools/:schoolId/media", async (req: Request, res: Response) => {
  try {
    const schoolId = parseInt(req.params.schoolId);

    if (isNaN(schoolId)) {
      return res.status(400).json({ error: "Invalid school ID" });
    }

    const mediaItems = await storage.getSchoolMedia(schoolId);
    
    // Filter out private media items for non-admins
    const isAdmin = req.session.userId && await checkSchoolAccess(req.session.userId, schoolId);
    
    const filteredMediaItems = isAdmin 
      ? mediaItems 
      : mediaItems.filter(item => item.isPublic);

    res.json(filteredMediaItems);
  } catch (error) {
    console.error("Failed to fetch school media:", error);
    res.status(500).json({ error: "Failed to fetch school media" });
  }
});

// Get a specific media item
mediaRouter.get("/schools/:schoolId/media/:mediaId", async (req: Request, res: Response) => {
  try {
    const mediaId = parseInt(req.params.mediaId);

    if (isNaN(mediaId)) {
      return res.status(400).json({ error: "Invalid media ID" });
    }

    const mediaItem = await storage.getSchoolMediaItem(mediaId);
    
    if (!mediaItem) {
      return res.status(404).json({ error: "Media item not found" });
    }
    
    // Check if this media belongs to the requested school
    if (mediaItem.schoolId !== parseInt(req.params.schoolId)) {
      return res.status(403).json({ error: "Media doesn't belong to this school" });
    }
    
    // Check visibility for non-admin users
    const isAdmin = req.session.userId && await checkSchoolAccess(req.session.userId, mediaItem.schoolId);
    
    if (!isAdmin && !mediaItem.isPublic) {
      return res.status(403).json({ error: "You don't have permission to view this media" });
    }

    res.json(mediaItem);
  } catch (error) {
    console.error("Failed to fetch media item:", error);
    res.status(500).json({ error: "Failed to fetch media item" });
  }
});

// Create a new media item
mediaRouter.post("/schools/:schoolId/media", async (req: Request, res: Response) => {
  try {
    const schoolId = parseInt(req.params.schoolId);
    
    if (isNaN(schoolId)) {
      return res.status(400).json({ error: "Invalid school ID" });
    }
    
    // Check if user has admin access to this school
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    const hasAccess = await checkSchoolAccess(userId, schoolId);
    if (!hasAccess) {
      return res.status(403).json({ error: "You don't have permission to add media to this school" });
    }
    
    // Validate input
    const mediaData = uploadMediaSchema.parse({
      ...req.body,
      schoolId,
      createdBy: userId
    });
    
    const newMedia = await storage.createSchoolMedia(mediaData);
    
    res.status(201).json(newMedia);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: "Invalid media data", 
        details: error.errors 
      });
    }
    
    console.error("Failed to create media item:", error);
    res.status(500).json({ error: "Failed to create media item" });
  }
});

// Update a media item
mediaRouter.put("/schools/:schoolId/media/:mediaId", async (req: Request, res: Response) => {
  try {
    const schoolId = parseInt(req.params.schoolId);
    const mediaId = parseInt(req.params.mediaId);
    
    if (isNaN(schoolId) || isNaN(mediaId)) {
      return res.status(400).json({ error: "Invalid ID parameter" });
    }
    
    // Check if user has admin access to this school
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    const hasAccess = await checkSchoolAccess(userId, schoolId);
    if (!hasAccess) {
      return res.status(403).json({ error: "You don't have permission to update media for this school" });
    }
    
    // Check if media item exists and belongs to this school
    const existingMedia = await storage.getSchoolMediaItem(mediaId);
    
    if (!existingMedia) {
      return res.status(404).json({ error: "Media item not found" });
    }
    
    if (existingMedia.schoolId !== schoolId) {
      return res.status(403).json({ error: "Media doesn't belong to this school" });
    }
    
    // Validate update data
    const mediaData = updateMediaSchema.parse({
      ...req.body,
      schoolId
    });
    
    const updatedMedia = await storage.updateSchoolMedia(mediaId, mediaData);
    
    res.json(updatedMedia);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: "Invalid media data", 
        details: error.errors 
      });
    }
    
    console.error("Failed to update media item:", error);
    res.status(500).json({ error: "Failed to update media item" });
  }
});

// Delete a media item
mediaRouter.delete("/schools/:schoolId/media/:mediaId", async (req: Request, res: Response) => {
  try {
    const schoolId = parseInt(req.params.schoolId);
    const mediaId = parseInt(req.params.mediaId);
    
    if (isNaN(schoolId) || isNaN(mediaId)) {
      return res.status(400).json({ error: "Invalid ID parameter" });
    }
    
    // Check if user has admin access to this school
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    const hasAccess = await checkSchoolAccess(userId, schoolId);
    if (!hasAccess) {
      return res.status(403).json({ error: "You don't have permission to delete media from this school" });
    }
    
    // Check if media item exists and belongs to this school
    const existingMedia = await storage.getSchoolMediaItem(mediaId);
    
    if (!existingMedia) {
      return res.status(404).json({ error: "Media item not found" });
    }
    
    if (existingMedia.schoolId !== schoolId) {
      return res.status(403).json({ error: "Media doesn't belong to this school" });
    }
    
    const success = await storage.deleteSchoolMedia(mediaId);
    
    if (success) {
      res.json({ success: true });
    } else {
      res.status(500).json({ error: "Failed to delete media item" });
    }
  } catch (error) {
    console.error("Failed to delete media item:", error);
    res.status(500).json({ error: "Failed to delete media item" });
  }
});

export default mediaRouter;
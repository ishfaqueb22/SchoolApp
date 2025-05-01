import { Router, Request, Response } from "express";
import { storage } from "../storage";
import { z } from "zod";
import { insertSchoolCategorySchema, insertSchoolCategoryRelationSchema } from "@shared/schema";
import { checkSchoolAccess } from "../utils/auth-helpers";
import { requirePlatformAdmin, requireSchoolAdmin } from "./middleware";

const categoryRouter = Router();

// Get all school categories
categoryRouter.get("/school-categories", async (req: Request, res: Response) => {
  try {
    const categories = await storage.getSchoolCategories();
    res.json(categories);
  } catch (error) {
    console.error("Failed to fetch school categories:", error);
    res.status(500).json({ error: "Failed to fetch school categories" });
  }
});

// Get a specific category
categoryRouter.get("/school-categories/:id", async (req: Request, res: Response) => {
  try {
    const categoryId = parseInt(req.params.id);
    
    if (isNaN(categoryId)) {
      return res.status(400).json({ error: "Invalid category ID" });
    }
    
    const category = await storage.getSchoolCategory(categoryId);
    
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }
    
    res.json(category);
  } catch (error) {
    console.error("Failed to fetch category:", error);
    res.status(500).json({ error: "Failed to fetch category" });
  }
});

// Create a new category (platform admin only)
categoryRouter.post("/school-categories", requirePlatformAdmin, async (req: Request, res: Response) => {
  try {
    const categoryData = insertSchoolCategorySchema.parse(req.body);
    const newCategory = await storage.createSchoolCategory(categoryData);
    res.status(201).json(newCategory);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: "Invalid category data", 
        details: error.errors 
      });
    }
    
    console.error("Failed to create category:", error);
    res.status(500).json({ error: "Failed to create category" });
  }
});

// Update a category (platform admin only)
categoryRouter.put("/school-categories/:id", requirePlatformAdmin, async (req: Request, res: Response) => {
  try {
    const categoryId = parseInt(req.params.id);
    
    if (isNaN(categoryId)) {
      return res.status(400).json({ error: "Invalid category ID" });
    }
    
    const categoryData = insertSchoolCategorySchema.partial().parse(req.body);
    const updatedCategory = await storage.updateSchoolCategory(categoryId, categoryData);
    
    res.json(updatedCategory);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: "Invalid category data", 
        details: error.errors 
      });
    }
    
    console.error("Failed to update category:", error);
    res.status(500).json({ error: "Failed to update category" });
  }
});

// Delete a category (platform admin only)
categoryRouter.delete("/school-categories/:id", requirePlatformAdmin, async (req: Request, res: Response) => {
  try {
    const categoryId = parseInt(req.params.id);
    
    if (isNaN(categoryId)) {
      return res.status(400).json({ error: "Invalid category ID" });
    }
    
    const success = await storage.deleteSchoolCategory(categoryId);
    
    if (success) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: "Category not found" });
    }
  } catch (error) {
    console.error("Failed to delete category:", error);
    res.status(500).json({ error: "Failed to delete category" });
  }
});

// Get categories for a specific school
categoryRouter.get("/schools/:schoolId/categories", async (req: Request, res: Response) => {
  try {
    const schoolId = parseInt(req.params.schoolId);
    
    if (isNaN(schoolId)) {
      return res.status(400).json({ error: "Invalid school ID" });
    }
    
    const categories = await storage.getSchoolCategoriesBySchoolId(schoolId);
    res.json(categories);
  } catch (error) {
    console.error("Failed to fetch school categories:", error);
    res.status(500).json({ error: "Failed to fetch school categories" });
  }
});

// Add a category to a school
categoryRouter.post("/schools/:schoolId/categories", requireSchoolAdmin, async (req: Request, res: Response) => {
  try {
    const schoolId = parseInt(req.params.schoolId);
    
    if (isNaN(schoolId)) {
      return res.status(400).json({ error: "Invalid school ID" });
    }
    
    // Check if user has admin access to this school
    const userId = req.session.userId!;
    const hasAccess = await checkSchoolAccess(userId, schoolId);
    
    if (!hasAccess) {
      return res.status(403).json({ error: "You don't have permission to add categories to this school" });
    }
    
    // Validate the category ID
    const { categoryId } = req.body;
    if (!categoryId || isNaN(parseInt(categoryId))) {
      return res.status(400).json({ error: "Invalid category ID" });
    }
    
    // Check if the category exists
    const category = await storage.getSchoolCategory(parseInt(categoryId));
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }
    
    // Add the category to the school
    const relationData = {
      schoolId,
      categoryId: parseInt(categoryId)
    };
    
    const relation = await storage.addCategoryToSchool(relationData);
    
    res.status(201).json(relation);
  } catch (error) {
    console.error("Failed to add category to school:", error);
    res.status(500).json({ error: "Failed to add category to school" });
  }
});

// Remove a category from a school
categoryRouter.delete("/schools/:schoolId/categories/:categoryId", requireSchoolAdmin, async (req: Request, res: Response) => {
  try {
    const schoolId = parseInt(req.params.schoolId);
    const categoryId = parseInt(req.params.categoryId);
    
    if (isNaN(schoolId) || isNaN(categoryId)) {
      return res.status(400).json({ error: "Invalid ID parameter" });
    }
    
    // Check if user has admin access to this school
    const userId = req.session.userId!;
    const hasAccess = await checkSchoolAccess(userId, schoolId);
    
    if (!hasAccess) {
      return res.status(403).json({ error: "You don't have permission to remove categories from this school" });
    }
    
    const success = await storage.removeCategoryFromSchool(schoolId, categoryId);
    
    if (success) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: "Category relation not found" });
    }
  } catch (error) {
    console.error("Failed to remove category from school:", error);
    res.status(500).json({ error: "Failed to remove category from school" });
  }
});

export default categoryRouter;
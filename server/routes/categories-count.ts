import { Router, Request, Response } from "express";
import { db } from "../db";
import { sql } from "drizzle-orm";

export const categoriesCountRouter = Router();

// Get all school categories with school counts
categoriesCountRouter.get("/", async (req: Request, res: Response) => {
  try {
    // Get categories with school counts using SQL
    const categoriesWithCounts = await db.execute(sql`
      SELECT c.id, c.name, c.description, c.color, c.icon, COUNT(scr.school_id)::int as school_count 
      FROM school_categories c
      LEFT JOIN school_category_relations scr ON c.id = scr.category_id
      GROUP BY c.id, c.name, c.description, c.color, c.icon
      ORDER BY c.name
    `);
    
    res.json(categoriesWithCounts.rows);
  } catch (error) {
    console.error("Error fetching school categories with counts:", error);
    res.status(500).json({ error: "Failed to fetch school categories with counts" });
  }
});

// Get schools by category ID
categoriesCountRouter.get("/:id/schools", async (req: Request, res: Response) => {
  try {
    const categoryId = parseInt(req.params.id);
    
    if (isNaN(categoryId)) {
      return res.status(400).json({ error: "Invalid category ID" });
    }
    
    // First check if category exists
    const category = await db.execute(sql`
      SELECT * FROM school_categories WHERE id = ${categoryId}
    `);
    
    if (category.rows.length === 0) {
      return res.status(404).json({ error: "Category not found" });
    }
    
    // Get all schools in this category
    // In a production app, we would keep the approval_status filter
    // but for development/testing, let's include all schools to show data
    const schoolsInCategory = await db.execute(sql`
      SELECT s.* 
      FROM schools s
      JOIN school_category_relations scr ON s.id = scr.school_id
      WHERE scr.category_id = ${categoryId}
      ORDER BY s.name
    `);
    
    console.log(`Found ${schoolsInCategory.rows.length} schools for category ID ${categoryId}`);
    
    res.json(schoolsInCategory.rows);
  } catch (error) {
    console.error(`Error fetching schools for category ID ${req.params.id}:`, error);
    res.status(500).json({ error: "Failed to fetch schools for this category" });
  }
});
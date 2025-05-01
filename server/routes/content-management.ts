import { Router, Request, Response } from "express";
import { storage } from "../storage";
import { requireAuth, requireAdminRole } from "../middlewares/auth";
import { db } from "../db";
import { 
  insertContentPageSchema, 
  insertFaqItemSchema, 
  insertBlogPostSchema,
  insertCategorySchema,
  contentPages,
  faqItems,
  blogPosts,
  categories
} from "@shared/schema";
import { eq, and, like, desc, sql } from "drizzle-orm";
import { z } from "zod";

const router = Router();

// ==================== Public Content Routes ====================

/**
 * Get all published content pages
 */
router.get("/pages", async (_req: Request, res: Response) => {
  try {
    // Use direct DB query instead of storage to match actual database schema
    const pages = await db
      .select()
      .from(contentPages)
      .where(eq(contentPages.isPublished, true));
    
    res.json(pages);
  } catch (error) {
    console.error("Failed to fetch content pages:", error);
    res.status(500).json({ error: "Failed to fetch content pages" });
  }
});

/**
 * Get a specific content page by slug
 */
router.get("/pages/:slug", async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    
    // Use direct DB query instead of storage to match actual database schema
    const [page] = await db
      .select()
      .from(contentPages)
      .where(and(
        eq(contentPages.slug, slug),
        eq(contentPages.isPublished, true)
      ));
    
    if (!page) {
      return res.status(404).json({ error: "Content page not found" });
    }
    
    res.json(page);
  } catch (error) {
    console.error(`Failed to fetch content page with slug ${req.params.slug}:`, error);
    res.status(500).json({ error: "Failed to fetch content page" });
  }
});

/**
 * Get all FAQ items
 */
router.get("/faqs", async (req: Request, res: Response) => {
  try {
    const categoryId = req.query.category_id ? parseInt(req.query.category_id as string) : undefined;
    
    let query = db.select().from(faqItems);
    
    if (categoryId) {
      query = query.where(eq(faqItems.categoryId, categoryId));
    }
    
    // Order by order_index
    query = query.orderBy(faqItems.orderIndex);
    
    const faqs = await query;
    res.json(faqs);
  } catch (error) {
    console.error("Failed to fetch FAQs:", error);
    res.status(500).json({ error: "Failed to fetch FAQs" });
  }
});

/**
 * Get all FAQ categories
 */
router.get("/faq-categories", async (_req: Request, res: Response) => {
  try {
    // Get all FAQ categories
    const faqCategories = await db
      .select()
      .from(categories)
      .where(eq(categories.type, "faq"));
    
    res.json(faqCategories);
  } catch (error) {
    console.error("Failed to fetch FAQ categories:", error);
    res.status(500).json({ error: "Failed to fetch FAQ categories" });
  }
});

/**
 * Get all published blog posts
 */
router.get("/blog", async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = parseInt(req.query.offset as string) || 0;
    const categoryId = req.query.category_id ? parseInt(req.query.category_id as string) : undefined;
    
    let query = db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.isPublished, true))
      .limit(limit)
      .offset(offset)
      .orderBy(desc(blogPosts.createdAt));
    
    if (categoryId) {
      query = query.where(eq(blogPosts.categoryId, categoryId));
    }
    
    const posts = await query;
    res.json(posts);
  } catch (error) {
    console.error("Failed to fetch blog posts:", error);
    res.status(500).json({ error: "Failed to fetch blog posts" });
  }
});

/**
 * Get a specific blog post by slug
 */
router.get("/blog/:slug", async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    
    // Use direct DB query
    const [post] = await db
      .select()
      .from(blogPosts)
      .where(and(
        eq(blogPosts.slug, slug),
        eq(blogPosts.isPublished, true)
      ));
    
    if (!post) {
      return res.status(404).json({ error: "Blog post not found" });
    }
    
    res.json(post);
  } catch (error) {
    console.error(`Failed to fetch blog post with slug ${req.params.slug}:`, error);
    res.status(500).json({ error: "Failed to fetch blog post" });
  }
});

/**
 * Get all blog categories
 */
router.get("/blog-categories", async (_req: Request, res: Response) => {
  try {
    // Get all blog categories
    const blogCategories = await db
      .select()
      .from(categories)
      .where(eq(categories.type, "blog"));
    
    res.json(blogCategories);
  } catch (error) {
    console.error("Failed to fetch blog categories:", error);
    res.status(500).json({ error: "Failed to fetch blog categories" });
  }
});

/**
 * Get all categories by type
 */
router.get("/categories/:type", async (req: Request, res: Response) => {
  try {
    const { type } = req.params;
    
    if (!["school", "blog", "faq"].includes(type)) {
      return res.status(400).json({ error: "Invalid category type" });
    }
    
    // Use direct DB query
    const result = await db
      .select()
      .from(categories)
      .where(eq(categories.type, type));
    
    res.json(result);
  } catch (error) {
    console.error(`Failed to fetch categories of type ${req.params.type}:`, error);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

// ==================== Platform Admin Content Management Routes ====================

// -------------- Content Pages Management --------------

/**
 * Get all content pages (platform admin only)
 */
router.get("/platform-admin/content/pages", requireAuth, requireAdminRole, async (_req: Request, res: Response) => {
  try {
    // Use direct DB query
    const pages = await db
      .select()
      .from(contentPages)
      .orderBy(contentPages.title);
      
    res.json(pages);
  } catch (error) {
    console.error("Failed to fetch content pages:", error);
    res.status(500).json({ error: "Failed to fetch content pages" });
  }
});

/**
 * Create a new content page (platform admin only)
 */
router.post("/platform-admin/content/pages", requireAuth, requireAdminRole, async (req: Request, res: Response) => {
  try {
    const userData = req.user!;
    
    // Validate the content page data
    const validatedData = insertContentPageSchema.parse({
      ...req.body,
      createdBy: userData.id,
      updatedBy: userData.id
    });
    
    // Check if slug is already in use
    const [existingPage] = await db
      .select()
      .from(contentPages)
      .where(eq(contentPages.slug, validatedData.slug));
      
    if (existingPage) {
      return res.status(400).json({ error: "Slug is already in use" });
    }
    
    // Create the content page
    const [newContentPage] = await db
      .insert(contentPages)
      .values(validatedData)
      .returning();
      
    res.status(201).json(newContentPage);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error("Failed to create content page:", error);
    res.status(500).json({ error: "Failed to create content page" });
  }
});

/**
 * Update an existing content page (platform admin only)
 */
router.put("/platform-admin/content/pages/:id", requireAuth, requireAdminRole, async (req: Request, res: Response) => {
  try {
    const userData = req.user!;
    const pageId = parseInt(req.params.id);
    
    if (isNaN(pageId)) {
      return res.status(400).json({ error: "Invalid content page ID" });
    }
    
    // Check if content page exists
    const [contentPage] = await db
      .select()
      .from(contentPages)
      .where(eq(contentPages.id, pageId));
      
    if (!contentPage) {
      return res.status(404).json({ error: "Content page not found" });
    }
    
    // If the slug is being changed, check if the new slug is already in use
    if (req.body.slug && req.body.slug !== contentPage.slug) {
      const [existingPage] = await db
        .select()
        .from(contentPages)
        .where(eq(contentPages.slug, req.body.slug));
        
      if (existingPage && existingPage.id !== pageId) {
        return res.status(400).json({ error: "Slug is already in use" });
      }
    }
    
    // Update content page with the userData as the updater
    const [updatedPage] = await db
      .update(contentPages)
      .set({
        ...req.body,
        updatedBy: userData.id,
        updatedAt: new Date()
      })
      .where(eq(contentPages.id, pageId))
      .returning();
    
    res.json(updatedPage);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    
    console.error(`Failed to update content page with ID ${req.params.id}:`, error);
    res.status(500).json({ error: "Failed to update content page" });
  }
});

/**
 * Delete a content page (platform admin only)
 */
router.delete("/platform-admin/content/pages/:id", requireAuth, requireAdminRole, async (req: Request, res: Response) => {
  try {
    const pageId = parseInt(req.params.id);
    
    if (isNaN(pageId)) {
      return res.status(400).json({ error: "Invalid content page ID" });
    }
    
    // Check if content page exists
    const [contentPage] = await db
      .select()
      .from(contentPages)
      .where(eq(contentPages.id, pageId));
      
    if (!contentPage) {
      return res.status(404).json({ error: "Content page not found" });
    }
    
    // Delete the content page
    await db
      .delete(contentPages)
      .where(eq(contentPages.id, pageId));
      
    res.json({ success: true });
  } catch (error) {
    console.error(`Failed to delete content page with ID ${req.params.id}:`, error);
    res.status(500).json({ error: "Failed to delete content page" });
  }
});

// -------------- FAQ Management --------------

/**
 * Get all FAQ items (platform admin only)
 */
router.get("/platform-admin/content/faqs", requireAuth, requireAdminRole, async (_req: Request, res: Response) => {
  try {
    // Use direct DB query
    const faqs = await db
      .select()
      .from(faqItems)
      .orderBy(faqItems.orderIndex);
      
    res.json(faqs);
  } catch (error) {
    console.error("Failed to fetch FAQs:", error);
    res.status(500).json({ error: "Failed to fetch FAQs" });
  }
});

/**
 * Create a new FAQ item (platform admin only)
 */
router.post("/platform-admin/content/faqs", requireAuth, requireAdminRole, async (req: Request, res: Response) => {
  try {
    const userData = req.user!;
    
    // Validate the FAQ item data
    const validatedData = insertFaqItemSchema.parse({
      ...req.body,
      createdBy: userData.id,
      updatedBy: userData.id
    });
    
    // Create the FAQ item
    const [newFaq] = await db
      .insert(faqItems)
      .values(validatedData)
      .returning();
      
    res.status(201).json(newFaq);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error("Failed to create FAQ item:", error);
    res.status(500).json({ error: "Failed to create FAQ item" });
  }
});

/**
 * Update an existing FAQ item (platform admin only)
 */
router.put("/platform-admin/content/faqs/:id", requireAuth, requireAdminRole, async (req: Request, res: Response) => {
  try {
    const userData = req.user!;
    const faqId = parseInt(req.params.id);
    
    if (isNaN(faqId)) {
      return res.status(400).json({ error: "Invalid FAQ item ID" });
    }
    
    // Check if FAQ item exists
    const [faq] = await db
      .select()
      .from(faqItems)
      .where(eq(faqItems.id, faqId));
      
    if (!faq) {
      return res.status(404).json({ error: "FAQ item not found" });
    }
    
    // Update FAQ item with the userData as the updater
    const [updatedFaq] = await db
      .update(faqItems)
      .set({
        ...req.body,
        updatedBy: userData.id,
        updatedAt: new Date()
      })
      .where(eq(faqItems.id, faqId))
      .returning();
    
    res.json(updatedFaq);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    
    console.error(`Failed to update FAQ item with ID ${req.params.id}:`, error);
    res.status(500).json({ error: "Failed to update FAQ item" });
  }
});

/**
 * Delete a FAQ item (platform admin only)
 */
router.delete("/platform-admin/content/faqs/:id", requireAuth, requireAdminRole, async (req: Request, res: Response) => {
  try {
    const faqId = parseInt(req.params.id);
    
    if (isNaN(faqId)) {
      return res.status(400).json({ error: "Invalid FAQ item ID" });
    }
    
    // Check if FAQ item exists
    const [faq] = await db
      .select()
      .from(faqItems)
      .where(eq(faqItems.id, faqId));
      
    if (!faq) {
      return res.status(404).json({ error: "FAQ item not found" });
    }
    
    // Delete the FAQ item
    await db
      .delete(faqItems)
      .where(eq(faqItems.id, faqId));
      
    res.json({ success: true });
  } catch (error) {
    console.error(`Failed to delete FAQ item with ID ${req.params.id}:`, error);
    res.status(500).json({ error: "Failed to delete FAQ item" });
  }
});

// -------------- Blog Post Management --------------

/**
 * Get all blog posts (platform admin only)
 */
router.get("/platform-admin/content/blog", requireAuth, requireAdminRole, async (_req: Request, res: Response) => {
  try {
    // Use direct DB query
    const posts = await db
      .select()
      .from(blogPosts)
      .orderBy(desc(blogPosts.createdAt));
      
    res.json(posts);
  } catch (error) {
    console.error("Failed to fetch blog posts:", error);
    res.status(500).json({ error: "Failed to fetch blog posts" });
  }
});

/**
 * Create a new blog post (platform admin only)
 */
router.post("/platform-admin/content/blog", requireAuth, requireAdminRole, async (req: Request, res: Response) => {
  try {
    const userData = req.user!;
    
    // Validate the blog post data
    const validatedData = insertBlogPostSchema.parse({
      ...req.body,
      authorId: userData.id
    });
    
    // Check if slug is already in use
    const [existingPost] = await db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.slug, validatedData.slug));
      
    if (existingPost) {
      return res.status(400).json({ error: "Slug is already in use" });
    }
    
    // Create the blog post
    const [newBlogPost] = await db
      .insert(blogPosts)
      .values(validatedData)
      .returning();
      
    res.status(201).json(newBlogPost);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error("Failed to create blog post:", error);
    res.status(500).json({ error: "Failed to create blog post" });
  }
});

/**
 * Update an existing blog post (platform admin only)
 */
router.put("/platform-admin/content/blog/:id", requireAuth, requireAdminRole, async (req: Request, res: Response) => {
  try {
    const postId = parseInt(req.params.id);
    
    if (isNaN(postId)) {
      return res.status(400).json({ error: "Invalid blog post ID" });
    }
    
    // Check if blog post exists
    const [blogPost] = await db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.id, postId));
      
    if (!blogPost) {
      return res.status(404).json({ error: "Blog post not found" });
    }
    
    // If the slug is being changed, check if the new slug is already in use
    if (req.body.slug && req.body.slug !== blogPost.slug) {
      const [existingPost] = await db
        .select()
        .from(blogPosts)
        .where(eq(blogPosts.slug, req.body.slug));
        
      if (existingPost && existingPost.id !== postId) {
        return res.status(400).json({ error: "Slug is already in use" });
      }
    }
    
    // Prepare update data
    const updateData: any = {
      ...req.body,
      updatedAt: new Date()
    };
    
    // If we're publishing for the first time, set publishedAt date
    if (req.body.isPublished === true && !blogPost.isPublished) {
      updateData.publishedAt = new Date();
    }

    // Update blog post
    const [updatedBlogPost] = await db
      .update(blogPosts)
      .set(updateData)
      .where(eq(blogPosts.id, postId))
      .returning();
    
    res.json(updatedBlogPost);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    
    console.error(`Failed to update blog post with ID ${req.params.id}:`, error);
    res.status(500).json({ error: "Failed to update blog post" });
  }
});

/**
 * Delete a blog post (platform admin only)
 */
router.delete("/platform-admin/content/blog/:id", requireAuth, requireAdminRole, async (req: Request, res: Response) => {
  try {
    const postId = parseInt(req.params.id);
    
    if (isNaN(postId)) {
      return res.status(400).json({ error: "Invalid blog post ID" });
    }
    
    // Check if blog post exists
    const [blogPost] = await db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.id, postId));
      
    if (!blogPost) {
      return res.status(404).json({ error: "Blog post not found" });
    }
    
    // Delete the blog post
    await db
      .delete(blogPosts)
      .where(eq(blogPosts.id, postId));
      
    res.json({ success: true });
  } catch (error) {
    console.error(`Failed to delete blog post with ID ${req.params.id}:`, error);
    res.status(500).json({ error: "Failed to delete blog post" });
  }
});

// -------------- Category Management --------------

/**
 * Get all categories (platform admin only)
 */
router.get("/platform-admin/content/categories", requireAuth, requireAdminRole, async (req: Request, res: Response) => {
  try {
    const type = req.query.type as string | undefined;
    
    // Use direct DB query
    let query = db
      .select()
      .from(categories)
      .orderBy(categories.name);
      
    if (type) {
      query = query.where(eq(categories.type, type));
    }
    
    const result = await query;
    res.json(result);
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

/**
 * Create a new category (platform admin only)
 */
router.post("/platform-admin/content/categories", requireAuth, requireAdminRole, async (req: Request, res: Response) => {
  try {
    // Validate the category data
    const validatedData = insertCategorySchema.parse(req.body);
    
    // Check if slug is already in use
    const [existingCategory] = await db
      .select()
      .from(categories)
      .where(eq(categories.slug, validatedData.slug));
      
    if (existingCategory) {
      return res.status(400).json({ error: "Slug is already in use" });
    }
    
    // Create the category
    const [newCategory] = await db
      .insert(categories)
      .values(validatedData)
      .returning();
      
    res.status(201).json(newCategory);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    
    console.error("Failed to create category:", error);
    res.status(500).json({ error: "Failed to create category" });
  }
});

/**
 * Update an existing category (platform admin only)
 */
router.put("/platform-admin/content/categories/:id", requireAuth, requireAdminRole, async (req: Request, res: Response) => {
  try {
    const categoryId = parseInt(req.params.id);
    
    if (isNaN(categoryId)) {
      return res.status(400).json({ error: "Invalid category ID" });
    }
    
    // Check if category exists
    const [category] = await db
      .select()
      .from(categories)
      .where(eq(categories.id, categoryId));
      
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }
    
    // If the slug is being changed, check if the new slug is already in use
    if (req.body.slug && req.body.slug !== category.slug) {
      const [existingCategory] = await db
        .select()
        .from(categories)
        .where(eq(categories.slug, req.body.slug));
        
      if (existingCategory && existingCategory.id !== categoryId) {
        return res.status(400).json({ error: "Slug is already in use" });
      }
    }
    
    // Update category
    const [updatedCategory] = await db
      .update(categories)
      .set({
        ...req.body,
        updatedAt: new Date()
      })
      .where(eq(categories.id, categoryId))
      .returning();
    
    res.json(updatedCategory);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    
    console.error(`Failed to update category with ID ${req.params.id}:`, error);
    res.status(500).json({ error: "Failed to update category" });
  }
});

/**
 * Delete a category (platform admin only)
 */
router.delete("/platform-admin/content/categories/:id", requireAuth, requireAdminRole, async (req: Request, res: Response) => {
  try {
    const categoryId = parseInt(req.params.id);
    
    if (isNaN(categoryId)) {
      return res.status(400).json({ error: "Invalid category ID" });
    }
    
    // Check if category exists
    const [category] = await db
      .select()
      .from(categories)
      .where(eq(categories.id, categoryId));
      
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }
    
    // Delete the category
    await db
      .delete(categories)
      .where(eq(categories.id, categoryId));
      
    res.json({ success: true });
  } catch (error) {
    console.error(`Failed to delete category with ID ${req.params.id}:`, error);
    res.status(500).json({ error: "Failed to delete category" });
  }
});

export default router;
import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { storage } from '../storage';
import { insertTeamProfileSchema } from '@shared/schema';
import { requirePlatformAdmin } from './middleware';

export const teamProfilesRouter = Router();

// Validate team profile input
const teamProfileSchema = insertTeamProfileSchema.extend({
  socialLinks: z.object({
    linkedin: z.string().optional(),
    twitter: z.string().optional(),
    github: z.string().optional(),
    website: z.string().optional(),
  }).optional(),
});

// GET all team profiles (public)
teamProfilesRouter.get('/team-profiles', async (req: Request, res: Response) => {
  try {
    const profiles = await storage.getTeamProfiles();
    res.json(profiles);
  } catch (error) {
    console.error('Error fetching team profiles:', error);
    res.status(500).json({ error: 'Failed to fetch team profiles' });
  }
});

// Protected routes require platform admin authentication
teamProfilesRouter.use('/platform-admin/team-profiles', requirePlatformAdmin);

// GET all team profiles (admin)
teamProfilesRouter.get('/platform-admin/team-profiles', async (req: Request, res: Response) => {
  try {
    const profiles = await storage.getTeamProfiles({ includeInactive: true });
    res.json(profiles);
  } catch (error) {
    console.error('Error fetching team profiles:', error);
    res.status(500).json({ error: 'Failed to fetch team profiles' });
  }
});

// GET single team profile
teamProfilesRouter.get('/platform-admin/team-profiles/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }

    const profile = await storage.getTeamProfile(id);
    if (!profile) {
      return res.status(404).json({ error: 'Team profile not found' });
    }

    res.json(profile);
  } catch (error) {
    console.error('Error fetching team profile:', error);
    res.status(500).json({ error: 'Failed to fetch team profile' });
  }
});

// CREATE team profile
teamProfilesRouter.post('/platform-admin/team-profiles', async (req: Request, res: Response) => {
  try {
    const validatedData = teamProfileSchema.parse(req.body);
    
    const newProfile = await storage.createTeamProfile({
      ...validatedData,
      // Add audit fields
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    res.status(201).json(newProfile);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error creating team profile:', error);
    res.status(500).json({ error: 'Failed to create team profile' });
  }
});

// UPDATE team profile
teamProfilesRouter.put('/platform-admin/team-profiles/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }

    const validatedData = teamProfileSchema.parse(req.body);
    
    const profile = await storage.getTeamProfile(id);
    if (!profile) {
      return res.status(404).json({ error: 'Team profile not found' });
    }

    const updatedProfile = await storage.updateTeamProfile(id, {
      ...validatedData,
      updatedAt: new Date(),
    });

    res.json(updatedProfile);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error updating team profile:', error);
    res.status(500).json({ error: 'Failed to update team profile' });
  }
});

// DELETE team profile
teamProfilesRouter.delete('/platform-admin/team-profiles/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }

    const profile = await storage.getTeamProfile(id);
    if (!profile) {
      return res.status(404).json({ error: 'Team profile not found' });
    }

    await storage.deleteTeamProfile(id);
    res.json({ success: true, message: 'Team profile deleted successfully' });
  } catch (error) {
    console.error('Error deleting team profile:', error);
    res.status(500).json({ error: 'Failed to delete team profile' });
  }
});
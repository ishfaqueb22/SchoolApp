import { Request, Response, NextFunction } from "express";

// Authorization middleware
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
};

// School admin authorization middleware
export const requireSchoolAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Authentication required" });
  }

  if (req.session.userRole !== 'schoolAdmin' && req.session.userRole !== 'platformAdmin') {
    return res.status(403).json({ error: "School administrator access required" });
  }

  next();
};

// Platform admin authorization middleware
export const requirePlatformAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Authentication required" });
  }

  if (req.session.userRole !== 'platformAdmin') {
    return res.status(403).json({ error: "Platform administrator access required" });
  }

  next();
};
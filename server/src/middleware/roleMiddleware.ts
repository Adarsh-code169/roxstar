// src/middleware/roleMiddleware.ts
import { Request, Response, NextFunction } from "express";

type AuthRequest = Request & { user?: { id: string; role: string } };

export const requireRole = (role: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthenticated" });
    }
    if (req.user.role !== role) {
      return res.status(403).json({ message: "Forbidden: insufficient role" });
    }
    next();
  };
};

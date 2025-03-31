import { Request, Response, NextFunction } from "express";
import { supabase } from "../config/supabase";
export interface AuthRequest extends Request {
  user?: any;
}
export const checkAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const token: string = req.cookies.token;
  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { data: user, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    res.status(401).json({ error: "Invalid Token" });
    return;
  }
  req.user = user.user;
  next();
};

import { Request, Response } from "express";
import { supabase } from "../config/supabase";
import cookieParser from "cookie-parser";
import { AuthRequest } from "../middleware/authMiddlware";

export const login = async (req: AuthRequest, res: Response) => {
console.log(req.body)
  const { email, password }: { email: string; password: string } = req.body;
  if (!email || !password) {
    res.status(404).json({ msg: "Invalid credentails" });
    return;
  }
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) {
    res.status(401).json({ error: error.message });
    return;
  }
  res.cookie("token", data.session.access_token, {
    httpOnly: true, // Secure and inaccessible to JavaScript
  });
  console.log("Cookies being set:", res.getHeaders()["set-cookie"]);

  console.log(data.session.access_token)
  res.status(200).json({ message: "Logged in successfully" });
};
export const fetchUser = async (req: AuthRequest, res: Response) => {
  console.log(req.user.id)
  const {data, error}=await supabase.from("request_handlers").select("*").eq("id",req.user.id).single()
  console.log(data)
  if(error){console.log("hh")}
  console.log(data)
  res.status(200).json({ message: "Logged in successfully", user: req.user, stationInfo:data });
};
export const logout = async (req: AuthRequest, res: Response) => {
  const token = req?.user.token;
  if (!token) {
    res.status(404).json({ error: "Already logged out" });
    return;
  }
  await supabase.auth.signOut();
  res.clearCookie("token", {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
  });

  res.json({ message: "Logged out successfully" });
};

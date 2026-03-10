import { Router } from "express";
import { z } from "zod";
import jwt from "jsonwebtoken";
import { usersDb, achievementsDb } from "../services/database.js";

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

// User validation schema
const userSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  password: z.string().min(6),
  role: z.enum(["admin", "student"]).default("student"),
});

// Generate JWT token
const generateToken = (user: any) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
};

// Register new user
router.post("/register", (req, res) => {
  try {
    const data = userSchema.parse(req.body);
    
    // Check if user already exists
    const existingUser = usersDb.findAll().find(u => u.email === data.email);
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }
    
    const user = {
      id: `user_${Date.now()}`,
      email: data.email,
      name: data.name,
      password: data.password, // In production, hash this!
      role: data.role,
      isVerified: data.role === "admin", // Admins are auto-verified
      verificationCode: Math.random().toString(36).substring(2, 8),
      createdAt: new Date().toISOString(),
    };
    
    usersDb.create(user);
    
    const token = generateToken(user);
    const { password, ...userWithoutPassword } = user;
    
    res.status(201).json({ user: userWithoutPassword, token });
  } catch (error) {
    res.status(400).json({ error: "Invalid data" });
  }
});

// Login
router.post("/login", (req, res) => {
  const { email, password } = req.body;
  
  const user = usersDb.findAll().find(u => u.email === email && u.password === password);
  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  
  const token = generateToken(user);
  const { password: _, ...userWithoutPassword } = user;
  
  res.json({ user: userWithoutPassword, token });
});

// Get current user
router.get("/me", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "No token provided" });
  }
  
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = usersDb.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
});

// Update profile
router.put("/profile", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "No token provided" });
  }
  
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = usersDb.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    const updated = usersDb.update(decoded.id, req.body);
    const { password, ...userWithoutPassword } = updated!;
    res.json(userWithoutPassword);
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
});

// Change password
router.put("/password", (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = usersDb.findById(decoded.id);
    
    if (!user || user.password !== currentPassword) {
      return res.status(400).json({ error: "Current password is incorrect" });
    }
    
    usersDb.update(decoded.id, { password: newPassword });
    res.json({ success: true });
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
});

// Get all users (admin only)
router.get("/", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "No token provided" });
  }
  
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (decoded.role !== "admin") {
      return res.status(403).json({ error: "Admin only" });
    }
    
    const users = usersDb.findAll().map(({ password, ...u }) => u);
    res.json(users);
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
});

// Get user by ID
router.get("/:id", (req, res) => {
  const user = usersDb.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  const { password, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
});

// Get user achievements
router.get("/:id/achievements", (req, res) => {
  const userAchievementsList = achievementsDb.findMany(
    ua => ua.userId === req.params.id
  );
  res.json(userAchievementsList);
});

// Add user achievement
router.post("/:id/achievements", (req, res) => {
  const { achievementType } = req.body;
  const achievement = {
    id: `ua_${Date.now()}`,
    userId: req.params.id,
    achievementType,
    earnedAt: new Date().toISOString(),
  };
  achievementsDb.create(achievement);
  res.status(201).json(achievement);
});

// Verify email
router.post("/verify-email", (req, res) => {
  const { code } = req.body;
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = usersDb.findById(decoded.id);
    
    if (!user || user.verificationCode !== code) {
      return res.status(400).json({ error: "Invalid verification code" });
    }
    
    usersDb.update(decoded.id, { isVerified: true });
    res.json({ success: true });
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
});

// Request password reset
router.post("/forgot-password", (req, res) => {
  const { email } = req.body;
  const user = usersDb.findAll().find(u => u.email === email);
  
  if (user) {
    // In production, send email with reset link
    const resetCode = Math.random().toString(36).substring(2, 8);
    usersDb.update(user.id, { resetCode });
  }
  
  // Always return success to prevent email enumeration
  res.json({ message: "If email exists, reset instructions will be sent" });
});

// Reset password
router.post("/reset-password", (req, res) => {
  const { code, newPassword } = req.body;
  const user = usersDb.findAll().find(u => u.resetCode === code);
  
  if (!user) {
    return res.status(400).json({ error: "Invalid reset code" });
  }
  
  usersDb.update(user.id, { password: newPassword });
  delete user.resetCode;
  
  res.json({ success: true });
});

export default router;

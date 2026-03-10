import { Router } from "express";
import { z } from "zod";
import { tagsDb } from "../services/database.js";

const router = Router();

// Tag validation schema
const tagSchema = z.object({
  name: z.string().min(1),
  color: z.string().optional(),
});

// Get all tags
router.get("/", (_req, res) => {
  const tags = tagsDb.findAll();
  res.json(tags);
});

// Get tag by ID
router.get("/:id", (req, res) => {
  const tag = tagsDb.findById(req.params.id);
  if (!tag) {
    return res.status(404).json({ error: "Tag not found" });
  }
  res.json(tag);
});

// Create tag
router.post("/", (req, res) => {
  try {
    const data = tagSchema.parse(req.body);
    
    // Check if tag with same name exists
    const existingTag = tagsDb.findMany(t => t.name === data.name);
    if (existingTag.length > 0) {
      return res.status(400).json({ error: "Tag with this name already exists" });
    }
    
    const tag = {
      id: `tag_${Date.now()}`,
      name: data.name,
      color: data.color || "#3b82f6",
      createdAt: new Date().toISOString(),
    };
    
    tagsDb.create(tag);
    res.status(201).json(tag);
  } catch (error) {
    res.status(400).json({ error: "Invalid data" });
  }
});

// Update tag
router.put("/:id", (req, res) => {
  const tag = tagsDb.findById(req.params.id);
  if (!tag) {
    return res.status(404).json({ error: "Tag not found" });
  }
  
  const updatedTag = tagsDb.update(req.params.id, req.body);
  res.json(updatedTag);
});

// Delete tag
router.delete("/:id", (req, res) => {
  const tag = tagsDb.findById(req.params.id);
  if (!tag) {
    return res.status(404).json({ error: "Tag not found" });
  }
  
  tagsDb.delete(req.params.id);
  res.json({ success: true });
});

export default router;


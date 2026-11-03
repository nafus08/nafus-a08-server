import express from "express";
import type { Document } from "mongodb";
import { studios } from "./db.js";
import { serializeStudio, validId } from "./studio-utils.js";

export const publicStudioRouter = express.Router();

publicStudioRouter.get("/api/studios", async (req, res, next) => {
  try {
    const category = typeof req.query.category === "string" ? req.query.category : undefined;
    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
    const filter: Document = {};
    if (category && category !== "All") filter.category = category;
    const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (search) filter.$or = [
      { title: { $regex: escapedSearch, $options: "i" } },
      { location: { $regex: escapedSearch, $options: "i" } },
    ];
    const items = await studios.find(filter).sort({ createdAt: -1 }).limit(100).toArray();
    res.json(items.map(serializeStudio));
  } catch (error) {
    next(error);
  }
});

publicStudioRouter.get("/api/studios/featured", async (_req, res, next) => {
  try {
    const items = await studios.find().sort({ rating: -1, createdAt: -1 }).limit(6).toArray();
    res.json(items.map(serializeStudio));
  } catch (error) {
    next(error);
  }
});

publicStudioRouter.get("/api/studios/:id", async (req, res, next) => {
  try {
    const id = validId(req.params.id);
    if (!id) return res.status(400).json({ error: "Invalid studio id." });
    const item = await studios.findOne({ _id: id });
    if (!item) return res.status(404).json({ error: "Studio not found." });
    res.json(serializeStudio(item));
  } catch (error) {
    next(error);
  }
});

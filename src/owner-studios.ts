import express from "express";
import { requireUser } from "./auth.js";
import { studios } from "./db.js";
import { serializeStudio, studioInput, validId } from "./studio-utils.js";
import type { Studio } from "./types.js";

export const ownerStudioRouter = express.Router();

ownerStudioRouter.get("/api/studios/mine", async (req, res, next) => {
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    const items = await studios.find({ hostEmail: user.email }).sort({ createdAt: -1 }).toArray();
    res.json(items.map(serializeStudio));
  } catch (error) {
    next(error);
  }
});

ownerStudioRouter.post("/api/studios", async (req, res, next) => {
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    const parsed = studioInput.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid studio details." });
    const studio: Studio = {
      ...parsed.data,
      hostName: user.name,
      hostEmail: user.email,
      rating: 5,
      createdAt: new Date(),
    };
    const result = await studios.insertOne(studio);
    res.status(201).json({ id: result.insertedId.toString(), ...studio });
  } catch (error) {
    next(error);
  }
});

ownerStudioRouter.patch("/api/studios/:id", async (req, res, next) => {
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    const id = validId(req.params.id);
    if (!id) return res.status(400).json({ error: "Invalid studio id." });
    const parsed = studioInput.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid studio details." });
    const updated = await studios.findOneAndUpdate(
      { _id: id, hostEmail: user.email },
      { $set: parsed.data },
      { returnDocument: "after" },
    );
    if (!updated) return res.status(404).json({ error: "Studio not found or you do not own it." });
    res.json(serializeStudio(updated));
  } catch (error) {
    next(error);
  }
});

ownerStudioRouter.delete("/api/studios/:id", async (req, res, next) => {
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    const id = validId(req.params.id);
    if (!id) return res.status(400).json({ error: "Invalid studio id." });
    const result = await studios.deleteOne({ _id: id, hostEmail: user.email });
    if (!result.deletedCount) return res.status(404).json({ error: "Studio not found or you do not own it." });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

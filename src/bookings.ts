import { randomUUID } from "node:crypto";
import express from "express";
import { ObjectId } from "mongodb";
import { z } from "zod";
import { requireUser } from "./auth.js";
import { bookings, studios } from "./db.js";
import { validId } from "./studio-utils.js";
import type { Booking } from "./types.js";

const bookingInput = z.object({
  studioId: z.string().refine(ObjectId.isValid, "Invalid studio id"),
  startAt: z.coerce.date(),
  endAt: z.coerce.date(),
});

export const bookingRouter = express.Router();

bookingRouter.post("/api/bookings", async (req, res, next) => {
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    const parsed = bookingInput.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid booking." });
    const { studioId, startAt, endAt } = parsed.data;
    if (endAt <= startAt || startAt <= new Date()) return res.status(400).json({ error: "Choose a future time range with an end after the start." });
    const studioObjectId = new ObjectId(studioId);
    const studio = await studios.findOne({ _id: studioObjectId });
    if (!studio) return res.status(404).json({ error: "Studio not found." });

    const lockToken = randomUUID();
    const now = new Date();
    const lock = await studios.updateOne(
      { _id: studioObjectId, $or: [{ bookingLockUntil: { $exists: false } }, { bookingLockUntil: { $lt: now } }] },
      { $set: { bookingLockToken: lockToken, bookingLockUntil: new Date(now.getTime() + 120_000) } },
    );
    if (!lock.modifiedCount) return res.status(409).json({ error: "Bookings for this space are being updated. Please try again." });

    try {
      const overlap = await bookings.findOne({
        studioId: studioObjectId,
        status: "Confirmed",
        startAt: { $lt: endAt },
        endAt: { $gt: startAt },
      });
      if (overlap) return res.status(409).json({ error: "This time slot is already booked. Please choose another time." });
      const booking: Booking = {
        studioId: studioObjectId,
        studioTitle: studio.title,
        guestEmail: user.email,
        guestName: user.name,
        startAt,
        endAt,
        status: "Pending",
        createdAt: new Date(),
      };
      const result = await bookings.insertOne(booking);
      res.status(201).json({ id: result.insertedId.toString(), ...booking });
    } finally {
      await studios.updateOne(
        { _id: studioObjectId, bookingLockToken: lockToken },
        { $unset: { bookingLockToken: "", bookingLockUntil: "" } },
      );
    }
  } catch (error) {
    next(error);
  }
});

bookingRouter.get("/api/bookings/mine", async (req, res, next) => {
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    const items = await bookings.find({ guestEmail: user.email }).sort({ createdAt: -1 }).toArray();
    res.json(items.map(({ _id, ...item }) => ({ id: _id.toString(), ...item, studioId: item.studioId.toString() })));
  } catch (error) {
    next(error);
  }
});

bookingRouter.patch("/api/bookings/:id/cancel", async (req, res, next) => {
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    const id = validId(req.params.id);
    if (!id) return res.status(400).json({ error: "Invalid booking id." });
    const result = await bookings.updateOne(
      { _id: id, guestEmail: user.email, status: "Pending" },
      { $set: { status: "Cancelled" } },
    );
    if (!result.modifiedCount) return res.status(409).json({ error: "Only pending bookings can be cancelled." });
    res.json({ status: "Cancelled" });
  } catch (error) {
    next(error);
  }
});

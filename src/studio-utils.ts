import { ObjectId, type Document } from "mongodb";
import { z } from "zod";
import type { Studio } from "./types.js";

export const studioInput = z.object({
  title: z.string().trim().min(3).max(100),
  category: z.string().trim().min(2).max(50),
  hourlyRate: z.coerce.number().positive().max(10000),
  securityDeposit: z.coerce.number().min(0).max(100000),
  maxCapacity: z.coerce.number().int().positive().max(1000),
  location: z.string().trim().min(3).max(200),
  imageUrl: z.string().url(),
  galleryImages: z.array(z.string().url()).max(12).default([]),
  amenities: z.array(z.string().trim().min(1).max(50)).max(30),
  overview: z.string().trim().min(20).max(5000),
});

export function validId(id: string) {
  return ObjectId.isValid(id) ? new ObjectId(id) : null;
}

export function serializeStudio({ _id, bookingLockToken: _lockToken, bookingLockUntil: _lockUntil, ...item }: Studio & Document) {
  return { id: _id.toString(), ...item };
}

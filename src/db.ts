import { MongoClient } from "mongodb";
import type { Booking, Studio } from "./types.js";

export const mongo = new MongoClient(process.env.MONGODB_URI!);
export const db = mongo.db(process.env.MONGODB_DB ?? "studiospace");
export const studios = db.collection<Studio>("studios");
export const bookings = db.collection<Booking>("bookings");

export async function connectMongo() {
  await mongo.connect();
}

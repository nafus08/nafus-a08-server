import type { ObjectId } from "mongodb";

export type Studio = {
  title: string;
  category: string;
  hourlyRate: number;
  securityDeposit: number;
  maxCapacity: number;
  location: string;
  imageUrl: string;
  galleryImages?: string[];
  amenities: string[];
  overview: string;
  hostName: string;
  hostEmail: string;
  rating: number;
  createdAt: Date;
  bookingLockToken?: string;
  bookingLockUntil?: Date;
};

export type Booking = {
  studioId: ObjectId;
  studioTitle: string;
  guestEmail: string;
  guestName: string;
  startAt: Date;
  endAt: Date;
  status: "Pending" | "Confirmed" | "Completed" | "Cancelled";
  createdAt: Date;
};

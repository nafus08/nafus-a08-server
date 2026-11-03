import "dotenv/config";
import cors from "cors";
import express from "express";
import { authRouter, securityRouter } from "./auth.js";
import { bookingRouter } from "./bookings.js";
import { connectMongo } from "./db.js";
import { ownerStudioRouter } from "./owner-studios.js";
import { publicStudioRouter } from "./public-studios.js";
import { clientUrl } from "./config.js";

await connectMongo();

const app = express();
app.use(cors({ origin: clientUrl, credentials: true }));
app.use(authRouter);
app.use(securityRouter);
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
app.use(ownerStudioRouter);
app.use(publicStudioRouter);
app.use(bookingRouter);

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(error);
  res.status(500).json({ error: "An unexpected server error occurred." });
});

const port = Number(process.env.PORT ?? 5000);
app.listen(port, () => console.log(`StudioSpace API listening on port ${port}`));

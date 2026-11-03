import "./config.js";
import express from "express";
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { fromNodeHeaders, toNodeHandler } from "better-auth/node";
import { SignJWT, jwtVerify } from "jose";
import { clientUrl } from "./config.js";
import { db } from "./db.js";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: [clientUrl],
  database: mongodbAdapter(db),
  emailAndPassword: { enabled: true, minPasswordLength: 6 },
  socialProviders: process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ? {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        },
      }
    : {},
});

export const authRouter = express.Router();
authRouter.all(/^\/api\/auth(?:\/.*)?$/, toNodeHandler(auth));

async function currentUser(req: express.Request) {
  const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
  return session?.user ?? null;
}

function cookieValue(req: express.Request, name: string) {
  const prefix = `${name}=`;
  const pair = req.headers.cookie?.split(";").map((part) => part.trim()).find((part) => part.startsWith(prefix));
  return pair?.slice(prefix.length) ?? null;
}

export async function requireUser(req: express.Request, res: express.Response) {
  const user = await currentUser(req);
  const token = cookieValue(req, "studio_token");
  let tokenEmail: string | null = null;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, new TextEncoder().encode(process.env.BETTER_AUTH_SECRET));
      tokenEmail = typeof payload.email === "string" ? payload.email : null;
    } catch {
      tokenEmail = null;
    }
  }
  if (!user || tokenEmail !== user.email) {
    res.status(401).json({ error: "Please sign in to continue." });
    return null;
  }
  return user;
}

export const securityRouter = express.Router();

securityRouter.get("/api/security/cookie", async (req, res, next) => {
  try {
    const user = await currentUser(req);
    if (!user) return res.status(401).json({ error: "Please sign in to continue." });
    const token = await new SignJWT({ email: user.email })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(user.id)
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(new TextEncoder().encode(process.env.BETTER_AUTH_SECRET));
    const secure = process.env.NODE_ENV === "production";
    res.setHeader("Set-Cookie", `studio_token=${token}; HttpOnly; Path=/; Max-Age=604800; SameSite=${secure ? "None; Secure" : "Lax"}`);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

securityRouter.post("/api/security/clear", (_req, res) => {
  const secure = process.env.NODE_ENV === "production";
  res.setHeader("Set-Cookie", `studio_token=; HttpOnly; Path=/; Max-Age=0; SameSite=${secure ? "None; Secure" : "Lax"}`);
  res.status(204).end();
});

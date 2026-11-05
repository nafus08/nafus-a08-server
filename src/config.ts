import { setServers } from "node:dns";

const required = ["MONGODB_URI", "BETTER_AUTH_SECRET", "BETTER_AUTH_URL"] as const;

for (const name of required) {
  if (!process.env[name]) throw new Error(`Missing required environment variable: ${name}`);
}

if (process.env.BETTER_AUTH_SECRET!.length < 32) {
  throw new Error("BETTER_AUTH_SECRET must be at least 32 characters long.");
}

const dnsServers = process.env.MONGODB_DNS_SERVERS?.split(",").map((server) => server.trim()).filter(Boolean);
if (dnsServers?.length) setServers(dnsServers);

export const clientUrl = process.env.CLIENT_URL ?? "http://localhost:3000";

# StudioSpace API

Express API for StudioSpace. MongoDB stores Better Auth users/sessions, studios, and bookings.

## Run locally

1. Copy `.env.example` to `.env`.
2. Set `MONGODB_URI`, `MONGODB_DB`, `BETTER_AUTH_SECRET` (32+ random characters), `BETTER_AUTH_URL`, and `CLIENT_URL`.
3. For Google sign-in, configure the OAuth client and set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`. The callback URI is `<BETTER_AUTH_URL>/api/auth/callback/google`.
4. Run `npm install` and `npm run dev`.

If a `mongodb+srv` URI fails with an SRV DNS error while using a resolver that supports Atlas SRV records, set the optional `MONGODB_DNS_SERVERS` to a comma-separated list of working DNS resolver IPs (for example `8.8.8.8,8.8.4.4`).

The client project README contains deployment and examiner setup notes. Production should use HTTPS and a narrowly configured client origin.

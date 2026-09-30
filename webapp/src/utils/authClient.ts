import { createAuthClient } from "better-auth/react";
import { SERVER_URL } from "./envConfig";

// BetterAuth needs an absolute URL, but production uses the relative Netlify
// proxy path (/server). A URL with a path is taken as the full auth base, so
// /api/auth has to be included explicitly.
const authClient = createAuthClient({
  baseURL: new URL(`${SERVER_URL}/api/auth`, window.location.origin).toString(),
});

export { authClient };

import { createAuthClient } from "better-auth/react";
import { API_URL } from "./envConfig";

// better-auth treats a baseURL with a path as the full auth base, so the
// /api/auth mount path has to be included explicitly.
const authClient = createAuthClient({
  baseURL: `${API_URL}/api/auth`,
});

export { authClient };

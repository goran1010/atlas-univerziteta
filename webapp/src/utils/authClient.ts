import { createAuthClient } from "better-auth/react";
import { SERVER_URL } from "./envConfig";

const authClient = createAuthClient({
  baseURL: SERVER_URL,
});

export { authClient };

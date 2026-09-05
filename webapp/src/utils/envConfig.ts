const { VITE_SERVER_URL, VITE_PUBLIC_API_URL, VITE_SITE_URL } = import.meta.env;

if (typeof VITE_SERVER_URL !== "string") {
  throw new Error("VITE_SERVER_URL is not defined in environment variables");
}

export const SERVER_URL = VITE_SERVER_URL;

export const PUBLIC_API_URL =
  typeof VITE_PUBLIC_API_URL === "string" && VITE_PUBLIC_API_URL !== ""
    ? VITE_PUBLIC_API_URL
    : VITE_SERVER_URL;

export const SITE_URL =
  typeof VITE_SITE_URL === "string" && VITE_SITE_URL !== ""
    ? VITE_SITE_URL
    : "https://uniatlas-bosnia.netlify.app";

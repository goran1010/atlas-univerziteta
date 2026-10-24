const { VITE_API_URL, VITE_PUBLIC_API_URL, VITE_SITE_URL } = import.meta.env;

if (typeof VITE_API_URL !== "string") {
  throw new Error("VITE_API_URL is not defined in environment variables");
}

export const API_URL = VITE_API_URL;

export const PUBLIC_API_URL =
  typeof VITE_PUBLIC_API_URL === "string" && VITE_PUBLIC_API_URL !== ""
    ? VITE_PUBLIC_API_URL
    : VITE_API_URL;

export const SITE_URL =
  typeof VITE_SITE_URL === "string" && VITE_SITE_URL !== ""
    ? VITE_SITE_URL
    : "https://atlasuniverziteta.com";

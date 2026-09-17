/**
 * Standalone admin auth for this site's own deployment.
 *
 * Replaces the old ChatGPT-Sites "Sign in with ChatGPT" dependency (which
 * only worked when hosted on chatgpt.site) with a single shared admin
 * password, kept in ADMIN_PASSWORD and signed with SESSION_SECRET — both
 * set as environment variables / Worker secrets on your own hosting.
 *
 * Keeps the same shape (getX/requireX/signInPath/signOutPath) as before so
 * the rest of the app (admin page, upload route, content route) barely
 * had to change.
 */
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export type AdminUser = {
  userId: string;
  displayName: string;
  email: string;
  fullName: string | null;
};

export const SESSION_COOKIE_NAME = "admin_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours
const SIGN_IN_PATH = "/admin-login";
const SIGN_OUT_PATH = "/api/admin-logout";

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error(
      "Missing SESSION_SECRET environment variable — set a long random string before deploying.",
    );
  }
  return secret;
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): Uint8Array {
  const padLength = (4 - (value.length % 4)) % 4;
  const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat(padLength);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function hmac(data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return toBase64Url(new Uint8Array(signature));
}

/** Builds the value to put in the admin_session cookie after a successful login. */
export async function createSessionCookieValue(): Promise<string> {
  const payload = JSON.stringify({ exp: Date.now() + SESSION_TTL_MS });
  const encodedPayload = toBase64Url(new TextEncoder().encode(payload));
  const signature = await hmac(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

async function verifySessionCookieValue(value: string): Promise<boolean> {
  const [encodedPayload, signature] = value.split(".");
  if (!encodedPayload || !signature) return false;

  const expectedSignature = await hmac(encodedPayload);
  if (expectedSignature !== signature) return false;

  try {
    const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(encodedPayload)));
    return typeof payload.exp === "number" && payload.exp > Date.now();
  } catch {
    return false;
  }
}

export async function getAdminUser(): Promise<AdminUser | null> {
  const cookieStore = await cookies();
  const value = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!value) return null;

  const valid = await verifySessionCookieValue(value);
  if (!valid) return null;

  return {
    userId: "admin",
    displayName: "Admin",
    email: "admin@pupotsannhs.local",
    fullName: null,
  };
}

export async function requireAdminUser(returnTo: string): Promise<AdminUser> {
  const user = await getAdminUser();
  if (user) return user;
  redirect(adminSignInPath(returnTo));
}

export function adminSignInPath(returnTo: string): string {
  return `${SIGN_IN_PATH}?return_to=${encodeURIComponent(safeRelativeReturnPath(returnTo))}`;
}

export function adminSignOutPath(returnTo = "/"): string {
  return `${SIGN_OUT_PATH}?return_to=${encodeURIComponent(safeRelativeReturnPath(returnTo))}`;
}

function safeRelativeReturnPath(value: string): string {
  if (!value.startsWith("/") || value.startsWith("//")) return "/";
  try {
    const url = new URL(value, "https://app.local");
    if (url.origin !== "https://app.local") return "/";
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/";
  }
}

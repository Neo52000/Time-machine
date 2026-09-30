/**
 * Canonical origin of the public site: `NEXT_PUBLIC_SITE_URL` when set,
 * otherwise the `URL` Netlify injects at build time, otherwise local dev.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.URL ??
  "http://localhost:3000"
).replace(/\/+$/, "");

export const SITE_NAME = "Time Machine";
export const SITE_DESCRIPTION =
  "Choisissez une date, chargez une époque, et voyagez dans l'histoire de l'informatique et d'Internet.";

/**
 * Converts an event title into a URL-friendly slug.
 * Example: "ROOT ORIGIN Hackathon 2026!" -> "ROOT_ORIGIN_HACKATHON_2026"
 */
export const slugify = (title: string): string => {
  return title
    .toUpperCase()
    .trim()
    .replace(/[^A-Z0-9\s_-]/g, "")  // remove special chars
    .replace(/[\s-]+/g, "_")         // spaces/dashes -> underscore
    .replace(/^_+|_+$/g, "");        // trim leading/trailing underscores
};

/**
 * Returns true if the value looks like a MongoDB ObjectId (24 hex chars).
 */
export const isObjectId = (val: string): boolean => /^[a-f0-9]{24}$/i.test(val);
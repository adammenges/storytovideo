import * as fs from "fs";
import * as path from "path";
import type { UserProvidedAssets } from "../types";

const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp"]);

/**
 * Scans a directory for image files and returns a map of name → absolute path.
 * The name is the filename without extension.
 */
function scanImageDir(dirPath: string): Record<string, string> {
  const result: Record<string, string> = {};
  if (!dirPath || !fs.existsSync(dirPath)) {
    return result;
  }

  const stat = fs.statSync(dirPath);
  if (!stat.isDirectory()) {
    return result;
  }

  const entries = fs.readdirSync(dirPath);
  for (const entry of entries) {
    const ext = path.extname(entry).toLowerCase();
    if (!IMAGE_EXTENSIONS.has(ext)) continue;

    const name = path.basename(entry, ext);
    if (!name) continue;

    result[name] = path.resolve(dirPath, entry);
  }

  return result;
}

/**
 * Discovers user-provided character and object reference images from the
 * specified directories. Returns a UserProvidedAssets object mapping
 * names (derived from filenames) to absolute image paths.
 */
export function discoverUserAssets(
  charactersDir?: string,
  objectsDir?: string,
): UserProvidedAssets {
  const characters = scanImageDir(charactersDir ?? "");
  const objects = scanImageDir(objectsDir ?? "");

  const charCount = Object.keys(characters).length;
  const objCount = Object.keys(objects).length;

  if (charCount > 0) {
    console.log(`[discover-assets] Found ${charCount} character image(s): ${Object.keys(characters).join(", ")}`);
  }
  if (objCount > 0) {
    console.log(`[discover-assets] Found ${objCount} object image(s): ${Object.keys(objects).join(", ")}`);
  }
  if (charCount === 0 && objCount === 0) {
    console.log("[discover-assets] No user-provided character or object images found.");
  }

  return { characters, objects };
}

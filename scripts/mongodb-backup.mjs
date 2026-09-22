#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("MONGODB_URI is required");

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const output = process.env.MONGODB_BACKUP_DIR || join(process.cwd(), "backups", stamp);
mkdirSync(output, { recursive: true });

try {
  execFileSync("mongodump", ["--uri", uri, "--out", output], { stdio: "inherit" });
  console.log(`MongoDB backup completed: ${output}`);
} catch (error) {
  if (!existsSync(output)) {
    throw new Error("mongodump is not installed or the backup command failed. Install MongoDB Database Tools and retry.");
  }
  throw error;
}

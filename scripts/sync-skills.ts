/* eslint-disable no-console */
import { cpSync, existsSync, lstatSync, readdirSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const SOURCE_DIR = resolve(ROOT, 'skills');
const MIRROR_ROOTS = [
  '.github/skills', // GitHub Copilot
  '.agents/skills', // Antigravity
  // '.claude/skills', // Claude
  // '.cursor/skills', // Cursor
  // '.windsurf/skills', // Windsurf
];

console.log('\n[skills] Syncing all skills to mirrors...\n');

if (!existsSync(SOURCE_DIR)) {
  console.error(`[skills] ERROR: Source directory ${SOURCE_DIR} not found.`);
  process.exit(1);
}

// 1. Get all skill subdirectories
const skillNames = readdirSync(SOURCE_DIR).filter((file) =>
  lstatSync(join(SOURCE_DIR, file)).isDirectory(),
);

// 2. Copy each skill to all mirror directories
for (const skillName of skillNames) {
  const skillSourceDir = join(SOURCE_DIR, skillName);

  // Skip skill if mandatory SKILL.md does not exist
  if (!existsSync(join(skillSourceDir, 'SKILL.md'))) {
    continue;
  }

  // 3. Copy skill to each mirror directory
  for (const destinationSkillsDir of MIRROR_ROOTS) {
    const skillDestinationDir = resolve(ROOT, destinationSkillsDir, skillName);

    // Clear the destination first to ensure a clean mirror
    if (existsSync(skillDestinationDir)) {
      rmSync(skillDestinationDir, { force: true, recursive: true });
    }

    // Create mirror directory and copy recursively
    cpSync(skillSourceDir, skillDestinationDir, {
      force: true,
      recursive: true,
    });

    console.log(
      `[skills] Synced skill "${skillName}" to ${destinationSkillsDir}.`,
    );
  }
}

console.log(`[skills] Done. Synced ${skillNames.length} skills.`);

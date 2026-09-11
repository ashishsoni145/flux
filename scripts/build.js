import { execSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync } from "node:fs";
import { resolve, join } from "node:path";

const rootDir = resolve(".");
const packages = ["protocol", "model-gateway", "engine", "cli", "desktop"];

console.log("⚡ Building FluxIDE packages...");

const portableToolsDir = resolve(rootDir, "..", "tools");
const portableNodeModules = join(portableToolsDir, "node_modules");
const portableBin = join(portableNodeModules, ".bin");
const portableNode = join(portableToolsDir, "nodejs");

const localBin = join(rootDir, "node_modules", ".bin");
const tsupCmd = existsSync(join(localBin, "tsup.cmd"))
  ? join(localBin, "tsup.cmd")
  : existsSync(join(portableBin, "tsup.cmd"))
    ? join(portableBin, "tsup.cmd")
    : "tsup";

const buildEnv = {
  ...process.env,
  PATH: `${localBin};${portableNode};${portableBin};${process.env.PATH || ""}`,
  NODE_PATH: `${join(rootDir, "node_modules")};${portableNodeModules}`,
};

for (const pkg of packages) {
  const pkgDir = join(rootDir, "packages", pkg);
  console.log(`\n📦 Building @fluxide/${pkg}...`);
  execSync(`"${tsupCmd}" src/index.ts --format esm --clean`, {
    cwd: pkgDir,
    stdio: "inherit",
    env: buildEnv,
    shell: true,
  });

  // Sync dist to node_modules for FAT32 compatibility
  const distSrc = join(pkgDir, "dist");
  const distDest = join(rootDir, "node_modules", "@fluxide", pkg, "dist");
  if (existsSync(distSrc)) {
    mkdirSync(distDest, { recursive: true });
    cpSync(distSrc, distDest, { recursive: true });
  }
}

console.log("\n✅ All packages built and synced successfully!\n");

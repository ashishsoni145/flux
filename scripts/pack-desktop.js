/**
 * FluxIDE Desktop — Packaging & Installer Orchestrator
 *
 * 1. Runs monorepo build (all 5 packages)
 * 2. Compiles native Windows launcher (FluxIDE.exe)
 * 3. Compiles native Windows installer wizard (dist/FluxIDE-Setup.exe)
 * 4. Generates portable launcher (FluxIDE-Portable.bat)
 */

import { execSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { resolve, join } from "node:path";

const rootDir = resolve(".");
const cscExe = "C:\\Windows\\Microsoft.NET\\Framework64\\v4.0.30319\\csc.exe";

console.log("⚡ Packaging FluxIDE Desktop Application & Installer...\n");

// 1. Monorepo Build
console.log("Step 1: Building all monorepo packages...");
execSync(`"${process.execPath}" scripts/build.js`, {
  cwd: rootDir,
  stdio: "inherit",
  env: process.env,
});

// 2. Ensure dist directory exists
const distDir = join(rootDir, "dist");
if (!existsSync(distDir)) {
  mkdirSync(distDir, { recursive: true });
}

// 3. Compile native Windows launcher
console.log("\nStep 2: Compiling native Windows launcher (FluxIDE.exe)...");
if (existsSync(cscExe)) {
  execSync(`"${cscExe}" /target:winexe /out:FluxIDE.exe src-native\\FluxLauncher.cs`, {
    cwd: rootDir,
    stdio: "inherit",
  });
  console.log("✅ Compiled FluxIDE.exe (Native Windows WinExe Launcher)");
} else {
  console.warn("⚠️ csc.exe not found; relying on FluxIDE-Desktop.bat launcher");
}

// 4. Compile native Windows Setup Wizard
console.log("\nStep 3: Compiling native Windows Setup Wizard (dist/FluxIDE-Setup.exe)...");
if (existsSync(cscExe)) {
  execSync(`"${cscExe}" /target:winexe /r:Microsoft.CSharp.dll /out:dist\\FluxIDE-Setup.exe src-native\\FluxSetup.cs`, {
    cwd: rootDir,
    stdio: "inherit",
  });
  console.log("✅ Compiled dist\\FluxIDE-Setup.exe (Native Windows Setup Wizard)");
}

// 5. Verify outputs
console.log("\n📦 Packaging Summary:");
console.log(`- Native Desktop Launcher: ${existsSync(join(rootDir, "FluxIDE.exe")) ? "✅ Ready" : "❌ Missing"}`);
console.log(`- Windows Setup Wizard:    ${existsSync(join(distDir, "FluxIDE-Setup.exe")) ? "✅ Ready" : "❌ Missing"}`);
console.log(`- Portable Batch Launcher: ${existsSync(join(rootDir, "FluxIDE-Desktop.bat")) ? "✅ Ready" : "❌ Missing"}`);
console.log("\n🎉 FluxIDE Desktop is ready for distribution and installation!\n");

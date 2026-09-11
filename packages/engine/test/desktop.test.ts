import { describe, it, expect } from "vitest";
import { DaemonSupervisor } from "../../desktop/src/main/daemon-supervisor.js";
import { IpcService } from "../../desktop/src/main/ipc-handlers.js";
import { TerminalSession } from "../../desktop/src/main/pty-terminal.js";
import { resolve, join } from "node:path";

describe("FluxIDE Desktop Platform Foundation", () => {
  const workspaceRoot = resolve(__dirname, "../../..");

  describe("1. Daemon Supervisor", () => {
    it("should initialize with default port and probe daemon health", async () => {
      const supervisor = new DaemonSupervisor(48100);
      const isRunning = await supervisor.isDaemonRunning();
      expect(typeof isRunning).toBe("boolean");
    });
  });

  describe("2. IpcService & Workspace Scanning", () => {
    it("should scan directory tree filtering out build/vendor folders", () => {
      const supervisor = new DaemonSupervisor(48100);
      const ipc = new IpcService(supervisor, workspaceRoot);

      const tree = ipc.readDirectoryTree(workspaceRoot, 0, 2);
      expect(tree.length).toBeGreaterThan(0);

      const hasPackages = tree.some((n) => n.name === "packages" && n.isDirectory);
      expect(hasPackages).toBe(true);

      // Verify node_modules and .git are filtered
      const hasNodeModules = tree.some((n) => n.name === "node_modules");
      const hasGit = tree.some((n) => n.name === ".git");
      expect(hasNodeModules).toBe(false);
      expect(hasGit).toBe(false);
    });

    it("should read file content cleanly", () => {
      const supervisor = new DaemonSupervisor(48100);
      const ipc = new IpcService(supervisor, workspaceRoot);

      const pkgContent = ipc.readFile(join(workspaceRoot, "package.json"));
      expect(pkgContent).toContain('"name": "fluxide"');
    });
  });

  describe("3. Native Terminal Subprocess", () => {
    it("should initialize a terminal session with an id", () => {
      const term = new TerminalSession("term_test", workspaceRoot);
      expect(term.id).toBe("term_test");
    });
  });

  describe("4. Embedded Desktop IDE HTML Provider", () => {
    it("should load and return the complete desktop IDE HTML UI", async () => {
      const { getDesktopIdeHtml } = await import("../src/web/desktop.js");
      const html = getDesktopIdeHtml(48100);
      expect(html).toBeDefined();
      expect(html.length).toBeGreaterThan(1000);
      expect(html).toContain("FluxIDE");
      expect(html).toContain("monaco-root");
      expect(html).toContain("workbench");
    });
  });
});

/**
 * FluxIDE Desktop — Main Process Entrypoint
 *
 * Coordinates desktop window lifecycle, daemon supervision,
 * native terminal, and workspace file services.
 */

import { DaemonSupervisor } from "./daemon-supervisor.js";
import { IpcService } from "./ipc-handlers.js";
import { existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export interface DesktopAppConfig {
  port: number;
  workspacePath: string;
}

export class FluxDesktopApp {
  private daemonSupervisor: DaemonSupervisor;
  private ipcService: IpcService;

  constructor(private config: DesktopAppConfig) {
    this.daemonSupervisor = new DaemonSupervisor(config.port);
    this.ipcService = new IpcService(this.daemonSupervisor, config.workspacePath);
  }

  /**
   * Boot the desktop application foundation.
   */
  async start(): Promise<void> {
    console.log("⚡ Starting FluxIDE Desktop Platform...");

    // 1. Ensure local fluxd daemon is running
    const daemonStatus = await this.daemonSupervisor.ensureDaemon(this.config.workspacePath);
    console.log(`⚡ fluxd daemon status: ${daemonStatus.running ? "ACTIVE" : "OFFLINE"} on ${daemonStatus.url}`);

    // 2. Register Start Menu / Desktop launcher script if running on Windows
    this.registerShortcuts();
  }

  /**
   * Register Windows Start Menu / desktop launch scripts for installed & portable modes.
   */
  private registerShortcuts(): void {
    if (process.platform !== "win32") return;

    try {
      const appData = process.env["APPDATA"];
      if (appData) {
        const startMenuDir = join(appData, "Microsoft", "Windows", "Start Menu", "Programs", "FluxIDE");
        // Creation of Windows Start Menu launcher can be placed here during installed setup
      }
    } catch {
      // ignore
    }
  }

  getIpcService(): IpcService {
    return this.ipcService;
  }

  getDaemonSupervisor(): DaemonSupervisor {
    return this.daemonSupervisor;
  }

  async stop(): Promise<void> {
    await this.daemonSupervisor.stopDaemon();
  }
}

// Standalone CLI launcher if executed directly
if (process.argv[1] && process.argv[1].endsWith("index.js")) {
  const app = new FluxDesktopApp({
    port: parseInt(process.env["FLUX_PORT"] ?? "48100", 10),
    workspacePath: process.cwd(),
  });

  app.start().catch((err) => {
    console.error("Failed to start FluxIDE Desktop:", err);
  });
}

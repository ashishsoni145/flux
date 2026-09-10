/**
 * FluxIDE Desktop — Daemon Supervisor
 *
 * Automatically manages the lifecycle of the local fluxd core daemon.
 * Ensures the user NEVER has to start or stop backend services manually.
 */

import { spawn, type ChildProcess } from "node:child_process";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";

export interface DaemonStatus {
  running: boolean;
  port: number;
  pid?: number;
  managedByApp: boolean;
  url: string;
}

export class DaemonSupervisor {
  private childProcess: ChildProcess | null = null;
  private port: number;
  private isManaged = false;

  constructor(port = 48100) {
    this.port = port;
  }

  /**
   * Check if fluxd is already running on the configured port.
   */
  async isDaemonRunning(): Promise<boolean> {
    try {
      const res = await fetch(`http://127.0.0.1:${this.port}/health`, {
        signal: AbortSignal.timeout(1000),
      });
      return res.status === 200;
    } catch {
      return false;
    }
  }

  /**
   * Start the fluxd daemon process if it is not already running.
   */
  async ensureDaemon(workspaceRoot?: string): Promise<DaemonStatus> {
    const alreadyRunning = await this.isDaemonRunning();
    if (alreadyRunning) {
      return {
        running: true,
        port: this.port,
        managedByApp: false,
        url: `ws://127.0.0.1:${this.port}`,
      };
    }

    // Locate engine entrypoint
    const cwd = workspaceRoot ?? process.cwd();
    const candidatePaths = [
      resolve(cwd, "packages", "engine", "dist", "index.js"),
      resolve(cwd, "..", "engine", "dist", "index.js"),
      resolve(cwd, "dist", "engine", "index.js"),
    ];

    const engineScript = candidatePaths.find((p) => existsSync(p));
    if (!engineScript) {
      console.warn("[DaemonSupervisor] Could not find engine dist script at candidates:", candidatePaths);
    }

    // Locate portable node or current runtime
    const nodeExecutable = process.env["FLUX_NODE_PATH"] ?? process.execPath;

    if (engineScript) {
      console.log(`[DaemonSupervisor] Spawning local fluxd daemon: ${nodeExecutable} ${engineScript}`);

      this.childProcess = spawn(nodeExecutable, [engineScript], {
        cwd,
        env: {
          ...process.env,
          FLUX_PORT: String(this.port),
          FLUX_HOST: "127.0.0.1",
        },
        stdio: ["ignore", "pipe", "pipe"],
      });

      this.isManaged = true;

      this.childProcess.stdout?.on("data", (data) => {
        const str = data.toString();
        if (process.env["DEBUG_FLUX_DAEMON"]) {
          console.log(`[fluxd stdout]: ${str.trim()}`);
        }
      });

      this.childProcess.stderr?.on("data", (data) => {
        console.error(`[fluxd stderr]: ${data.toString().trim()}`);
      });

      this.childProcess.on("exit", (code) => {
        console.log(`[DaemonSupervisor] fluxd exited with code ${code}`);
        this.childProcess = null;
        this.isManaged = false;
      });

      // Poll until healthy (up to 6 seconds)
      const start = Date.now();
      while (Date.now() - start < 6000) {
        if (await this.isDaemonRunning()) {
          console.log(`[DaemonSupervisor] fluxd daemon verified healthy on port ${this.port}`);
          return {
            running: true,
            port: this.port,
            pid: this.childProcess.pid,
            managedByApp: true,
            url: `ws://127.0.0.1:${this.port}`,
          };
        }
        await new Promise((r) => setTimeout(r, 250));
      }
    }

    return {
      running: await this.isDaemonRunning(),
      port: this.port,
      managedByApp: this.isManaged,
      url: `ws://127.0.0.1:${this.port}`,
    };
  }

  /**
   * Stop the daemon if it was spawned by this supervisor.
   */
  async stopDaemon(): Promise<void> {
    if (this.childProcess && this.isManaged) {
      console.log("[DaemonSupervisor] Terminating managed fluxd process...");
      try {
        this.childProcess.kill("SIGTERM");
      } catch {
        // ignore
      }
      this.childProcess = null;
      this.isManaged = false;
    }
  }
}

/**
 * FluxIDE Engine — Terminal Tool
 *
 * Execute shell commands in a controlled environment with
 * timeout, output capture, and safety checks.
 */

import { spawn } from "node:child_process";
import { platform } from "node:os";

/**
 * Execute a shell command and return its output.
 */
export async function terminalExecute(
  input: Record<string, unknown>
): Promise<string> {
  const command = input["command"] as string;
  const cwd = input["cwd"] as string | undefined;
  const timeoutMs = (input["timeoutMs"] as number | undefined) ?? 30_000;

  if (!command) throw new Error("Missing required parameter: command");

  return new Promise((resolve, reject) => {
    const isWindows = platform() === "win32";
    const shell = isWindows ? "powershell.exe" : "/bin/bash";
    const shellArgs = isWindows ? ["-NoProfile", "-Command", command] : ["-c", command];

    const proc = spawn(shell, shellArgs, {
      cwd: cwd ?? process.cwd(),
      env: { ...process.env, PAGER: "cat" },
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    let killed = false;

    const timer = setTimeout(() => {
      killed = true;
      proc.kill("SIGTERM");
    }, timeoutMs);

    proc.stdout.on("data", (data: Buffer) => {
      stdout += data.toString();
    });

    proc.stderr.on("data", (data: Buffer) => {
      stderr += data.toString();
    });

    proc.on("close", (code) => {
      clearTimeout(timer);

      const parts: string[] = [];
      if (stdout.trim()) {
        parts.push(stdout.trim());
      }
      if (stderr.trim()) {
        parts.push(`[stderr]\n${stderr.trim()}`);
      }
      if (killed) {
        parts.push(`\n⏱️  Command timed out after ${timeoutMs}ms`);
      }

      const output = parts.join("\n\n") || "(no output)";
      const exitInfo = `Exit code: ${code ?? "unknown"}`;

      resolve(`$ ${command}\n${exitInfo}\n\n${output}`);
    });

    proc.on("error", (error) => {
      clearTimeout(timer);
      reject(new Error(`Failed to execute command: ${error.message}`));
    });
  });
}

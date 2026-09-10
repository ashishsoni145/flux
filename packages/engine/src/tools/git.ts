/**
 * FluxIDE Engine — Git Tools
 *
 * Git operations exposed as tool executors for agents.
 */

import { terminalExecute } from "./terminal.js";

/**
 * Get git status.
 */
export async function gitStatus(
  input: Record<string, unknown>
): Promise<string> {
  const cwd = input["cwd"] as string;
  if (!cwd) throw new Error("Missing required parameter: cwd");

  return terminalExecute({ command: "git status --short --branch", cwd });
}

/**
 * Get git diff.
 */
export async function gitDiff(
  input: Record<string, unknown>
): Promise<string> {
  const cwd = input["cwd"] as string;
  const staged = (input["staged"] as boolean) ?? false;
  const file = input["file"] as string | undefined;

  if (!cwd) throw new Error("Missing required parameter: cwd");

  let command = staged ? "git diff --staged" : "git diff";
  if (file) command += ` -- "${file}"`;

  return terminalExecute({ command, cwd });
}

/**
 * Stage and commit changes.
 */
export async function gitCommit(
  input: Record<string, unknown>
): Promise<string> {
  const cwd = input["cwd"] as string;
  const message = input["message"] as string;
  const files = input["files"] as string[] | undefined;

  if (!cwd) throw new Error("Missing required parameter: cwd");
  if (!message) throw new Error("Missing required parameter: message");

  // Stage files
  if (files && files.length > 0) {
    const filePaths = files.map((f) => `"${f}"`).join(" ");
    await terminalExecute({ command: `git add ${filePaths}`, cwd });
  } else {
    await terminalExecute({ command: "git add -A", cwd });
  }

  // Commit
  const escapedMessage = message.replace(/"/g, '\\"');
  return terminalExecute({
    command: `git commit -m "${escapedMessage}"`,
    cwd,
  });
}

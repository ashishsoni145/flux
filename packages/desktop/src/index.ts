/**
 * @fluxide/desktop
 *
 * Public entrypoint for the FluxIDE Desktop IDE application.
 */

export { FluxDesktopApp } from "./main/index.js";
export { DaemonSupervisor } from "./main/daemon-supervisor.js";
export { IpcService } from "./main/ipc-handlers.js";
export { TerminalSession } from "./main/pty-terminal.js";

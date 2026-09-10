/**
 * @fluxide/protocol — Utility functions
 */

import { randomUUID } from "node:crypto";

/**
 * Generate a unique identifier for entities across the system.
 * Uses crypto.randomUUID for guaranteed uniqueness.
 */
export function generateId(prefix?: string): string {
  const uuid = randomUUID();
  return prefix ? `${prefix}_${uuid}` : uuid;
}

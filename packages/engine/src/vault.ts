/**
 * FluxIDE Engine — BYOK Encrypted Vault
 *
 * Secure local credential and API key storage using AES-256-GCM.
 * Protects user keys on the local USB filesystem (.flux/vault.enc).
 * Keys are only held in memory during daemon execution and never
 * written to plain logs, prompts, or git.
 */

import { randomBytes, createCipheriv, createDecipheriv, scryptSync } from "node:crypto";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96 bits for GCM
const SALT_LENGTH = 16;
const TAG_LENGTH = 16;

export interface VaultData {
  keys: Record<string, string>; // provider -> apiKey
  customEndpoints: Record<string, string>; // provider -> baseUrl
  updatedAt: string;
}

export class EncryptedVault {
  private inMemoryKeys: Map<string, string> = new Map();
  private inMemoryEndpoints: Map<string, string> = new Map();
  private vaultPath: string;
  private isUnlocked: boolean = false;

  constructor(private readonly workspacePath: string = process.cwd()) {
    this.vaultPath = join(workspacePath, ".flux", "vault.enc");
  }

  /**
   * Check if a vault file exists on disk.
   */
  exists(): boolean {
    return existsSync(this.vaultPath);
  }

  /**
   * Derive a 256-bit encryption key using scrypt.
   */
  private deriveKey(passphrase: string, salt: Buffer): Buffer {
    return scryptSync(passphrase, salt, 32);
  }

  /**
   * Initialize a new encrypted vault with a master passphrase.
   */
  async initialize(passphrase: string): Promise<void> {
    const dir = dirname(this.vaultPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    const data: VaultData = {
      keys: Object.fromEntries(this.inMemoryKeys),
      customEndpoints: Object.fromEntries(this.inMemoryEndpoints),
      updatedAt: new Date().toISOString(),
    };

    await this.save(passphrase, data);
    this.isUnlocked = true;
  }

  /**
   * Unlock and read the vault into memory using the master passphrase.
   */
  async unlock(passphrase: string): Promise<boolean> {
    if (!this.exists()) {
      return false;
    }

    try {
      const buffer = readFileSync(this.vaultPath);
      if (buffer.length < SALT_LENGTH + IV_LENGTH + TAG_LENGTH) {
        throw new Error("Vault file is corrupted or incomplete.");
      }

      const salt = buffer.subarray(0, SALT_LENGTH);
      const iv = buffer.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
      const tag = buffer.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
      const ciphertext = buffer.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);

      const key = this.deriveKey(passphrase, salt);
      const decipher = createDecipheriv(ALGORITHM, key, iv);
      decipher.setAuthTag(tag);

      const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
      const data = JSON.parse(decrypted.toString("utf8")) as VaultData;

      this.inMemoryKeys.clear();
      for (const [k, v] of Object.entries(data.keys || {})) {
        this.inMemoryKeys.set(k.toLowerCase(), v);
      }

      this.inMemoryEndpoints.clear();
      for (const [k, v] of Object.entries(data.customEndpoints || {})) {
        this.inMemoryEndpoints.set(k.toLowerCase(), v);
      }

      this.isUnlocked = true;
      return true;
    } catch {
      this.isUnlocked = false;
      return false;
    }
  }

  /**
   * Save vault data to disk with AES-256-GCM encryption.
   */
  private async save(passphrase: string, data: VaultData): Promise<void> {
    const salt = randomBytes(SALT_LENGTH);
    const iv = randomBytes(IV_LENGTH);
    const key = this.deriveKey(passphrase, salt);

    const cipher = createCipheriv(ALGORITHM, key, iv);
    const plaintext = Buffer.from(JSON.stringify(data), "utf8");
    const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    const tag = cipher.getAuthTag();

    const output = Buffer.concat([salt, iv, tag, ciphertext]);
    writeFileSync(this.vaultPath, output);
  }

  /**
   * Set an API key in memory (and persist if passphrase provided).
   */
  setKey(provider: string, apiKey: string, passphrase?: string): void {
    this.inMemoryKeys.set(provider.toLowerCase(), apiKey);
    if (passphrase && this.isUnlocked) {
      const data: VaultData = {
        keys: Object.fromEntries(this.inMemoryKeys),
        customEndpoints: Object.fromEntries(this.inMemoryEndpoints),
        updatedAt: new Date().toISOString(),
      };
      this.save(passphrase, data);
    }
  }

  /**
   * Get an API key for a provider. Checks in-memory vault first, then fallback to environment.
   */
  getKey(provider: string): string | undefined {
    const key = this.inMemoryKeys.get(provider.toLowerCase());
    if (key) return key;

    // Environment fallbacks
    switch (provider.toLowerCase()) {
      case "anthropic":
        return process.env["ANTHROPIC_API_KEY"];
      case "openai":
        return process.env["OPENAI_API_KEY"];
      case "gemini":
      case "google":
        return process.env["GEMINI_API_KEY"] ?? process.env["GOOGLE_API_KEY"];
      case "openrouter":
        return process.env["OPENROUTER_API_KEY"];
      case "groq":
        return process.env["GROQ_API_KEY"];
      default:
        return process.env[`${provider.toUpperCase()}_API_KEY`];
    }
  }

  /**
   * Set custom endpoint for a provider (e.g. self-hosted, Ollama, LM Studio).
   */
  setEndpoint(provider: string, baseUrl: string, passphrase?: string): void {
    this.inMemoryEndpoints.set(provider.toLowerCase(), baseUrl);
    if (passphrase && this.isUnlocked) {
      const data: VaultData = {
        keys: Object.fromEntries(this.inMemoryKeys),
        customEndpoints: Object.fromEntries(this.inMemoryEndpoints),
        updatedAt: new Date().toISOString(),
      };
      this.save(passphrase, data);
    }
  }

  /**
   * Get custom endpoint for a provider.
   */
  getEndpoint(provider: string): string | undefined {
    const ep = this.inMemoryEndpoints.get(provider.toLowerCase());
    if (ep) return ep;

    if (provider.toLowerCase() === "ollama") {
      return process.env["OLLAMA_HOST"] ?? "http://127.0.0.1:11434/v1";
    }
    return undefined;
  }

  /**
   * List configured providers (keys masked for security).
   */
  listConfigured(): Array<{ provider: string; hasKey: boolean; customEndpoint?: string }> {
    const providers = new Set([
      ...this.inMemoryKeys.keys(),
      "anthropic",
      "openai",
      "gemini",
      "ollama",
    ]);

    return Array.from(providers).map((p) => {
      const key = this.getKey(p);
      const ep = this.getEndpoint(p);
      return {
        provider: p,
        hasKey: Boolean(key && key.trim().length > 0),
        customEndpoint: ep,
      };
    });
  }

  get unlocked(): boolean {
    return this.isUnlocked;
  }
}

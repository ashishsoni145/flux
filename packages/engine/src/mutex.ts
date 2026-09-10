/**
 * FluxIDE Engine — File Mutex for Parallel Execution
 *
 * Implements granular file locking to allow concurrent agent execution
 * while preventing race conditions and simultaneous mutations to the same file.
 */

export class FileMutex {
  private fileLocks = new Map<string, string>(); // normalizedFilePath -> taskId/agentId
  private waitingQueue = new Map<string, Array<() => void>>();

  /**
   * Acquire lock for one or more files for a given task/agent.
   * If any file is locked by another task, waits until it is released.
   */
  async acquire(taskId: string, files: readonly string[]): Promise<void> {
    const normalizedFiles = files.map((f) => this.normalize(f));

    for (const file of normalizedFiles) {
      await this.acquireSingle(taskId, file);
    }
  }

  private acquireSingle(taskId: string, file: string): Promise<void> {
    const currentOwner = this.fileLocks.get(file);

    if (!currentOwner || currentOwner === taskId) {
      this.fileLocks.set(file, taskId);
      return Promise.resolve();
    }

    // Wait for the lock to become available
    return new Promise<void>((resolve) => {
      let queue = this.waitingQueue.get(file);
      if (!queue) {
        queue = [];
        this.waitingQueue.set(file, queue);
      }

      queue.push(() => {
        this.fileLocks.set(file, taskId);
        resolve();
      });
    });
  }

  /**
   * Release lock for one or more files held by a task.
   */
  release(taskId: string, files: readonly string[]): void {
    const normalizedFiles = files.map((f) => this.normalize(f));

    for (const file of normalizedFiles) {
      if (this.fileLocks.get(file) === taskId) {
        this.fileLocks.delete(file);

        const queue = this.waitingQueue.get(file);
        if (queue && queue.length > 0) {
          const nextInLine = queue.shift();
          if (nextInLine) {
            nextInLine();
          }
        }
      }
    }
  }

  /**
   * Release all locks held by a task (useful on completion or failure).
   */
  releaseAll(taskId: string): void {
    const heldFiles: string[] = [];
    for (const [file, owner] of this.fileLocks.entries()) {
      if (owner === taskId) {
        heldFiles.push(file);
      }
    }

    this.release(taskId, heldFiles);
  }

  /**
   * Check if a file is currently locked.
   */
  isLocked(file: string): boolean {
    return this.fileLocks.has(this.normalize(file));
  }

  /**
   * Get the task ID currently holding the lock for a file.
   */
  getLockHolder(file: string): string | undefined {
    return this.fileLocks.get(this.normalize(file));
  }

  private normalize(filePath: string): string {
    return filePath.replace(/\\/g, "/").toLowerCase();
  }
}

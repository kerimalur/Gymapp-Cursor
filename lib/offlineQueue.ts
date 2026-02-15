/**
 * Offline Queue for Firebase Sync
 *
 * This module implements a persistent queue for Firebase operations.
 * If a sync fails (network error, crash, etc.), operations are queued
 * and automatically retried when the connection is restored.
 */

interface QueuedOperation {
  id: string;
  type: 'workout' | 'nutrition' | 'custom-exercises';
  data: any;
  timestamp: number;
  retryCount: number;
}

const QUEUE_STORAGE_KEY = 'firebase-sync-queue';
const MAX_RETRIES = 5;

/**
 * Get all queued operations from localStorage
 */
export function getQueuedOperations(): QueuedOperation[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(QUEUE_STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error('Failed to load queued operations:', error);
    return [];
  }
}

/**
 * Save queued operations to localStorage
 */
function saveQueuedOperations(operations: QueuedOperation[]) {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(operations));
  } catch (error) {
    console.error('Failed to save queued operations:', error);
  }
}

/**
 * Add an operation to the queue
 */
export function queueOperation(
  type: 'workout' | 'nutrition' | 'custom-exercises',
  data: any
): void {
  const queue = getQueuedOperations();

  const operation: QueuedOperation = {
    id: `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    data,
    timestamp: Date.now(),
    retryCount: 0,
  };

  queue.push(operation);
  saveQueuedOperations(queue);

  console.log(`[Offline Queue] Added ${type} operation to queue (${queue.length} total)`);
}

/**
 * Remove an operation from the queue
 */
export function removeFromQueue(operationId: string): void {
  const queue = getQueuedOperations();
  const filtered = queue.filter(op => op.id !== operationId);
  saveQueuedOperations(filtered);

  console.log(`[Offline Queue] Removed operation ${operationId} (${filtered.length} remaining)`);
}

/**
 * Increment retry count for an operation
 */
function incrementRetryCount(operationId: string): void {
  const queue = getQueuedOperations();
  const updated = queue.map(op =>
    op.id === operationId
      ? { ...op, retryCount: op.retryCount + 1 }
      : op
  );
  saveQueuedOperations(updated);
}

/**
 * Clear all queued operations
 */
export function clearQueue(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(QUEUE_STORAGE_KEY);
  console.log('[Offline Queue] Cleared all queued operations');
}

/**
 * Process the queue - try to sync all pending operations
 * Returns { success: number, failed: number, skipped: number }
 */
export async function processQueue(
  userId: string,
  syncFunctions: {
    syncWorkout: (data: any) => Promise<void>;
    syncNutrition: (data: any) => Promise<void>;
    syncCustomExercises: (data: any) => Promise<void>;
  }
): Promise<{ success: number; failed: number; skipped: number }> {
  const queue = getQueuedOperations();

  if (queue.length === 0) {
    console.log('[Offline Queue] Queue is empty');
    return { success: 0, failed: 0, skipped: 0 };
  }

  console.log(`[Offline Queue] Processing ${queue.length} queued operations...`);

  let successCount = 0;
  let failedCount = 0;
  let skippedCount = 0;

  for (const operation of queue) {
    // Skip operations that have exceeded max retries
    if (operation.retryCount >= MAX_RETRIES) {
      console.warn(`[Offline Queue] Skipping operation ${operation.id} (max retries exceeded)`);
      skippedCount++;
      removeFromQueue(operation.id);
      continue;
    }

    try {
      // Select the appropriate sync function
      let syncFn: (data: any) => Promise<void>;

      switch (operation.type) {
        case 'workout':
          syncFn = syncFunctions.syncWorkout;
          break;
        case 'nutrition':
          syncFn = syncFunctions.syncNutrition;
          break;
        case 'custom-exercises':
          syncFn = syncFunctions.syncCustomExercises;
          break;
        default:
          console.error(`[Offline Queue] Unknown operation type: ${operation.type}`);
          removeFromQueue(operation.id);
          skippedCount++;
          continue;
      }

      // Execute the sync
      await syncFn(operation.data);

      // Success - remove from queue
      removeFromQueue(operation.id);
      successCount++;
      console.log(`[Offline Queue] Successfully synced ${operation.type} operation`);

    } catch (error) {
      // Failed - increment retry count
      console.error(`[Offline Queue] Failed to sync ${operation.type}:`, error);
      incrementRetryCount(operation.id);
      failedCount++;
    }
  }

  console.log(`[Offline Queue] Processing complete: ${successCount} success, ${failedCount} failed, ${skippedCount} skipped`);

  return { success: successCount, failed: failedCount, skipped: skippedCount };
}

/**
 * Get queue status for UI display
 */
export function getQueueStatus(): {
  queueLength: number;
  oldestOperation: number | null;
  hasFailedOperations: boolean;
} {
  const queue = getQueuedOperations();

  return {
    queueLength: queue.length,
    oldestOperation: queue.length > 0
      ? Math.min(...queue.map(op => op.timestamp))
      : null,
    hasFailedOperations: queue.some(op => op.retryCount > 0),
  };
}

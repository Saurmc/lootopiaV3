import AsyncStorage from '@react-native-async-storage/async-storage';

const HUNT_CACHE_PREFIX = 'lootopia_hunt_cache_';
const VALIDATION_QUEUE_KEY = 'lootopia_validation_queue';

export interface QueuedValidation {
  id: string;
  huntId: string;
  stepId: string;
  payload: Record<string, unknown>;
  queuedAt: string;
}

function isNetworkError(err: unknown): boolean {
  const e = err as { code?: string; message?: string };
  return e?.code === 'ERR_NETWORK' || e?.message === 'Network Error';
}

export const offlineService = {
  /** Returns true if the error is a connectivity issue (not a 4xx/5xx). */
  isNetworkError,

  /** Cache any data keyed by huntId. */
  async cacheHunt<T>(huntId: string, data: T): Promise<void> {
    await AsyncStorage.setItem(
      `${HUNT_CACHE_PREFIX}${huntId}`,
      JSON.stringify(data),
    );
  },

  /** Retrieve cached hunt data, returns null if not cached. */
  async getCachedHunt<T>(huntId: string): Promise<T | null> {
    const raw = await AsyncStorage.getItem(`${HUNT_CACHE_PREFIX}${huntId}`);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },

  /** Add a failed step validation to the offline queue. */
  async enqueueValidation(
    huntId: string,
    stepId: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    const queue = await offlineService.getQueue();
    const item: QueuedValidation = {
      id: `${huntId}_${stepId}_${Date.now()}`,
      huntId,
      stepId,
      payload,
      queuedAt: new Date().toISOString(),
    };
    await AsyncStorage.setItem(VALIDATION_QUEUE_KEY, JSON.stringify([...queue, item]));
  },

  /** Get the current validation queue. */
  async getQueue(): Promise<QueuedValidation[]> {
    const raw = await AsyncStorage.getItem(VALIDATION_QUEUE_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as QueuedValidation[];
    } catch {
      return [];
    }
  },

  /** Remove a single item from the queue by id. */
  async dequeue(id: string): Promise<void> {
    const queue = await offlineService.getQueue();
    const updated = queue.filter((item) => item.id !== id);
    await AsyncStorage.setItem(VALIDATION_QUEUE_KEY, JSON.stringify(updated));
  },

  /** Attempt to flush all queued validations. Returns count of successfully sent items. */
  async flushQueue(
    validateFn: (huntId: string, stepId: string, payload: Record<string, unknown>) => Promise<void>,
  ): Promise<number> {
    const queue = await offlineService.getQueue();
    if (queue.length === 0) return 0;

    let flushed = 0;
    for (const item of queue) {
      try {
        await validateFn(item.huntId, item.stepId, item.payload);
        await offlineService.dequeue(item.id);
        flushed++;
      } catch (err) {
        if (isNetworkError(err)) break; // Still offline, stop trying
      }
    }
    return flushed;
  },
};

import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { offlineService } from '../services/offline.service';
import { huntService } from '../services/hunt.service';

/**
 * Mount this once at the app root. When the app comes to foreground,
 * it attempts to flush any queued step validations.
 */
export function useOfflineSync() {
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    async function flush() {
      const flushed = await offlineService.flushQueue(async (huntId, stepId, payload) => {
        await huntService.validateStep(huntId, stepId, payload);
      });
      if (flushed > 0) {
        console.log(`[offline] Flushed ${flushed} queued validation(s)`);
      }
    }

    // Try to flush immediately on mount
    flush();

    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (appStateRef.current !== 'active' && nextState === 'active') {
        flush();
      }
      appStateRef.current = nextState;
    });

    return () => subscription.remove();
  }, []);
}

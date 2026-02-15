import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { processOfflineQueue } from '@/lib/firestore';
import { getQueueStatus } from '@/lib/offlineQueue';
import toast from 'react-hot-toast';

/**
 * Hook to automatically process offline queue
 * - Processes queue on mount (app startup)
 * - Processes queue when network connection is restored
 * - Provides queue status for UI
 */
export function useOfflineQueue() {
  const { user } = useAuthStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [queueStatus, setQueueStatus] = useState(getQueueStatus());

  // Update queue status
  const refreshStatus = () => {
    setQueueStatus(getQueueStatus());
  };

  // Process the queue
  const processQueue = async () => {
    if (!user || isProcessing) return;

    setIsProcessing(true);

    try {
      const result = await processOfflineQueue(user.uid);

      if (result.success > 0) {
        toast.success(`${result.success} ausstehende Änderungen synchronisiert`);
      }

      if (result.failed > 0) {
        toast.error(`${result.failed} Synchronisierungen fehlgeschlagen`);
      }

      refreshStatus();
    } catch (error) {
      console.error('[Offline Queue] Processing failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Process queue on mount if there are pending operations
  useEffect(() => {
    if (user && queueStatus.queueLength > 0) {
      console.log(`[Offline Queue] Found ${queueStatus.queueLength} pending operations, processing...`);
      processQueue();
    }
  }, [user]); // Only run once when user is available

  // Listen for online event
  useEffect(() => {
    const handleOnline = () => {
      console.log('[Offline Queue] Connection restored, processing queue...');
      refreshStatus();

      if (queueStatus.queueLength > 0) {
        // Delay to ensure connection is stable
        setTimeout(() => {
          processQueue();
        }, 2000);
      }
    };

    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [user, queueStatus.queueLength]);

  return {
    queueStatus,
    isProcessing,
    processQueue,
    refreshStatus,
  };
}

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { getQueueStatus } from '@/lib/offlineQueue';
import toast from 'react-hot-toast';

/**
 * Hook to manage offline queue (Supabase syncing)
 * Supabase handles syncing automatically through the client SDK
 * This hook is kept for future offline support
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
      // Supabase handles syncing automatically
      // No manual processing needed
      refreshStatus();
    } catch (error) {
      console.error('[Offline Queue] Processing failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Check for pending operations on mount
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

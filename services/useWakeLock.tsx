
import { useState, useEffect, useRef, useCallback } from 'react';

export const useWakeLock = () => {
    const [isLocked, setIsLocked] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const wakeLockRef = useRef<any>(null);
    const isPolicyBlocked = useRef(false);

    const requestWakeLock = useCallback(async () => {
        // If we already know it's blocked by policy, don't try again.
        if (isPolicyBlocked.current) return;

        if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
            try {
                // @ts-ignore - Types for wakeLock might not be available in all TS configs
                const wakeLock = await navigator.wakeLock.request('screen');
                wakeLockRef.current = wakeLock;
                setIsLocked(true);
                setError(null);
                
                wakeLock.addEventListener('release', () => {
                    setIsLocked(false);
                });
            } catch (err: any) {
                // Specific handling for NotAllowedError
                if (err.name === 'NotAllowedError') {
                    if (err.message.includes('permissions policy')) {
                        // Hard block by iframe/environment policy
                        isPolicyBlocked.current = true;
                        console.warn('Screen Wake Lock is disabled by the embedding environment permissions policy.');
                        setError('Blocked by Policy');
                    } else {
                        // Soft block, likely needs user gesture. Will retry on interaction.
                        // console.debug('Wake Lock request pending user interaction.');
                        setError('Needs Interaction');
                    }
                } else {
                    // Other errors
                    console.error(`Wake Lock error: ${err.name}, ${err.message}`);
                    setError(err.message);
                }
                setIsLocked(false);
            }
        } else {
            setError('Not supported');
        }
    }, []);

    const releaseWakeLock = useCallback(async () => {
        if (wakeLockRef.current) {
            try {
                await wakeLockRef.current.release();
                wakeLockRef.current = null;
                setIsLocked(false);
            } catch (err: any) {
                console.error(`Release error: ${err.name}, ${err.message}`);
            }
        }
    }, []);

    useEffect(() => {
        // Attempt to acquire lock on mount
        requestWakeLock();

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                requestWakeLock();
            }
        };

        // Many browsers require a user gesture to grant wake lock.
        // We listen for the first interaction to retry if we aren't locked yet.
        const handleInteraction = () => {
            if (!isLocked && !isPolicyBlocked.current) {
                requestWakeLock();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('click', handleInteraction);
        window.addEventListener('touchstart', handleInteraction);
        
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('click', handleInteraction);
            window.removeEventListener('touchstart', handleInteraction);
            releaseWakeLock();
        };
    }, [requestWakeLock, releaseWakeLock, isLocked]);

    return { isLocked, error, requestWakeLock };
};

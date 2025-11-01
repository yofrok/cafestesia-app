import { useRef, useCallback } from 'react';
import { NOTIFICATION_SOUND_BASE64 } from '../assets/notification';

export const useAudioAlerts = () => {
    // useRef ensures the Audio object is created only once.
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const initializeAudio = useCallback(() => {
        if (!audioRef.current) {
            audioRef.current = new Audio(NOTIFICATION_SOUND_BASE64);
        }
    }, []);

    const playAlert = useCallback(() => {
        // Initialize on first play attempt to comply with browser autoplay policies
        initializeAudio();

        if (audioRef.current) {
            // Reset time to play again if it's already playing
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(error => {
                // Autoplay was prevented. This is common before any user interaction.
                // We can log this, but typically we don't need to show an error to the user.
                console.warn("Audio playback failed:", error);
            });
        }
    }, [initializeAudio]);

    return { playAlert };
};
import { useRef, useCallback, useState, useEffect } from 'react';

const SOUND_MUTED_KEY = 'productionSoundMuted';

type SoundName = 'start' | 'warning' | 'alarm' | 'success' | 'notification';
type AudioState = 'uninitialized' | 'loading' | 'suspended' | 'running' | 'error';

// This now maps sound names to their file paths.
const sounds: Record<SoundName, string> = {
    start: '/assets/sounds/start.mp3',
    warning: '/assets/sounds/warning.mp3',
    alarm: '/assets/sounds/alarm.mp3',
    success: '/assets/sounds/success.mp3',
    notification: '/assets/sounds/notification.mp3',
};

// --- Singleton AudioContext ---
// A single, persistent AudioContext and buffer cache are attached to the window
// object. This prevents re-initialization during hot-reloads and ensures a
// single audio source for the entire application, avoiding common playback issues.
interface CafestesiaWindow extends Window {
  cafestesiaAudioContext?: AudioContext;
  cafestesiaAudioBuffers?: Partial<Record<SoundName, AudioBuffer>>;
  cafestesiaGainNode?: GainNode;
  AudioContext: typeof AudioContext;
  webkitAudioContext: typeof AudioContext;
}

declare const window: CafestesiaWindow;

let audioContext: AudioContext | null = null;
let audioBuffers: Partial<Record<SoundName, AudioBuffer>> = {};
let gainNode: GainNode | null = null;

if (typeof window !== 'undefined') {
    if (!window.cafestesiaAudioContext) {
        try {
            window.cafestesiaAudioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.error("Web Audio API is not supported in this browser.", e);
        }
    }
    audioContext = window.cafestesiaAudioContext || null;
    
    if (audioContext && !window.cafestesiaGainNode) {
        const node = audioContext.createGain();
        node.connect(audioContext.destination);
        window.cafestesiaGainNode = node;
    }
    gainNode = window.cafestesiaGainNode || null;

    if (!window.cafestesiaAudioBuffers) {
        window.cafestesiaAudioBuffers = {};
    }
    audioBuffers = window.cafestesiaAudioBuffers;
}
// ----------------------------

export const useProductionAlerts = () => {
    const alarmSourceRef = useRef<AudioBufferSourceNode | null>(null);
    const [audioState, setAudioState] = useState<AudioState>('uninitialized');
    const [areBuffersLoaded, setAreBuffersLoaded] = useState<boolean>(() => {
        // Check if buffers are already loaded in the singleton cache on init
        return Object.keys(audioBuffers).length === Object.keys(sounds).length;
    });

    const [isSoundMuted, setIsSoundMuted] = useState<boolean>(() => {
        try {
            return localStorage.getItem(SOUND_MUTED_KEY) === 'true';
        } catch { 
            return false; 
        }
    });

    useEffect(() => {
        localStorage.setItem(SOUND_MUTED_KEY, String(isSoundMuted));
        if (gainNode && audioContext) {
            gainNode.gain.setTargetAtTime(isSoundMuted ? 0 : 1, audioContext.currentTime, 0.01);
        }
        // Use a custom event to notify other instances of this hook on the same page.
        window.dispatchEvent(new CustomEvent('mute-change', { detail: { isMuted: isSoundMuted } }));
    }, [isSoundMuted]);

    // Listen for custom event (same page) OR storage event (cross-tab) to sync mute state.
    useEffect(() => {
        const handleMuteChange = (e: Event) => {
            setIsSoundMuted((e as CustomEvent).detail.isMuted);
        };
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === SOUND_MUTED_KEY) {
                setIsSoundMuted(e.newValue === 'true');
            }
        };

        window.addEventListener('mute-change', handleMuteChange);
        window.addEventListener('storage', handleStorageChange);
        return () => {
            window.removeEventListener('mute-change', handleMuteChange);
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);


    // This effect loads audio files into the singleton context once.
    useEffect(() => {
        let isMounted = true;

        const initializeAudio = async () => {
            if (!audioContext) {
                setAudioState('error');
                return;
            }
             // If buffers are already loaded from a previous run, just set the state and exit.
            if (areBuffersLoaded) {
                setAudioState(audioContext.state as AudioState);
                return;
            }
            
            setAudioState('loading');
            
            // Listen for state changes (e.g., from suspended to running).
            audioContext.onstatechange = () => {
                if (isMounted) {
                    setAudioState(audioContext!.state as 'suspended' | 'running');
                }
            };
            setAudioState(audioContext.state as AudioState);

            try {
                const promises = (Object.keys(sounds) as SoundName[]).map(async name => {
                    if (audioBuffers[name]) return; // Don't re-decode if already loaded.

                    const soundPath = sounds[name];
                    const response = await fetch(soundPath);
                    if (!response.ok) {
                        throw new Error(`Failed to fetch sound: ${soundPath}`);
                    }
                    
                    const arrayBuffer = await response.arrayBuffer();
                    const decodedBuffer = await audioContext!.decodeAudioData(arrayBuffer);
                    
                    if (isMounted) {
                        audioBuffers[name] = decodedBuffer;
                    }
                });

                await Promise.all(promises);

                if (isMounted) {
                    setAreBuffersLoaded(true);
                    // Final state check after loading is complete.
                    setAudioState(audioContext.state as AudioState);
                }
            } catch (error) {
                console.error("Error initializing audio buffers:", error);
                if (isMounted) {
                    setAudioState('error');
                }
            }
        };

        initializeAudio();
        
        return () => { isMounted = false; };
    }, [areBuffersLoaded]); // Run only when buffers are not loaded.

    // unlockAudio attempts to resume the context if it's suspended by the browser.
    // This must be called from a user gesture (e.g., a click).
    const unlockAudio = useCallback(async () => {
        if (audioContext && audioContext.state === 'suspended') {
            try {
                await audioContext.resume();
                // Proactively update the state after resuming.
                // Do not rely solely on the onstatechange event as it can be unreliable.
                setAudioState(audioContext.state as AudioState);
            } catch(e) {
                console.error("Failed to resume audio context", e);
                 // Even if it fails, update state to reflect the attempt.
                setAudioState(audioContext.state as AudioState);
            }
        }
    }, []);

    const playSound = useCallback((name: SoundName, loop = false) => {
        if (!audioContext || !gainNode || audioState === 'error' || !areBuffersLoaded) return;
        
        if (audioContext.state !== 'running') {
            console.warn(`AudioContext not running (state: ${audioContext.state}). Sound '${name}' needs a user gesture.`);
            // Attempt to unlock if a sound is triggered while suspended.
            // This won't work without a user gesture, but it's a fallback.
            unlockAudio();
            return;
        }

        const buffer = audioBuffers[name];
        if (!buffer) {
            console.warn(`Audio buffer for '${name}' not loaded yet. State: ${audioState}`);
            return;
        }
        
        if (loop) stopAlarmLoop();

        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(gainNode);
        source.loop = loop;
        source.start(0);

        if (loop) {
            alarmSourceRef.current = source;
        }

    }, [audioState, areBuffersLoaded, unlockAudio]);

    const stopAlarmLoop = useCallback(() => {
        if (alarmSourceRef.current) {
            try { alarmSourceRef.current.stop(); } catch (e) { /* Ignore */ }
            alarmSourceRef.current = null;
        }
    }, []);

    const toggleSoundMute = useCallback(() => {
        unlockAudio();
        setIsSoundMuted(prev => {
            const nextMuted = !prev;
            if (nextMuted) {
                stopAlarmLoop();
            }
            return nextMuted;
        });
    }, [stopAlarmLoop, unlockAudio]);

    const isAudioReady = areBuffersLoaded;
    const isSuspended = audioState === 'suspended';

    return {
        isSoundMuted,
        toggleSoundMute,
        unlockAudio,
        isAudioReady,
        isSuspended,
        playStart: () => playSound('start'),
        playWarning: () => playSound('warning'),
        playAlarmLoop: () => playSound('alarm', true),
        stopAlarmLoop,
        playSuccess: () => playSound('success'),
        playNotification: () => playSound('notification'),
    };
};

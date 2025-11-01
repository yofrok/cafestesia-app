import { useRef, useCallback, useState, useEffect } from 'react';
import { START_SOUND_BASE64, WARNING_SOUND_BASE64, ALARM_SOUND_BASE64, SUCCESS_SOUND_BASE64 } from '../../assets/production-sounds';

const SOUND_MUTED_KEY = 'productionSoundMuted';

type SoundName = 'start' | 'warning' | 'alarm' | 'success';

const sounds: Record<SoundName, string> = {
    start: START_SOUND_BASE64,
    warning: WARNING_SOUND_BASE64,
    alarm: ALARM_SOUND_BASE64,
    success: SUCCESS_SOUND_BASE64,
};

export const useProductionAlerts = () => {
    const audioContextRef = useRef<AudioContext | null>(null);
    const audioBuffersRef = useRef<Partial<Record<SoundName, AudioBuffer>>>({});
    const alarmSourceRef = useRef<AudioBufferSourceNode | null>(null);

    const [isSoundMuted, setIsSoundMuted] = useState<boolean>(() => {
        try {
            const storedValue = localStorage.getItem(SOUND_MUTED_KEY);
            // Default to NOT muted (false) if no value is stored. This was the bug.
            return storedValue === null ? false : storedValue === 'true';
        } catch { 
            return false; 
        }
    });

    useEffect(() => {
        localStorage.setItem(SOUND_MUTED_KEY, String(isSoundMuted));
    }, [isSoundMuted]);

    const unlockAudio = useCallback(() => {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        const context = audioContextRef.current;
        if (context.state === 'suspended') {
            context.resume();
        }
    }, []);

    useEffect(() => {
        let isMounted = true;
        // Create the context as soon as the component mounts.
        // It will be in a 'suspended' state until a user interaction.
        if (!audioContextRef.current) {
             audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        
        const context = audioContextRef.current;

        const loadAllSounds = async () => {
            try {
                const promises = (Object.keys(sounds) as SoundName[]).map(async name => {
                    if (audioBuffersRef.current[name]) return;

                    const response = await fetch(sounds[name]);
                    const arrayBuffer = await response.arrayBuffer();
                    const audioBuffer = await context.decodeAudioData(arrayBuffer);
                    if (isMounted) {
                        audioBuffersRef.current[name] = audioBuffer;
                    }
                });
                await Promise.all(promises);
            } catch (error) {
                console.error("Error loading or decoding audio files:", error);
            }
        };

        loadAllSounds();
        
        return () => { isMounted = false; };
    }, []);

    const playSound = useCallback((name: SoundName, loop = false) => {
        if (isSoundMuted) return;
        
        const context = audioContextRef.current;
        const buffer = audioBuffersRef.current[name];
        if (!context || !buffer) return;

        // The resume() function is the key to unlocking audio on user interaction.
        // It returns a promise, so we play the sound after it resolves.
        if (context.state === 'suspended') {
            context.resume().then(() => {
                const source = context.createBufferSource();
                source.buffer = buffer;
                source.connect(context.destination);
                source.loop = loop;
                source.start(0);
                if (loop) alarmSourceRef.current = source;
            });
        } else {
             const source = context.createBufferSource();
             source.buffer = buffer;
             source.connect(context.destination);
             source.loop = loop;
             source.start(0);
             if (loop) alarmSourceRef.current = source;
        }
    }, [isSoundMuted]);

    const stopAlarmLoop = useCallback(() => {
        if (alarmSourceRef.current) {
            try {
                alarmSourceRef.current.stop();
            } catch (e) { /* Ignore errors if already stopped */ }
            alarmSourceRef.current = null;
        }
    }, []);

    const toggleSoundMute = useCallback(() => {
        unlockAudio(); // Always try to unlock on user interaction
        setIsSoundMuted(prev => {
            const nextMuted = !prev;
            if (nextMuted) {
                 stopAlarmLoop();
            }
            return nextMuted;
        });
    }, [stopAlarmLoop, unlockAudio]);

    return {
        isSoundMuted,
        toggleSoundMute,
        playStart: () => playSound('start'),
        playWarning: () => playSound('warning'),
        playAlarmLoop: () => playSound('alarm', true),
        stopAlarmLoop,
        playSuccess: () => playSound('success'),
    };
};
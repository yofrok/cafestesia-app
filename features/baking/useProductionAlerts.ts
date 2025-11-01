import { useRef, useCallback, useState, useEffect } from 'react';
import { START_SOUND_BASE64, WARNING_SOUND_BASE64, ALARM_SOUND_BASE64, SUCCESS_SOUND_BASE64 } from '../../assets/production-sounds';

const SOUND_MUTED_KEY = 'productionSoundMuted';

type SoundName = 'start' | 'warning' | 'alarm' | 'success';
type AudioState = 'loading' | 'ready' | 'error';

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
    const isUnlockedRef = useRef(false);

    const [audioState, setAudioState] = useState<AudioState>('loading');

    const [isSoundMuted, setIsSoundMuted] = useState<boolean>(() => {
        try {
            return localStorage.getItem(SOUND_MUTED_KEY) === 'true';
        } catch { 
            return false; 
        }
    });

    useEffect(() => {
        localStorage.setItem(SOUND_MUTED_KEY, String(isSoundMuted));
    }, [isSoundMuted]);

    // This effect loads and decodes audio files.
    useEffect(() => {
        let isMounted = true;
        setAudioState('loading');
        
        // Use a temporary context just for decoding.
        const decodingContext = new (window.AudioContext || (window as any).webkitAudioContext)();

        const loadAllSounds = async () => {
            try {
                const promises = (Object.keys(sounds) as SoundName[]).map(async name => {
                    if (audioBuffersRef.current[name]) return;
                    const response = await fetch(sounds[name]);
                    const arrayBuffer = await response.arrayBuffer();
                    const audioBuffer = await decodingContext.decodeAudioData(arrayBuffer);
                    if (isMounted) {
                        audioBuffersRef.current[name] = audioBuffer;
                    }
                });
                await Promise.all(promises);
                if (isMounted) {
                    setAudioState('ready');
                }
            } catch (error) {
                console.error("Error loading or decoding audio files:", error);
                if (isMounted) {
                    setAudioState('error');
                }
            } finally {
                // Close the temporary context after decoding is done.
                decodingContext.close();
            }
        };

        loadAllSounds();
        
        return () => { isMounted = false; };
    }, []);

    const unlockAudio = useCallback(() => {
        if (isUnlockedRef.current) return;
        
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        
        const context = audioContextRef.current;
        if (context.state === 'suspended') {
            context.resume().then(() => {
                isUnlockedRef.current = true;
            });
        } else {
            isUnlockedRef.current = true;
        }
    }, []);


    const playSound = useCallback((name: SoundName, loop = false) => {
        if (isSoundMuted || audioState !== 'ready' || !audioContextRef.current) {
            return;
        }
        
        const context = audioContextRef.current;
        const buffer = audioBuffersRef.current[name];
        
        if (!buffer) return;

        // If the context is still suspended, it means unlockAudio hasn't been successfully called yet.
        // We don't play to avoid errors. The unlock needs to happen first.
        if (context.state === 'suspended') {
            return;
        }

        const source = context.createBufferSource();
        source.buffer = buffer;
        source.connect(context.destination);
        source.loop = loop;
        source.start(0);

        if (loop) {
             if (alarmSourceRef.current) {
                try { alarmSourceRef.current.stop(); } catch (e) {}
             }
            alarmSourceRef.current = source;
        }

    }, [isSoundMuted, audioState]);

    const stopAlarmLoop = useCallback(() => {
        if (alarmSourceRef.current) {
            try {
                alarmSourceRef.current.stop();
            } catch (e) { /* Ignore errors if already stopped */ }
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

    return {
        isSoundMuted,
        toggleSoundMute,
        audioState,
        unlockAudio,
        playStart: () => playSound('start'),
        playWarning: () => playSound('warning'),
        playAlarmLoop: () => playSound('alarm', true),
        stopAlarmLoop,
        playSuccess: () => playSound('success'),
    };
};
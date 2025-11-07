import { useState, useEffect, useCallback, useRef } from 'react';
// Fix: Imported RecipeStep from types.ts and separated RECIPES import.
import { ProductionProcess, RecipeStep } from '../../types';
import { RECIPES } from '../../constants';
import { useProductionAlerts } from './useProductionAlerts';

const PRODUCTION_STATE_KEY = 'productionState_v2';

const loadState = (): ProductionProcess[] => {
    try {
        const savedStateJSON = localStorage.getItem(PRODUCTION_STATE_KEY);
        if (savedStateJSON) {
            const loadedProcesses: ProductionProcess[] = JSON.parse(savedStateJSON);
            return loadedProcesses.map(p => ({...p, recipe: p.recipeId ? RECIPES[p.recipeId] : undefined }));
        }
    } catch (error) {
        console.error("Error loading production state:", error);
    }
    return [];
};

const saveState = (state: ProductionProcess[]) => {
    try {
        // Don't save the full recipe object, just the ID, to keep localStorage light.
        const stateToSave = state.map(({ recipe, ...rest }) => rest);
        localStorage.setItem(PRODUCTION_STATE_KEY, JSON.stringify(stateToSave));
    } catch (error) {
        console.error("Error saving production state:", error);
    }
};

export const useProduction = () => {
    const [processes, setProcesses] = useState<ProductionProcess[]>(loadState);
    const timerRef = useRef<number | null>(null);
    const pendingStartProcessId = useRef<string | null>(null);

    const { 
        isSoundMuted, 
        toggleSoundMute,
        playStart, 
        playWarning, 
        playAlarmLoop, 
        stopAlarmLoop, 
        playSuccess,
        unlockAudio,
        isAudioReady,
        playNotification,
        isSuspended,
    } = useProductionAlerts();
    
    const playedWarningsRef = useRef(new Set<string>());

    const stopTimer = useCallback(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    const tick = useCallback(() => {
        setProcesses(prevProcesses => {
            const now = Date.now();
            let hasChanged = false;

            const updatedProcesses = prevProcesses.map(p => {
                if (p.state !== 'running') return p;
                
                hasChanged = true;
                const elapsedSeconds = Math.round((now - p.lastTickTimestamp) / 1000);
                
                const previousStepTimeLeft = p.stepTimeLeft;
                const newStepTimeLeft = Math.max(0, p.stepTimeLeft - elapsedSeconds);
                const newTotalTimeLeft = Math.max(0, p.totalTimeLeft - elapsedSeconds);

                // --- Precise 30-Second Warning Logic ---
                const warningKey = `${p.id}-${p.currentStepIndex}`;
                if (previousStepTimeLeft > 30 && newStepTimeLeft <= 30 && !playedWarningsRef.current.has(warningKey)) {
                    // Play warning sound 3 times with a delay.
                    playWarning();
                    setTimeout(() => playWarning(), 700);
                    setTimeout(() => playWarning(), 1400);
                    playedWarningsRef.current.add(warningKey);
                }
                
                // When step time hits zero, trigger alarm directly.
                if (newStepTimeLeft === 0 && previousStepTimeLeft > 0) {
                    playAlarmLoop(); // Play alarm sound immediately
                    return {
                        ...p,
                        stepTimeLeft: 0,
                        totalTimeLeft: newTotalTimeLeft,
                        state: 'alarm' as const,
                        lastTickTimestamp: now,
                    };
                }
                
                return {
                    ...p,
                    stepTimeLeft: newStepTimeLeft,
                    totalTimeLeft: newTotalTimeLeft,
                    lastTickTimestamp: now,
                };
            });
            
            if (hasChanged) return updatedProcesses;
            return prevProcesses;
        });
    }, [playWarning, playAlarmLoop]);

    const startTimer = useCallback(() => {
        stopTimer();
        timerRef.current = window.setInterval(tick, 1000);
    }, [stopTimer, tick]);

     // Recalculate time on load
    useEffect(() => {
        setProcesses(prevProcesses => {
            const now = Date.now();
            return prevProcesses.map(p => {
                 if (p.state !== 'running') return p;
                 
                 const elapsedSeconds = Math.round((now - p.lastTickTimestamp) / 1000);
                 const newStepTimeLeft = Math.max(0, p.stepTimeLeft - elapsedSeconds);
                 const newTotalTimeLeft = Math.max(0, p.totalTimeLeft - elapsedSeconds);

                 if(newStepTimeLeft === 0) {
                     return { ...p, state: 'alarm' as const, stepTimeLeft: 0, totalTimeLeft: newTotalTimeLeft };
                 }
                 return { ...p, stepTimeLeft: newStepTimeLeft, totalTimeLeft: newTotalTimeLeft, lastTickTimestamp: now };
            });
        });
    }, []);

    useEffect(() => {
        saveState(processes);
        const isAnyProcessRunning = processes.some(p => p.state === 'running');
        if (isAnyProcessRunning) {
            startTimer();
        } else {
            stopTimer();
        }
        return stopTimer;
    }, [processes, startTimer, stopTimer]);
    
    // This effect triggers when the audio is no longer suspended AND there's a process waiting.
    useEffect(() => {
        if (!isSuspended && pendingStartProcessId.current) {
            const processIdToStart = pendingStartProcessId.current;
            pendingStartProcessId.current = null; // Clear the queue

            // Now, safely start the process and play the sound
            setProcesses(prev => prev.map(p => {
                if (p.id !== processIdToStart) return p;

                const isFirstStart = p.state === 'paused' && p.totalTimeLeft === p.totalTime;
                if (isFirstStart) {
                    playStart();
                }
                return { ...p, state: 'running' as const, lastTickTimestamp: Date.now() };
            }));
        }
    }, [isSuspended, playStart]);


    const startBakingProcess = useCallback((recipeId: string) => {
        const recipe = RECIPES[recipeId];
        if (!recipe) return;
        
        const newProcess: ProductionProcess = {
            id: `baking-${Date.now()}`,
            name: recipe.name,
            recipeId,
            recipe,
            type: 'baking',
            state: 'paused',
            currentStepIndex: 0,
            steps: recipe.steps,
            totalTime: recipe.totalDuration,
            totalTimeLeft: recipe.totalDuration,
            stepTimeLeft: recipe.steps[0].duration,
            lastTickTimestamp: Date.now(),
        };
        setProcesses(prev => [...prev, newProcess]);
    }, []);

    const startHeatingProcess = useCallback((duration: number, name: string) => {
        const heatingSteps: RecipeStep[] = [{ instruction: name, duration, isPauseStep: false }];
        const newProcess: ProductionProcess = {
             id: `heating-${Date.now()}`,
             name: name,
             type: 'heating',
             state: 'paused',
             currentStepIndex: 0,
             steps: heatingSteps,
             totalTime: duration,
             totalTimeLeft: duration,
             stepTimeLeft: duration,
             lastTickTimestamp: Date.now(),
        };
        setProcesses(prev => [...prev, newProcess]);
    }, []);

    const advanceProcess = useCallback((processId: string) => {
        stopAlarmLoop();
        setProcesses(prev => prev.map(p => {
            if (p.id !== processId) return p;

            if (p.state === 'finished') { // Acknowledging a finished process
                return { ...p, state: 'paused' }; // Becomes a static finished card
            }
            
            // Acknowledging an alarm
            if (p.currentStepIndex < p.steps.length - 1) {
                const nextStepIndex = p.currentStepIndex + 1;
                const nextStep = p.steps[nextStepIndex];
                return {
                    ...p,
                    state: 'intermission' as const,
                    currentStepIndex: nextStepIndex,
                    stepTimeLeft: nextStep.duration,
                    lastTickTimestamp: Date.now(),
                };
            } else { // Last step finished
                playSuccess();
                return {
                    ...p,
                    state: 'finished' as const,
                    stepTimeLeft: 0,
                    lastTickTimestamp: Date.now(),
                };
            }
        }));
    }, [stopAlarmLoop, playSuccess]);
    
    const togglePauseProcess = useCallback((processId: string) => {
        const processToToggle = processes.find(p => p.id === processId);
        if (!processToToggle || processToToggle.state === 'alarm' || processToToggle.state === 'finished') {
            return;
        }

        // Handle pausing a running process (always allowed)
        if (processToToggle.state === 'running') {
            setProcesses(prev => prev.map(p => p.id === processId ? { ...p, state: 'paused' as const } : p));
            return;
        }

        // Handle starting a paused or intermission process
        if (processToToggle.state === 'paused' || processToToggle.state === 'intermission') {
            if (isSuspended) {
                // If audio is suspended, queue the start and request unlock
                pendingStartProcessId.current = processId;
                unlockAudio();
            } else {
                // Audio is already running, proceed immediately
                setProcesses(prev => prev.map(p => {
                    if (p.id !== processId) return p;
                    
                    const isFirstStart = p.state === 'paused' && p.totalTimeLeft === p.totalTime;
                    if (isFirstStart) {
                        playStart();
                    }
                    return { ...p, state: 'running' as const, lastTickTimestamp: Date.now() };
                }));
            }
        }
    }, [processes, isSuspended, unlockAudio, playStart]);

    const cancelProcess = useCallback((processId: string) => {
        stopAlarmLoop();
        setProcesses(prev => prev.filter(p => p.id !== processId));
    }, [stopAlarmLoop]);

    return { processes, startBakingProcess, startHeatingProcess, advanceProcess, togglePauseProcess, cancelProcess, isSoundMuted, toggleSoundMute, isAudioReady, playNotification, isSuspended, unlockAudio };
};
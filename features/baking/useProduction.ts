
import { useState, useEffect, useCallback, useRef } from 'react';
import { ProductionProcess, Recipe, RecipeStep } from '../../types';
import { useProductionAlerts } from './useProductionAlerts';
import { db } from '../../services/firebase';
import * as firestore from 'firebase/firestore';

const processesCollectionRef = firestore.collection(db, 'production_processes');

// Helper to apply variant overrides to base recipe steps
const getStepsForVariant = (recipe: Recipe, variantId?: string): RecipeStep[] => {
    if (!variantId || variantId === "base" || !recipe.variants) {
        return recipe.steps;
    }
    const variant = recipe.variants.find(v => v.id === variantId);
    if (!variant) {
        return recipe.steps;
    }
    return recipe.steps.map((baseStep, index) => {
        const override = variant.stepOverrides[index];
        if (override) {
            return { ...baseStep, ...override };
        }
        return baseStep;
    });
};

export const useProduction = () => {
    const [processes, setProcesses] = useState<ProductionProcess[]>([]);
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

    // --- Firestore Real-time Listener ---
    useEffect(() => {
        // Order by start time so the list doesn't jump around
        const q = firestore.query(processesCollectionRef, firestore.orderBy("lastTickTimestamp", "asc")); // Using timestamp as proxy for creation/update order
        
        const unsubscribe = firestore.onSnapshot(q, (snapshot) => {
            const processesData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as ProductionProcess));
            setProcesses(processesData);
        }, (error) => {
            console.error("Error syncing production processes:", error);
        });

        return () => unsubscribe();
    }, []);


    const stopTimer = useCallback(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    // --- The Local Ticker ---
    // This updates the UI every second based on the server's data.
    // It calculates "Real Time" elapsed since the last server update.
    const tick = useCallback(() => {
        setProcesses(prevProcesses => {
            const now = Date.now();
            let hasChanged = false;

            const updatedProcesses = prevProcesses.map(p => {
                if (p.state !== 'running') return p;
                
                // We calculate elapsed time locally relative to when the process was last "touched" (started/resumed)
                // This 'lastTickTimestamp' effectively acts as the "Resume Time" stored in DB.
                const elapsedSeconds = Math.round((now - p.lastTickTimestamp) / 1000);
                
                // Don't let it go below 0 purely visually here.
                // The source of truth is the DB data (p.stepTimeLeft) minus elapsed.
                const currentStepTimeLeft = Math.max(0, p.stepTimeLeft - elapsedSeconds);
                const currentTotalTimeLeft = Math.max(0, p.totalTimeLeft - elapsedSeconds);

                hasChanged = true;

                // --- Precise 30-Second Warning Logic ---
                const warningKey = `${p.id}-${p.currentStepIndex}`;
                // Use a slightly wider window for detection to ensure we catch it between ticks
                if (currentStepTimeLeft <= 30 && currentStepTimeLeft > 28 && !playedWarningsRef.current.has(warningKey)) {
                    playWarning();
                    setTimeout(() => playWarning(), 700);
                    setTimeout(() => playWarning(), 1400);
                    playedWarningsRef.current.add(warningKey);
                }
                
                // --- Alarm Trigger (Write to DB) ---
                // If we hit 0 locally, we must update the DB so ALL devices know it's Alarm time.
                if (currentStepTimeLeft === 0) {
                    // Prevent multiple writes
                    if (p.state === 'running') { // Double check it hasn't already been updated
                        playAlarmLoop();
                        // Update Firestore! This stops the timer on all devices.
                        const processRef = firestore.doc(db, 'production_processes', p.id);
                        firestore.updateDoc(processRef, {
                            state: 'alarm',
                            stepTimeLeft: 0,
                            totalTimeLeft: currentTotalTimeLeft,
                            lastTickTimestamp: now 
                        }).catch(err => console.error("Error triggering alarm:", err));
                    }
                    
                    return {
                        ...p,
                        state: 'alarm' as const,
                        stepTimeLeft: 0,
                        totalTimeLeft: currentTotalTimeLeft,
                    };
                }
                
                // Just update local display state, DO NOT write to DB on every tick (too expensive)
                return {
                    ...p,
                    // We override these values locally for display, but they aren't saved to DB until pause/stop
                    stepTimeLeft: currentStepTimeLeft, 
                    totalTimeLeft: currentTotalTimeLeft,
                    // We DON'T update lastTickTimestamp here, because we need the original anchor point
                    // relative to Date.now() to keep calculating correctly.
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

    useEffect(() => {
        const isAnyProcessRunning = processes.some(p => p.state === 'running');
        if (isAnyProcessRunning) {
            startTimer();
        } else {
            stopTimer();
        }
        return stopTimer;
    }, [processes, startTimer, stopTimer]);
    
    
    // --- Audio Unlock Logic ---
    useEffect(() => {
        if (!isSuspended && pendingStartProcessId.current) {
            const processIdToStart = pendingStartProcessId.current;
            pendingStartProcessId.current = null;

            // Find the process to play sound for (visual feedback only, logic handled in togglePause)
            const process = processes.find(p => p.id === processIdToStart);
            if (process && process.state === 'paused' && process.totalTimeLeft === process.totalTime) {
                playStart();
            }
        }
    }, [isSuspended, playStart, processes]);


    // --- Actions (Firestore Writes) ---

    const startBakingProcess = useCallback(async (recipe: Recipe, variantId?: string) => {
        if (!recipe) return;
        
        const processSteps = getStepsForVariant(recipe, variantId);
        const totalDuration = processSteps.reduce((sum, step) => sum + step.duration, 0);
        
        const variant = recipe.variants?.find(v => v.id === variantId);
        const processName = variant ? `${recipe.name} (${variant.name})` : recipe.name;

        const newProcess: Omit<ProductionProcess, 'id'> = {
            name: processName,
            recipeId: recipe.id,
            recipe: recipe,
            variantId: variantId,
            type: 'baking',
            state: 'paused',
            currentStepIndex: 0,
            steps: processSteps,
            totalTime: totalDuration,
            totalTimeLeft: totalDuration,
            stepTimeLeft: processSteps[0].duration,
            lastTickTimestamp: Date.now(),
        };
        
        try {
            await firestore.addDoc(processesCollectionRef, newProcess);
        } catch (e) {
            console.error("Error starting baking process:", e);
        }
    }, []);

    const startHeatingProcess = useCallback(async (duration: number, name: string) => {
        const heatingSteps: RecipeStep[] = [{ instruction: name, duration: duration, type: 'passive' }];
        const newProcess: Omit<ProductionProcess, 'id'> = {
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
        try {
            await firestore.addDoc(processesCollectionRef, newProcess);
        } catch (e) {
            console.error("Error starting heating process:", e);
        }
    }, []);

    const advanceProcess = useCallback(async (processId: string) => {
        stopAlarmLoop();
        const process = processes.find(p => p.id === processId);
        if (!process) return;

        const processRef = firestore.doc(db, 'production_processes', processId);
        const updates: Partial<ProductionProcess> = { lastTickTimestamp: Date.now() };

        if (process.state === 'finished') {
             updates.state = 'paused';
        } else if (process.currentStepIndex < process.steps.length - 1) {
            const nextStepIndex = process.currentStepIndex + 1;
            const nextStep = process.steps[nextStepIndex];
            
            updates.state = 'intermission';
            updates.currentStepIndex = nextStepIndex;
            updates.stepTimeLeft = nextStep.duration;
            // Note: totalTimeLeft is approximate here, we accept the drift
        } else {
            playSuccess();
            updates.state = 'finished';
            updates.stepTimeLeft = 0;
        }

        try {
            await firestore.updateDoc(processRef, updates);
        } catch (e) {
            console.error("Error advancing process:", e);
        }
    }, [processes, stopAlarmLoop, playSuccess]);

    const goToPreviousStep = useCallback(async (processId: string) => {
        stopAlarmLoop();
        const process = processes.find(p => p.id === processId);
        if (!process) return;

        if (process.currentStepIndex > 0) {
            const prevStepIndex = process.currentStepIndex - 1;
            const prevStep = process.steps[prevStepIndex];
            
            const processRef = firestore.doc(db, 'production_processes', processId);
            try {
                await firestore.updateDoc(processRef, {
                    state: 'paused',
                    currentStepIndex: prevStepIndex,
                    stepTimeLeft: prevStep.duration,
                    lastTickTimestamp: Date.now()
                });
            } catch (e) {
                console.error("Error going back:", e);
            }
        }
    }, [processes, stopAlarmLoop]);
    
    const togglePauseProcess = useCallback(async (processId: string) => {
        const process = processes.find(p => p.id === processId);
        if (!process || process.state === 'alarm' || process.state === 'finished') {
            return;
        }

        const processRef = firestore.doc(db, 'production_processes', processId);

        if (process.state === 'running') {
            // PAUSING:
            // We trust the current visual state from 'tick' as the pause point.
            const now = Date.now();
            
            try {
                await firestore.updateDoc(processRef, {
                    state: 'paused',
                    stepTimeLeft: process.stepTimeLeft, 
                    totalTimeLeft: process.totalTimeLeft,
                    lastTickTimestamp: now
                });
            } catch(e) { console.error(e); }

        } else {
            // RESUMING
            if (isSuspended) {
                pendingStartProcessId.current = processId;
                unlockAudio();
            } 
            
            const isFirstStart = process.state === 'paused' && process.totalTimeLeft === process.totalTime;
            if (isFirstStart) playStart();

            try {
                await firestore.updateDoc(processRef, {
                    state: 'running',
                    lastTickTimestamp: Date.now() // This sets the anchor for all devices
                });
            } catch(e) { console.error(e); }
        }
    }, [processes, isSuspended, unlockAudio, playStart]);

    const cancelProcess = useCallback(async (processId: string) => {
        stopAlarmLoop();
        const processRef = firestore.doc(db, 'production_processes', processId);
        try {
            await firestore.deleteDoc(processRef);
        } catch (e) {
            console.error("Error deleting process:", e);
        }
    }, [stopAlarmLoop]);

    return { processes, startBakingProcess, startHeatingProcess, advanceProcess, goToPreviousStep, togglePauseProcess, cancelProcess, isSoundMuted, toggleSoundMute, isAudioReady, playNotification, isSuspended, unlockAudio };
};

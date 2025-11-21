
import { useState, useEffect, useCallback } from 'react';
import { KanbanTask, TaskStatus, TaskTemplate } from '../types';
import { INITIAL_TASKS } from '../constants';
import { db } from './firebase';
// FIX: Use namespace import for firestore to fix module resolution issues.
import * as firestore from 'firebase/firestore';

const tasksCollectionRef = firestore.collection(db, 'tasks');
const templatesCollectionRef = firestore.collection(db, 'task_templates');

export const useKanban = () => {
    const [tasks, setTasks] = useState<KanbanTask[]>([]);

    useEffect(() => {
        // Query without date/time ordering to fetch all tasks, including unplanned ones.
        const q = firestore.query(tasksCollectionRef);
        
        const unsubscribe = firestore.onSnapshot(q, (snapshot: firestore.QuerySnapshot) => {
            // REMOVED: Auto-seeding logic. 
            // This prevents the "Zombie Task" issue where emptying the list causes it to regenerate immediately.
            
            const tasksData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            } as KanbanTask));
            setTasks(tasksData);
        }, (error) => {
            console.error("Error fetching Kanban tasks:", error);
        });

        return () => unsubscribe();
    }, []);

    const updateTaskStatus = async (taskId: string, newStatus: TaskStatus) => {
        const taskRef = firestore.doc(db, 'tasks', taskId);
        try {
            await firestore.updateDoc(taskRef, { status: newStatus });
        } catch (error) {
            console.error("Error updating task status:", error);
        }
    };

    const addTask = async (taskData: Omit<KanbanTask, 'id' | 'status'>) => {
        try {
            await firestore.addDoc(tasksCollectionRef, { ...taskData, status: 'todo' });
        } catch (error) {
            console.error("Error adding task:", error);
        }
    };
    
    const addMultipleTasks = async (tasksData: Omit<KanbanTask, 'id' | 'status'>[]) => {
        try {
            const batch = firestore.writeBatch(db);
            const recurrenceId = `rec-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
            tasksData.forEach(taskData => {
                const docRef = firestore.doc(tasksCollectionRef);
                batch.set(docRef, { ...taskData, status: 'todo', recurrenceId });
            });
            await batch.commit();
        } catch (error) {
            console.error("Error adding multiple tasks:", error);
        }
    };

    const updateTask = async (updatedTask: KanbanTask) => {
        const { id, ...taskData } = updatedTask;
        const taskRef = firestore.doc(db, 'tasks', id);
        const dataToUpdate: { [key: string]: any } = taskData;
        
        // If recurrenceId is not present in the object, it means we want to remove it.
        if (!('recurrenceId' in taskData)) {
            dataToUpdate.recurrenceId = firestore.deleteField();
        }

        try {
            await firestore.updateDoc(taskRef, dataToUpdate);
        } catch (error) {
            console.error("Error updating task:", error);
        }
    };

    const deleteTask = async (taskId: string) => {
        const taskRef = firestore.doc(db, 'tasks', taskId);
        try {
            await firestore.deleteDoc(taskRef);
        } catch (error) {
            console.error("Error deleting task:", error);
        }
    };

    const updateFutureTasks = async (originalTask: KanbanTask, updates: Partial<Omit<KanbanTask, 'id' | 'recurrenceId'>>) => {
        if (!originalTask.recurrenceId || !originalTask.date) return;

        const q = firestore.query(
            tasksCollectionRef,
            firestore.where("recurrenceId", "==", originalTask.recurrenceId),
            firestore.where("date", ">=", originalTask.date)
        );

        try {
            const querySnapshot = await firestore.getDocs(q);
            const batch = firestore.writeBatch(db);
            querySnapshot.forEach((document) => {
                const taskRef = firestore.doc(db, 'tasks', document.id);
                const { recurrenceId, ...safeUpdates } = updates as any;
                batch.update(taskRef, safeUpdates);
            });
            await batch.commit();
        } catch (error) {
            console.error("Error updating future tasks:", error);
        }
    };

    const deleteFutureTasks = async (originalTask: KanbanTask) => {
        if (!originalTask.recurrenceId || !originalTask.date) return;

        const q = firestore.query(
            tasksCollectionRef,
            firestore.where("recurrenceId", "==", originalTask.recurrenceId),
            firestore.where("date", ">=", originalTask.date)
        );

        try {
            const querySnapshot = await firestore.getDocs(q);
            const batch = firestore.writeBatch(db);
            querySnapshot.forEach((document) => {
                batch.delete(firestore.doc(db, 'tasks', document.id));
            });
            await batch.commit();
        } catch (error) {
            console.error("Error deleting future tasks:", error);
        }
    };

    const reorderDailyTasks = async (draggedTaskId: string, targetTaskId: string) => {
        const draggedTask = tasks.find(t => t.id === draggedTaskId);
        const targetTask = tasks.find(t => t.id === targetTaskId);

        if (!draggedTask || !targetTask || !draggedTask.time || !targetTask.time || draggedTask.date !== targetTask.date) {
            console.error("Cannot reorder tasks: invalid tasks or different dates.");
            return;
        }

        const draggedTaskRef = firestore.doc(db, 'tasks', draggedTaskId);
        const targetTaskRef = firestore.doc(db, 'tasks', targetTaskId);

        try {
            const batch = firestore.writeBatch(db);
            // Swap times
            batch.update(draggedTaskRef, { time: targetTask.time });
            batch.update(targetTaskRef, { time: draggedTask.time });
            await batch.commit();
        } catch (error) {
            console.error("Error reordering tasks:", error);
        }
    };

    // --- Maintenance Functions ---

    const clearAllTasks = async () => {
        try {
            const snapshot = await firestore.getDocs(tasksCollectionRef);
            const batch = firestore.writeBatch(db);
            snapshot.docs.forEach((doc) => {
                batch.delete(doc.ref);
            });
            await batch.commit();
            console.log("All tasks cleared.");
        } catch (error) {
            console.error("Error clearing tasks:", error);
            throw error;
        }
    };

    const resetTasksToDefault = async () => {
        try {
            // 1. Clear existing
            await clearAllTasks();
            
            // 2. Seed defaults
            const batch = firestore.writeBatch(db);
            INITIAL_TASKS.forEach(task => {
                const newDocRef = firestore.doc(tasksCollectionRef);
                batch.set(newDocRef, task);
            });
            await batch.commit();
            console.log("Tasks reset to default.");
        } catch (error) {
             console.error("Error resetting tasks:", error);
             throw error;
        }
    };

    // --- Lazy Generation of Routines ---
    const generateDailyRoutines = useCallback(async (dateStr: string) => {
        try {
            // 1. Get day of week (0-6) ensuring timezone safety for the string provided
            // Parse YYYY-MM-DD manually to avoid timezone shifts
            const [y, m, d] = dateStr.split('-').map(Number);
            const localDate = new Date(y, m - 1, d);
            const dayOfWeek = localDate.getDay();

            // 2. Get all templates
            const templatesSnapshot = await firestore.getDocs(templatesCollectionRef);
            if (templatesSnapshot.empty) return;

            // 3. Get existing tasks for this day to prevent duplicates
            const existingTasksQuery = firestore.query(tasksCollectionRef, firestore.where("date", "==", dateStr));
            const existingTasksSnapshot = await firestore.getDocs(existingTasksQuery);
            const existingTemplateIds = new Set(
                existingTasksSnapshot.docs
                    .map(doc => (doc.data() as KanbanTask).templateId)
                    .filter(id => !!id)
            );

            const batch = firestore.writeBatch(db);
            let tasksAdded = 0;

            templatesSnapshot.forEach(doc => {
                // FIX: Cast doc.data() to Omit<TaskTemplate, 'id'> to prevent TypeScript error about overwriting 'id'
                const template = { id: doc.id, ...(doc.data() as Omit<TaskTemplate, 'id'>) } as TaskTemplate;

                // Check if routine runs today
                if (template.frequencyDays.includes(dayOfWeek)) {
                    // Check if already generated
                    if (!existingTemplateIds.has(template.id)) {
                        
                        // Determine Employee
                        const assignee = template.customAssignments?.[String(dayOfWeek)] || template.defaultEmployee;

                        const newTask: Omit<KanbanTask, 'id'> = {
                            text: template.title,
                            employee: assignee,
                            date: dateStr,
                            time: template.time,
                            duration: template.duration,
                            shift: template.shift,
                            zone: template.zone,
                            isCritical: template.isCritical,
                            status: 'todo',
                            subtasks: template.subtasks || [],
                            notes: template.notes || '',
                            templateId: template.id,
                            addedBy: 'Sistema (Rutina)'
                        };

                        const newRef = firestore.doc(tasksCollectionRef);
                        batch.set(newRef, newTask);
                        tasksAdded++;
                    }
                }
            });

            if (tasksAdded > 0) {
                await batch.commit();
                console.log(`Generated ${tasksAdded} routine tasks for ${dateStr}`);
            }

        } catch (error) {
            console.error("Error generating daily routines:", error);
        }
    }, []);


    return { 
        tasks, 
        updateTaskStatus, 
        addTask, 
        addMultipleTasks, 
        updateTask, 
        deleteTask, 
        updateFutureTasks, 
        deleteFutureTasks, 
        reorderDailyTasks,
        clearAllTasks,       
        resetTasksToDefault,
        generateDailyRoutines // Exposed
    };
};

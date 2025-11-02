import { useState, useEffect } from 'react';
import { KanbanTask, TaskStatus } from '../types';
import { INITIAL_TASKS } from '../constants';
import { db } from './firebase';
// FIX: Use namespace import for firestore to fix module resolution issues.
import * as firestore from 'firebase/firestore';

const tasksCollectionRef = firestore.collection(db, 'tasks');

const seedInitialData = async () => {
    console.log("Seeding initial tasks to Firestore...");
    const batch = firestore.writeBatch(db);
    INITIAL_TASKS.forEach(task => {
        const newDocRef = firestore.doc(tasksCollectionRef); // Create a new doc with a generated ID
        batch.set(newDocRef, task);
    });
    await batch.commit();
    console.log("Initial tasks seeded.");
};

export const useKanban = () => {
    const [tasks, setTasks] = useState<KanbanTask[]>([]);

    useEffect(() => {
        const q = firestore.query(tasksCollectionRef, firestore.orderBy("date"), firestore.orderBy("time"));
        
        const unsubscribe = firestore.onSnapshot(q, (snapshot) => {
            // Seed data if the collection is empty on first load
            if (snapshot.empty && INITIAL_TASKS.length > 0) {
                seedInitialData();
                return; // The snapshot will re-fire once data is added
            }

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
        if (!originalTask.recurrenceId) return;

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
        if (!originalTask.recurrenceId) return;

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


    return { tasks, updateTaskStatus, addTask, addMultipleTasks, updateTask, deleteTask, updateFutureTasks, deleteFutureTasks };
};
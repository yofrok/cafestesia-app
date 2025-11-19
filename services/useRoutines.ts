
import { useState, useEffect } from 'react';
import { TaskTemplate } from '../types';
import { db } from './firebase';
import * as firestore from 'firebase/firestore';

const templatesCollectionRef = firestore.collection(db, 'task_templates');

export const useRoutines = () => {
    const [routines, setRoutines] = useState<TaskTemplate[]>([]);

    useEffect(() => {
        const q = firestore.query(templatesCollectionRef, firestore.orderBy("title"));
        const unsubscribe = firestore.onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as TaskTemplate));
            setRoutines(data);
        }, (error) => {
            console.error("Error fetching routines:", error);
        });

        return () => unsubscribe();
    }, []);

    const addRoutine = async (routineData: Omit<TaskTemplate, 'id'>) => {
        try {
            await firestore.addDoc(templatesCollectionRef, routineData);
        } catch (error) {
            console.error("Error adding routine:", error);
        }
    };

    const updateRoutine = async (routineData: TaskTemplate) => {
        const { id, ...data } = routineData;
        const ref = firestore.doc(db, 'task_templates', id);
        try {
            await firestore.updateDoc(ref, data);
        } catch (error) {
            console.error("Error updating routine:", error);
        }
    };

    const deleteRoutine = async (id: string) => {
        const ref = firestore.doc(db, 'task_templates', id);
        try {
            await firestore.deleteDoc(ref);
        } catch (error) {
            console.error("Error deleting routine:", error);
        }
    };

    return { routines, addRoutine, updateRoutine, deleteRoutine };
};


import { useState, useEffect } from 'react';
import { TaskTemplate } from '../types';
import { db } from './firebase';
import { 
    collection, 
    query, 
    orderBy, 
    onSnapshot, 
    addDoc, 
    doc, 
    updateDoc, 
    deleteDoc,
    QuerySnapshot
} from 'firebase/firestore';

const templatesCollectionRef = collection(db, 'task_templates');

export const useRoutines = () => {
    const [routines, setRoutines] = useState<TaskTemplate[]>([]);

    useEffect(() => {
        const q = query(templatesCollectionRef, orderBy("title"));
        const unsubscribe = onSnapshot(q, (snapshot: QuerySnapshot) => {
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
            await addDoc(templatesCollectionRef, routineData);
        } catch (error) {
            console.error("Error adding routine:", error);
        }
    };

    const updateRoutine = async (routineData: TaskTemplate) => {
        const { id, ...data } = routineData;
        const ref = doc(db, 'task_templates', id);
        try {
            await updateDoc(ref, data);
        } catch (error) {
            console.error("Error updating routine:", error);
        }
    };

    const deleteRoutine = async (id: string) => {
        const ref = doc(db, 'task_templates', id);
        try {
            await deleteDoc(ref);
        } catch (error) {
            console.error("Error deleting routine:", error);
        }
    };

    return { routines, addRoutine, updateRoutine, deleteRoutine };
};

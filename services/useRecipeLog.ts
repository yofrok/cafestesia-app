import { useState, useEffect } from 'react';
import { RecipeFeedback } from '../types';
import { db } from './firebase';
import { 
    collection, 
    query, 
    orderBy, 
    onSnapshot, 
    addDoc 
} from 'firebase/firestore';

const recipeFeedbackCollectionRef = collection(db, 'recipeFeedback');

export const useRecipeLog = () => {
    const [feedbackLog, setFeedbackLog] = useState<RecipeFeedback[]>([]);

    useEffect(() => {
        const q = query(recipeFeedbackCollectionRef, orderBy("date", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const feedbackData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as RecipeFeedback));
            setFeedbackLog(feedbackData);
        }, (error) => {
            console.error("Error fetching recipe feedback:", error);
        });
        
        return () => unsubscribe();
    }, []);

    const addFeedback = async (feedbackData: Omit<RecipeFeedback, 'id' | 'date'>) => {
        try {
            await addDoc(recipeFeedbackCollectionRef, {
                ...feedbackData,
                date: new Date().toISOString(),
            });
        } catch (error) {
            console.error("Error adding feedback:", error);
        }
    };

    return { feedbackLog, addFeedback };
};
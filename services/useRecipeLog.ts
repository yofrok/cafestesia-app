import { useState, useEffect } from 'react';
import { RecipeFeedback } from '../types';
import { db } from './firebase';
// FIX: Use namespace import for firestore to fix module resolution issues.
import * as firestore from 'firebase/firestore';

const recipeFeedbackCollectionRef = firestore.collection(db, 'recipeFeedback');

export const useRecipeLog = () => {
    const [feedbackLog, setFeedbackLog] = useState<RecipeFeedback[]>([]);

    useEffect(() => {
        const q = firestore.query(recipeFeedbackCollectionRef, firestore.orderBy("date", "desc"));
        const unsubscribe = firestore.onSnapshot(q, (snapshot) => {
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
            await firestore.addDoc(recipeFeedbackCollectionRef, {
                ...feedbackData,
                date: new Date().toISOString(),
            });
        } catch (error) {
            console.error("Error adding feedback:", error);
        }
    };

    return { feedbackLog, addFeedback };
};

import { useState, useEffect } from 'react';
import { Provider } from '../types';
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

const providersCollectionRef = collection(db, 'providers');

export const useProviders = () => {
    const [providers, setProviders] = useState<Provider[]>([]);

    useEffect(() => {
        const q = query(providersCollectionRef, orderBy("name"));
        const unsubscribe = onSnapshot(q, (snapshot: QuerySnapshot) => {
            const providersData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Provider));
            setProviders(providersData);
        }, (error) => {
            console.error("Error fetching providers:", error);
        });

        return () => unsubscribe();
    }, []);

    const addProvider = async (providerData: Omit<Provider, 'id'>) => {
        try {
            await addDoc(providersCollectionRef, providerData);
        } catch (error) {
            console.error("Error adding provider:", error);
        }
    };

    const updateProvider = async (providerData: Provider) => {
        const { id, ...data } = providerData;
        const providerRef = doc(db, 'providers', id);
        try {
            await updateDoc(providerRef, data);
        } catch (error) {
            console.error("Error updating provider:", error);
        }
    };

    const deleteProvider = async (providerId: string) => {
        const providerRef = doc(db, 'providers', providerId);
        try {
            await deleteDoc(providerRef);
        } catch (error) {
            console.error("Error deleting provider:", error);
        }
    };

    return { providers, addProvider, updateProvider, deleteProvider };
};

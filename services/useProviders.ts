import { useState, useEffect } from 'react';
import { Provider } from '../types';
import { db } from './firebase';
import { 
    collection, 
    query, 
    orderBy, 
    onSnapshot, 
    writeBatch, 
    doc, 
    addDoc, 
    updateDoc, 
    deleteDoc 
} from 'firebase/firestore';

const providersCollectionRef = collection(db, 'providers');

const MOCK_PROVIDERS: Omit<Provider, 'id'>[] = [
    { name: 'Proveedor A' },
    { name: 'Proveedor B' },
    { name: 'Proveedor C' },
    { name: 'Supermercado' },
    { name: 'Tostador Local' },
];

const seedInitialData = async () => {
    console.log("Seeding initial providers to Firestore...");
    const batch = writeBatch(db);
    MOCK_PROVIDERS.forEach(provider => {
        const newDocRef = doc(providersCollectionRef);
        batch.set(newDocRef, provider);
    });
    await batch.commit();
    console.log("Initial providers seeded.");
};

export const useProviders = () => {
    const [providers, setProviders] = useState<Provider[]>([]);

    useEffect(() => {
        const q = query(providersCollectionRef, orderBy("name"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (snapshot.empty && MOCK_PROVIDERS.length > 0) {
                seedInitialData();
                return;
            }
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
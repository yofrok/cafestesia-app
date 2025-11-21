
import { useState, useEffect } from 'react';
import { Provider } from '../types';
import { db } from './firebase';
// FIX: Use namespace import for firestore to fix module resolution issues.
import * as firestore from 'firebase/firestore';

const providersCollectionRef = firestore.collection(db, 'providers');

const MOCK_PROVIDERS: Omit<Provider, 'id'>[] = [
    { name: 'Proveedor A' },
    { name: 'Proveedor B' },
    { name: 'Proveedor C' },
    { name: 'Supermercado' },
    { name: 'Tostador Local' },
];

const seedInitialData = async () => {
    console.log("Seeding initial providers to Firestore...");
    const batch = firestore.writeBatch(db);
    MOCK_PROVIDERS.forEach(provider => {
        const newDocRef = firestore.doc(providersCollectionRef);
        batch.set(newDocRef, provider);
    });
    await batch.commit();
    console.log("Initial providers seeded.");
};

export const useProviders = () => {
    const [providers, setProviders] = useState<Provider[]>([]);

    useEffect(() => {
        const q = firestore.query(providersCollectionRef, firestore.orderBy("name"));
        const unsubscribe = firestore.onSnapshot(q, (snapshot: firestore.QuerySnapshot) => {
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
            await firestore.addDoc(providersCollectionRef, providerData);
        } catch (error) {
            console.error("Error adding provider:", error);
        }
    };

    const updateProvider = async (providerData: Provider) => {
        const { id, ...data } = providerData;
        const providerRef = firestore.doc(db, 'providers', id);
        try {
            await firestore.updateDoc(providerRef, data);
        } catch (error) {
            console.error("Error updating provider:", error);
        }
    };

    const deleteProvider = async (providerId: string) => {
        const providerRef = firestore.doc(db, 'providers', providerId);
        try {
            await firestore.deleteDoc(providerRef);
        } catch (error) {
            console.error("Error deleting provider:", error);
        }
    };

    return { providers, addProvider, updateProvider, deleteProvider };
};

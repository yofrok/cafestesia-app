
import { useState, useEffect } from 'react';
import { Category } from '../types';
import { db } from './firebase';
// FIX: Use namespace import for firestore to fix module resolution issues.
import * as firestore from 'firebase/firestore';

const categoriesCollectionRef = firestore.collection(db, 'categories');

const MOCK_CATEGORIES: Omit<Category, 'id'>[] = [
    { name: 'Secos' },
    { name: 'Refrigerados' },
    { name: 'Lácteos' },
    { name: 'Bebidas' },
    { name: 'Carnes' },
    { name: 'Frutas y Verduras' },
];

const seedInitialData = async () => {
    console.log("Seeding initial categories to Firestore...");
    const batch = firestore.writeBatch(db);
    MOCK_CATEGORIES.forEach(category => {
        const newDocRef = firestore.doc(categoriesCollectionRef);
        batch.set(newDocRef, category);
    });
    await batch.commit();
    console.log("Initial categories seeded.");
};

export const useCategories = () => {
    const [categories, setCategories] = useState<Category[]>([]);

    useEffect(() => {
        const q = firestore.query(categoriesCollectionRef, firestore.orderBy("name"));
        const unsubscribe = firestore.onSnapshot(q, (snapshot: firestore.QuerySnapshot) => {
            if (snapshot.empty && MOCK_CATEGORIES.length > 0) {
                seedInitialData();
                return;
            }
            const categoriesData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Category));
            setCategories(categoriesData);
        }, (error) => {
            console.error("Error fetching categories:", error);
        });

        return () => unsubscribe();
    }, []);

    const addCategory = async (categoryData: Omit<Category, 'id'>) => {
        try {
            await firestore.addDoc(categoriesCollectionRef, categoryData);
        } catch (error) {
            console.error("Error adding category:", error);
        }
    };

    const updateCategory = async (categoryData: Category) => {
        const { id, ...data } = categoryData;
        const categoryRef = firestore.doc(db, 'categories', id);
        try {
            await firestore.updateDoc(categoryRef, data);
        } catch (error) {
            console.error("Error updating category:", error);
        }
    };

    const deleteCategory = async (categoryId: string) => {
        const categoryRef = firestore.doc(db, 'categories', categoryId);
        try {
            await firestore.deleteDoc(categoryRef);
        } catch (error) {
            console.error("Error deleting category:", error);
        }
    };

    return { categories, addCategory, updateCategory, deleteCategory };
};

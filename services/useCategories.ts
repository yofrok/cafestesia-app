import { useState, useEffect } from 'react';
import { Category } from '../types';
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

const categoriesCollectionRef = collection(db, 'categories');

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
    const batch = writeBatch(db);
    MOCK_CATEGORIES.forEach(category => {
        const newDocRef = doc(categoriesCollectionRef);
        batch.set(newDocRef, category);
    });
    await batch.commit();
    console.log("Initial categories seeded.");
};

export const useCategories = () => {
    const [categories, setCategories] = useState<Category[]>([]);

    useEffect(() => {
        const q = query(categoriesCollectionRef, orderBy("name"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
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
            await addDoc(categoriesCollectionRef, categoryData);
        } catch (error) {
            console.error("Error adding category:", error);
        }
    };

    const updateCategory = async (categoryData: Category) => {
        const { id, ...data } = categoryData;
        const categoryRef = doc(db, 'categories', id);
        try {
            await updateDoc(categoryRef, data);
        } catch (error) {
            console.error("Error updating category:", error);
        }
    };

    const deleteCategory = async (categoryId: string) => {
        const categoryRef = doc(db, 'categories', categoryId);
        try {
            await deleteDoc(categoryRef);
        } catch (error) {
            console.error("Error deleting category:", error);
        }
    };

    return { categories, addCategory, updateCategory, deleteCategory };
};
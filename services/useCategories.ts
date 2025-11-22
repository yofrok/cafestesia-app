
import { useState, useEffect } from 'react';
import { Category } from '../types';
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

const categoriesCollectionRef = collection(db, 'categories');

export const useCategories = () => {
    const [categories, setCategories] = useState<Category[]>([]);

    useEffect(() => {
        const q = query(categoriesCollectionRef, orderBy("name"));
        const unsubscribe = onSnapshot(q, (snapshot: QuerySnapshot) => {
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

import { useState, useEffect } from 'react';
import { User } from '../types';
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

const usersCollectionRef = collection(db, 'users');

const MOCK_USERS: Omit<User, 'id'>[] = [
    { name: 'Ali', color: '#ec4899' },     // pink-500
    { name: 'Fer', color: '#8b5cf6' },     // purple-500
    { name: 'Claudia', color: '#14b8a6' }, // teal-500
    { name: 'Admin', color: '#f59e0b' },   // amber-500
];

const seedInitialData = async () => {
    console.log("Seeding initial users to Firestore...");
    const batch = writeBatch(db);
    MOCK_USERS.forEach(user => {
        const newDocRef = doc(usersCollectionRef);
        batch.set(newDocRef, user);
    });
    await batch.commit();
    console.log("Initial users seeded.");
};

export const useUsers = () => {
    const [users, setUsers] = useState<User[]>([]);

    useEffect(() => {
        const q = query(usersCollectionRef, orderBy("name"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (snapshot.empty && MOCK_USERS.length > 0) {
                seedInitialData();
                return;
            }
            const usersData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as User));
            setUsers(usersData);
        }, (error) => {
            console.error("Error fetching users:", error);
        });

        return () => unsubscribe();
    }, []);

    const addUser = async (userData: Omit<User, 'id'>) => {
        try {
            await addDoc(usersCollectionRef, userData);
        } catch (error) {
            console.error("Error adding user:", error);
        }
    };

    const updateUser = async (userData: User) => {
        const { id, ...data } = userData;
        const userRef = doc(db, 'users', id);
        try {
            await updateDoc(userRef, data);
        } catch (error) {
            console.error("Error updating user:", error);
        }
    };

    const deleteUser = async (userId: string) => {
        const userRef = doc(db, 'users', userId);
        try {
            await deleteDoc(userRef);
        } catch (error) {
            console.error("Error deleting user:", error);
        }
    };

    return { users, addUser, updateUser, deleteUser };
};
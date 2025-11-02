import { useState, useEffect } from 'react';
import { User } from '../types';
import { db } from './firebase';
// FIX: Use namespace import for firestore to fix module resolution issues.
import * as firestore from 'firebase/firestore';

const usersCollectionRef = firestore.collection(db, 'users');

const MOCK_USERS: Omit<User, 'id'>[] = [
    { name: 'Ali', color: '#ec4899' },     // pink-500
    { name: 'Fer', color: '#8b5cf6' },     // purple-500
    { name: 'Claudia', color: '#14b8a6' }, // teal-500
    { name: 'Admin', color: '#f59e0b' },   // amber-500
];

const seedInitialData = async () => {
    console.log("Seeding initial users to Firestore...");
    const batch = firestore.writeBatch(db);
    MOCK_USERS.forEach(user => {
        const newDocRef = firestore.doc(usersCollectionRef);
        batch.set(newDocRef, user);
    });
    await batch.commit();
    console.log("Initial users seeded.");
};

export const useUsers = () => {
    const [users, setUsers] = useState<User[]>([]);

    useEffect(() => {
        const q = firestore.query(usersCollectionRef, firestore.orderBy("name"));
        const unsubscribe = firestore.onSnapshot(q, (snapshot) => {
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
            await firestore.addDoc(usersCollectionRef, userData);
        } catch (error) {
            console.error("Error adding user:", error);
        }
    };

    const updateUser = async (userData: User) => {
        const { id, ...data } = userData;
        const userRef = firestore.doc(db, 'users', id);
        try {
            await firestore.updateDoc(userRef, data);
        } catch (error) {
            console.error("Error updating user:", error);
        }
    };

    const deleteUser = async (userId: string) => {
        const userRef = firestore.doc(db, 'users', userId);
        try {
            await firestore.deleteDoc(userRef);
        } catch (error) {
            console.error("Error deleting user:", error);
        }
    };

    return { users, addUser, updateUser, deleteUser };
};
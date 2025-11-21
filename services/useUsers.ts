
import { useState, useEffect } from 'react';
import { User } from '../types';
import { db } from './firebase';
// FIX: Use namespace import for firestore to fix module resolution issues.
import * as firestore from 'firebase/firestore';

const usersCollectionRef = firestore.collection(db, 'users');

export const useUsers = () => {
    const [users, setUsers] = useState<User[]>([]);

    useEffect(() => {
        const q = firestore.query(usersCollectionRef, firestore.orderBy("name"));
        const unsubscribe = firestore.onSnapshot(q, (snapshot: firestore.QuerySnapshot) => {
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

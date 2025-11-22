
import { useState, useEffect } from 'react';
import { User } from '../types';
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

const usersCollectionRef = collection(db, 'users');

export const useUsers = () => {
    const [users, setUsers] = useState<User[]>([]);

    useEffect(() => {
        const q = query(usersCollectionRef, orderBy("name"));
        const unsubscribe = onSnapshot(q, (snapshot: QuerySnapshot) => {
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


import { useState, useEffect } from 'react';
import { Beverage, BeverageOrder } from '../types';
import { db } from './firebase';
import * as firestore from 'firebase/firestore';

const beveragesCollectionRef = firestore.collection(db, 'beverages');
const ordersCollectionRef = firestore.collection(db, 'beverage_orders');

export const useBeverages = () => {
    const [beverages, setBeverages] = useState<Beverage[]>([]);
    const [activeOrders, setActiveOrders] = useState<BeverageOrder[]>([]);

    // 1. Sync Menu (Beverages)
    useEffect(() => {
        const q = firestore.query(beveragesCollectionRef, firestore.orderBy("name"));
        const unsubscribe = firestore.onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Beverage));
            setBeverages(data);
        }, (error) => console.error("Error fetching beverages:", error));
        return () => unsubscribe();
    }, []);

    // 2. Sync Active Orders (Pending)
    useEffect(() => {
        // Query ONLY by status to avoid needing a composite index in Firestore.
        // We will sort by createdAt client-side.
        const q = firestore.query(
            ordersCollectionRef, 
            firestore.where("status", "==", "pending")
        );
        const unsubscribe = firestore.onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as BeverageOrder));
            
            // Client-side sort: Oldest first (FIFO)
            data.sort((a, b) => a.createdAt - b.createdAt);
            
            setActiveOrders(data);
        }, (error) => console.error("Error fetching active orders:", error));
        return () => unsubscribe();
    }, []);

    // Actions: Beverages (Master Data)
    const addBeverage = async (data: Omit<Beverage, 'id'>) => {
        try { await firestore.addDoc(beveragesCollectionRef, data); }
        catch (e) { console.error(e); }
    };

    const updateBeverage = async (data: Beverage) => {
        const { id, ...rest } = data;
        try { await firestore.updateDoc(firestore.doc(db, 'beverages', id), rest); }
        catch (e) { console.error(e); }
    };

    const deleteBeverage = async (id: string) => {
        try { await firestore.deleteDoc(firestore.doc(db, 'beverages', id)); }
        catch (e) { console.error(e); }
    };

    // Actions: Orders
    const createOrder = async (customerName: string, items: any[]) => {
        const order: Omit<BeverageOrder, 'id'> = {
            customerName,
            items,
            status: 'pending',
            createdAt: Date.now()
        };

        // CRITICAL FIX: Sanitize order object to remove 'undefined' values (like optional sizeName)
        // Firestore rejects documents containing undefined fields.
        const sanitizedOrder = JSON.parse(JSON.stringify(order));

        try { await firestore.addDoc(ordersCollectionRef, sanitizedOrder); }
        catch (e) { console.error("Error creating order:", e); }
    };

    const completeOrder = async (orderId: string) => {
        try {
            await firestore.updateDoc(firestore.doc(db, 'beverage_orders', orderId), {
                status: 'completed',
                completedAt: Date.now()
            });
        } catch (e) { console.error("Error completing order:", e); }
    };
    
    const cancelOrder = async (orderId: string) => {
         try {
            await firestore.deleteDoc(firestore.doc(db, 'beverage_orders', orderId));
        } catch (e) { console.error("Error cancelling order:", e); }
    }

    return { 
        beverages, 
        activeOrders, 
        addBeverage, 
        updateBeverage, 
        deleteBeverage, 
        createOrder, 
        completeOrder, 
        cancelOrder 
    };
};

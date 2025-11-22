
import { useState, useEffect } from 'react';
import { Beverage, BeverageOrder } from '../types';
import { db } from './firebase';
import { 
    collection, 
    query, 
    orderBy, 
    onSnapshot, 
    where, 
    addDoc, 
    doc, 
    updateDoc, 
    deleteDoc,
    QuerySnapshot
} from 'firebase/firestore';

const beveragesCollectionRef = collection(db, 'beverages');
const ordersCollectionRef = collection(db, 'beverage_orders');

export const useBeverages = () => {
    const [beverages, setBeverages] = useState<Beverage[]>([]);
    const [activeOrders, setActiveOrders] = useState<BeverageOrder[]>([]);

    // 1. Sync Menu (Beverages)
    useEffect(() => {
        const q = query(beveragesCollectionRef, orderBy("name"));
        const unsubscribe = onSnapshot(q, (snapshot: QuerySnapshot) => {
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
        const q = query(
            ordersCollectionRef, 
            where("status", "==", "pending")
        );
        const unsubscribe = onSnapshot(q, (snapshot: QuerySnapshot) => {
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
        try { 
            // Sanitize to remove undefined
            const sanitized = JSON.parse(JSON.stringify(data));
            await addDoc(beveragesCollectionRef, sanitized); 
        }
        catch (e) { console.error(e); }
    };

    const updateBeverage = async (data: Beverage) => {
        const { id, ...rest } = data;
        try { 
            // Sanitize to remove undefined
            const sanitized = JSON.parse(JSON.stringify(rest));
            await updateDoc(doc(db, 'beverages', id), sanitized); 
        }
        catch (e) { console.error(e); }
    };

    const deleteBeverage = async (id: string) => {
        try { await deleteDoc(doc(db, 'beverages', id)); }
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

        try { await addDoc(ordersCollectionRef, sanitizedOrder); }
        catch (e) { console.error("Error creating order:", e); }
    };

    const completeOrder = async (orderId: string) => {
        try {
            await updateDoc(doc(db, 'beverage_orders', orderId), {
                status: 'completed',
                completedAt: Date.now()
            });
        } catch (e) { console.error("Error completing order:", e); }
    };
    
    const cancelOrder = async (orderId: string) => {
         try {
            await deleteDoc(doc(db, 'beverage_orders', orderId));
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

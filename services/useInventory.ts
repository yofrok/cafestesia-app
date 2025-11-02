import { useState, useEffect } from 'react';
import { InventoryItem, PurchaseRecord } from '../types';
import { MOCK_INVENTORY_ITEMS } from '../constants';
import { db } from './firebase';
// FIX: Use namespace import for firestore to fix module resolution issues.
import * as firestore from 'firebase/firestore';

const inventoryCollectionRef = firestore.collection(db, 'inventory');

interface StockChangeDetails {
    itemId: string;
    change: number;
    purchaseDetails?: {
        totalPrice: number;
        providerName: string;
    }
}

const seedInitialData = async () => {
    console.log("Seeding initial inventory to Firestore...");
    const batch = firestore.writeBatch(db);
    MOCK_INVENTORY_ITEMS.forEach(item => {
        const newDocRef = firestore.doc(inventoryCollectionRef);
        batch.set(newDocRef, { ...item, purchaseHistory: [] });
    });
    await batch.commit();
    console.log("Initial inventory seeded.");
};

export const useInventory = () => {
    const [items, setItems] = useState<InventoryItem[]>([]);

    useEffect(() => {
        const q = firestore.query(inventoryCollectionRef, firestore.orderBy("name"));

        const unsubscribe = firestore.onSnapshot(q, (snapshot) => {
             if (snapshot.empty && MOCK_INVENTORY_ITEMS.length > 0) {
                seedInitialData();
                return;
            }
            const inventoryData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            } as InventoryItem));
            setItems(inventoryData);
        }, (error) => {
            console.error("Error fetching inventory items:", error);
        });

        return () => unsubscribe();
    }, []);

    const addItem = async (itemData: Omit<InventoryItem, 'id' | 'purchaseHistory'>) => {
        try {
            await firestore.addDoc(inventoryCollectionRef, { ...itemData, purchaseHistory: [] });
        } catch (error) {
            console.error("Error adding inventory item:", error);
        }
    };

    const updateItem = async (itemData: InventoryItem) => {
        const { id, ...data } = itemData;
        const itemRef = firestore.doc(db, 'inventory', id);
        try {
            await firestore.updateDoc(itemRef, data);
        } catch (error) {
            console.error("Error updating item:", error);
        }
    };

    const deleteItem = async (itemId: string) => {
        const itemRef = firestore.doc(db, 'inventory', itemId);
        try {
            await firestore.deleteDoc(itemRef);
        } catch (error) {
            console.error("Error deleting item:", error);
        }
    };

    const recordStockChange = async ({ itemId, change, purchaseDetails }: StockChangeDetails) => {
        const itemRef = firestore.doc(db, 'inventory', itemId);
        try {
            const updatePayload: { [key: string]: any } = {
                currentStock: firestore.increment(change)
            };

            if (purchaseDetails && change > 0) {
                const newPurchase: PurchaseRecord = {
                    id: `pur-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                    date: new Date().toISOString(),
                    quantity: change,
                    totalPrice: purchaseDetails.totalPrice,
                    providerName: purchaseDetails.providerName,
                };
                updatePayload.purchaseHistory = firestore.arrayUnion(newPurchase);
            }
            
            await firestore.updateDoc(itemRef, updatePayload);

        } catch (error) {
            console.error("Error recording stock change:", error);
        }
    };

    return { items, addItem, updateItem, deleteItem, recordStockChange };
};
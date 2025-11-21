
import { useState, useEffect } from 'react';
import { InventoryItem, PurchaseRecord, Recipe, StockLog, StockLogType } from '../types';
import { MOCK_INVENTORY_ITEMS } from '../constants';
import { db } from './firebase';
import * as firestore from 'firebase/firestore';

const inventoryCollectionRef = firestore.collection(db, 'inventory');
const stockLogsCollectionRef = firestore.collection(db, 'stock_logs');

interface StockChangeDetails {
    itemId: string;
    change: number;
    purchaseDetails?: {
        totalPrice: number;
        providerName: string;
    };
    responsible: string;
    reason?: string;
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
    const [stockLogs, setStockLogs] = useState<StockLog[]>([]);

    // Sync Inventory Items
    useEffect(() => {
        const q = firestore.query(inventoryCollectionRef, firestore.orderBy("name"));
        const unsubscribe = firestore.onSnapshot(q, (snapshot: firestore.QuerySnapshot) => {
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

    // Sync Stock Logs (Limited to last 100 for performance, ordered by date descending)
    useEffect(() => {
        const q = firestore.query(stockLogsCollectionRef, firestore.orderBy("date", "desc"), firestore.limit(100));
        const unsubscribe = firestore.onSnapshot(q, (snapshot: firestore.QuerySnapshot) => {
            const logsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            } as StockLog));
            setStockLogs(logsData);
        }, (error) => {
            console.error("Error fetching stock logs:", error);
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

    const createLog = (batch: firestore.WriteBatch, item: InventoryItem, change: number, type: StockLogType, responsible: string, reason?: string, recipeName?: string) => {
        const newLogRef = firestore.doc(stockLogsCollectionRef);
        const log: StockLog = {
            id: newLogRef.id, // Placeholder, strictly not needed in firestore doc data but good for type consistency
            date: new Date().toISOString(),
            itemId: item.id,
            itemName: item.name,
            quantityChange: change,
            unit: item.unit,
            type,
            responsible,
            reason: reason || '',
            recipeName
        };
        // Remove id from data payload
        const { id, ...data } = log;
        // Sanitize to remove undefined fields (like recipeName) which Firestore rejects
        const logData = JSON.parse(JSON.stringify(data));
        batch.set(newLogRef, logData);
    };

    const recordStockChange = async ({ itemId, change, purchaseDetails, responsible, reason }: StockChangeDetails) => {
        const item = items.find(i => i.id === itemId);
        if (!item) return;

        const itemRef = firestore.doc(db, 'inventory', itemId);
        const batch = firestore.writeBatch(db);

        try {
            // 1. Update Item Stock
            const updatePayload: { [key: string]: any } = {
                currentStock: firestore.increment(change)
            };

            let logType: StockLogType = 'adjustment';

            if (purchaseDetails && change > 0) {
                logType = 'purchase';
                const newPurchase: PurchaseRecord = {
                    id: `pur-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                    date: new Date().toISOString(),
                    quantity: change,
                    totalPrice: purchaseDetails.totalPrice,
                    providerName: purchaseDetails.providerName,
                };
                updatePayload.purchaseHistory = firestore.arrayUnion(newPurchase);
            } else if (change < 0 && reason?.toLowerCase().includes('merma')) {
                logType = 'waste';
            }

            batch.update(itemRef, updatePayload);

            // 2. Create Log
            createLog(batch, item, change, logType, responsible, reason || (logType === 'purchase' ? `Compra a ${purchaseDetails?.providerName}` : 'Ajuste manual'));

            await batch.commit();

        } catch (error) {
            console.error("Error recording stock change:", error);
        }
    };

    const produceBatch = async (recipe: Recipe, multiplier: number, customOutputQuantity: number, responsible: string) => {
        const batch = firestore.writeBatch(db);
        let hasUpdates = false;

        // 1. Deduct Ingredients
        if (recipe.ingredients && recipe.ingredients.length > 0) {
            recipe.ingredients.forEach(ingredient => {
                const item = items.find(i => i.id === ingredient.inventoryItemId);
                if (item) {
                    const amountToDeduct = ingredient.quantity * multiplier;
                    const itemRef = firestore.doc(db, 'inventory', item.id);
                    
                    // Update Stock
                    batch.update(itemRef, { currentStock: firestore.increment(-amountToDeduct) });
                    
                    // Log Consumption
                    createLog(batch, item, -amountToDeduct, 'consumption', responsible, `Producción de ${recipe.name}`, recipe.name);
                    
                    hasUpdates = true;
                }
            });
        }

        // 2. Add Output Product (if configured)
        if (recipe.outputInventoryItemId) {
            const outputItem = items.find(i => i.id === recipe.outputInventoryItemId);
            const amountToAdd = customOutputQuantity; // We trust the passed quantity from the modal

            if (outputItem && amountToAdd > 0) {
                const outputRef = firestore.doc(db, 'inventory', outputItem.id);
                
                // Update Stock
                batch.update(outputRef, { currentStock: firestore.increment(amountToAdd) });
                
                // Log Production
                createLog(batch, outputItem, amountToAdd, 'production', responsible, `Lote finalizado`, recipe.name);
                
                hasUpdates = true;
            }
        }

        if (hasUpdates) {
            try {
                await batch.commit();
                console.log(`Batch produced for ${recipe.name} by ${responsible}`);
                return true;
            } catch (error) {
                console.error("Error producing batch:", error);
                return false;
            }
        }
        return true;
    };

    return { items, stockLogs, addItem, updateItem, deleteItem, recordStockChange, produceBatch };
};

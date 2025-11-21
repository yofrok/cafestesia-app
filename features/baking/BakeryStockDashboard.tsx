
import React, { useState, useMemo, useEffect } from 'react';
import { useInventory } from '../../services/useInventory';
import { useCategories } from '../../services/useCategories';
import Icon from '../../components/Icon';
import Modal from '../../components/Modal';
import { InventoryItem } from '../../types';
import { db } from '../../services/firebase';
import * as firestore from 'firebase/firestore';

// FIX: Using Firestore 'settings' collection instead of localStorage to ensure sync across devices (Mac/iPad).
const settingsDocRef = firestore.doc(db, 'settings', 'bakery_dashboard');

type ColumnType = 'wip' | 'finished' | 'none';

interface DashboardConfig {
    categoryMapping: Record<string, ColumnType>;
}

interface BakeryStockDashboardProps {
    inventoryHook: ReturnType<typeof useInventory>;
    categoriesHook: ReturnType<typeof useCategories>;
}

const BakeryStockDashboard: React.FC<BakeryStockDashboardProps> = ({ inventoryHook, categoriesHook }) => {
    const { items } = inventoryHook;
    const { categories } = categoriesHook;
    const [config, setConfig] = useState<DashboardConfig>({ categoryMapping: {} });
    const [isConfigOpen, setIsConfigOpen] = useState(false);

    // Load config from Firestore on mount (real-time sync)
    useEffect(() => {
        const unsubscribe = firestore.onSnapshot(settingsDocRef, (doc) => {
            if (doc.exists()) {
                setConfig(doc.data() as DashboardConfig);
            }
        }, (error) => {
            console.error("Error fetching dashboard settings:", error);
        });
        return () => unsubscribe();
    }, []);

    // Save config logic (Firestore)
    const handleSaveConfig = async (newMapping: Record<string, ColumnType>) => {
        const newConfig = { categoryMapping: newMapping };
        // Optimistic update
        setConfig(newConfig);
        setIsConfigOpen(false);
        try {
            await firestore.setDoc(settingsDocRef, newConfig);
        } catch (e) {
            console.error("Error saving dashboard settings:", e);
        }
    };

    // Group items based on mapping and smart tagging
    const { rawItems, wipItems, finishedItems, totalValue } = useMemo(() => {
        const raw: InventoryItem[] = [];
        const wip: InventoryItem[] = [];
        const finished: InventoryItem[] = [];
        let value = 0;

        items.forEach(item => {
            const catName = item.category || 'Sin Categoría';
            const type = config.categoryMapping[catName] || 'none';
            
            // Calculate approximate value (using last purchase price if available)
            const lastPrice = item.purchaseHistory?.[item.purchaseHistory.length - 1]?.totalPrice;
            const lastQty = item.purchaseHistory?.[item.purchaseHistory.length - 1]?.quantity;
            const unitPrice = (lastPrice && lastQty) ? lastPrice / lastQty : 0;
            value += unitPrice * item.currentStock;

            // Logic Change: Column 1 is now driven by the 'isBakeryCritical' flag
            if (item.isBakeryCritical) {
                raw.push(item);
            }
            
            // Columns 2 & 3 are still driven by Category Mapping
            if (type === 'wip') wip.push(item);
            else if (type === 'finished') finished.push(item);
        });

        return { rawItems: raw, wipItems: wip, finishedItems: finished, totalValue: value };
    }, [items, config]);

    const ItemCard: React.FC<{ item: InventoryItem, theme: 'green' | 'blue' | 'orange' }> = ({ item, theme }) => {
        const isLow = item.currentStock <= item.minStock;
        
        const themeClasses = {
            green: { bg: 'bg-white', border: 'border-emerald-100', text: 'text-emerald-800', badge: 'bg-emerald-100 text-emerald-800' },
            blue: { bg: 'bg-white', border: 'border-cyan-100', text: 'text-cyan-800', badge: 'bg-cyan-100 text-cyan-800' },
            orange: { bg: 'bg-white', border: 'border-orange-100', text: 'text-orange-800', badge: 'bg-orange-100 text-orange-800' },
        }[theme];

        return (
            <div className={`p-3 rounded-lg border shadow-sm flex justify-between items-center ${themeClasses.bg} ${themeClasses.border} ${isLow ? 'border-red-300 ring-1 ring-red-200' : ''}`}>
                <div className="min-w-0 flex-1 pr-2">
                    <p className={`font-bold text-sm truncate ${themeClasses.text}`}>{item.name}</p>
                    <p className="text-xs text-gray-500">{item.category}</p>
                </div>
                <div className="text-right">
                    <span className={`font-bold text-lg ${isLow ? 'text-red-600' : 'text-gray-800'}`}>
                        {parseFloat(item.currentStock.toFixed(2))}
                    </span>
                    <span className="text-xs text-gray-500 ml-1">{item.unit}</span>
                </div>
            </div>
        );
    };

    return (
        <div className="h-full flex flex-col bg-gray-50">
            {/* Top Metric Bar */}
            <div className="bg-white p-4 border-b border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4 flex-shrink-0">
                <div>
                    <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider">Valor Estimado Stock Panadería</h3>
                    <p className="text-2xl font-bold text-gray-800">${totalValue.toFixed(2)}</p>
                </div>
                <button 
                    onClick={() => setIsConfigOpen(true)}
                    className="flex items-center gap-2 text-sm text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors"
                >
                    <Icon name="settings" size={16} />
                    Configurar Tablero
                </button>
            </div>

            {/* 3-Column Dashboard */}
            <div className="flex-grow overflow-x-auto">
                <div className="flex h-full min-w-[800px] p-4 gap-4">
                    
                    {/* COL 1: Raw Materials (Smart Tagged) */}
                    <div className="flex-1 flex flex-col bg-emerald-50/50 rounded-xl border border-emerald-100 overflow-hidden">
                        <div className="p-3 bg-emerald-100/50 border-b border-emerald-200 flex items-center gap-2">
                            <Icon name="archive" className="text-emerald-600" size={20} />
                            <div className="flex-grow">
                                <h3 className="font-bold text-emerald-900">1. Insumos Críticos</h3>
                                <p className="text-[10px] text-emerald-700 leading-none">Marcados manualmente en inventario</p>
                            </div>
                            <span className="ml-auto bg-white text-emerald-700 text-xs font-bold px-2 py-0.5 rounded-full">{rawItems.length}</span>
                        </div>
                        <div className="p-3 overflow-y-auto flex-grow space-y-2">
                            {rawItems.map(item => <ItemCard key={item.id} item={item} theme="green" />)}
                            {rawItems.length === 0 && (
                                <div className="text-center p-4">
                                    <p className="text-sm text-emerald-500 italic">Sin insumos marcados.</p>
                                    <p className="text-xs text-emerald-400 mt-1">Edita un producto en inventario y activa "Crítico de Panadería" para verlo aquí.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* COL 2: WIP / Frozen */}
                    <div className="flex-1 flex flex-col bg-cyan-50/50 rounded-xl border border-cyan-100 overflow-hidden">
                        <div className="p-3 bg-cyan-100/50 border-b border-cyan-200 flex items-center gap-2">
                            <Icon name="thermometer-snowflake" className="text-cyan-600" size={20} />
                            <h3 className="font-bold text-cyan-900">2. En Reserva (Congelados)</h3>
                            <span className="ml-auto bg-white text-cyan-700 text-xs font-bold px-2 py-0.5 rounded-full">{wipItems.length}</span>
                        </div>
                        <div className="p-3 overflow-y-auto flex-grow space-y-2">
                            {wipItems.map(item => <ItemCard key={item.id} item={item} theme="blue" />)}
                            {wipItems.length === 0 && <p className="text-center text-sm text-cyan-400 italic mt-4">Sin categorías asignadas</p>}
                        </div>
                    </div>

                    {/* COL 3: Finished */}
                    <div className="flex-1 flex flex-col bg-orange-50/50 rounded-xl border border-orange-100 overflow-hidden">
                        <div className="p-3 bg-orange-100/50 border-b border-orange-200 flex items-center gap-2">
                            <Icon name="cake-slice" className="text-orange-600" size={20} />
                            <h3 className="font-bold text-orange-900">3. Vitrina (Horneados)</h3>
                            <span className="ml-auto bg-white text-orange-700 text-xs font-bold px-2 py-0.5 rounded-full">{finishedItems.length}</span>
                        </div>
                        <div className="p-3 overflow-y-auto flex-grow space-y-2">
                            {finishedItems.map(item => <ItemCard key={item.id} item={item} theme="orange" />)}
                            {finishedItems.length === 0 && <p className="text-center text-sm text-orange-400 italic mt-4">Sin categorías asignadas</p>}
                        </div>
                    </div>

                </div>
            </div>

            {isConfigOpen && (
                <DashboardConfigModal 
                    isOpen={isConfigOpen}
                    onClose={() => setIsConfigOpen(false)}
                    categories={categories}
                    currentMapping={config.categoryMapping}
                    onSave={handleSaveConfig}
                />
            )}
        </div>
    );
};

const DashboardConfigModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    categories: { id: string; name: string }[];
    currentMapping: Record<string, ColumnType>;
    onSave: (mapping: Record<string, ColumnType>) => void;
}> = ({ isOpen, onClose, categories, currentMapping, onSave }) => {
    const [localMapping, setLocalMapping] = useState(currentMapping);

    const handleChange = (catName: string, val: ColumnType) => {
        setLocalMapping(prev => ({ ...prev, [catName]: val }));
    };

    const handleSave = () => {
        onSave(localMapping);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Configurar Tablero de Panadería">
            <div className="max-h-[60vh] overflow-y-auto pr-2">
                <div className="bg-blue-50 p-3 rounded border border-blue-200 mb-4 text-sm text-blue-800">
                    <p className="font-bold">ℹ️ Nota sobre la Columna 1 (Insumos):</p>
                    <p>Esta columna ahora es automática. Muestra los productos que has marcado como "Crítico de Panadería" en el Inventario, sin importar su categoría.</p>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                    Asigna categorías de inventario a las columnas de proceso:
                </p>
                <div className="space-y-3">
                    {categories.map(cat => (
                        <div key={cat.id} className="flex items-center justify-between bg-gray-50 p-2 rounded border border-gray-200">
                            <span className="font-bold text-gray-700 text-sm">{cat.name}</span>
                            <select 
                                value={localMapping[cat.name] || 'none'}
                                onChange={(e) => handleChange(cat.name, e.target.value as ColumnType)}
                                className="p-1.5 text-sm border border-gray-300 rounded bg-white"
                            >
                                <option value="none">Ocultar / General</option>
                                <option value="wip">Col 2: Congelados/Masa</option>
                                <option value="finished">Col 3: Horneados</option>
                            </select>
                        </div>
                    ))}
                </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
                <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg">Cancelar</button>
                <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg">Guardar Configuración</button>
            </div>
        </Modal>
    );
};

export default BakeryStockDashboard;

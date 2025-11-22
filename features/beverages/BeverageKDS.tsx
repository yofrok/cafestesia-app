
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useBeverages } from '../../services/useBeverages';
import { useInventory } from '../../services/useInventory';
import Icon from '../../components/Icon';
import Modal from '../../components/Modal';
import SwipeButton from '../../components/SwipeButton';
import { MenuItemType, BeverageOrder } from '../../types';
import { useProductionAlerts } from '../baking/useProductionAlerts';

const OrderTimer: React.FC<{ timestamp: number }> = ({ timestamp }) => {
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        const update = () => setElapsed(Math.floor((Date.now() - timestamp) / 60000));
        update();
        const interval = setInterval(update, 60000);
        return () => clearInterval(interval);
    }, [timestamp]);

    let colorClass = "bg-green-100 text-green-800";
    if (elapsed >= 5) colorClass = "bg-yellow-100 text-yellow-800";
    if (elapsed >= 10) colorClass = "bg-red-100 text-red-800 animate-pulse";

    return (
        <span className={`px-2 py-1 rounded-full text-xs font-bold ${colorClass}`}>
            {elapsed} min
        </span>
    );
};

interface BeverageKDSProps {
    type: MenuItemType; // 'beverage' or 'food'
    inventoryHook: ReturnType<typeof useInventory>;
}

const BeverageKDS: React.FC<BeverageKDSProps> = ({ type, inventoryHook }) => {
    const { activeOrders, completeOrder, cancelOrder, beverages } = useBeverages();
    const { recordStockChange } = inventoryHook;
    const [recipeModal, setRecipeModal] = useState<{ name: string, text: string } | null>(null);
    
    // Audio Alert Logic
    const { playNotification } = useProductionAlerts();
    const prevOrderCountRef = useRef<number>(0);
    const isFirstRun = useRef(true);

    // Filter orders that contain at least one item of the requested type
    const filteredOrders = useMemo(() => {
        return activeOrders.filter(order => 
            order.items.some(item => {
                // Handle backwards compatibility where type might be undefined (assume 'beverage')
                const itemType = item.type || 'beverage';
                return itemType === type;
            })
        );
    }, [activeOrders, type]);

    // Effect to play sound on new orders
    useEffect(() => {
        if (isFirstRun.current) {
            isFirstRun.current = false;
            prevOrderCountRef.current = filteredOrders.length;
            return;
        }

        if (filteredOrders.length > prevOrderCountRef.current) {
            playNotification();
        }
        
        prevOrderCountRef.current = filteredOrders.length;
    }, [filteredOrders.length, playNotification]);

    const handleComplete = (order: BeverageOrder) => {
        // 1. Trigger Inventory Deduction for items of THIS type in the order
        order.items.forEach(item => {
            const itemType = item.type || 'beverage';
            if (itemType !== type) return; // Only deduct for items managed by this KDS screen

            // Find the master definition to get stock config
            const masterDef = beverages.find(b => b.id === item.beverageId);
            if (!masterDef?.stockConfig) return;

            const { mode, directItemId, ingredients } = masterDef.stockConfig;

            if (mode === 'direct' && directItemId) {
                recordStockChange({
                    itemId: directItemId,
                    change: -1,
                    responsible: 'KDS System',
                    reason: `Venta: ${item.beverageName}`
                });
            } else if (mode === 'recipe' && ingredients) {
                ingredients.forEach(ing => {
                    if (ing.quantity > 0) {
                        recordStockChange({
                            itemId: ing.inventoryItemId,
                            change: -ing.quantity,
                            responsible: 'KDS System',
                            reason: `Insumo Venta: ${item.beverageName}`
                        });
                    }
                });
            }
        });

        // 2. Mark order as completed (This currently completes the whole order. 
        // Future improvement: Complete only items of this type).
        completeOrder(order.id);
    };

    const themeClass = type === 'food' ? 'bg-orange-50 border-orange-200' : 'bg-blue-50 border-blue-200';
    const iconClass = type === 'food' ? 'text-orange-500' : 'text-blue-600';

    return (
        <div className="h-full overflow-y-auto p-4 bg-gray-100">
            {filteredOrders.length === 0 ? (
                 <div className="h-full flex flex-col items-center justify-center text-gray-400">
                    <Icon name={type === 'food' ? "cake-slice" : "star"} size={64} className="mb-4 text-gray-300" />
                    <p className="text-xl font-bold">{type === 'food' ? 'Cocina' : 'Barra'} Limpia</p>
                    <p>Esperando pedidos...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredOrders.map(order => (
                        <div key={order.id} className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden flex flex-col animate-fadeIn">
                            <div className={`p-3 border-b flex justify-between items-center ${themeClass}`}>
                                <div>
                                    <h3 className="font-bold text-lg truncate max-w-[150px] text-gray-800">{order.customerName}</h3>
                                    <p className="text-xs text-gray-500">#{order.id.slice(-4)}</p>
                                </div>
                                <OrderTimer timestamp={order.createdAt} />
                            </div>
                            
                            <div className="p-4 flex-grow space-y-4">
                                {order.items
                                    .filter(item => (item.type || 'beverage') === type)
                                    .map((item, idx) => (
                                    <div key={idx} className="flex flex-col gap-1">
                                        <div className="flex items-start gap-2">
                                            <div className="mt-1">
                                                <button 
                                                    onClick={() => setRecipeModal({ name: `${item.beverageName} ${item.sizeName ? `(${item.sizeName})` : ''}`, text: item.recipeRef || 'Sin receta disponible.' })}
                                                    className={`p-1 rounded-full transition-colors hover:bg-gray-100 ${iconClass}`}
                                                    title="Ver Instrucción"
                                                >
                                                    <Icon name="list" size={18} />
                                                </button>
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-800 text-lg leading-tight">
                                                    {item.beverageName}
                                                    {item.sizeName && <span className="text-gray-500 ml-1 text-base font-bold">({item.sizeName})</span>}
                                                </p>
                                                {item.modifiers.length > 0 && (
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        {item.modifiers.map((mod, i) => (
                                                            <span key={i} className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs font-bold border border-gray-200">
                                                                {mod}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        {/* Custom Note Display */}
                                        {item.notes && (
                                            <div className="ml-8 bg-yellow-100 border-l-4 border-yellow-400 p-2 rounded-r text-sm font-bold text-yellow-900 flex items-start gap-2">
                                                <Icon name="message-square" size={16} className="mt-0.5 flex-shrink-0" />
                                                <span>{item.notes}</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                                
                                {/* Show hint if other items exist in ticket */}
                                {order.items.some(item => (item.type || 'beverage') !== type) && (
                                    <div className="pt-2 border-t border-dashed border-gray-200">
                                        <p className="text-xs text-gray-400 italic text-center">
                                            + {order.items.filter(item => (item.type || 'beverage') !== type).length} items en otra estación
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="p-3 border-t border-gray-100 bg-gray-50">
                                <SwipeButton 
                                    onSwipe={() => handleComplete(order)} 
                                    text="Completar" 
                                    icon="check"
                                    className="bg-white border-gray-300 shadow-sm h-12"
                                />
                                <div className="text-center mt-2">
                                    <button onClick={() => { if(confirm('¿Cancelar ticket entero?')) cancelOrder(order.id)}} className="text-xs text-gray-400 hover:text-red-500">Cancelar Ticket</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {recipeModal && (
                <Modal isOpen={!!recipeModal} onClose={() => setRecipeModal(null)} title={recipeModal.name}>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-gray-800 whitespace-pre-wrap font-medium text-lg">
                        {recipeModal.text}
                    </div>
                    <div className="mt-6 text-center">
                        <button onClick={() => setRecipeModal(null)} className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold shadow-md text-lg w-full">
                            ¡Entendido!
                        </button>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default BeverageKDS;

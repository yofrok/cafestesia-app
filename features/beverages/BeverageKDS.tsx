
import React, { useState, useEffect } from 'react';
import { useBeverages } from '../../services/useBeverages';
import Icon from '../../components/Icon';
import Modal from '../../components/Modal';
import SwipeButton from '../../components/SwipeButton';

const OrderTimer: React.FC<{ timestamp: number }> = ({ timestamp }) => {
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        const update = () => setElapsed(Math.floor((Date.now() - timestamp) / 60000));
        update();
        const interval = setInterval(update, 60000); // Update every minute
        return () => clearInterval(interval);
    }, [timestamp]);

    let colorClass = "bg-green-100 text-green-800";
    if (elapsed >= 5) colorClass = "bg-yellow-100 text-yellow-800";
    if (elapsed >= 8) colorClass = "bg-red-100 text-red-800 animate-pulse";

    return (
        <span className={`px-2 py-1 rounded-full text-xs font-bold ${colorClass}`}>
            {elapsed} min
        </span>
    );
};

const BeverageKDS: React.FC = () => {
    const { activeOrders, completeOrder, cancelOrder } = useBeverages();
    const [recipeModal, setRecipeModal] = useState<{ name: string, text: string } | null>(null);

    return (
        <div className="h-full overflow-y-auto p-4 bg-gray-100">
            {activeOrders.length === 0 ? (
                 <div className="h-full flex flex-col items-center justify-center text-gray-400">
                    <Icon name="check-circle" size={64} className="mb-4 text-gray-300" />
                    <p className="text-xl font-bold">Barra Limpia</p>
                    <p>Esperando pedidos...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {activeOrders.map(order => (
                        <div key={order.id} className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden flex flex-col">
                            <div className="p-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                                <div>
                                    <h3 className="font-bold text-lg truncate max-w-[150px]">{order.customerName}</h3>
                                    <p className="text-xs text-gray-500">#{order.id.slice(-4)}</p>
                                </div>
                                <OrderTimer timestamp={order.createdAt} />
                            </div>
                            
                            <div className="p-4 flex-grow space-y-4">
                                {order.items.map((item, idx) => (
                                    <div key={idx} className="flex items-start gap-2">
                                        <div className="mt-1">
                                            <button 
                                                onClick={() => setRecipeModal({ name: `${item.beverageName} ${item.sizeName ? `(${item.sizeName})` : ''}`, text: item.recipeRef || 'Sin receta disponible.' })}
                                                className="text-amber-600 hover:bg-amber-50 p-1 rounded-full transition-colors"
                                                title="Ver Receta"
                                            >
                                                <Icon name="list" size={18} />
                                            </button>
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-800 text-lg leading-tight">
                                                {item.beverageName}
                                                {item.sizeName && <span className="text-amber-700 ml-1 text-base font-bold">({item.sizeName})</span>}
                                            </p>
                                            {item.modifiers.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {item.modifiers.map((mod, i) => (
                                                        <span key={i} className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs font-bold border border-blue-100">
                                                            {mod}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="p-3 border-t border-gray-100 bg-gray-50">
                                <SwipeButton 
                                    onSwipe={() => completeOrder(order.id)} 
                                    text="Completar" 
                                    icon="check"
                                    className="bg-white border-gray-300 shadow-sm h-12"
                                />
                                <div className="text-center mt-2">
                                    <button onClick={() => { if(confirm('Cancelar ticket?')) cancelOrder(order.id)}} className="text-xs text-gray-400 hover:text-red-500">Cancelar</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {recipeModal && (
                <Modal isOpen={!!recipeModal} onClose={() => setRecipeModal(null)} title={recipeModal.name}>
                    <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 text-amber-900 whitespace-pre-wrap font-medium text-lg">
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

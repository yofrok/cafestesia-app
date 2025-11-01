import React from 'react';
import { InventoryItem } from '../../types';
import Icon from '../../components/Icon';

interface InventoryItemCardProps {
    item: InventoryItem;
    onEdit: (item: InventoryItem) => void;
    onAddStock: () => void;
    onUseStock: () => void;
    onViewHistory: () => void;
}

const IconButton: React.FC<{icon: 'plus' | 'minus' | 'pencil' | 'bar-chart-2', onClick: () => void, colorClass: string, title: string}> = ({icon, onClick, colorClass, title}) => (
     <button 
        title={title}
        onClick={onClick} 
        className={`w-10 h-10 flex items-center justify-center bg-gray-100 border border-gray-200 rounded-full transition-colors ${colorClass}`}
    >
        <Icon name={icon} size={20} />
    </button>
);


const InventoryItemCard: React.FC<InventoryItemCardProps> = ({ item, onEdit, onAddStock, onUseStock, onViewHistory }) => {
    const isLowStock = item.currentStock <= item.minStock;

    const lastPurchase = item.purchaseHistory && item.purchaseHistory.length > 0
        ? item.purchaseHistory[item.purchaseHistory.length - 1]
        : null;

    const lastUnitPrice = lastPurchase ? (lastPurchase.totalPrice / lastPurchase.quantity).toFixed(2) : null;

    return (
        <div className={`p-4 bg-white rounded-lg border flex flex-col md:flex-row md:items-center justify-between gap-4 ${isLowStock ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}>
            <div className="flex-grow">
                <p className="font-bold text-lg">{item.name}</p>
                <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm">
                    <p>Stock: <span className="font-semibold">{item.currentStock.toFixed(2)}</span> {item.unit}</p>
                    <p className="text-gray-500">(Mín: {item.minStock} {item.unit})</p>
                    {lastUnitPrice && (
                        <p className="text-gray-500 font-semibold">
                            Último Precio: ${lastUnitPrice} / {item.unit}
                        </p>
                    )}
                </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 justify-end">
                <IconButton icon="plus" onClick={onAddStock} colorClass="hover:bg-green-100 hover:text-green-600" title="Añadir Stock" />
                <IconButton icon="minus" onClick={onUseStock} colorClass="hover:bg-red-100 hover:text-red-600" title="Usar Stock" />
                <IconButton icon="bar-chart-2" onClick={onViewHistory} colorClass="hover:bg-yellow-100 hover:text-yellow-600" title="Historial de Precios"/>
                <IconButton icon="pencil" onClick={() => onEdit(item)} colorClass="hover:bg-blue-100 hover:text-blue-600" title="Editar Producto"/>
            </div>
        </div>
    );
};

export default InventoryItemCard;
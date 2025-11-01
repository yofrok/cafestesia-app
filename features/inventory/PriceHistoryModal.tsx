import React, { useMemo } from 'react';
import { InventoryItem } from '../../types';
import Modal from '../../components/Modal';

interface PriceHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    item: InventoryItem;
}

const PriceHistoryModal: React.FC<PriceHistoryModalProps> = ({ isOpen, onClose, item }) => {

    const sortedHistory = useMemo(() => {
        if (!item.purchaseHistory) return [];
        return [...item.purchaseHistory].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [item.purchaseHistory]);

    const bestPrice = useMemo(() => {
        if (!sortedHistory || sortedHistory.length === 0) return null;
        return sortedHistory.reduce((min, p) => {
            const unitPrice = p.totalPrice / p.quantity;
            return unitPrice < min ? unitPrice : min;
        }, Infinity);
    }, [sortedHistory]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Historial de Precios: ${item.name}`}>
            <div className="max-h-[60vh] overflow-y-auto">
                {bestPrice && bestPrice !== Infinity && (
                    <div className="p-3 mb-4 bg-green-100 border border-green-300 rounded-lg text-center">
                        <p className="font-bold text-green-800">
                            Mejor Precio Histórico: ${bestPrice.toFixed(2)} / {item.unit}
                        </p>
                    </div>
                )}
                {sortedHistory.length > 0 ? (
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="p-2">Fecha</th>
                                <th className="p-2">Proveedor</th>
                                <th className="p-2">Cant.</th>
                                <th className="p-2">Total</th>
                                <th className="p-2">Unitario</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedHistory.map(p => {
                                const unitPrice = p.totalPrice / p.quantity;
                                const isBestPrice = unitPrice.toFixed(2) === bestPrice?.toFixed(2);
                                return (
                                    <tr key={p.id} className={`border-b ${isBestPrice ? 'bg-green-50' : ''}`}>
                                        <td className="p-2">{new Date(p.date).toLocaleDateString()}</td>
                                        <td className="p-2">{p.providerName}</td>
                                        <td className="p-2">{p.quantity} {item.unit}</td>
                                        <td className="p-2">${p.totalPrice.toFixed(2)}</td>
                                        <td className={`p-2 font-bold ${isBestPrice ? 'text-green-700' : ''}`}>
                                            ${unitPrice.toFixed(2)}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                ) : (
                    <p className="text-center text-gray-500 py-8">No hay historial de compras para este producto.</p>
                )}
            </div>
             <div className="flex justify-end mt-6">
                <button onClick={onClose} className="py-2 px-6 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300">Cerrar</button>
            </div>
        </Modal>
    );
};

export default PriceHistoryModal;
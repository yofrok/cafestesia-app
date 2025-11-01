import React, { useState, FormEvent, useEffect } from 'react';
import { InventoryItem, Provider } from '../../types';
import Modal from '../../components/Modal';

interface StockUpdateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpdate: (details: { itemId: string; change: number; purchaseDetails?: { totalPrice: number; providerName: string; } }) => void;
    item: InventoryItem;
    isAdding: boolean;
    providers: Provider[];
}

const StockUpdateModal: React.FC<StockUpdateModalProps> = ({ isOpen, onClose, onUpdate, item, isAdding, providers }) => {
    const [amount, setAmount] = useState('');
    const [totalPrice, setTotalPrice] = useState('');
    const [providerName, setProviderName] = useState('');
    const [error, setError] = useState('');
    const actionText = isAdding ? 'Añadir' : 'Usar';

    useEffect(() => {
        if (isOpen) {
            setAmount('');
            setTotalPrice('');
            setProviderName(item.providerPreferido || (providers.length > 0 ? providers[0].name : ''));
            setError('');
        }
    }, [isOpen, item, providers]);


    // FIX: Refactored handleSubmit to build the payload and call onUpdate within conditional branches.
    // This avoids the error "Property 'purchaseDetails' does not exist on type 'unknown'" by not mutating the payload object after creation.
    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        setError('');
        const amountNum = parseFloat(amount);

        if (isNaN(amountNum) || amountNum <= 0) {
            setError('Introduce una cantidad válida mayor que 0.');
            return;
        }

        if (isAdding) {
            const priceNum = parseFloat(totalPrice);
            if (isNaN(priceNum) || priceNum < 0) {
                setError('Introduce un precio total válido.');
                return;
            }
            onUpdate({
                itemId: item.id,
                change: amountNum,
                purchaseDetails: {
                    totalPrice: priceNum,
                    providerName: providerName,
                }
            });
        } else {
            onUpdate({
                itemId: item.id,
                change: -amountNum,
            });
        }
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`${actionText} Stock`}>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                    <p>Producto: <span className="font-bold">{item.name}</span></p>
                    <p>Stock Actual: {item.currentStock} {item.unit}</p>
                </div>
                
                <FormGroup label={`Cantidad a ${actionText.toLowerCase()}`}>
                    <input type="number" value={amount} onChange={e => setAmount(e.target.value)} step="any" min="0.01" required autoFocus />
                </FormGroup>

                {isAdding && (
                    <>
                       <FormGroup label="Precio Total de la Compra ($)">
                            <input type="number" value={totalPrice} onChange={e => setTotalPrice(e.target.value)} step="any" min="0" required />
                       </FormGroup>
                       <FormGroup label="Proveedor">
                            <select value={providerName} onChange={e => setProviderName(e.target.value)} required>
                                {providers.map(p => (
                                    <option key={p.id} value={p.name}>{p.name}</option>
                                ))}
                                <option value="Otro">Otro</option>
                            </select>
                       </FormGroup>
                    </>
                )}

                {error && <p className="text-sm text-red-600 text-center">{error}</p>}

                <div className="flex justify-end gap-4 mt-4">
                    <button type="button" onClick={onClose} className="py-2 px-4 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300">Cancelar</button>
                    <button type="submit" className="py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700">{actionText}</button>
                </div>
            </form>
        </Modal>
    );
};

const FormGroup: React.FC<{label: string, children: React.ReactElement<{ className?: string }>}> = ({label, children}) => (
    <div>
        <label className="block text-sm font-medium text-gray-600 mb-1">{label}</label>
        {React.cloneElement(children, { className: "w-full p-2 border border-gray-300 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500" })}
    </div>
);

export default StockUpdateModal;
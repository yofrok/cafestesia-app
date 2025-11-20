
import React, { useState } from 'react';
import { useBeverages } from '../../services/useBeverages';
import { Beverage, OrderItem } from '../../types';
import Icon from '../../components/Icon';
import Modal from '../../components/Modal';

const BeveragePOS: React.FC = () => {
    const { beverages, createOrder } = useBeverages();
    const [activeCategory, setActiveCategory] = useState<string>('caliente');
    const [currentOrderItems, setCurrentOrderItems] = useState<OrderItem[]>([]);
    const [customerName, setCustomerName] = useState('');
    
    // State for Size Selection
    const [selectedBeverageForSize, setSelectedBeverageForSize] = useState<Beverage | null>(null);

    // Group beverages
    const categories = ['caliente', 'frio', 'metodo', 'otro'];
    const filteredBeverages = beverages.filter(b => b.category === activeCategory);

    const handleBeverageClick = (beverage: Beverage) => {
        if (beverage.hasSizes && beverage.sizes && beverage.sizes.length > 0) {
            setSelectedBeverageForSize(beverage);
        } else {
            // Add directly if no sizes
            addToOrder(beverage, undefined, beverage.recipe);
        }
    };

    const addToOrder = (beverage: Beverage, sizeName?: string, recipeRef?: string) => {
        const newItem: OrderItem = {
            id: `item-${Date.now()}`,
            beverageId: beverage.id,
            beverageName: beverage.name,
            sizeName: sizeName,
            modifiers: [],
            recipeRef: recipeRef || beverage.recipe
        };
        setCurrentOrderItems([...currentOrderItems, newItem]);
        setSelectedBeverageForSize(null); // Close modal if open
    };

    const removeLastItem = () => {
        setCurrentOrderItems(prev => prev.slice(0, -1));
    };

    const addModifierToLastItem = (mod: string) => {
        if (currentOrderItems.length === 0) return;
        const updated = [...currentOrderItems];
        const lastItem = updated[updated.length - 1];
        if (!lastItem.modifiers.includes(mod)) {
            lastItem.modifiers.push(mod);
            setCurrentOrderItems(updated);
        }
    };

    const handleSendOrder = () => {
        if (currentOrderItems.length === 0) return;
        const name = customerName.trim() || "Mostrador";
        createOrder(name, currentOrderItems);
        setCustomerName('');
        setCurrentOrderItems([]);
    };

    // Extract common modifiers from the ACTIVE beverage category to show relevant buttons
    // Explicitly typing as string[] to avoid inference issues where it might be seen as unknown[]
    const activeModifiers: string[] = Array.from(new Set<string>(
        filteredBeverages.flatMap(b => b.modifiers || []) as string[]
    )).slice(0, 6); // Limit to top 6

    return (
        <div className="flex flex-col h-full md:flex-row overflow-hidden">
            {/* Left: Menu Grid */}
            <div className="flex-1 flex flex-col bg-gray-100 border-r border-gray-200">
                {/* Categories */}
                <div className="flex gap-2 p-2 bg-white shadow-sm overflow-x-auto">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`px-4 py-3 rounded-lg font-bold capitalize flex-shrink-0 transition-colors ${activeCategory === cat ? 'bg-amber-700 text-white' : 'bg-gray-100 text-gray-600'}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Items Grid */}
                <div className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 overflow-y-auto content-start">
                    {filteredBeverages.map(bev => (
                        <button
                            key={bev.id}
                            onClick={() => handleBeverageClick(bev)}
                            className="bg-white p-4 h-24 rounded-xl shadow-sm border border-gray-200 hover:border-amber-500 hover:shadow-md transition-all flex flex-col items-center justify-center text-center active:scale-95 relative"
                        >
                            <span className="font-bold text-gray-800 leading-tight">{bev.name}</span>
                            {bev.hasSizes && (
                                <span className="absolute top-2 right-2 text-xs bg-gray-100 text-gray-500 px-1 rounded">Tallas</span>
                            )}
                        </button>
                    ))}
                </div>
                
                {/* Quick Modifiers (Contextual) */}
                {currentOrderItems.length > 0 && activeModifiers.length > 0 && (
                     <div className="p-2 bg-gray-200 flex gap-2 overflow-x-auto">
                        {activeModifiers.map(mod => (
                            <button 
                                key={mod}
                                onClick={() => addModifierToLastItem(mod)}
                                className="px-3 py-2 bg-white rounded-full text-xs font-bold text-gray-700 border border-gray-300 shadow-sm hover:bg-blue-50 active:bg-blue-100 whitespace-nowrap"
                            >
                                + {mod}
                            </button>
                        ))}
                     </div>
                )}
            </div>

            {/* Right: Current Order Ticket */}
            <div className="w-full md:w-80 bg-white flex flex-col flex-shrink-0 border-l border-gray-200 shadow-xl z-10">
                <div className="p-4 bg-gray-50 border-b border-gray-200">
                    <input 
                        type="text" 
                        value={customerName} 
                        onChange={e => setCustomerName(e.target.value)}
                        placeholder="Nombre / Mesa (Opcional)" 
                        className="w-full p-2 border border-gray-300 rounded-md text-lg font-semibold"
                    />
                </div>

                <div className="flex-grow overflow-y-auto p-4 space-y-3">
                    {currentOrderItems.length === 0 ? (
                        <div className="text-center text-gray-400 mt-10">
                            <Icon name="shopping-cart" size={48} className="mx-auto mb-2 opacity-20" />
                            <p>Ticket vacío</p>
                        </div>
                    ) : (
                        currentOrderItems.map((item, idx) => (
                            <div key={idx} className={`flex justify-between items-start pb-2 border-b border-dashed border-gray-200 ${idx === currentOrderItems.length - 1 ? 'opacity-100' : 'opacity-70'}`}>
                                <div>
                                    <p className="font-bold text-gray-800">
                                        {item.beverageName}
                                        {item.sizeName && <span className="text-amber-700 ml-1 text-sm">({item.sizeName})</span>}
                                    </p>
                                    {item.modifiers.length > 0 && (
                                        <p className="text-xs text-blue-600">{item.modifiers.join(', ')}</p>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-4 bg-gray-50 border-t border-gray-200 grid grid-cols-2 gap-3">
                    <button 
                        onClick={removeLastItem}
                        disabled={currentOrderItems.length === 0}
                        className="py-3 bg-gray-200 text-gray-600 font-bold rounded-lg disabled:opacity-50"
                    >
                        <Icon name="rotate-ccw" className="mx-auto" />
                    </button>
                    <button 
                        onClick={handleSendOrder}
                        disabled={currentOrderItems.length === 0}
                        className="py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        <span>ENVIAR</span>
                        <Icon name="play-circle" />
                    </button>
                </div>
            </div>

            {/* Size Selection Modal */}
            {selectedBeverageForSize && (
                <Modal isOpen={!!selectedBeverageForSize} onClose={() => setSelectedBeverageForSize(null)} title={`Tamaño para: ${selectedBeverageForSize.name}`}>
                    <div className="flex flex-col gap-3">
                        {selectedBeverageForSize.sizes?.map((size, idx) => (
                            <button
                                key={idx}
                                onClick={() => addToOrder(selectedBeverageForSize, size.name, size.recipe)}
                                className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-blue-800 font-bold text-lg hover:bg-blue-100 transition-colors"
                            >
                                {size.name}
                            </button>
                        ))}
                         <button
                            onClick={() => setSelectedBeverageForSize(null)}
                            className="p-3 mt-2 bg-gray-100 text-gray-600 rounded-lg font-semibold"
                        >
                            Cancelar
                        </button>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default BeveragePOS;

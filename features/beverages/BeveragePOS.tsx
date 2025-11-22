
import React, { useState, useMemo, useRef } from 'react';
import { useBeverages } from '../../services/useBeverages';
import { Beverage, OrderItem, MenuItemType } from '../../types';
import Icon from '../../components/Icon';
import Modal from '../../components/Modal';

// --- Sub-component for Swipe-to-Delete Item ---
interface OrderItemRowProps {
    item: OrderItem;
    index: number;
    onEdit: (index: number) => void;
    onDelete: (index: number) => void;
}

const OrderItemRow: React.FC<OrderItemRowProps> = ({ item, index, onEdit, onDelete }) => {
    const [offsetX, setOffsetX] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const startX = useRef(0);
    const currentOffsetX = useRef(0);

    // Threshold to trigger delete (pixels)
    const DELETE_THRESHOLD = -100;

    const onDragStart = (clientX: number) => {
        startX.current = clientX;
        setIsDragging(true);
    };

    const onDragMove = (clientX: number) => {
        if (!isDragging) return;
        const diff = clientX - startX.current;
        
        // Only allow sliding to the left (negative values)
        // Limit max slide to -150px for visual constraints
        if (diff < 0) {
             const newOffset = Math.max(diff, -150);
             currentOffsetX.current = newOffset;
             setOffsetX(newOffset);
        }
    };

    const onDragEnd = () => {
        setIsDragging(false);
        if (currentOffsetX.current < DELETE_THRESHOLD) {
            // Swiped far enough -> Delete
            setOffsetX(-500); // Visual swipe out
            setTimeout(() => onDelete(index), 200);
        } else {
            // Not far enough -> Snap back
            setOffsetX(0);
            currentOffsetX.current = 0;
        }
    };

    // Touch Events
    const handleTouchStart = (e: React.TouchEvent) => onDragStart(e.touches[0].clientX);
    const handleTouchMove = (e: React.TouchEvent) => onDragMove(e.touches[0].clientX);
    
    // Mouse Events (for desktop testing)
    const handleMouseDown = (e: React.MouseEvent) => onDragStart(e.clientX);
    const handleMouseMove = (e: React.MouseEvent) => isDragging && onDragMove(e.clientX);
    const handleMouseUp = () => isDragging && onDragEnd();
    const handleMouseLeave = () => isDragging && onDragEnd();

    return (
        <div className="relative overflow-hidden mb-2 select-none touch-pan-y">
            {/* Background Layer (Red/Delete) */}
            <div className="absolute inset-0 bg-red-500 rounded-lg flex items-center justify-end pr-6">
                <div className="flex items-center gap-2 text-white font-bold">
                    <span>Borrar</span>
                    <Icon name="trash-2" size={20} />
                </div>
            </div>

            {/* Foreground Layer (Content) */}
            <div 
                className="relative bg-white p-2 border-b border-dashed border-gray-200 flex justify-between items-start transition-transform duration-200 ease-out"
                style={{ 
                    transform: `translateX(${offsetX}px)`,
                    transition: isDragging ? 'none' : 'transform 0.2s ease-out',
                    cursor: isDragging ? 'grabbing' : 'grab'
                }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={onDragEnd}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
            >
                <div className="flex-1 min-w-0 pr-2">
                    <p className="font-bold text-gray-800 text-sm md:text-base leading-tight truncate">
                        {item.beverageName}
                    </p>
                    {item.sizeName && <span className="text-amber-700 text-xs md:text-sm block truncate">({item.sizeName})</span>}
                    
                    <div className="flex flex-wrap gap-1 items-center mt-1">
                        <span className={`text-[10px] px-1 rounded ${item.type === 'food' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'}`}>
                            {item.type === 'food' ? 'COCINA' : 'BARRA'}
                        </span>
                        {item.notes && (
                            <span className="text-[10px] px-1 rounded bg-yellow-200 text-yellow-900 font-bold flex items-center gap-1 max-w-full truncate">
                                <Icon name="pencil" size={8} /> {item.notes}
                            </span>
                        )}
                    </div>
                    {item.modifiers.length > 0 && (
                        <p className="text-[10px] md:text-xs text-blue-600 mt-0.5 truncate">{item.modifiers.join(', ')}</p>
                    )}
                </div>

                <div className="flex flex-col gap-1 flex-shrink-0 mt-0.5">
                    <button 
                        onClick={(e) => { e.stopPropagation(); onEdit(index); }}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        title="Editar Nota"
                        onMouseDown={(e) => e.stopPropagation()} 
                        onTouchStart={(e) => e.stopPropagation()}
                    >
                        <Icon name="pencil" size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};


const BeveragePOS: React.FC = () => {
    const { beverages, createOrder } = useBeverages();
    const [activeType, setActiveType] = useState<MenuItemType>('beverage');
    const [activeCategory, setActiveCategory] = useState<string>('all');
    const [currentOrderItems, setCurrentOrderItems] = useState<OrderItem[]>([]);
    const [customerName, setCustomerName] = useState('');
    
    // Search State
    const [searchQuery, setSearchQuery] = useState('');
    
    // State for Size Selection
    const [selectedBeverageForSize, setSelectedBeverageForSize] = useState<Beverage | null>(null);

    // State for Note Editing
    const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
    const [tempNote, setTempNote] = useState('');

    // Filter items by main type (Drink vs Food)
    const typeFilteredItems = useMemo(() => {
        return beverages.filter(b => b.type === activeType || (!b.type && activeType === 'beverage')); // Backwards compat
    }, [beverages, activeType]);

    // Get unique categories from the filtered list for dynamic tabs
    const categories = useMemo(() => {
        const cats = new Set<string>(typeFilteredItems.map(b => b.category));
        return Array.from(cats);
    }, [typeFilteredItems]);

    // Final grid items (Search overrides Category)
    const gridItems = useMemo(() => {
        // 1. If searching, filter strictly by name match within the active type
        if (searchQuery.trim()) {
            return typeFilteredItems.filter(b => 
                b.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
        
        // 2. If not searching, use category filter
        if (activeCategory === 'all') return typeFilteredItems;
        return typeFilteredItems.filter(b => b.category === activeCategory);
    }, [typeFilteredItems, activeCategory, searchQuery]);

    const handleTypeChange = (type: MenuItemType) => {
        setActiveType(type);
        setActiveCategory('all');
        setSearchQuery(''); // Clear search on type switch
    };

    const handleBeverageClick = (beverage: Beverage) => {
        if (beverage.hasSizes && beverage.sizes && beverage.sizes.length > 0) {
            setSelectedBeverageForSize(beverage);
        } else {
            // Add directly if no sizes
            addToOrder(beverage, undefined, beverage.recipe);
        }
        setSearchQuery(''); // Optional: Clear search after adding? Let's keep it for now in case adding multiple similar items.
    };

    const addToOrder = (beverage: Beverage, sizeName?: string, recipeRef?: string) => {
        const newItem: OrderItem = {
            id: `item-${Date.now()}`,
            beverageId: beverage.id,
            beverageName: beverage.name,
            type: beverage.type || 'beverage',
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

    const removeSpecificItem = (index: number) => {
        const updated = [...currentOrderItems];
        updated.splice(index, 1);
        setCurrentOrderItems(updated);
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

    // --- Note Handling ---
    const openNoteModal = (index: number) => {
        setEditingItemIndex(index);
        setTempNote(currentOrderItems[index].notes || '');
    };

    const saveNote = () => {
        if (editingItemIndex === null) return;
        const updated = [...currentOrderItems];
        updated[editingItemIndex].notes = tempNote.trim();
        setCurrentOrderItems(updated);
        setEditingItemIndex(null);
        setTempNote('');
    };

    const handleSendOrder = () => {
        if (currentOrderItems.length === 0) return;
        const name = customerName.trim() || "Mostrador";
        createOrder(name, currentOrderItems);
        setCustomerName('');
        setCurrentOrderItems([]);
    };

    // Extract common modifiers from the ACTIVE view
    const activeModifiers: string[] = Array.from(new Set<string>(
        typeFilteredItems.flatMap(b => b.modifiers || []) as string[]
    )).slice(0, 6);

    return (
        <div className="flex flex-col h-full md:flex-row overflow-hidden">
            {/* Left: Menu Grid */}
            {/* On mobile, restrict height to 60% to leave room for ticket. On desktop, flex-1 takes available width. */}
            <div className="h-[60%] md:h-auto md:flex-1 flex flex-col bg-gray-100 border-r border-gray-200 min-w-0">
                
                {/* Top Level Switcher */}
                <div className="p-1 md:p-2 bg-white flex gap-2 border-b border-gray-200 flex-shrink-0">
                    <button 
                        onClick={() => handleTypeChange('beverage')}
                        className={`flex-1 py-2 md:py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors text-xs md:text-base ${activeType === 'beverage' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}`}
                    >
                        <Icon name="star" size={16} className="md:w-5 md:h-5" />
                        Bebidas
                    </button>
                    <button 
                        onClick={() => handleTypeChange('food')}
                        className={`flex-1 py-2 md:py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors text-xs md:text-base ${activeType === 'food' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-500'}`}
                    >
                        <Icon name="cake-slice" size={16} className="md:w-5 md:h-5" />
                        Comida
                    </button>
                </div>

                {/* Search Bar */}
                <div className="px-2 pt-2 pb-1 bg-gray-100 flex-shrink-0">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-2 md:pl-3 flex items-center pointer-events-none text-gray-400">
                            <Icon name="list" size={16} className="md:w-[18px]" />
                        </div>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={`Buscar...`}
                            className="w-full pl-8 md:pl-10 pr-8 py-1.5 md:py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                        />
                        {searchQuery && (
                            <button 
                                onClick={() => setSearchQuery('')}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                            >
                                <Icon name="x" size={16} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Categories (Hidden if searching) */}
                {!searchQuery && (
                    <div className="flex gap-1 md:gap-2 p-1 md:p-2 bg-gray-100 overflow-x-auto flex-shrink-0 custom-scrollbar">
                        <button
                            onClick={() => setActiveCategory('all')}
                            className={`px-3 py-1.5 md:px-4 md:py-2 rounded-full font-bold capitalize flex-shrink-0 transition-colors border text-xs md:text-sm ${activeCategory === 'all' ? 'bg-gray-700 text-white border-gray-700' : 'bg-white text-gray-600 border-gray-300'}`}
                        >
                            Todos
                        </button>
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`px-3 py-1.5 md:px-4 md:py-2 rounded-full font-bold capitalize flex-shrink-0 transition-colors border text-xs md:text-sm ${activeCategory === cat ? 'bg-gray-700 text-white border-gray-700' : 'bg-white text-gray-600 border-gray-300'}`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                )}

                {/* Items Grid - 3 Columns on Mobile, smaller height */}
                <div className="p-2 md:p-3 grid grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-3 overflow-y-auto content-start flex-grow">
                    {gridItems.length > 0 ? (
                        gridItems.map(bev => (
                            <button
                                key={bev.id}
                                onClick={() => handleBeverageClick(bev)}
                                className="bg-white p-1 md:p-4 h-20 md:h-28 rounded-lg shadow-sm border border-gray-200 hover:border-amber-500 hover:shadow-md transition-all flex flex-col items-center justify-center text-center active:scale-95 relative"
                            >
                                <span className="font-bold text-gray-800 leading-none text-xs md:text-base line-clamp-3">{bev.name}</span>
                                {bev.hasSizes && (
                                    <span className="absolute top-1 right-1 text-[9px] md:text-[10px] bg-gray-100 text-gray-500 px-1 rounded">Var</span>
                                )}
                            </button>
                        ))
                    ) : (
                        <div className="col-span-full text-center py-10 text-gray-400">
                            <p>No se encontraron productos.</p>
                        </div>
                    )}
                </div>
                
                {/* Quick Modifiers */}
                {currentOrderItems.length > 0 && activeModifiers.length > 0 && (
                     <div className="p-2 bg-gray-200 flex gap-2 overflow-x-auto flex-shrink-0">
                        {activeModifiers.map(mod => (
                            <button 
                                key={mod}
                                onClick={() => addModifierToLastItem(mod)}
                                className="px-2 py-1.5 md:px-3 md:py-2 bg-white rounded-full text-[10px] md:text-xs font-bold text-gray-700 border border-gray-300 shadow-sm hover:bg-blue-50 active:bg-blue-100 whitespace-nowrap"
                            >
                                + {mod}
                            </button>
                        ))}
                     </div>
                )}
            </div>

            {/* Right: Ticket */}
            {/* Fixed width w-80. Using flex-col. Critical: overflow-hidden on the container to manage inner scroll */}
            <div className="h-[40%] md:h-auto w-full md:w-80 bg-white flex flex-col flex-shrink-0 border-l border-gray-200 shadow-xl z-10 overflow-hidden">
                <div className="p-2 md:p-4 bg-gray-50 border-b border-gray-200 flex-shrink-0">
                    <input 
                        type="text" 
                        value={customerName} 
                        onChange={e => setCustomerName(e.target.value)}
                        placeholder="Nombre / Mesa" 
                        className="w-full p-2 border border-gray-300 rounded-md text-sm md:text-lg font-semibold"
                    />
                </div>

                <div className="flex-grow overflow-y-auto p-2 md:p-4 custom-scrollbar">
                    {currentOrderItems.length === 0 ? (
                        <div className="text-center text-gray-400 mt-6 md:mt-10">
                            <Icon name="shopping-cart" size={32} className="mx-auto mb-2 opacity-20" />
                            <p className="text-xs md:text-sm">Ticket vacío</p>
                        </div>
                    ) : (
                        currentOrderItems.map((item, idx) => (
                            <OrderItemRow 
                                key={`${item.id}-${idx}`} 
                                item={item} 
                                index={idx} 
                                onEdit={openNoteModal} 
                                onDelete={removeSpecificItem} 
                            />
                        ))
                    )}
                </div>

                <div className="p-2 md:p-4 bg-gray-50 border-t border-gray-200 grid grid-cols-2 gap-2 md:gap-3 flex-shrink-0">
                    <button 
                        onClick={removeLastItem}
                        disabled={currentOrderItems.length === 0}
                        className="py-2 md:py-3 bg-gray-200 text-gray-600 font-bold rounded-lg disabled:opacity-50 flex items-center justify-center text-xs md:text-sm"
                    >
                        <Icon name="rotate-ccw" className="mr-1" size={16} />
                        Deshacer
                    </button>
                    <button 
                        onClick={handleSendOrder}
                        disabled={currentOrderItems.length === 0}
                        className="py-2 md:py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 shadow-md disabled:opacity-50 flex items-center justify-center gap-2 text-sm md:text-base"
                    >
                        <span>ENVIAR</span>
                        <Icon name="play-circle" size={18} />
                    </button>
                </div>
            </div>

            {/* Size Selection Modal */}
            {selectedBeverageForSize && (
                <Modal isOpen={!!selectedBeverageForSize} onClose={() => setSelectedBeverageForSize(null)} title={`Variante para: ${selectedBeverageForSize.name}`}>
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

            {/* Note Modal */}
            {editingItemIndex !== null && (
                <Modal isOpen={editingItemIndex !== null} onClose={() => setEditingItemIndex(null)} title="Nota para cocina/barra">
                    <div className="flex flex-col gap-4">
                        <p className="text-sm text-gray-600">
                            Agrega detalles especiales para: <span className="font-bold">{currentOrderItems[editingItemIndex].beverageName}</span>
                        </p>
                        <input
                            type="text"
                            value={tempNote}
                            onChange={(e) => setTempNote(e.target.value)}
                            placeholder="Ej: Sin cebolla, leche deslactosada, extra caliente..."
                            autoFocus
                            className="w-full p-3 border border-gray-300 rounded-lg text-lg"
                        />
                        <div className="flex gap-3 mt-2">
                            <button 
                                onClick={() => setEditingItemIndex(null)} 
                                className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-lg"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={saveNote} 
                                className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700"
                            >
                                Guardar Nota
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default BeveragePOS;

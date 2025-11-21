
import React, { useState } from 'react';
import Icon from './Icon';

interface CollapsibleSectionProps {
    title: string;
    count?: number;
    children: React.ReactNode;
    defaultOpen?: boolean;
    icon?: string;
    colorClass?: string; // e.g., "text-blue-700"
    bgClass?: string; // e.g., "bg-gray-50"
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ 
    title, 
    count, 
    children, 
    defaultOpen = true, 
    icon,
    colorClass = "text-gray-800",
    bgClass = "bg-gray-100"
}) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between p-4 transition-colors ${bgClass} hover:brightness-95`}
            >
                <div className="flex items-center gap-3">
                    {icon && <Icon name={icon as any} size={20} className={colorClass} />}
                    <h3 className={`text-lg font-bold ${colorClass}`}>
                        {title}
                    </h3>
                    {count !== undefined && (
                        <span className="bg-white px-2 py-0.5 rounded-full text-xs font-bold text-gray-500 shadow-sm">
                            {count}
                        </span>
                    )}
                </div>
                <div className={`text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-90' : ''}`}>
                    <Icon name="chevron-right" size={20} />
                </div>
            </button>
            
            <div 
                className={`transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}
            >
                <div className="p-4 bg-white border-t border-gray-100">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default CollapsibleSection;

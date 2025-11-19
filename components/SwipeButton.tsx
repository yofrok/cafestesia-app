
import React, { useState, useRef, MouseEvent, TouchEvent, useEffect } from 'react';
import Icon from './Icon';

interface SwipeButtonProps {
    onSwipe: () => void;
    text: string;
    icon?: 'chevron-right' | 'check' | 'check-circle';
    className?: string;
    disabled?: boolean;
}

const SwipeButton: React.FC<SwipeButtonProps> = ({ onSwipe, text, icon = 'chevron-right', className = 'bg-gray-100 border-gray-300', disabled = false }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [dragWidth, setDragWidth] = useState(0);
    const [isCompleted, setIsCompleted] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const sliderRef = useRef<HTMLDivElement>(null);

    // Reset state if disabled changes
    useEffect(() => {
        if (disabled) {
            setDragWidth(0);
            setIsDragging(false);
        }
    }, [disabled]);

    const startDrag = () => {
        if (disabled || isCompleted) return;
        setIsDragging(true);
    };

    const onDrag = (clientX: number) => {
        if (!isDragging || !containerRef.current || !sliderRef.current) return;
        
        const containerRect = containerRef.current.getBoundingClientRect();
        const sliderWidth = sliderRef.current.offsetWidth;
        const maxDrag = containerRect.width - sliderWidth - 8; // 8px padding total roughly

        let newWidth = clientX - containerRect.left - (sliderWidth / 2);
        newWidth = Math.max(0, Math.min(newWidth, maxDrag));
        
        setDragWidth(newWidth);
    };

    const endDrag = () => {
        if (!isDragging || !containerRef.current || !sliderRef.current) return;
        
        const containerRect = containerRef.current.getBoundingClientRect();
        const maxDrag = containerRect.width - sliderRef.current.offsetWidth - 8;
        const threshold = maxDrag * 0.9; // 90% to complete

        if (dragWidth >= threshold) {
            setDragWidth(maxDrag);
            setIsCompleted(true);
            onSwipe();
            // Reset after a delay allows visual confirmation
            setTimeout(() => {
                setIsCompleted(false);
                setDragWidth(0);
            }, 1000);
        } else {
            setDragWidth(0);
        }
        setIsDragging(false);
    };

    // Mouse Events
    const onMouseDown = () => startDrag();
    const onMouseMove = (e: MouseEvent) => isDragging && onDrag(e.clientX);
    const onMouseUp = () => endDrag();
    const onMouseLeave = () => isDragging && endDrag();

    // Touch Events
    const onTouchStart = () => startDrag();
    const onTouchMove = (e: TouchEvent) => isDragging && onDrag(e.touches[0].clientX);
    const onTouchEnd = () => endDrag();

    return (
        <div 
            className={`relative h-14 rounded-full overflow-hidden select-none shadow-inner border ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
            ref={containerRef}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseLeave}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
        >
            {/* Background Text */}
            <div className="absolute inset-0 flex items-center justify-center z-0">
                <span className={`text-sm font-bold uppercase tracking-widest transition-opacity duration-300 ${isDragging ? 'opacity-50' : 'text-gray-500'}`}>
                    {isCompleted ? '¡Completado!' : text}
                </span>
                {!isCompleted && !isDragging && (
                    <div className="absolute right-4 animate-pulse text-gray-400">
                        <Icon name="chevron-right" size={20} />
                    </div>
                )}
            </div>

            {/* Slider Handle */}
            <div
                ref={sliderRef}
                className={`absolute top-1 bottom-1 left-1 w-12 rounded-full flex items-center justify-center z-10 shadow-md border border-gray-100 transition-transform duration-100 ease-out ${isCompleted ? 'bg-green-500' : 'bg-white'}`}
                style={{ 
                    transform: `translateX(${dragWidth}px)`,
                    transition: isDragging ? 'none' : 'transform 0.3s ease-out'
                }}
                onMouseDown={onMouseDown}
                onTouchStart={onTouchStart}
            >
                <Icon 
                    name={isCompleted ? 'check' : icon} 
                    className={isCompleted ? 'text-white' : 'text-blue-600'} 
                    size={24} 
                />
            </div>
            
            {/* Progress Track */}
            <div 
                className={`absolute top-0 bottom-0 left-0 bg-green-500/20 z-0 transition-all duration-100 ease-out`}
                style={{ width: `${dragWidth + 24}px` }} 
            />
        </div>
    );
};

export default SwipeButton;

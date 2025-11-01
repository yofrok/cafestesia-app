
import React, { useState, useRef, MouseEvent, TouchEvent } from 'react';
import Icon from './Icon';

interface SwipeButtonProps {
    onSwipe: () => void;
    text: string;
    icon: 'chevron-right' | 'rotate-ccw' | 'x';
    variant?: 'success' | 'danger';
    pulse?: boolean;
}

const SwipeButton: React.FC<SwipeButtonProps> = ({ onSwipe, text, icon, variant = 'success', pulse = false }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [diff, setDiff] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const handleRef = useRef<HTMLDivElement>(null);

    const handleDragStart = (clientX: number) => {
        setIsDragging(true);
        setStartX(clientX);
        if (handleRef.current) {
            handleRef.current.style.transition = 'none';
        }
    };

    const handleDragMove = (clientX: number) => {
        if (!isDragging || !containerRef.current || !handleRef.current) return;
        let currentDiff = clientX - startX;
        const maxDiff = containerRef.current.offsetWidth - handleRef.current.offsetWidth - 10;
        currentDiff = Math.max(0, Math.min(currentDiff, maxDiff));
        setDiff(currentDiff);
    };

    const handleDragEnd = () => {
        if (!isDragging || !containerRef.current) {
            setDiff(0);
            return;
        };

        const threshold = containerRef.current.offsetWidth * 0.7;
        if (diff > threshold) {
            onSwipe();
        }

        setIsDragging(false);
        setDiff(0);
        if (handleRef.current) {
            handleRef.current.style.transition = 'transform 0.3s ease';
        }
    };

    // Mouse Events
    const onMouseDown = (e: MouseEvent<HTMLDivElement>) => handleDragStart(e.clientX);
    const onMouseMove = (e: MouseEvent<HTMLDivElement>) => handleDragMove(e.clientX);
    const onMouseUp = () => handleDragEnd();
    const onMouseLeave = () => handleDragEnd();
    
    // Touch Events
    const onTouchStart = (e: TouchEvent<HTMLDivElement>) => handleDragStart(e.touches[0].clientX);
    const onTouchMove = (e: TouchEvent<HTMLDivElement>) => handleDragMove(e.touches[0].clientX);
    const onTouchEnd = () => handleDragEnd();
    
    const handleStyle = { transform: `translateX(${diff}px)` };

    return (
        <div
            ref={containerRef}
            className={`relative w-full h-[70px] bg-gray-100 rounded-full p-1.5 user-select-none overflow-hidden border border-gray-200 ${pulse ? 'animate-pulse' : ''}`}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseLeave}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
        >
            <div
                ref={handleRef}
                className={`absolute top-1.5 left-1.5 w-[58px] h-[58px] rounded-full flex items-center justify-center cursor-grab z-10 ${variant === 'success' ? 'bg-green-500' : 'bg-red-500'}`}
                style={handleStyle}
                onMouseDown={onMouseDown}
                onTouchStart={onTouchStart}
            >
                <Icon name={icon} className="text-white" size={36} />
            </div>
            <span className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm md:text-base font-bold uppercase tracking-wider z-0">
                {text}
            </span>
        </div>
    );
};

export default SwipeButton;

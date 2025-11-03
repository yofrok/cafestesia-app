import React, { useState, useEffect, useRef, useMemo } from 'react';
import Icon from '../../components/Icon';
import { KanbanTask, User } from '../../types';

interface WeekdaySelectorProps {
    selectedDate: Date;
    setSelectedDate: (date: Date) => void;
    tasks: KanbanTask[];
    users: User[];
}

const WeekdaySelector: React.FC<WeekdaySelectorProps> = ({ selectedDate, setSelectedDate, tasks, users }) => {
    const [displayDate, setDisplayDate] = useState(selectedDate);
    const [animationClass, setAnimationClass] = useState('');
    const touchStartX = useRef(0);

    const userColorMap = useMemo(() => {
        return users.reduce((acc, user) => {
            acc[user.name] = user.color;
            return acc;
        }, {} as Record<string, string>);
    }, [users]);
    
    const tasksByDay = useMemo(() => {
        const map = new Map<string, string[]>(); // Key: "YYYY-MM-DD", Value: array of unique employee names
        tasks.forEach(task => {
            if (task.date) {
                const dateStr = task.date;
                if (!map.has(dateStr)) {
                    map.set(dateStr, []);
                }
                map.get(dateStr)!.push(task.employee);
            }
        });
        // Make employees unique for each day
        for (const [dateStr, employees] of map.entries()) {
            map.set(dateStr, Array.from(new Set(employees)));
        }
        return map;
    }, [tasks]);

    // This is key for the calendar picker to work. When a date is picked,
    // it updates the parent's `selectedDate`, and this effect snaps our
    // view to that week.
    useEffect(() => {
        setDisplayDate(selectedDate);
    }, [selectedDate]);

    // This effect handles the slide animation and date logic for week changes.
    useEffect(() => {
        if (animationClass.startsWith('slide-out')) {
            const direction = animationClass.includes('left') ? 'next' : 'prev';
            const timer = setTimeout(() => {
                // Calculate the new date for the week to display
                const newDisplayDate = new Date(displayDate);
                newDisplayDate.setDate(newDisplayDate.getDate() + (direction === 'prev' ? -7 : 7));
                setDisplayDate(newDisplayDate);

                // THE FIX: Also update the parent's selected date to keep the agenda in sync.
                // We'll select the same day of the week in the new week.
                const newSelectedDate = new Date(selectedDate);
                newSelectedDate.setDate(newSelectedDate.getDate() + (direction === 'prev' ? -7 : 7));
                setSelectedDate(newSelectedDate);

                // Trigger the slide-in animation for the new week
                setAnimationClass(direction === 'next' ? 'slide-in-from-right' : 'slide-in-from-left');
            }, 200); // Must match CSS animation duration
            return () => clearTimeout(timer);
        } else if (animationClass.startsWith('slide-in')) {
            // Clean up the animation class after it completes
            const timer = setTimeout(() => {
                setAnimationClass('');
            }, 200);
            return () => clearTimeout(timer);
        }
    }, [animationClass, displayDate, selectedDate, setSelectedDate]);


    const changeWeek = (direction: 'prev' | 'next') => {
        if (animationClass) return; // Prevent new animations while one is running
        setAnimationClass(direction === 'next' ? 'slide-out-left' : 'slide-out-right');
    };

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const dateStr = e.target.value;
        if (dateStr) {
            const newDate = new Date(dateStr);
            newDate.setMinutes(newDate.getMinutes() + newDate.getTimezoneOffset());
            setSelectedDate(newDate);
        }
    };

    const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
        touchStartX.current = e.targetTouches[0].clientX;
    };

    const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
        const touchEndX = e.changedTouches[0].clientX;
        const threshold = 50; // Min swipe distance
        const swipeDistance = touchStartX.current - touchEndX;

        if (swipeDistance > threshold) {
            changeWeek('next');
        } else if (swipeDistance < -threshold) {
            changeWeek('prev');
        }
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startOfWeek = new Date(displayDate);
    const dayOfWeek = displayDate.getDay();
    const diff = displayDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);

    const weekDays: Date[] = [];
    for (let i = 0; i < 7; i++) {
        const day = new Date(startOfWeek);
        day.setDate(startOfWeek.getDate() + i);
        weekDays.push(day);
    }

    const isSameDay = (d1: Date, d2: Date) => {
        return d1.getFullYear() === d2.getFullYear() &&
               d1.getMonth() === d2.getMonth() &&
               d1.getDate() === d2.getDate();
    };

    const monthName = displayDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

    return (
        <div className="w-full">
            <div className="flex justify-between items-center mb-2 px-2">
                <button onClick={() => changeWeek('prev')} className="p-2 text-gray-500 hover:text-blue-600 rounded-full hover:bg-gray-100 transition-colors">
                    <Icon name="chevron-left" size={20} />
                </button>
                <div className="flex items-center gap-2">
                    <h4 className="font-bold text-gray-700 capitalize text-sm">{monthName}</h4>
                    <div 
                        className="relative w-9 h-9 flex items-center justify-center text-gray-500 hover:text-blue-600 rounded-full hover:bg-gray-100 transition-colors cursor-pointer" 
                        title="Seleccionar fecha"
                    >
                        <Icon name="calendar" size={18} />
                        <input
                            type="date"
                            onChange={handleDateChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            aria-label="Seleccionar fecha"
                        />
                    </div>
                </div>
                <button onClick={() => changeWeek('next')} className="p-2 text-gray-500 hover:text-blue-600 rounded-full hover:bg-gray-100 transition-colors">
                    <Icon name="chevron-right" size={20} />
                </button>
            </div>
            <div className="p-1 bg-gray-200 rounded-lg overflow-hidden relative touch-pan-y">
                 <div
                    className={`flex justify-between items-center gap-1 md:gap-2 ${animationClass}`}
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                >
                    {weekDays.map(day => {
                        const isSelected = isSameDay(day, selectedDate);
                        const isToday = isSameDay(day, today);

                        const localDate = new Date(day);
                        localDate.setMinutes(localDate.getMinutes() - localDate.getTimezoneOffset());
                        const dayKey = localDate.toISOString().split('T')[0];
                        const employeesForDay = tasksByDay.get(dayKey) || [];
                        
                        return (
                            <button
                                key={day.toISOString()}
                                onClick={() => setSelectedDate(day)}
                                className={`px-1 py-1 md:px-2 md:py-2 rounded-md transition-all duration-200 text-center flex-1`}
                            >
                                <div className={`${isSelected ? 'bg-white shadow-sm rounded-md' : ''} py-1`}>
                                    <span className={`text-xs uppercase font-bold ${isSelected ? 'text-blue-600' : 'text-gray-500'}`}>
                                        {day.toLocaleDateString('es-ES', { weekday: 'short' }).replace('.', '')}
                                    </span>
                                    <p className={`font-bold text-lg ${isToday ? 'text-blue-600' : (isSelected ? 'text-gray-800' : 'text-gray-600')}`}>
                                        {day.getDate()}
                                    </p>
                                    <div className="flex justify-center items-center h-2 mt-1 gap-0.5">
                                        {employeesForDay.slice(0, 4).map(employeeName => (
                                            <div
                                                key={employeeName}
                                                className="w-1.5 h-1.5 rounded-full"
                                                style={{ backgroundColor: userColorMap[employeeName] || '#9ca3af' }}
                                                title={employeeName}
                                            ></div>
                                        ))}
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default WeekdaySelector;
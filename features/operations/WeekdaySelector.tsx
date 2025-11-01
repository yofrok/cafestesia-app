import React from 'react';

interface WeekdaySelectorProps {
    selectedDate: Date;
    setSelectedDate: (date: Date) => void;
}

const WeekdaySelector: React.FC<WeekdaySelectorProps> = ({ selectedDate, setSelectedDate }) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startOfWeek = new Date(selectedDate);
    const dayOfWeek = selectedDate.getDay();
    const diff = selectedDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust for Sunday
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

    return (
        <div className="flex justify-center items-center gap-1 md:gap-2 p-1 bg-gray-200 rounded-lg">
            {weekDays.map(day => {
                const isSelected = isSameDay(day, selectedDate);
                const isToday = isSameDay(day, today);
                
                return (
                    <button
                        key={day.toISOString()}
                        onClick={() => setSelectedDate(day)}
                        className={`px-2 py-1 md:px-4 md:py-2 rounded-md transition-all duration-200 w-full text-center ${
                            isSelected ? 'bg-white shadow-sm' : 'bg-transparent'
                        }`}
                    >
                        <span className={`text-xs uppercase font-bold ${isSelected ? 'text-blue-600' : 'text-gray-500'}`}>
                            {day.toLocaleDateString('es-ES', { weekday: 'short' })}
                        </span>
                        <p className={`font-bold text-lg ${isToday ? 'text-blue-600' : (isSelected ? 'text-gray-800' : 'text-gray-600')}`}>
                            {day.getDate()}
                        </p>
                    </button>
                );
            })}
        </div>
    );
};

export default WeekdaySelector;
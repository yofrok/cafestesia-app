import React, { useState, useEffect } from 'react';
import { KanbanTask, Employee } from '../../types';
import { TIMELINE_START_HOUR, TIMELINE_END_HOUR } from '../../constants';

interface TimelineProps {
    tasks: KanbanTask[];
}

const HOUR_HEIGHT_PX = 60; // 60px per hour

const employeeColors: Record<Employee, string> = {
    'Ali': 'bg-pink-500',
    'Fer': 'bg-purple-600',
    'Claudia': 'bg-teal-500',
    'Admin': 'bg-yellow-700',
};

const timeToPosition = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    const hoursFromStart = hours - TIMELINE_START_HOUR;
    return (hoursFromStart * HOUR_HEIGHT_PX) + (minutes / 60 * HOUR_HEIGHT_PX);
};

const Timeline: React.FC<TimelineProps> = ({ tasks }) => {
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 60000); // Update every minute
        return () => clearInterval(timer);
    }, []);

    const hours = Array.from({ length: TIMELINE_END_HOUR - TIMELINE_START_HOUR + 1 }, (_, i) => TIMELINE_START_HOUR + i);

    const currentTimePosition = timeToPosition(`${now.getHours()}:${now.getMinutes()}`);

    return (
        <div className="hidden md:block w-32 flex-shrink-0 bg-gray-100 rounded-lg p-2 relative overflow-y-auto">
            <div className="relative" style={{ height: `${(TIMELINE_END_HOUR - TIMELINE_START_HOUR + 1) * HOUR_HEIGHT_PX}px` }}>
                {/* Hour markers and lines */}
                {hours.map(hour => (
                    <div key={hour} className="relative" style={{ height: `${HOUR_HEIGHT_PX}px` }}>
                        <span className="absolute -top-2 left-0 text-xs font-semibold text-gray-500">{hour % 12 === 0 ? 12 : hour % 12}{hour < 12 ? 'am' : 'pm'}</span>
                        <div className="absolute top-0 left-8 w-px h-full bg-gray-300"></div>
                    </div>
                ))}
                
                {/* Current time indicator */}
                {currentTimePosition >= 0 && currentTimePosition <= (hours.length * HOUR_HEIGHT_PX) && (
                     <div className="absolute left-6 right-0 h-px bg-red-500 z-20" style={{ top: `${currentTimePosition}px` }}>
                        <div className="absolute -left-2 -top-1 w-2 h-2 bg-red-500 rounded-full"></div>
                    </div>
                )}
               
                {/* Task dots */}
                {tasks.map(task => (
                    <div key={task.id} className="absolute left-8 transform -translate-x-1/2 z-10 group" style={{ top: `${timeToPosition(task.time)}px` }}>
                        <div className={`w-3 h-3 rounded-full border-2 border-white ${employeeColors[task.employee]}`}></div>
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 p-2 bg-gray-800 text-white text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30">
                            <p className="font-bold">{task.time} - {task.employee}</p>
                            <p>{task.text}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Timeline;
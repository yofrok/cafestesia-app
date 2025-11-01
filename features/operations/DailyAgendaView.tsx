import React, { useState, useEffect, useMemo } from 'react';
import { KanbanTask, TaskStatus } from '../../types';
import { TIMELINE_START_HOUR, TIMELINE_END_HOUR } from '../../constants';
import AgendaTaskCard from './AgendaTaskCard';

interface DailyAgendaViewProps {
    tasks: KanbanTask[];
    onUpdateStatus: (taskId: string, newStatus: TaskStatus) => void;
    onEditTask: (task: KanbanTask) => void;
}

const EXPANDED_HOUR_HEIGHT_PX = 120; // Height for hours with tasks
const COMPRESSED_HOUR_HEIGHT_PX = 30; // Height for empty hours

interface TaskLayout {
    task: KanbanTask;
    top: number;
    height: number;
    left: number;
    width: number;
    zIndex: number;
}

const DailyAgendaView: React.FC<DailyAgendaViewProps> = ({ tasks, onUpdateStatus, onEditTask }) => {
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    const tasksByHour = useMemo(() => {
        const byHour: Record<number, boolean> = {};
        tasks.forEach(task => {
            const hour = parseInt(task.time.split(':')[0], 10);
            byHour[hour] = true;
        });
        return byHour;
    }, [tasks]);

    const hourLayouts = useMemo(() => {
        let currentTop = 0;
        const layouts: { hour: number; top: number; height: number }[] = [];
        for (let hour = TIMELINE_START_HOUR; hour <= TIMELINE_END_HOUR; hour++) {
            const hasTasks = !!tasksByHour[hour];
            const height = hasTasks ? EXPANDED_HOUR_HEIGHT_PX : COMPRESSED_HOUR_HEIGHT_PX;
            layouts.push({ hour, top: currentTop, height });
            currentTop += height;
        }
        return layouts;
    }, [tasksByHour]);

    const totalHeight = hourLayouts.length > 0 ? hourLayouts[hourLayouts.length - 1].top + hourLayouts[hourLayouts.length - 1].height : 0;

    const timeToPosition = (time: string): number => {
        const [hours, minutes] = time.split(':').map(Number);
        const hourLayout = hourLayouts.find(l => l.hour === hours);
        if (!hourLayout) return 0; // Fallback for times outside range

        const minuteOffset = (minutes / 60) * hourLayout.height;
        return hourLayout.top + minuteOffset;
    };
    
    const taskLayouts = useMemo(() => {
        const sortedTasks = [...tasks].sort((a, b) => a.time.localeCompare(b.time) || b.duration - a.duration);
        const layouts: TaskLayout[] = [];

        for (const task of sortedTasks) {
            const top = timeToPosition(task.time);
            const taskStart = new Date(`${task.date}T${task.time}`).getTime();
            const taskEnd = taskStart + task.duration * 60000;
            const hourLayout = hourLayouts.find(l => l.hour === parseInt(task.time.split(':')[0], 10));
            const hourHeight = hourLayout ? hourLayout.height : EXPANDED_HOUR_HEIGHT_PX;
            const height = (task.duration / 60) * hourHeight;
            
            const collidingTasks: TaskLayout[] = [];
            for (const placedLayout of layouts) {
                const placedStart = new Date(`${placedLayout.task.date}T${placedLayout.task.time}`).getTime();
                const placedEnd = placedStart + placedLayout.task.duration * 60000;

                if (taskStart < placedEnd && taskEnd > placedStart) {
                    collidingTasks.push(placedLayout);
                }
            }
            
            let col = 0;
            while (collidingTasks.some(l => l.left === col)) {
                col++;
            }
            
            const maxCols = Math.max(col + 1, ...collidingTasks.map(l => l.width))
            
            layouts.push({ task, top, height, left: col, width: 1, zIndex: col });
        }
        
        // Post-process to adjust width and left based on collisions
         return layouts.map((layout, i, allLayouts) => {
            const { task, top } = layout;
            const taskStart = new Date(`${task.date}T${task.time}`).getTime();
            const taskEnd = taskStart + task.duration * 60000;

            const concurrentTasks = allLayouts.filter(otherLayout => {
                const otherStart = new Date(`${otherLayout.task.date}T${otherLayout.task.time}`).getTime();
                const otherEnd = otherStart + otherLayout.task.duration * 60000;
                return taskStart < otherEnd && taskEnd > otherStart;
            });
            
            const cols = new Set(concurrentTasks.map(l => l.left));
            const numCols = cols.size;
            
            let myColIndex = 0;
            const sortedCols = Array.from(cols).sort((a, b) => a - b);
            myColIndex = sortedCols.indexOf(layout.left);

            return {
                ...layout,
                width: 100 / numCols,
                left: (myColIndex / numCols) * 100,
            };
        });

    }, [tasks, hourLayouts]);


    const currentTimePosition = timeToPosition(`${now.getHours()}:${now.getMinutes()}`);
    
    return (
        <div className="p-4 md:p-6 h-full">
            <div className="relative" style={{ height: `${totalHeight}px` }}>
                {/* Hour markers */}
                {hourLayouts.map(({ hour, top, height }) => (
                    <div key={hour} className="absolute w-full" style={{ top: `${top}px`, height: `${height}px` }}>
                        <span className="absolute -top-3 left-0 text-sm font-semibold text-gray-400 w-16 text-right pr-4">
                            {hour}:00
                        </span>
                        <div className="h-px bg-gray-200 ml-16"></div>
                    </div>
                ))}
                
                {/* Current time indicator */}
                {currentTimePosition >= 0 && currentTimePosition <= totalHeight && (
                     <div className="absolute left-16 right-0 h-0.5 bg-red-500 z-20" style={{ top: `${currentTimePosition}px` }}>
                        <div className="absolute -left-1.5 -top-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></div>
                    </div>
                )}
               
                {/* Task Cards */}
                <div className="absolute top-0 bottom-0 left-16 right-0">
                   {taskLayouts.map(({ task, top, height, left, width, zIndex }) => (
                       <AgendaTaskCard 
                           key={task.id}
                           task={task}
                           onUpdateStatus={onUpdateStatus}
                           onEdit={onEditTask}
                           style={{
                               top: `${top}px`,
                               height: `${Math.max(height - 4, 80)}px`,
                               left: `${left}%`,
                               width: `calc(${width}% - 4px)`,
                               zIndex: zIndex,
                           }}
                       />
                   ))}
                </div>
            </div>
        </div>
    );
};

export default DailyAgendaView;
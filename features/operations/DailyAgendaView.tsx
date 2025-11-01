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

    const durationToHeight = (duration: number, startTime: string): number => {
        const startHour = parseInt(startTime.split(':')[0], 10);
        const hourLayout = hourLayouts.find(l => l.hour === startHour);
        const hourHeight = hourLayout ? hourLayout.height : EXPANDED_HOUR_HEIGHT_PX;
        return (duration / 60) * hourHeight;
    };

    const currentTimePosition = timeToPosition(`${now.getHours()}:${now.getMinutes()}`);
    
    const taskLayout = useMemo(() => {
        const sortedTasks = [...tasks].sort((a, b) => a.time.localeCompare(b.time));
        const layout: { task: KanbanTask; top: number; height: number; left: number; width: number }[] = [];
        const columns: KanbanTask[][] = [];

        sortedTasks.forEach(task => {
            let placed = false;
            for (let i = 0; i < columns.length; i++) {
                const lastTaskInColumn = columns[i][columns[i].length - 1];
                const taskStartTime = new Date(`${task.date}T${task.time}`);
                const lastTaskEndTime = new Date(`${lastTaskInColumn.date}T${lastTaskInColumn.time}`);
                lastTaskEndTime.setMinutes(lastTaskEndTime.getMinutes() + lastTaskInColumn.duration);

                if (taskStartTime >= lastTaskEndTime) {
                    columns[i].push(task);
                    placed = true;
                    break;
                }
            }
            if (!placed) {
                columns.push([task]);
            }
        });

        const totalColumns = columns.length;
        columns.forEach((col, colIndex) => {
            col.forEach(task => {
                layout.push({
                    task,
                    top: timeToPosition(task.time),
                    height: durationToHeight(task.duration, task.time),
                    left: (colIndex / totalColumns) * 100,
                    width: (1 / totalColumns) * 100
                });
            });
        });

        return layout;
    }, [tasks, hourLayouts]);

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
                   {taskLayout.map(({ task, top, height, left, width }) => (
                       <AgendaTaskCard 
                           key={task.id}
                           task={task}
                           onUpdateStatus={onUpdateStatus}
                           onEdit={onEditTask}
                           style={{
                               top: `${top}px`,
                               height: `${Math.max(height - 8, 80)}px`, // Increased min height
                               left: `${left}%`,
                               width: `${width}%`,
                               paddingLeft: '0.5rem',
                           }}
                       />
                   ))}
                </div>
            </div>
        </div>
    );
};

export default DailyAgendaView;
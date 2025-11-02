import React, { useMemo } from 'react';
import { KanbanTask, TaskStatus, User } from '../../types';
import KanbanCard from './KanbanCard';
import Icon from '../../components/Icon';

type TimeStatus = 'due' | 'imminent' | 'normal';

interface KanbanColumnProps {
    title: string;
    icon: 'list' | 'play-circle' | 'check-circle';
    status: TaskStatus;
    tasks: KanbanTask[];
    onDrop: (status: TaskStatus) => void;
    onDragStart: (taskId: string) => void;
    updateTaskStatus: (taskId: string, newStatus: TaskStatus) => void;
    timeAwareTasks: Record<string, { diff: number; status: TimeStatus }>;
    onEdit: (task: KanbanTask) => void;
    users: User[];
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({ title, icon, status, tasks, onDrop, onDragStart, updateTaskStatus, timeAwareTasks, onEdit, users }) => {
    
    const userColorMap = useMemo(() => {
        return users.reduce((acc, user) => {
            acc[user.name] = user.color;
            return acc;
        }, {} as Record<string, string>);
    }, [users]);

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        onDrop(status);
    };

    let lastShift = '';

    return (
        <div 
            className="bg-gray-100 rounded-lg p-4 flex flex-col h-full min-h-[300px]"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >
            <h3 className="flex items-center gap-2 font-bold text-lg mb-4 pb-4 border-b-4 border-gray-200 flex-shrink-0">
                <Icon name={icon} size={20} />
                {title}
            </h3>
            <div className="flex-grow flex flex-col gap-4 overflow-y-auto pr-2 -mr-2">
                 {tasks.map(task => {
                    const showShiftHeader = task.status === 'todo' && task.shift !== lastShift;
                    if (showShiftHeader) {
                        lastShift = task.shift;
                    }
                    const timeStatus = timeAwareTasks[task.id]?.status ?? 'normal';
                    const userColor = userColorMap[task.employee] || '#9ca3af';

                    return (
                        <React.Fragment key={task.id}>
                            {showShiftHeader && (
                                <h4 className="font-bold text-blue-600 mt-2 pb-1 border-b border-dashed border-gray-300 capitalize">
                                    Turno {task.shift.replace('-', ' ')}
                                </h4>
                            )}
                            <KanbanCard 
                                task={task} 
                                onDragStart={onDragStart}
                                timeStatus={timeStatus}
                                onCardClick={() => {
                                    const nextStatus: TaskStatus = task.status === 'todo' ? 'inprogress' : task.status === 'inprogress' ? 'done' : 'todo';
                                    updateTaskStatus(task.id, nextStatus);
                                }}
                                onEdit={onEdit}
                                userColor={userColor}
                            />
                        </React.Fragment>
                    );
                 })}
            </div>
        </div>
    );
};

export default KanbanColumn;
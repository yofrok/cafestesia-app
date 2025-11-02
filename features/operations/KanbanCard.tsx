import React from 'react';
import { KanbanTask } from '../../types';
import Icon from '../../components/Icon';

type TimeStatus = 'due' | 'imminent' | 'normal';

interface KanbanCardProps {
    task: KanbanTask;
    onDragStart: (taskId: string) => void;
    onCardClick: () => void;
    timeStatus: TimeStatus;
    onEdit: (task: KanbanTask) => void;
    userColor: string; // Dynamic color prop
}

const KanbanCard: React.FC<KanbanCardProps> = ({ task, onDragStart, onCardClick, timeStatus, onEdit, userColor }) => {
    
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
        onDragStart(task.id);
        e.dataTransfer.setData('text/plain', task.id);
    };

    const getBorderClass = () => {
        if (task.status !== 'todo') return 'border-gray-200';
        switch (timeStatus) {
            case 'due':
                return 'animate-pulse-red';
            case 'imminent':
                return 'animate-pulse-yellow';
            default:
                return 'border-gray-200';
        }
    };

    return (
        <div
            draggable
            onDragStart={handleDragStart}
            onClick={onCardClick}
            className={`bg-white rounded-lg p-4 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-shadow border-2 relative ${getBorderClass()}`}
        >
            <div className="flex flex-col gap-2 pr-6">
                <span className="text-xs text-gray-500 font-semibold">{task.time}</span>
                <span className="font-medium">{task.text}</span>
                <div className="flex flex-wrap gap-2 items-center mt-2">
                    <span 
                        className="text-xs font-bold text-white px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: userColor }}
                    >
                        {task.employee}
                    </span>
                    {task.isCritical && (
                        <span className="flex items-center gap-1 text-xs font-semibold text-red-600">
                            <Icon name="alert-triangle" size={14} /> Crítico
                        </span>
                    )}
                    {task.zone && (
                        <span className="flex items-center gap-1 text-xs font-semibold text-blue-600">
                           <Icon name="map-pin" size={14} /> {task.zone}
                        </span>
                    )}
                </div>
            </div>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onEdit(task);
                }}
                className="absolute top-2 right-2 p-1 text-gray-400 hover:text-blue-600 transition-colors rounded-full hover:bg-gray-100"
                title="Editar Tarea"
            >
                <Icon name="pencil" size={16} />
            </button>
        </div>
    );
};

export default KanbanCard;
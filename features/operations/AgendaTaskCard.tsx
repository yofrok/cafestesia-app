import React from 'react';
import { KanbanTask, TaskStatus } from '../../types';
import Icon from '../../components/Icon';

interface AgendaTaskCardProps {
    task: KanbanTask;
    onUpdateStatus: (taskId: string, newStatus: TaskStatus) => void;
    onEdit: (task: KanbanTask) => void;
    onViewSubtasks: () => void;
    style: React.CSSProperties;
    userColor: string;
}

const getStatusStyles = (status: TaskStatus) => {
    switch (status) {
        case 'inprogress':
            return 'opacity-100 animate-pulse-yellow';
        case 'done':
            return 'opacity-50';
        case 'todo':
        default:
            return 'opacity-100';
    }
};

const AgendaTaskCard: React.FC<AgendaTaskCardProps> = ({ task, onUpdateStatus, onEdit, onViewSubtasks, style, userColor }) => {
    const statusStyles = getStatusStyles(task.status);
    
    const handleStatusChange = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent opening subtask view
        if (task.status === 'todo') {
            onUpdateStatus(task.id, 'inprogress');
        } else if (task.status === 'inprogress') {
            onUpdateStatus(task.id, 'done');
        } else if (task.status === 'done') {
            onUpdateStatus(task.id, 'todo');
        }
    };

    const startTime = new Date(`${task.date}T${task.time}`);
    const endTime = new Date(startTime.getTime() + task.duration * 60000); // 60000 ms in a minute
    const formattedEndTime = endTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });

    const totalSubtasks = task.subtasks?.length || 0;
    const completedSubtasks = task.subtasks?.filter(st => st.isCompleted).length || 0;

    const cardStyle: React.CSSProperties = {
        ...style,
        borderWidth: '2px',
        borderColor: task.status === 'inprogress' ? userColor : 'transparent',
        backgroundColor: '#f9fafb' // bg-gray-50 for normal
    };

    const textStyle = {
        color: '#374151' // neutral text-gray-700 for readability
    };

    return (
        <div
            style={cardStyle}
            onClick={onViewSubtasks}
            className={`absolute rounded-lg p-2 flex gap-2 transition-all duration-300 cursor-pointer ${statusStyles}`}
        >
            <div className="flex-shrink-0 w-1 h-full rounded-full" style={{ backgroundColor: userColor }}></div>
            <div className="flex-grow flex flex-col min-w-0 min-h-0">
                <div className="flex-grow overflow-hidden">
                    <p className={`font-bold text-sm truncate ${task.status === 'done' ? 'line-through' : ''}`} style={textStyle}>
                        {task.isCritical && (
                            <Icon name="alert-triangle" size={14} className="inline-block mr-1 text-red-600" title="Tarea Crítica" />
                        )}
                        {task.text}
                    </p>
                    <p className={`text-xs ${task.status === 'done' ? 'line-through' : ''}`} style={textStyle}>
                        {task.time} - {formattedEndTime} ({task.duration} min)
                    </p>
                </div>
                <div className="flex items-center justify-between mt-1 flex-shrink-0">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/60" style={textStyle}>{task.employee}</span>
                     
                    <div className="flex items-center gap-2" style={textStyle}>
                        {task.notes && task.notes.trim() !== '' && (
                            <Icon name="message-square" size={14} title="Esta tarea tiene notas" />
                        )}
                        {totalSubtasks > 0 && (
                            <div className="flex items-center gap-1 text-xs font-semibold">
                                <Icon name="list" size={14} />
                                <span>{completedSubtasks}/{totalSubtasks}</span>
                            </div>
                        )}
                        <button
                            onClick={(e) => { e.stopPropagation(); onEdit(task); }}
                            className="p-1 rounded-full hover:bg-black/10 transition-colors"
                            title="Editar Tarea"
                        >
                            <Icon name="pencil" size={14} />
                        </button>
                    </div>
                </div>
            </div>
             <div className="flex-shrink-0">
                <button onClick={handleStatusChange} className="w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all"
                    style={{
                        borderColor: task.status === 'done' ? '#4ade80' : '#9ca3af',
                        backgroundColor: task.status === 'done' ? '#4ade80' : 'white',
                    }}
                >
                    {task.status === 'inprogress' && <div className="w-2.5 h-2.5 bg-yellow-500 rounded-full"></div>}
                    {task.status === 'done' && <Icon name="check" size={16} className="text-white" />}
                </button>
            </div>
        </div>
    );
};

export default AgendaTaskCard;
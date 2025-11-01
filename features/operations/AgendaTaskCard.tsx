import React from 'react';
import { KanbanTask, Employee, TaskStatus } from '../../types';
import Icon from '../../components/Icon';

interface AgendaTaskCardProps {
    task: KanbanTask;
    onUpdateStatus: (taskId: string, newStatus: TaskStatus) => void;
    onEdit: (task: KanbanTask) => void;
    style: React.CSSProperties;
}

const employeeColors: Record<Employee, { bg: string; border: string; text: string }> = {
    'Ali': { bg: 'bg-pink-100', border: 'border-pink-500', text: 'text-pink-800' },
    'Fer': { bg: 'bg-purple-100', border: 'border-purple-500', text: 'text-purple-800' },
    'Claudia': { bg: 'bg-teal-100', border: 'border-teal-500', text: 'text-teal-800' },
    'Admin': { bg: 'bg-yellow-100', border: 'border-yellow-600', text: 'text-yellow-900' },
};

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

const AgendaTaskCard: React.FC<AgendaTaskCardProps> = ({ task, onUpdateStatus, onEdit, style }) => {
    const { bg, border, text } = employeeColors[task.employee] || employeeColors.Admin;
    const statusStyles = getStatusStyles(task.status);
    
    const handleStatusChange = () => {
        if (task.status === 'todo') {
            onUpdateStatus(task.id, 'inprogress');
        } else if (task.status === 'inprogress') {
            onUpdateStatus(task.id, 'done');
        }
    };

    const startTime = new Date(`${task.date}T${task.time}`);
    const endTime = new Date(startTime.getTime() + task.duration * 60000); // 60000 ms in a minute
    const formattedEndTime = endTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });

    return (
        <div
            style={style}
            className={`absolute rounded-lg p-3 flex gap-3 transition-all duration-300 ${bg} border-2 ${statusStyles} ${task.status === 'inprogress' ? border : 'border-transparent'}`}
        >
            <div className={`flex-shrink-0 w-1.5 h-full ${border.replace('border-', 'bg-')} rounded-full`}></div>
            <div className="flex-grow flex flex-col min-h-0">
                <div className="flex-grow overflow-hidden">
                    <p className={`font-bold text-sm ${text} ${task.status === 'done' ? 'line-through' : ''}`}>{task.text}</p>
                    <p className={`text-xs ${text} ${task.status === 'done' ? 'line-through' : ''}`}>
                        {task.time} - {formattedEndTime} ({task.duration} min)
                    </p>
                </div>
                <div className="flex items-center justify-between mt-1 flex-shrink-0">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-white/60 ${text}`}>{task.employee}</span>
                     <button
                        onClick={(e) => { e.stopPropagation(); onEdit(task); }}
                        className={`p-1 rounded-full hover:bg-black/10 transition-colors ${text}`}
                        title="Editar Tarea"
                    >
                        <Icon name="pencil" size={14} />
                    </button>
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
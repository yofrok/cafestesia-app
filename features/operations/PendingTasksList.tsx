import React, { useMemo } from 'react';
import { KanbanTask, User } from '../../types';
import Icon from '../../components/Icon';

interface PendingTasksListProps {
    tasks: KanbanTask[];
    onEditTask: (task: KanbanTask) => void;
    users: User[];
}

const PendingTasksList: React.FC<PendingTasksListProps> = ({ tasks, onEditTask, users }) => {

    const userColorMap = useMemo(() => {
        return users.reduce((acc, user) => {
            acc[user.name] = user.color;
            return acc;
        }, {} as Record<string, string>);
    }, [users]);

    if (tasks.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 p-8">
                <Icon name="check-circle" size={48} className="text-green-500 mb-4" />
                <h3 className="text-xl font-bold">¡Bandeja Limpia!</h3>
                <p>No hay tareas pendientes sin planificar.</p>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6">
            <div className="space-y-3">
                {/* Header for Desktop */}
                <div className="hidden md:grid grid-cols-[3fr_1.5fr_1.5fr_1fr] gap-4 px-4 pb-2 border-b border-gray-200">
                    <h4 className="text-xs font-bold uppercase text-gray-500">Tarea</h4>
                    <h4 className="text-xs font-bold uppercase text-gray-500">Asignado a</h4>
                    <h4 className="text-xs font-bold uppercase text-gray-500">Añadida por</h4>
                    <h4 className="text-xs font-bold uppercase text-gray-500 text-right">Acciones</h4>
                </div>

                {/* Task Rows */}
                {tasks.map(task => (
                    <div 
                        key={task.id} 
                        className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:border-blue-400 transition-all grid grid-cols-2 md:grid-cols-[3fr_1.5fr_1.5fr_1fr] gap-x-4 gap-y-2 items-center"
                    >
                        {/* Task Text (spans full width on mobile) */}
                        <div className="col-span-2 md:col-span-1">
                            <p className="font-bold text-gray-800 break-words flex items-center gap-2">
                                {task.isCritical && (
                                    <Icon name="alert-triangle" size={16} className="text-red-500 flex-shrink-0" title="Tarea Crítica" />
                                )}
                                {task.text}
                                {task.notes && (
                                    <Icon name="message-square" size={14} className="text-gray-400 flex-shrink-0" title="Tiene notas" />
                                )}
                            </p>
                        </div>

                        {/* Assigned To */}
                        <div className="flex items-center gap-2 text-sm">
                            <span className="font-semibold text-gray-500 md:hidden">Asignado:</span>
                            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: userColorMap[task.employee] || '#9ca3af' }}></div>
                            <span className="text-gray-700">{task.employee}</span>
                        </div>
                        
                        {/* Added By */}
                        <div className="flex items-center gap-2 text-sm">
                             <span className="font-semibold text-gray-500 md:hidden">Añadida:</span>
                             <span className="text-gray-700">{task.addedBy}</span>
                        </div>

                        {/* Actions (spans full width on mobile) */}
                        <div className="col-span-2 md:col-span-1 flex justify-end">
                            <button
                                onClick={() => onEditTask(task)}
                                className="w-full md:w-auto flex-shrink-0 flex items-center justify-center gap-2 bg-blue-100 text-blue-700 font-semibold py-2 px-3 rounded-lg hover:bg-blue-200 transition-colors text-xs"
                            >
                                <Icon name="calendar" size={14} />
                                Planificar
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PendingTasksList;
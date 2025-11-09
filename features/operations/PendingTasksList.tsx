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
                {tasks.map(task => (
                    <div 
                        key={task.id} 
                        className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:border-blue-400 transition-all flex flex-col gap-3"
                    >
                        <p className="font-bold text-gray-800 break-words flex items-center gap-2">
                            {task.isCritical && (
                                <Icon name="alert-triangle" size={16} className="text-red-500 flex-shrink-0" title="Tarea Crítica" />
                            )}
                            {task.text}
                            {task.notes && (
                                <Icon name="message-square" size={14} className="text-gray-400 flex-shrink-0" title="Tiene notas" />
                            )}
                        </p>

                        <div className="flex justify-between items-center text-sm border-t pt-3">
                            <div className="flex items-center gap-2">
                                <span className="font-semibold text-gray-500">Para:</span>
                                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: userColorMap[task.employee] || '#9ca3af' }}></div>
                                <span className="text-gray-700 font-medium">{task.employee}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-500">
                                 <span>De:</span>
                                 <span className="text-gray-700 font-medium">{task.addedBy}</span>
                            </div>
                        </div>

                        <div className="mt-1">
                            <button
                                onClick={() => onEditTask(task)}
                                className="w-full flex-shrink-0 flex items-center justify-center gap-2 bg-blue-100 text-blue-700 font-semibold py-2 px-3 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                            >
                                <Icon name="calendar" size={14} />
                                Planificar o Editar
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PendingTasksList;
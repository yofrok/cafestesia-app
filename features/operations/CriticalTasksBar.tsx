import React from 'react';
import { KanbanTask } from '../../types';
import Icon from '../../components/Icon';

interface CriticalTasksBarProps {
    tasksWithDiff: { task: KanbanTask; diff: number }[];
}

const formatRelativeTime = (diff: number) => {
    if (diff > 0) return `en ${diff} min`;
    if (diff === 0) return `¡Ahora!`;
    return `hace ${Math.abs(diff)} min`;
};

const CriticalTasksBar: React.FC<CriticalTasksBarProps> = ({ tasksWithDiff }) => {
    return (
        <div className="bg-yellow-100 border-b-2 border-yellow-300 p-3 flex-shrink-0">
            <div className="flex items-center gap-3 mb-2">
                <Icon name="alert-triangle" className="text-yellow-600" size={20} />
                <h3 className="font-bold text-yellow-800 text-base">Tareas Críticas Próximas</h3>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2">
                {tasksWithDiff.map(({ task, diff }) => (
                    <div key={task.id} className="bg-white/70 p-2 rounded-lg border border-yellow-300 flex-shrink-0 w-60">
                        <p className="font-bold text-sm text-gray-800 truncate">{task.text}</p>
                        <p className={`text-xs font-semibold ${diff <=0 ? 'text-red-600 animate-pulse' : 'text-blue-600'}`}>
                            {task.time} ({formatRelativeTime(diff)})
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CriticalTasksBar;
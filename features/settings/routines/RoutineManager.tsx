
import React, { useState } from 'react';
import { useRoutines } from '../../../services/useRoutines';
import { User, TaskTemplate } from '../../../types';
import Icon from '../../../components/Icon';
import RoutineFormModal from './RoutineFormModal';

interface RoutineManagerProps {
    users: User[];
}

const RoutineManager: React.FC<RoutineManagerProps> = ({ users }) => {
    const { routines, addRoutine, updateRoutine, deleteRoutine } = useRoutines();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRoutine, setEditingRoutine] = useState<TaskTemplate | null>(null);

    const handleAddNew = () => {
        setEditingRoutine(null);
        setIsModalOpen(true);
    };

    const handleEdit = (routine: TaskTemplate) => {
        setEditingRoutine(routine);
        setIsModalOpen(true);
    };

    const getDayLabels = (days: number[]) => {
        if (days.length === 7) return "Todos los días";
        if (days.length === 0) return "Sin programar";
        const labels = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
        return days.sort().map(d => labels[d]).join(', ');
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">Rutinas Maestras</h2>
                    <p className="text-sm text-gray-500">Configura tareas recurrentes y sus asignaciones automáticas.</p>
                </div>
                <button onClick={handleAddNew} className="flex items-center gap-2 bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm">
                    <Icon name="plus-circle" size={16} />
                    Nueva Rutina
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {routines.map(routine => (
                    <div key={routine.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all cursor-pointer group" onClick={() => handleEdit(routine)}>
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="font-bold text-gray-800 group-hover:text-blue-600 transition-colors">{routine.title}</h3>
                            <Icon name="pencil" size={16} className="text-gray-300 group-hover:text-blue-500" />
                        </div>
                        
                        <div className="text-sm text-gray-600 space-y-1">
                            <div className="flex items-center gap-2">
                                <Icon name="calendar" size={14} className="text-gray-400" />
                                <span>{getDayLabels(routine.frequencyDays)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Icon name="check-circle" size={14} className="text-gray-400" />
                                <span>{routine.time} ({routine.shift})</span>
                            </div>
                        </div>
                        
                        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2 text-xs">
                            <span className="text-gray-400">Asignación:</span>
                            <span className="bg-gray-100 px-2 py-1 rounded text-gray-700 font-medium">{routine.defaultEmployee}</span>
                            {Object.keys(routine.customAssignments).length > 0 && (
                                <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded font-bold">+{Object.keys(routine.customAssignments).length} Excepciones</span>
                            )}
                        </div>
                    </div>
                ))}
                
                {routines.length === 0 && (
                    <div className="col-span-full text-center py-10 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                        <p>No hay rutinas configuradas.</p>
                    </div>
                )}
            </div>

            <RoutineFormModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={addRoutine}
                onUpdate={updateRoutine}
                onDelete={deleteRoutine}
                routine={editingRoutine}
                users={users}
            />
        </div>
    );
};

export default RoutineManager;

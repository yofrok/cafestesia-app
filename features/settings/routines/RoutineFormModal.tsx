
import React, { useState, useEffect, FormEvent } from 'react';
import { TaskTemplate, Subtask, User, Shift } from '../../../types';
import Modal from '../../../components/Modal';
import Icon from '../../../components/Icon';
import { TASK_DURATIONS } from '../../../constants';

interface RoutineFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (routine: Omit<TaskTemplate, 'id'>) => void;
    onUpdate: (routine: TaskTemplate) => void;
    onDelete: (id: string) => void;
    routine: TaskTemplate | null;
    users: User[];
}

const DAYS = [
    { label: 'Lunes', value: 1 },
    { label: 'Martes', value: 2 },
    { label: 'Miércoles', value: 3 },
    { label: 'Jueves', value: 4 },
    { label: 'Viernes', value: 5 },
    { label: 'Sábado', value: 6 },
    { label: 'Domingo', value: 0 },
];

const RoutineFormModal: React.FC<RoutineFormModalProps> = ({ isOpen, onClose, onSave, onUpdate, onDelete, routine, users }) => {
    const [title, setTitle] = useState('');
    const [time, setTime] = useState('08:00');
    const [duration, setDuration] = useState('30');
    const [shift, setShift] = useState<Shift>('pre-apertura');
    const [zone, setZone] = useState('');
    const [isCritical, setIsCritical] = useState(false);
    const [notes, setNotes] = useState('');
    const [subtasks, setSubtasks] = useState<Subtask[]>([]);
    const [newSubtaskText, setNewSubtaskText] = useState('');

    // Scheduling & Assignment
    const [frequencyDays, setFrequencyDays] = useState<number[]>([]);
    const [defaultEmployee, setDefaultEmployee] = useState(users[0]?.name || '');
    const [customAssignments, setCustomAssignments] = useState<Record<string, string>>({});

    useEffect(() => {
        if (isOpen) {
            setTitle(routine?.title || '');
            setTime(routine?.time || '08:00');
            setDuration(String(routine?.duration || '30'));
            setShift(routine?.shift || 'pre-apertura');
            setZone(routine?.zone || '');
            setIsCritical(routine?.isCritical || false);
            setNotes(routine?.notes || '');
            setSubtasks(routine?.subtasks || []);
            setFrequencyDays(routine?.frequencyDays || []);
            setDefaultEmployee(routine?.defaultEmployee || users[0]?.name || '');
            setCustomAssignments(routine?.customAssignments || {});
        }
    }, [isOpen, routine, users]);

    const handleSave = (e: FormEvent) => {
        e.preventDefault();
        if(!title.trim()) return;

        const data = {
            title,
            subtasks,
            notes,
            frequencyDays,
            time,
            duration: parseInt(duration),
            shift,
            zone,
            isCritical,
            defaultEmployee,
            customAssignments
        };

        if (routine) {
            onUpdate({ ...data, id: routine.id });
        } else {
            onSave(data);
        }
        onClose();
    };

    const toggleDay = (dayValue: number) => {
        if (frequencyDays.includes(dayValue)) {
            setFrequencyDays(prev => prev.filter(d => d !== dayValue));
            // Clean up assignment if day is removed
            const newAssignments = { ...customAssignments };
            delete newAssignments[dayValue];
            setCustomAssignments(newAssignments);
        } else {
            setFrequencyDays(prev => [...prev, dayValue]);
        }
    };

    const handleAssignmentChange = (dayValue: number, user: string) => {
        if (user === defaultEmployee) {
             const newAssignments = { ...customAssignments };
             delete newAssignments[dayValue];
             setCustomAssignments(newAssignments);
        } else {
            setCustomAssignments(prev => ({ ...prev, [dayValue]: user }));
        }
    };
    
    const handleAddSubtask = () => {
        if (!newSubtaskText.trim()) return;
        setSubtasks([...subtasks, { id: `st-${Date.now()}`, text: newSubtaskText, isCompleted: false }]);
        setNewSubtaskText('');
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={routine ? "Editar Rutina" : "Nueva Rutina Maestra"}>
            <form onSubmit={handleSave} className="flex flex-col gap-5 max-h-[80vh] overflow-y-auto pr-2">
                
                {/* Basic Info */}
                <div>
                    <label className="block text-sm font-medium text-gray-600">Nombre de la Tarea</label>
                    <input type="text" value={title} onChange={e => setTitle(e.target.value)} required className="w-full p-2 border border-gray-300 rounded-md bg-gray-50" placeholder="Ej: Limpieza de Máquina" />
                </div>

                {/* Schedule Matrix */}
                <div className="bg-gray-100 p-4 rounded-lg border border-gray-200">
                    <div className="flex justify-between items-center mb-3">
                         <h4 className="font-bold text-gray-700">Programación y Asignación</h4>
                         <div className="text-xs text-gray-500">
                             Por defecto: 
                             <select 
                                value={defaultEmployee} 
                                onChange={e => setDefaultEmployee(e.target.value)}
                                className="ml-2 p-1 rounded border border-gray-300 font-bold text-blue-600"
                            >
                                {users.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
                            </select>
                         </div>
                    </div>
                    
                    <div className="space-y-2">
                        {DAYS.map(day => {
                            const isSelected = frequencyDays.includes(day.value);
                            const assignedUser = customAssignments[day.value] || defaultEmployee;
                            const userColor = users.find(u => u.name === assignedUser)?.color || '#ccc';

                            return (
                                <div key={day.value} className={`flex items-center justify-between p-2 rounded-md transition-colors ${isSelected ? 'bg-white shadow-sm border border-blue-200' : 'opacity-60'}`}>
                                    <div className="flex items-center gap-3">
                                        <input 
                                            type="checkbox" 
                                            checked={isSelected} 
                                            onChange={() => toggleDay(day.value)}
                                            className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                                        />
                                        <span className={`font-medium ${isSelected ? 'text-gray-900' : 'text-gray-500'}`}>{day.label}</span>
                                    </div>
                                    
                                    {isSelected && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-gray-400">Asignar a:</span>
                                            <div className="relative">
                                                <select 
                                                    value={assignedUser}
                                                    onChange={(e) => handleAssignmentChange(day.value, e.target.value)}
                                                    className="pl-2 pr-6 py-1 text-sm border border-gray-300 rounded-md bg-gray-50 appearance-none cursor-pointer hover:border-blue-400 focus:outline-none"
                                                    style={{ borderLeftWidth: '4px', borderLeftColor: userColor }}
                                                >
                                                    {users.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Time & Details */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-600">Hora (24h)</label>
                        <input type="time" value={time} onChange={e => setTime(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md bg-gray-50" />
                    </div>
                    <div>
                         <label className="block text-sm font-medium text-gray-600">Duración</label>
                         <select value={duration} onChange={e => setDuration(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md bg-gray-50">
                            {TASK_DURATIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                        </select>
                    </div>
                     <div>
                         <label className="block text-sm font-medium text-gray-600">Turno</label>
                         <select value={shift} onChange={e => setShift(e.target.value as Shift)} className="w-full p-2 border border-gray-300 rounded-md bg-gray-50">
                            <option value="pre-apertura">Pre-apertura</option>
                            <option value="matutino">Matutino</option>
                            <option value="cierre">Cierre</option>
                            <option value="default">Otro</option>
                        </select>
                    </div>
                     <div>
                         <label className="block text-sm font-medium text-gray-600">Zona</label>
                         <input type="text" value={zone} onChange={e => setZone(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md bg-gray-50" />
                    </div>
                </div>

                {/* Subtasks */}
                <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">Subtareas Maestras</label>
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <ul className="mb-2 space-y-1">
                            {subtasks.map((st, idx) => (
                                <li key={idx} className="flex justify-between text-sm bg-white p-1 px-2 rounded border border-gray-100">
                                    <span>{st.text}</span>
                                    <button type="button" onClick={() => setSubtasks(subtasks.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-600"><Icon name="x" size={14}/></button>
                                </li>
                            ))}
                        </ul>
                        <div className="flex gap-2">
                            <input type="text" value={newSubtaskText} onChange={e => setNewSubtaskText(e.target.value)} placeholder="Nueva subtarea..." className="flex-1 p-1 text-sm border rounded" />
                            <button type="button" onClick={handleAddSubtask} className="px-3 bg-blue-500 text-white rounded text-sm"><Icon name="plus" size={14}/></button>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <input type="checkbox" checked={isCritical} onChange={e => setIsCritical(e.target.checked)} className="w-4 h-4 text-red-600" />
                    <label className="text-sm font-medium text-gray-700">Marcar como Crítica</label>
                </div>

                <div className="flex justify-between pt-4 border-t">
                    {routine && (
                         <button type="button" onClick={() => { if(window.confirm('Borrar rutina?')) onDelete(routine.id); onClose(); }} className="px-4 py-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100">Eliminar</button>
                    )}
                    <div className="flex gap-2 ml-auto">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">Cancelar</button>
                        <button type="submit" className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 font-bold">Guardar Rutina</button>
                    </div>
                </div>
            </form>
        </Modal>
    );
};

export default RoutineFormModal;

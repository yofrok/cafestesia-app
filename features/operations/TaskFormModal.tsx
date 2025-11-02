import React, { useState, FormEvent, useEffect, KeyboardEvent } from 'react';
import { KanbanTask, Employee, Shift, Subtask } from '../../types';
import Modal from '../../components/Modal';
import { TASK_DURATIONS, OPERATIONS_PIN } from '../../constants';
import Icon from '../../components/Icon';

export type TaskSubmitPayload = Omit<KanbanTask, 'id' | 'status'> & {
    recurrence: 'once' | 'weekly';
    selectedDays?: string[];
    recurrenceWeeks?: string;
};

interface TaskFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (payload: TaskSubmitPayload, existingTaskId?: string) => void;
    onDelete: (taskId: string) => void;
    task: KanbanTask | null;
    selectedDate: string;
}

const daysOfWeek = [
    { label: 'L', value: '1' }, { label: 'M', value: '2' }, { label: 'M', value: '3' },
    { label: 'J', value: '4' }, { label: 'V', value: '5' }, { label: 'S', value: '6' },
    { label: 'D', value: '0' },
];

const TaskFormModal: React.FC<TaskFormModalProps> = ({ isOpen, onClose, onSave, onDelete, task, selectedDate }) => {
    const [text, setText] = useState('');
    const [employee, setEmployee] = useState<Employee>('Ali');
    const [hour, setHour] = useState('08');
    const [minute, setMinute] = useState('00');
    const [period, setPeriod] = useState<'AM' | 'PM'>('AM');
    const [duration, setDuration] = useState('30');
    const [shift, setShift] = useState<Shift>('pre-apertura');
    const [zone, setZone] = useState('');
    const [isCritical, setIsCritical] = useState(false);
    const [recurrence, setRecurrence] = useState<'once' | 'weekly'>('once');
    const [selectedDays, setSelectedDays] = useState<string[]>([]);
    const [recurrenceWeeks, setRecurrenceWeeks] = useState('4');
    const [subtasks, setSubtasks] = useState<Subtask[]>([]);
    const [newSubtaskText, setNewSubtaskText] = useState('');
    
    // State for delete confirmation
    const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
    const [pinInput, setPinInput] = useState('');
    const [pinError, setPinError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setText(task?.text || '');
            setEmployee(task?.employee || 'Ali');
            
            const taskTime = task?.time || '08:00';
            const [h, m] = taskTime.split(':').map(Number);
            
            const newPeriod = h >= 12 ? 'PM' : 'AM';
            let displayHour = h % 12;
            if (displayHour === 0) displayHour = 12;

            setHour(String(displayHour).padStart(2, '0'));
            setMinute(String(m).padStart(2, '0'));
            setPeriod(newPeriod);

            setDuration(String(task?.duration || '30'));
            setShift(task?.shift || 'pre-apertura');
            setZone(task?.zone || '');
            setIsCritical(task?.isCritical || false);
            setRecurrence('once');
            setSelectedDays([]);
            setRecurrenceWeeks('4');
            setSubtasks(task?.subtasks || []);
            setNewSubtaskText('');
            
            // Reset delete confirmation state
            setIsConfirmingDelete(false);
            setPinInput('');
            setPinError('');
        }
    }, [isOpen, task]);

    const handleDayToggle = (dayValue: string) => {
        setSelectedDays(prev =>
            prev.includes(dayValue)
                ? prev.filter(d => d !== dayValue)
                : [...prev, dayValue]
        );
    };
    
    const handleAddSubtask = () => {
        if (newSubtaskText.trim() === '') return;
        const newSubtask: Subtask = {
            id: `sub-${Date.now()}`,
            text: newSubtaskText.trim(),
            isCompleted: false,
        };
        setSubtasks([...subtasks, newSubtask]);
        setNewSubtaskText('');
    };

    const handleSubtaskKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddSubtask();
        }
    };

    const handleDeleteSubtask = (subtaskId: string) => {
        setSubtasks(subtasks.filter(st => st.id !== subtaskId));
    };


    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!text) {
            alert('Por favor completa el nombre de la tarea.');
            return;
        }
        
        if (recurrence === 'weekly' && selectedDays.length === 0) {
            alert('Por favor selecciona al menos un día para la tarea recurrente.');
            return;
        }

        let h24 = parseInt(hour, 10);
        if (period === 'PM' && h24 !== 12) {
            h24 += 12;
        } else if (period === 'AM' && h24 === 12) {
            h24 = 0; // Midnight case
        }
        const finalTime = `${String(h24).padStart(2, '0')}:${minute}`;
        
        const payload: TaskSubmitPayload = {
            text,
            employee,
            time: finalTime,
            duration: parseInt(duration, 10),
            shift,
            zone,
            isCritical,
            date: task?.date || selectedDate,
            recurrence,
            selectedDays,
            recurrenceWeeks,
            subtasks,
        };
        
        onSave(payload, task?.id);
        onClose();
    };
    
    const handleConfirmDelete = () => {
        if (pinInput === OPERATIONS_PIN) {
            if (task) {
                onDelete(task.id);
            }
            onClose();
        } else {
            setPinError('PIN incorrecto. Inténtalo de nuevo.');
            setPinInput('');
        }
    };

    const isEditing = !!task;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={task ? "Editar Tarea" : "Añadir Nueva Tarea"}>
            <div className="relative">
                <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-h-[80vh] overflow-y-auto pr-2">
                    <div className="form-group">
                        <label className="text-sm font-medium text-gray-600">Nombre de la Tarea</label>
                        <input type="text" value={text} onChange={e => setText(e.target.value)} required className="w-full p-2 border border-gray-300 rounded-md bg-gray-50" />
                    </div>

                    <fieldset disabled={isEditing}>
                        <div className="form-group">
                            <label className="text-sm font-medium text-gray-600 mb-2 block">Repetición</label>
                            <div className="flex gap-2 bg-gray-200 rounded-lg p-1">
                                <button type="button" onClick={() => setRecurrence('once')} className={`flex-1 p-2 rounded-md text-sm font-bold transition-colors ${recurrence === 'once' ? 'bg-white shadow-sm' : ''}`}>Una vez</button>
                                <button type="button" onClick={() => setRecurrence('weekly')} className={`flex-1 p-2 rounded-md text-sm font-bold transition-colors ${recurrence === 'weekly' ? 'bg-white shadow-sm' : ''}`}>Semanalmente</button>
                            </div>
                             {isEditing && <p className="text-xs text-gray-500 mt-1">La repetición no se puede cambiar en una tarea existente.</p>}
                        </div>
                        {recurrence === 'weekly' && (
                            <div className="flex flex-col gap-4 mt-4">
                                <div className="form-group">
                                    <label className="text-sm font-medium text-gray-600 mb-2 block">Días de la semana</label>
                                    <div className="flex justify-between gap-1">
                                        {daysOfWeek.map(({label, value}) => (
                                            <button
                                                type="button"
                                                key={value}
                                                onClick={() => handleDayToggle(value)}
                                                className={`w-9 h-9 flex items-center justify-center font-bold rounded-full border-2 transition-colors ${selectedDays.includes(value) ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-100 border-gray-300'}`}
                                            >
                                                {label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="text-sm font-medium text-gray-600">Repetir durante</label>
                                    <select value={recurrenceWeeks} onChange={e => setRecurrenceWeeks(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md bg-gray-50">
                                        <option value="4">4 semanas</option>
                                        <option value="8">8 semanas</option>
                                        <option value="12">12 semanas</option>
                                    </select>
                                </div>
                            </div>
                        )}
                    </fieldset>
                    
                    <div className="grid grid-cols-2 gap-4">
                         <div className="form-group">
                            <label className="text-sm font-medium text-gray-600">Empleado</label>
                            <select value={employee} onChange={e => setEmployee(e.target.value as Employee)} className="w-full p-2 border border-gray-300 rounded-md bg-gray-50">
                                <option>Ali</option><option>Fer</option><option>Claudia</option><option>Admin</option>
                            </select>
                        </div>
                         <div className="form-group">
                            <label className="text-sm font-medium text-gray-600">Turno</label>
                            <select value={shift} onChange={e => setShift(e.target.value as Shift)} className="w-full p-2 border border-gray-300 rounded-md bg-gray-50">
                                <option value="matutino">Matutino</option><option value="pre-apertura">Pre Apertura</option><option value="cierre">Cierre</option><option value="default">Otro</option>
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group">
                            <label className="text-sm font-medium text-gray-600">Hora</label>
                            <div className="flex gap-1">
                                <select value={hour} onChange={e => setHour(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md bg-gray-50">
                                    {Array.from({ length: 12 }, (_, i) => i + 1).map(h => (
                                        <option key={h} value={String(h).padStart(2, '0')}>{String(h).padStart(2, '0')}</option>
                                    ))}
                                </select>
                                <select value={minute} onChange={e => setMinute(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md bg-gray-50">
                                     {Array.from({ length: 60 }, (_, i) => i).map(m => (
                                        <option key={m} value={String(m).padStart(2, '0')}>{String(m).padStart(2, '0')}</option>
                                    ))}
                                </select>
                                 <select value={period} onChange={e => setPeriod(e.target.value as 'AM' | 'PM')} className="w-full p-2 border border-gray-300 rounded-md bg-gray-50">
                                    <option>AM</option><option>PM</option>
                                </select>
                            </div>
                        </div>
                         <div className="form-group">
                            <label className="text-sm font-medium text-gray-600">Duración</label>
                            <select value={duration} onChange={e => setDuration(e.target.value)} required className="w-full p-2 border border-gray-300 rounded-md bg-gray-50">
                               {TASK_DURATIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                            </select>
                        </div>
                    </div>
                     <div className="form-group">
                        <label className="text-sm font-medium text-gray-600">Zona (Opcional)</label>
                        <input type="text" value={zone} onChange={e => setZone(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md bg-gray-50" />
                    </div>

                    <div className="form-group mt-2">
                        <label className="text-sm font-medium text-gray-600 mb-2 block">Subtareas</label>
                        <div className="bg-gray-100 p-3 rounded-lg">
                            {subtasks.length > 0 && (
                                <ul className="space-y-2 mb-3">
                                    {subtasks.map(st => (
                                        <li key={st.id} className="flex items-center justify-between bg-white p-2 rounded">
                                            <span className="text-sm text-gray-700">{st.text}</span>
                                            <button type="button" onClick={() => handleDeleteSubtask(st.id)} className="p-1 text-gray-400 hover:text-red-600">
                                                <Icon name="trash-2" size={16} />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newSubtaskText}
                                    onChange={e => setNewSubtaskText(e.target.value)}
                                    onKeyDown={handleSubtaskKeyDown}
                                    placeholder="Añadir una subtarea..."
                                    className="w-full p-2 border border-gray-300 rounded-md bg-white text-sm"
                                />
                                <button type="button" onClick={handleAddSubtask} className="py-2 px-4 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 text-sm">Añadir</button>
                            </div>
                        </div>
                    </div>


                    <div className="flex items-center gap-2 mt-2">
                        <input type="checkbox" id="task-critical" checked={isCritical} onChange={e => setIsCritical(e.target.checked)} className="w-4 h-4" />
                        <label htmlFor="task-critical" className="text-sm font-medium text-gray-600">Es una tarea crítica</label>
                    </div>
                    <div className="flex justify-between items-center mt-4 pt-4 border-t sticky bottom-0 bg-white">
                        <div>
                           {task && (
                               <button type="button" onClick={() => setIsConfirmingDelete(true)} className="py-2 px-4 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700">
                                   Eliminar Tarea
                               </button>
                           )}
                        </div>
                        <div className="flex gap-4">
                            <button type="button" onClick={onClose} className="py-2 px-4 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300">Cancelar</button>
                            <button type="submit" className="py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700">Guardar Cambios</button>
                        </div>
                    </div>
                </form>

                {isConfirmingDelete && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex justify-center items-center z-10">
                        <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200 w-full max-w-sm text-center">
                            <h4 className="font-bold text-lg text-gray-800">Confirmar Eliminación</h4>
                            <p className="text-sm text-gray-600 mt-2 mb-4">Para confirmar, introduce el PIN de operaciones. Esta acción no se puede deshacer.</p>
                            <input
                                type="password"
                                value={pinInput}
                                onChange={e => { setPinInput(e.target.value); setPinError(''); }}
                                placeholder="PIN de Seguridad"
                                autoFocus
                                className="w-full p-2 border border-gray-300 rounded-md text-center"
                            />
                            {pinError && <p className="text-xs text-red-600 mt-1">{pinError}</p>}
                            <div className="flex gap-4 mt-4">
                                <button onClick={() => setIsConfirmingDelete(false)} className="flex-1 py-2 px-4 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300">
                                    Cancelar
                                </button>
                                <button onClick={handleConfirmDelete} className="flex-1 py-2 px-4 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700">
                                    Confirmar
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default TaskFormModal;
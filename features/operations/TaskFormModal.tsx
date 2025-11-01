import React, { useState, FormEvent, useEffect } from 'react';
import { KanbanTask, Employee, Shift } from '../../types';
import Modal from '../../components/Modal';
import { TASK_DURATIONS } from '../../constants';

export type NewTaskPayload = Omit<KanbanTask, 'id' | 'status' | 'date'> & {
    recurrence: 'once' | 'weekly';
    selectedDays?: string[];
};

interface TaskFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (task: NewTaskPayload | KanbanTask) => void;
    task: KanbanTask | null;
    selectedDate: string;
}

const daysOfWeek = [
    { label: 'L', value: '1' }, { label: 'M', value: '2' }, { label: 'M', value: '3' },
    { label: 'J', value: '4' }, { label: 'V', value: '5' }, { label: 'S', value: '6' },
    { label: 'D', value: '0' },
];

const TaskFormModal: React.FC<TaskFormModalProps> = ({ isOpen, onClose, onSave, task, selectedDate }) => {
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
        }
    }, [isOpen, task]);

    const handleDayToggle = (dayValue: string) => {
        setSelectedDays(prev =>
            prev.includes(dayValue)
                ? prev.filter(d => d !== dayValue)
                : [...prev, dayValue]
        );
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
        
        const commonPayload = {
            text,
            employee,
            time: finalTime,
            duration: parseInt(duration, 10),
            shift,
            zone,
            isCritical,
        };
        
        if (task) {
            onSave({ ...task, ...commonPayload });
        } else {
            onSave({ 
                ...commonPayload, 
                date: selectedDate, // date is handled by parent for recurring
                recurrence, 
                selectedDays 
            });
        }
        
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={task ? "Editar Tarea" : "Añadir Nueva Tarea"}>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="form-group">
                    <label className="text-sm font-medium text-gray-600">Nombre de la Tarea</label>
                    <input type="text" value={text} onChange={e => setText(e.target.value)} required className="w-full p-2 border border-gray-300 rounded-md bg-gray-50" />
                </div>
                {!task && (
                     <div className="form-group">
                        <label className="text-sm font-medium text-gray-600 mb-2 block">Repetición</label>
                        <div className="flex gap-2 bg-gray-200 rounded-lg p-1">
                            <button type="button" onClick={() => setRecurrence('once')} className={`flex-1 p-2 rounded-md text-sm font-bold transition-colors ${recurrence === 'once' ? 'bg-white shadow-sm' : ''}`}>Una vez</button>
                            <button type="button" onClick={() => setRecurrence('weekly')} className={`flex-1 p-2 rounded-md text-sm font-bold transition-colors ${recurrence === 'weekly' ? 'bg-white shadow-sm' : ''}`}>Semanalmente</button>
                        </div>
                     </div>
                )}
                {recurrence === 'weekly' && !task && (
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
                )}
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
                <div className="flex items-center gap-2 mt-2">
                    <input type="checkbox" id="task-critical" checked={isCritical} onChange={e => setIsCritical(e.target.checked)} className="w-4 h-4" />
                    <label htmlFor="task-critical" className="text-sm font-medium text-gray-600">Es una tarea crítica</label>
                </div>
                <div className="flex justify-end gap-4 mt-4">
                    <button type="button" onClick={onClose} className="py-2 px-4 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300">Cancelar</button>
                    <button type="submit" className="py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700">Guardar Cambios</button>
                </div>
            </form>
        </Modal>
    );
};

export default TaskFormModal;
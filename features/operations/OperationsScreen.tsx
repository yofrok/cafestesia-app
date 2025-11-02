import React, { useState, useMemo } from 'react';
import { KanbanTask, User } from '../../types';
import TaskFormModal, { TaskSubmitPayload } from './TaskFormModal';
import { useKanban } from '../../services/useKanban';
import Icon from '../../components/Icon';
import WeekdaySelector from './WeekdaySelector';
import DailyAgendaView from './DailyAgendaView';
import CriticalTasksBar from './CriticalTasksBar';
import EditOptionsModal from './EditOptionsModal';
import { OPERATIONS_PIN } from '../../constants';
import Modal from '../../components/Modal';

interface OperationsScreenProps {
    kanbanHook: ReturnType<typeof useKanban>;
    criticalTasks: { task: KanbanTask; diff: number }[];
    users: User[];
}

export type EditMode = 'new' | 'single' | 'future';

const OperationsScreen: React.FC<OperationsScreenProps> = ({ kanbanHook, criticalTasks, users }) => {
    const { tasks, addTask, addMultipleTasks, updateTask, updateTaskStatus, deleteTask, updateFutureTasks, deleteFutureTasks } = kanbanHook;
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<KanbanTask | null>(null);
    const [employeeFilter, setEmployeeFilter] = useState<string>('All');

    // State for handling recurring task edits/deletes
    const [taskForRecurrenceModal, setTaskForRecurrenceModal] = useState<KanbanTask | null>(null);
    const [recurrenceModalType, setRecurrenceModalType] = useState<'edit' | 'delete' | null>(null);
    const [editMode, setEditMode] = useState<EditMode>('new');
    
    // State for PIN confirmation
    const [pinProtectedAction, setPinProtectedAction] = useState<(() => void) | null>(null);
    const [isPinModalOpen, setIsPinModalOpen] = useState(false);
    const [pinInput, setPinInput] = useState('');
    const [pinError, setPinError] = useState('');

    // State for save operation feedback
    const [isSaving, setIsSaving] = useState(false);

    const handleEdit = (task: KanbanTask) => {
        if (task.recurrenceId) {
            setRecurrenceModalType('edit');
            setTaskForRecurrenceModal(task);
        } else {
            setEditMode('single');
            setEditingTask(task);
            setIsModalOpen(true);
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingTask(null);
        setEditMode('new');
    };

    const handleSaveTask = async (formData: TaskSubmitPayload, existingTaskId?: string) => {
        const { recurrence, selectedDays, recurrenceWeeks, ...commonData } = formData;
        
        setIsSaving(true);
        try {
            if (existingTaskId && editingTask) { // It's an update
                if (editMode === 'future') {
                     // User is creating a NEW recurrence pattern from this point forward
                    if (recurrence === 'weekly' && selectedDays && selectedDays.length > 0) {
                        await deleteFutureTasks(editingTask);
    
                        const referenceDate = new Date(editingTask.date);
                        referenceDate.setMinutes(referenceDate.getMinutes() + referenceDate.getTimezoneOffset());
                        
                        const numWeeks = parseInt(recurrenceWeeks || '4', 10);
                        const tasksToCreate: Omit<KanbanTask, 'id' | 'status'>[] = [];
                        
                        const startOfWeek = new Date(referenceDate);
                        const dayOfWeek = referenceDate.getDay();
                        const diff = referenceDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
                        startOfWeek.setDate(diff);
    
                        for (let week = 0; week < numWeeks; week++) {
                            const currentWeekStart = new Date(startOfWeek);
                            currentWeekStart.setDate(startOfWeek.getDate() + week * 7);
    
                            selectedDays.forEach(dayIndexStr => {
                                const dayIndex = parseInt(dayIndexStr, 10);
                                const taskDate = new Date(currentWeekStart);
                                
                                if (dayIndex === 0) { // Sunday
                                    taskDate.setDate(currentWeekStart.getDate() + 6);
                                } else { // Monday-Saturday
                                    taskDate.setDate(currentWeekStart.getDate() + (dayIndex - 1));
                                }
                                
                                // Only add dates that are on or after the reference date
                                if (taskDate.getTime() >= referenceDate.getTime()) {
                                    taskDate.setMinutes(taskDate.getMinutes() - taskDate.getTimezoneOffset());
                                    tasksToCreate.push({
                                        ...commonData,
                                        date: taskDate.toISOString().split('T')[0],
                                    });
                                }
                            });
                        }
                        await addMultipleTasks(tasksToCreate);
    
                    } else {
                        // User is just updating data for all future tasks, NOT changing the pattern
                        const { date, time, ...futureUpdates } = commonData;
                        await updateFutureTasks(editingTask, futureUpdates);
                    }
    
                } else { // 'single' edit mode for a recurring or non-recurring task
                    // If it was a recurring task, we create an exception by removing the recurrenceId.
                    const { recurrenceId, ...originalTask } = editingTask;
                    const updatedTaskData: KanbanTask = {
                        ...originalTask,
                        ...commonData,
                        id: existingTaskId,
                    };
                    // If it was a non-recurring task, `recurrenceId` was already undefined.
                    await updateTask(updatedTaskData);
                }
            } else {
                // ADDING NEW
                const referenceDate = new Date(commonData.date);
                referenceDate.setMinutes(referenceDate.getMinutes() + referenceDate.getTimezoneOffset());
    
                if (recurrence === 'weekly' && selectedDays && selectedDays.length > 0) {
                    const numWeeks = parseInt(recurrenceWeeks || '4', 10);
                    const tasksToCreate: Omit<KanbanTask, 'id' | 'status'>[] = [];
                    
                    const startOfWeek = new Date(referenceDate);
                    const dayOfWeek = referenceDate.getDay();
                    const diff = referenceDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
                    startOfWeek.setDate(diff);
    
                    for (let week = 0; week < numWeeks; week++) {
                        const currentWeekStart = new Date(startOfWeek);
                        currentWeekStart.setDate(startOfWeek.getDate() + week * 7);
    
                        selectedDays.forEach(dayIndexStr => {
                            const dayIndex = parseInt(dayIndexStr, 10);
                            const taskDate = new Date(currentWeekStart);
                            
                            if (dayIndex === 0) { // Sunday
                                taskDate.setDate(currentWeekStart.getDate() + 6);
                            } else { // Monday-Saturday
                                taskDate.setDate(currentWeekStart.getDate() + (dayIndex - 1));
                            }
                            
                            taskDate.setMinutes(taskDate.getMinutes() - taskDate.getTimezoneOffset());
                            
                            tasksToCreate.push({
                                ...commonData,
                                date: taskDate.toISOString().split('T')[0],
                            });
                        });
                    }
                    await addMultipleTasks(tasksToCreate);
                } else {
                    await addTask(commonData);
                }
            }
            handleCloseModal();
        } catch (error) {
            console.error("Error saving task:", error);
            // In a real app, you might want to show a toast notification to the user here.
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = (task: KanbanTask) => {
        setIsModalOpen(false);
        setEditingTask(null);

        if (task.recurrenceId) {
            setRecurrenceModalType('delete');
            setTaskForRecurrenceModal(task);
        } else {
            promptForPin(() => deleteTask(task.id));
        }
    };

    // Handlers for the EditOptionsModal (Edit)
    const handleEditThisOne = () => {
        if (!taskForRecurrenceModal) return;
        setEditMode('single');
        setEditingTask(taskForRecurrenceModal);
        setIsModalOpen(true);
        setTaskForRecurrenceModal(null);
        setRecurrenceModalType(null);
    };

    const handleEditFuture = () => {
        if (!taskForRecurrenceModal) return;
        setEditMode('future');
        setEditingTask(taskForRecurrenceModal);
        setIsModalOpen(true);
        setTaskForRecurrenceModal(null);
        setRecurrenceModalType(null);
    };

    // Handlers for the EditOptionsModal (Delete)
    const handleDeleteThisOne = () => {
        if (!taskForRecurrenceModal) return;
        promptForPin(() => {
            // To delete just one, we detach it from the series first by removing the ID,
            // then we can delete it without a cascading effect.
            // A simpler way is just to delete it directly, since our delete function works by ID.
             deleteTask(taskForRecurrenceModal.id)
        });
        setTaskForRecurrenceModal(null);
        setRecurrenceModalType(null);
    };

    const handleDeleteFuture = () => {
        if (!taskForRecurrenceModal) return;
        promptForPin(() => deleteFutureTasks(taskForRecurrenceModal));
        setTaskForRecurrenceModal(null);
        setRecurrenceModalType(null);
    };

    // PIN Modal Logic
    const promptForPin = (action: () => void) => {
        setPinProtectedAction(() => action);
        setIsPinModalOpen(true);
        setPinInput('');
        setPinError('');
    };

    const handlePinConfirm = () => {
        if (pinInput === OPERATIONS_PIN) {
            pinProtectedAction?.();
            setIsPinModalOpen(false);
            setPinProtectedAction(null);
        } else {
            setPinError('PIN incorrecto. Inténtalo de nuevo.');
            setPinInput('');
        }
    };

    const selectedDateStr = useMemo(() => {
        const d = new Date(selectedDate);
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        return d.toISOString().split('T')[0];
    }, [selectedDate]);

    const dailyTasks = useMemo(() => {
        return tasks.filter(task => {
            const isSameDay = task.date === selectedDateStr;
            const matchesEmployee = employeeFilter === 'All' || task.employee === employeeFilter;
            return isSameDay && matchesEmployee;
        });
    }, [tasks, selectedDateStr, employeeFilter]);
    
    return (
        <div className="flex flex-col h-full bg-gray-50">
            {criticalTasks.length > 0 && <CriticalTasksBar tasksWithDiff={criticalTasks} />}

            <div className="operations-header flex flex-col p-4 border-b border-gray-200 gap-4 flex-shrink-0">
                <div className="flex flex-col md:flex-row justify-between items-center w-full gap-4">
                     <WeekdaySelector selectedDate={selectedDate} setSelectedDate={setSelectedDate} />
                     <div className="flex gap-2 w-full md:w-auto">
                        <button onClick={() => { setEditMode('new'); setEditingTask(null); setIsModalOpen(true); }} className="flex items-center gap-2 bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm w-full justify-center">
                            <Icon name="plus-circle" size={16} />
                            Añadir Tarea
                        </button>
                    </div>
                </div>
                <div className="flex items-center gap-2 bg-gray-200 rounded-lg p-1 w-full overflow-x-auto">
                    <button 
                        onClick={() => setEmployeeFilter('All')}
                        className={`px-3 py-1 text-sm font-bold rounded-md transition-colors ${employeeFilter === 'All' ? 'bg-white shadow-sm' : 'bg-transparent text-gray-600'}`}
                    >
                        Todos
                    </button>
                    {users.map(user => (
                         <button 
                            key={user.id}
                            onClick={() => setEmployeeFilter(user.name)}
                            className={`px-3 py-1 text-sm font-bold rounded-md transition-colors ${employeeFilter === user.name ? 'bg-white shadow-sm' : 'bg-transparent text-gray-600'}`}
                        >
                            {user.name}
                        </button>
                    ))}
                </div>
            </div>
            
            <div className="flex-grow overflow-auto relative">
                <DailyAgendaView 
                    tasks={dailyTasks} 
                    onEditTask={handleEdit} 
                    onUpdateStatus={updateTaskStatus}
                    onUpdateTask={updateTask}
                    users={users}
                />
            </div>

            <TaskFormModal 
                isOpen={isModalOpen} 
                onClose={handleCloseModal} 
                onSave={handleSaveTask}
                onDelete={handleDelete}
                task={editingTask}
                selectedDate={selectedDateStr}
                users={users}
                editMode={editMode}
                isSaving={isSaving}
                allTasks={tasks}
            />

             <EditOptionsModal
                isOpen={!!taskForRecurrenceModal}
                onClose={() => setTaskForRecurrenceModal(null)}
                onSelectThisOne={recurrenceModalType === 'edit' ? handleEditThisOne : handleDeleteThisOne}
                onSelectFuture={recurrenceModalType === 'edit' ? handleEditFuture : handleDeleteFuture}
                isDelete={recurrenceModalType === 'delete'}
            />

            {isPinModalOpen && (
                <Modal isOpen={isPinModalOpen} onClose={() => setIsPinModalOpen(false)} title="Confirmar Acción">
                    <div className="text-center">
                        <h4 className="font-bold text-lg text-gray-800">Acción Protegida</h4>
                        <p className="text-sm text-gray-600 mt-2 mb-4">Para continuar, introduce el PIN de operaciones.</p>
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
                            <button onClick={() => setIsPinModalOpen(false)} className="flex-1 py-2 px-4 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300">
                                Cancelar
                            </button>
                            <button onClick={handlePinConfirm} className="flex-1 py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700">
                                Confirmar
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default OperationsScreen;
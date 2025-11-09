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
import PendingTasksList from './PendingTasksList';

interface OperationsScreenProps {
    kanbanHook: ReturnType<typeof useKanban>;
    criticalTasks: { task: KanbanTask; diff: number }[];
    users: User[];
    selectedDate: Date;
    setSelectedDate: (date: Date) => void;
    highlightedTaskId: string | null;
    setHighlightedTaskId: (id: string | null) => void;
}

export type EditMode = 'new' | 'single' | 'future';
type OperationsView = 'agenda' | 'pending';

const OperationsScreen: React.FC<OperationsScreenProps> = ({ kanbanHook, criticalTasks, users, selectedDate, setSelectedDate, highlightedTaskId, setHighlightedTaskId }) => {
    const { tasks, addTask, addMultipleTasks, updateTask, updateTaskStatus, deleteTask, updateFutureTasks, deleteFutureTasks, reorderDailyTasks } = kanbanHook;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<KanbanTask | null>(null);
    const [employeeFilter, setEmployeeFilter] = useState<string>('All');
    const [activeView, setActiveView] = useState<OperationsView>('agenda');

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
                 if (!commonData.date) { // This is an unplanned task being updated
                    await updateTask({ ...commonData, id: existingTaskId, status: editingTask.status });
                 } else if (editMode === 'future') {
                     // User is creating a NEW recurrence pattern from this point forward
                    if (recurrence === 'weekly' && selectedDays && selectedDays.length > 0) {
                        await deleteFutureTasks(editingTask);
    
                        const referenceDate = new Date(editingTask.date!);
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
                if (!commonData.date) { // Unplanned task
                     await addTask(commonData);
                } else { // Planned task
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
            }
            handleCloseModal();
        } catch (error) {
            console.error("Error saving task:", error);
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

    const handleDeleteThisOne = () => {
        if (!taskForRecurrenceModal) return;
        promptForPin(() => deleteTask(taskForRecurrenceModal.id));
        setTaskForRecurrenceModal(null);
        setRecurrenceModalType(null);
    };

    const handleDeleteFuture = () => {
        if (!taskForRecurrenceModal) return;
        promptForPin(() => deleteFutureTasks(taskForRecurrenceModal));
        setTaskForRecurrenceModal(null);
        setRecurrenceModalType(null);
    };

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

    const filteredTasks = useMemo(() => {
        return tasks.filter(task => employeeFilter === 'All' || task.employee === employeeFilter);
    }, [tasks, employeeFilter]);

    const dailyTasks = useMemo(() => {
        return filteredTasks.filter(task => task.date === selectedDateStr);
    }, [filteredTasks, selectedDateStr]);
    
    const pendingTasks = useMemo(() => {
        return filteredTasks.filter(task => !task.date);
    }, [filteredTasks]);
    
    const TabButton: React.FC<{ view: OperationsView, label: string, mobileLabel: string, icon: 'calendar' | 'clipboard-list', count: number }> = ({ view, label, mobileLabel, icon, count }) => (
        <button
            onClick={() => setActiveView(view)}
            className={`flex items-center gap-2 py-2 px-3 md:px-4 text-sm font-bold border-b-4 transition-colors ${activeView === view ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
        >
            <Icon name={icon} size={18} />
            <span className="hidden md:inline">{label}</span>
            <span className="md:hidden">{mobileLabel}</span>
            {count > 0 && <span className="ml-1 text-xs bg-gray-300 text-gray-700 font-bold rounded-full px-2">{count}</span>}
        </button>
    );

    return (
        <div className="flex flex-col h-full bg-gray-50">
            {criticalTasks.length > 0 && <CriticalTasksBar tasksWithDiff={criticalTasks} />}

            <div className="operations-header flex flex-col p-4 border-b border-gray-200 gap-4 flex-shrink-0">
                <div className="flex justify-between items-center w-full">
                    <div className="flex">
                        <TabButton view="agenda" label="Agenda Diaria" mobileLabel="Agenda" icon="calendar" count={0} />
                        <TabButton view="pending" label="Tareas Pendientes" mobileLabel="Pendientes" icon="clipboard-list" count={pendingTasks.length} />
                    </div>
                    <div className="flex-shrink-0">
                        <button 
                            onClick={() => { setEditMode('new'); setEditingTask(null); setIsModalOpen(true); }} 
                            className="flex items-center justify-center bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors text-sm w-10 h-10 md:w-auto md:h-auto md:py-2 md:px-3"
                        >
                            <Icon name="plus-circle" size={20} />
                            <span className="hidden md:inline ml-2">Añadir Tarea</span>
                        </button>
                    </div>
                </div>
                {activeView === 'agenda' && (
                    <WeekdaySelector 
                        selectedDate={selectedDate} 
                        setSelectedDate={setSelectedDate} 
                        tasks={tasks}
                        users={users}
                        employeeFilter={employeeFilter}
                    />
                )}
                <div className="flex items-center gap-2 bg-gray-200 rounded-lg p-1 w-full overflow-x-auto">
                    <button 
                        onClick={() => setEmployeeFilter('All')}
                        className={`px-3 py-1 text-sm font-bold rounded-md transition-colors whitespace-nowrap ${employeeFilter === 'All' ? 'bg-white shadow-sm' : 'bg-transparent text-gray-600'}`}
                    >
                        Todos
                    </button>
                    {users.map(user => (
                         <button 
                            key={user.id}
                            onClick={() => setEmployeeFilter(user.name)}
                            className={`px-3 py-1 text-sm font-bold rounded-md transition-colors whitespace-nowrap ${employeeFilter === user.name ? 'bg-white shadow-sm' : 'bg-transparent text-gray-600'}`}
                        >
                            {user.name}
                        </button>
                    ))}
                </div>
            </div>
            
            <div className="flex-grow overflow-auto relative">
                {activeView === 'agenda' ? (
                    <DailyAgendaView 
                        tasks={dailyTasks} 
                        onEditTask={handleEdit} 
                        onUpdateStatus={updateTaskStatus}
                        onUpdateTask={updateTask}
                        onReorderTasks={reorderDailyTasks}
                        users={users}
                        highlightedTaskId={highlightedTaskId}
                        setHighlightedTaskId={setHighlightedTaskId}
                    />
                ) : (
                    <PendingTasksList
                        tasks={pendingTasks}
                        onEditTask={handleEdit}
                        users={users}
                    />
                )}
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
import React, { useState, useMemo } from 'react';
import { KanbanTask, User } from '../../types';
import TaskFormModal, { TaskSubmitPayload } from './TaskFormModal';
import { useKanban } from '../../services/useKanban';
import Icon from '../../components/Icon';
import WeekdaySelector from './WeekdaySelector';
import DailyAgendaView from './DailyAgendaView';
import CriticalTasksBar from './CriticalTasksBar';

interface OperationsScreenProps {
    kanbanHook: ReturnType<typeof useKanban>;
    criticalTasks: { task: KanbanTask; diff: number }[];
    users: User[];
}

const OperationsScreen: React.FC<OperationsScreenProps> = ({ kanbanHook, criticalTasks, users }) => {
    const { tasks, addTask, addMultipleTasks, updateTask, updateTaskStatus, deleteTask } = kanbanHook;
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<KanbanTask | null>(null);
    const [employeeFilter, setEmployeeFilter] = useState<string>('All');

    const handleEdit = (task: KanbanTask) => {
        setEditingTask(task);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingTask(null);
    };

    const handleSaveTask = (formData: TaskSubmitPayload, existingTaskId?: string) => {
        const { recurrence, selectedDays, recurrenceWeeks, ...commonData } = formData;
    
        if (existingTaskId) {
            // EDITING - Recurrence options are disabled in the modal, so we only update the single task.
            const originalTask = tasks.find(t => t.id === existingTaskId);
            if (!originalTask) return;
    
            const updatedTaskData: KanbanTask = {
                ...originalTask,
                ...commonData,
                id: existingTaskId,
            };
            updateTask(updatedTaskData);
    
        } else {
            // ADDING NEW
            const referenceDate = new Date(commonData.date);
            referenceDate.setMinutes(referenceDate.getMinutes() + referenceDate.getTimezoneOffset());

            if (recurrence === 'weekly' && selectedDays && selectedDays.length > 0) {
                const numWeeks = parseInt(recurrenceWeeks || '4', 10);
                const tasksToCreate: Omit<KanbanTask, 'id' | 'status'>[] = [];
                
                // Find the start of the reference week (Monday)
                const startOfWeek = new Date(referenceDate);
                const dayOfWeek = referenceDate.getDay(); // Sunday: 0, Monday: 1, etc.
                const diff = referenceDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
                startOfWeek.setDate(diff);

                // Iterate for the selected number of weeks
                for (let week = 0; week < numWeeks; week++) {
                    const currentWeekStart = new Date(startOfWeek);
                    currentWeekStart.setDate(startOfWeek.getDate() + week * 7);

                    selectedDays.forEach(dayIndexStr => {
                        const dayIndex = parseInt(dayIndexStr, 10);
                        const taskDate = new Date(currentWeekStart);
                        
                        // dayIndex from form: Sunday: 0, Monday: 1, ... Saturday: 6
                        // We calculated week start as Monday, so adjust accordingly.
                        if (dayIndex === 0) { // Sunday
                            taskDate.setDate(currentWeekStart.getDate() + 6);
                        } else { // Monday-Saturday
                            taskDate.setDate(currentWeekStart.getDate() + (dayIndex - 1));
                        }
                        
                        // Apply timezone offset to each created date
                        taskDate.setMinutes(taskDate.getMinutes() - taskDate.getTimezoneOffset());
                        
                        tasksToCreate.push({
                            ...commonData,
                            date: taskDate.toISOString().split('T')[0],
                        });
                    });
                }
                addMultipleTasks(tasksToCreate);
            } else {
                addTask(commonData);
            }
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
                        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm w-full justify-center">
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
                onDelete={deleteTask}
                task={editingTask}
                selectedDate={selectedDateStr}
                users={users}
            />
        </div>
    );
};

export default OperationsScreen;
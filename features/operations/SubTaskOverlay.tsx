
import React, { useState, KeyboardEvent } from 'react';
import { KanbanTask, Subtask } from '../../types';
import Icon from '../../components/Icon';

interface SubtaskOverlayProps {
    task: KanbanTask;
    onClose: () => void;
    onUpdateTask: (updatedTask: KanbanTask) => void;
}

const SubTaskOverlay: React.FC<SubtaskOverlayProps> = ({ task, onClose, onUpdateTask }) => {
    const [newSubtaskText, setNewSubtaskText] = useState('');

    const handleSubtaskToggle = (subtaskId: string) => {
        const updatedSubtasks = (task.subtasks || []).map(st =>
            st.id === subtaskId ? { ...st, isCompleted: !st.isCompleted } : st
        );
        onUpdateTask({ ...task, subtasks: updatedSubtasks });
    };

    const handleAddSubtask = () => {
        if (newSubtaskText.trim() === '') return;
        const newSubtask: Subtask = {
            id: `sub-${Date.now()}`,
            text: newSubtaskText.trim(),
            isCompleted: false,
        };
        const updatedSubtasks = [...(task.subtasks || []), newSubtask];
        onUpdateTask({ ...task, subtasks: updatedSubtasks });
        setNewSubtaskText('');
    };

    const handleDeleteSubtask = (subtaskId: string) => {
        const updatedSubtasks = (task.subtasks || []).filter(st => st.id !== subtaskId);
        onUpdateTask({ ...task, subtasks: updatedSubtasks });
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddSubtask();
        }
    };

    const completedCount = task.subtasks?.filter(st => st.isCompleted).length || 0;
    const totalCount = task.subtasks?.length || 0;
    const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

    return (
        <div
            className="fixed inset-0 bg-gray-900/60 z-[60] flex justify-center items-center p-4 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-xl shadow-2xl w-full max-w-md flex flex-col animate-fadeIn"
                onClick={(e) => e.stopPropagation()}
            >
                <header className="p-4 border-b">
                    <h3 className="font-bold text-lg text-blue-700">{task.text}</h3>
                    <p className="text-sm text-gray-500">{task.time} - {task.employee}</p>
                </header>

                <div className="p-4 flex-grow overflow-y-auto max-h-[60vh]">
                    {task.notes && task.notes.trim() !== '' && (
                        <div className="mb-4">
                            <h4 className="font-bold text-gray-700 mb-2">Notas</h4>
                            <div className="p-3 bg-yellow-50 border-l-4 border-yellow-400 text-gray-800 text-sm rounded-r-lg whitespace-pre-wrap">
                                {task.notes}
                            </div>
                        </div>
                    )}
                    
                    {totalCount > 0 && (
                        <div className="mb-4">
                            <div className="flex justify-between items-center text-sm mb-1">
                                <span className="font-semibold text-gray-600">Progreso de Subtareas</span>
                                <span>{completedCount} / {totalCount}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                            </div>
                        </div>
                    )}

                    <div className="space-y-2">
                        {(task.subtasks || []).map(subtask => (
                            <div key={subtask.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-md group transition-colors hover:bg-gray-100">
                                <input
                                    type="checkbox"
                                    checked={subtask.isCompleted}
                                    onChange={() => handleSubtaskToggle(subtask.id)}
                                    className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 flex-shrink-0 cursor-pointer"
                                />
                                <span className={`flex-grow text-gray-800 ${subtask.isCompleted ? 'line-through text-gray-400' : ''}`}>
                                    {subtask.text}
                                </span>
                                <button
                                    onClick={() => handleDeleteSubtask(subtask.id)}
                                    className="p-1 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Icon name="trash-2" size={16} />
                                </button>
                            </div>
                        ))}
                    </div>

                    {totalCount === 0 && (!task.notes || task.notes.trim() === '') && (
                        <p className="text-center text-gray-500 py-6">No hay subtareas ni notas. ¡Añade la primera!</p>
                    )}
                </div>

                <div className="p-4 border-t bg-gray-50 rounded-b-xl">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newSubtaskText}
                            onChange={(e) => setNewSubtaskText(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Añadir nueva subtarea..."
                            className="w-full p-2 border border-gray-300 rounded-md bg-white text-sm focus:ring-2 focus:ring-blue-500"
                        />
                        <button onClick={handleAddSubtask} className="py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 text-sm">Añadir</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SubTaskOverlay;

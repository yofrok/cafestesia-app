
import React from 'react';
import { Screen, KanbanTask, InventoryItem, ProductionProcess, User } from '../types';
import Icon from './Icon';

interface SidebarProps {
    activeScreen: Screen;
    setActiveScreen: (screen: Screen) => void;
    processes: ProductionProcess[];
    urgentTasks: { task: KanbanTask; diff: number }[];
    shoppingListItems: InventoryItem[];
    inProgressTasks: KanbanTask[];
    isOpen: boolean;
    onClose: () => void;
    users: User[];
    onNavigateToTask: (task: KanbanTask) => void;
    setOperationsDate: (date: Date) => void;
    setHighlightedTaskId: (id: string | null) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeScreen, setActiveScreen, processes, urgentTasks, shoppingListItems, inProgressTasks, isOpen, onClose, users, onNavigateToTask, setOperationsDate, setHighlightedTaskId }) => {

    const handleNavClick = (screen: Screen) => {
        if (screen === Screen.Operations) {
            setOperationsDate(new Date());
            setHighlightedTaskId(null);
        }
        setActiveScreen(screen);
        onClose();
    };

    const handleInProgressTaskClick = (task: KanbanTask) => {
        onNavigateToTask(task);
        onClose();
    };

    const handleNotifyClick = (e: React.MouseEvent, task: KanbanTask, user: User) => {
        e.stopPropagation(); // Don't trigger the main widget click
        if (!user.phone) return;
        const message = `Hola ${user.name}, tienes una tarea crítica: "${task.text}" programada para las ${task.time}.`;
        const whatsappUrl = `https://wa.me/${user.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    };
    
    const NavButton: React.FC<{ active: boolean, onClick: () => void, children: React.ReactNode }> = ({ active, onClick, children }) => {
        const base = "w-full flex items-center gap-4 p-4 rounded-lg font-bold text-left cursor-pointer transition-all duration-200";
        const classes = active ? `${base} bg-blue-600 text-white` : `${base} text-gray-500 hover:bg-gray-100 hover:text-gray-900`;
        return <button onClick={onClick} className={classes}>{children}</button>;
    };

    const AlertWidget: React.FC<{ title: string; children: React.ReactNode; onClick: () => void; isAlarm?: boolean; }> = ({ title, children, onClick, isAlarm }) => (
        <div className="mb-4">
            <h3 className={`text-xs uppercase font-bold mb-2 px-2 ${isAlarm ? 'text-red-600 animate-pulse' : 'text-blue-600'}`}>{title}</h3>
            <button
                onClick={onClick}
                className={`w-full text-left p-3 rounded-lg transition-colors border ${isAlarm ? 'bg-red-50 border-red-400 hover:bg-red-100' : 'bg-gray-100 border-gray-200 hover:bg-gray-200'}`}
            >
                {children}
            </button>
        </div>
    );

    const activeProcesses = processes.filter(p => p.state !== 'finished');
    const isBakingRelated = activeScreen === Screen.Baking;

    const sidebarClasses = `
        sidebar-nav flex flex-col bg-white p-4 border-r border-gray-200 overflow-y-auto 
        fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out 
        md:relative md:w-auto md:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
    `;

    return (
        <nav className={sidebarClasses}>
            <header className="sidebar-header text-center mb-6 pt-4 flex-shrink-0">
                <h1 className="text-2xl font-bold text-blue-600">Cafestesia</h1>
                <span className="text-sm text-gray-500">Gestor v2.1 (React)</span>
            </header>

            <div className="flex-grow">
                {activeProcesses.length > 0 && (
                    <div className="mb-4">
                        <h3 className="text-xs uppercase font-bold mb-2 px-2 text-blue-600">EN PRODUCCIÓN ({activeProcesses.length})</h3>
                        <div className="flex flex-col gap-2">
                             {activeProcesses.map(process => {
                                 const isAlarm = process.state === 'alarm';
                                 return (
                                     <button
                                         key={process.id}
                                         onClick={() => handleNavClick(Screen.Baking)}
                                         className={`w-full text-left p-2 rounded-lg transition-all border shadow-sm flex items-center gap-3 font-bold text-xs ${
                                             isAlarm 
                                             ? 'bg-red-50 border-red-400 hover:bg-red-100 text-red-900 animate-pulse' 
                                             : 'bg-white border-gray-200 hover:bg-blue-50 hover:border-blue-300 text-gray-700'
                                         }`}
                                     >
                                         <Icon 
                                             name={isAlarm ? 'bell' : 'cake-slice'} 
                                             className={isAlarm ? 'text-red-500' : 'text-blue-500'} 
                                             size={16} 
                                         />
                                         <span className="truncate">{process.name}</span>
                                     </button>
                                 )
                             })}
                        </div>
                    </div>
                )}

                {inProgressTasks.length > 0 && (
                    <div className="mb-4">
                        <h3 className="text-xs uppercase font-bold mb-2 px-2 text-blue-600">Tareas en Progreso</h3>
                        <div className="space-y-1">
                            {inProgressTasks.slice(0, 3).map(task => (
                                <button
                                    key={task.id}
                                    onClick={() => handleInProgressTaskClick(task)}
                                    className="w-full text-left p-2 rounded-lg transition-colors border-2 bg-yellow-50 animate-pulse-yellow hover:bg-yellow-100"
                                    title={`Ver tarea: ${task.text}`}
                                >
                                    <div className="flex items-center gap-2 text-sm text-gray-800">
                                        <Icon name="play-circle" className="text-yellow-600 flex-shrink-0 animate-pulse" size={18} />
                                        <div className="flex-grow min-w-0">
                                            <p className="font-bold truncate">{task.text}</p>
                                            <p className="text-xs font-normal text-gray-600">{task.employee} - {task.date}</p>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}


                {urgentTasks.length > 0 && (
                     <AlertWidget title="Operaciones Urgentes" onClick={() => handleNavClick(Screen.Operations)}>
                        {urgentTasks.map(({ task, diff }) => {
                            const user = users.find(u => u.name === task.employee);
                            return (
                                <div key={task.id} className="text-sm mb-2 last:mb-0">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-grow">
                                            <p className="font-bold text-gray-800">{task.text}</p>
                                            <p className={`text-xs font-semibold ${diff <= 0 ? 'text-red-600 animate-pulse' : 'text-blue-600'}`}>
                                                {task.time} {diff <= 0 ? '(¡AHORA!)' : `(en ${diff} min)`}
                                            </p>
                                        </div>
                                        {user?.phone && (
                                            <button
                                                onClick={(e) => handleNotifyClick(e, task, user)}
                                                className="p-2 -mr-2 -mt-1 text-green-600 hover:bg-green-100 rounded-full transition-colors flex-shrink-0"
                                                title={`Notificar a ${user.name} por WhatsApp`}
                                            >
                                                <Icon name="whatsapp" size={20} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </AlertWidget>
                )}

                {shoppingListItems.length > 0 && (
                    <AlertWidget title="Inventario Crítico" onClick={() => handleNavClick(Screen.Inventory)}>
                        <div className="flex items-center gap-3 font-bold text-sm text-gray-800">
                           <Icon name="shopping-cart" className="text-red-500" size={20} />
                           <span>{shoppingListItems.length > 1 ? `${shoppingListItems.length} productos` : '1 producto'} en la lista de compras</span>
                        </div>
                    </AlertWidget>
                )}
            </div>

            <div className="nav-buttons flex flex-col gap-2 mt-auto flex-shrink-0">
                <NavButton active={isBakingRelated} onClick={() => handleNavClick(Screen.Baking)}>
                    <Icon name="cake-slice" size={20} />
                    <span>Producción de Pan</span>
                </NavButton>
                <NavButton active={activeScreen === Screen.Operations} onClick={() => handleNavClick(Screen.Operations)}>
                    <Icon name="clipboard-kanban" size={20} />
                    <span>Operaciones</span>
                </NavButton>
                <NavButton active={activeScreen === Screen.Inventory} onClick={() => handleNavClick(Screen.Inventory)}>
                    <Icon name="archive" size={20} />
                    <span>Inventario</span>
                </NavButton>
                <NavButton active={activeScreen === Screen.Settings} onClick={() => handleNavClick(Screen.Settings)}>
                    <Icon name="settings" size={20} />
                    <span>Configuración</span>
                </NavButton>
            </div>
        </nav>
    );
};

export default Sidebar;

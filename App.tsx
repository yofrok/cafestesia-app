import React, { useState, useEffect, useMemo, useRef, lazy, Suspense } from 'react';
import { Screen } from './types';
import Sidebar from './components/Sidebar';
import { useKanban } from './services/useKanban';
import { useInventory } from './services/useInventory';
import { useProviders } from './services/useProviders';
import { useProduction } from './features/baking/useProduction';
import { useCategories } from './services/useCategories';
import { useRecipeLog } from './services/useRecipeLog';
import { useAudioAlerts } from './services/useAudioAlerts';
import Icon from './components/Icon';
import { useUsers } from './services/useUsers';

// --- Code Splitting ---
const BreadProductionScreen = lazy(() => import('./features/baking/BreadProductionScreen'));
const OperationsScreen = lazy(() => import('./features/operations/OperationsScreen'));
const InventoryScreen = lazy(() => import('./features/inventory/InventoryScreen'));
const SettingsScreen = lazy(() => import('./features/settings/SettingsScreen'));

type TimeStatus = 'due' | 'imminent' | 'normal';

const calculateTimeDifference = (taskTime: string) => {
    const now = new Date();
    const [hours, minutes] = taskTime.split(':').map(Number);
    const taskDateTime = new Date();
    taskDateTime.setHours(hours, minutes, 0, 0);
    return Math.round((taskDateTime.getTime() - now.getTime()) / 1000 / 60);
};

const LoadingFallback = () => (
    <div className="w-full h-full flex items-center justify-center">
        <Icon name="refresh-cw" className="animate-spin text-blue-500" size={48} />
    </div>
);


const App: React.FC = () => {
    const [activeScreen, setActiveScreen] = useState<Screen>(Screen.Baking);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    // Centralized Hooks
    const productionHook = useProduction();
    const kanbanHook = useKanban();
    const inventoryHook = useInventory();
    const providersHook = useProviders();
    const categoriesHook = useCategories();
    const recipeLogHook = useRecipeLog();
    const usersHook = useUsers();
    const { playAlert } = useAudioAlerts();
    
    const { processes } = productionHook;
    const { tasks } = kanbanHook;
    const { items } = inventoryHook;
    
    // Time-aware logic for tasks
    const [timeAwareTasks, setTimeAwareTasks] = useState<Record<string, { diff: number; status: TimeStatus }>>({});

    const todayStr = useMemo(() => {
         const today = new Date();
         today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
         return today.toISOString().split('T')[0];
    }, []);

    useEffect(() => {
        const checkTasksTime = () => {
            const newTimeAwareTasks: Record<string, { diff: number; status: TimeStatus }> = {};
            tasks.forEach(task => {
                if (task.date === todayStr && task.status !== 'done') {
                    const diff = calculateTimeDifference(task.time);
                    let status: TimeStatus = 'normal';
                     // This status is for Kanban card pulsing, not the same as critical logic
                    if (diff <= 0) {
                        status = 'due';
                    } else if (diff <= 15) { 
                        status = 'imminent';
                    }
                    newTimeAwareTasks[task.id] = { diff, status };
                }
            });
            setTimeAwareTasks(newTimeAwareTasks);
        };

        checkTasksTime();
        const interval = setInterval(checkTasksTime, 10000);
        return () => clearInterval(interval);
    }, [tasks, todayStr]);

    // Memoized derived state for alerts
    const criticalAndUpcomingTasks = useMemo(() => {
        const CRITICAL_WINDOW_START_MINS = 30;
        const CRITICAL_WINDOW_END_MINS = -15;

        return tasks
            .filter(t => t.date === todayStr && t.isCritical && t.status !== 'done' && timeAwareTasks[t.id])
            .map(t => ({ task: t, diff: timeAwareTasks[t.id].diff }))
            .filter(({ diff }) => diff <= CRITICAL_WINDOW_START_MINS && diff >= CRITICAL_WINDOW_END_MINS)
            .sort((a, b) => a.diff - b.diff);
    }, [tasks, timeAwareTasks, todayStr]);

    // Audio Alert Logic for Kanban tasks
    const playedAlerts = useRef(new Set<string>());

    useEffect(() => {
        const currentCriticalIds = new Set(criticalAndUpcomingTasks.map(t => `task-${t.task.id}`));
        currentCriticalIds.forEach(id => {
            if (!playedAlerts.current.has(id)) {
                playAlert();
                playedAlerts.current.add(id);
            }
        });
        // Clean up alerts for tasks that are no longer critical
        playedAlerts.current.forEach(id => {
            if (id.startsWith('task-') && !currentCriticalIds.has(id)) {
                playedAlerts.current.delete(id);
            }
        });
    }, [criticalAndUpcomingTasks, playAlert]);


    const sidebarCriticalTasks = useMemo(() => {
        return criticalAndUpcomingTasks.slice(0, 3);
    }, [criticalAndUpcomingTasks]);

    const inProgressTasks = useMemo(() => {
        return tasks.filter(t => t.status === 'inprogress');
    }, [tasks]);


    const shoppingListItems = useMemo(() => {
        return items.filter(item => item.currentStock <= item.minStock);
    }, [items]);

    const renderScreen = () => {
        switch (activeScreen) {
            case Screen.Baking:
                return <BreadProductionScreen productionHook={productionHook} recipeLogHook={recipeLogHook} />;
            case Screen.Operations:
                return <OperationsScreen kanbanHook={kanbanHook} criticalTasks={criticalAndUpcomingTasks} users={usersHook.users} />;
            case Screen.Inventory:
                return <InventoryScreen 
                            inventoryHook={inventoryHook} 
                            providers={providersHook.providers}
                            categories={categoriesHook.categories} 
                       />;
            case Screen.Settings:
                return <SettingsScreen 
                            providersHook={providersHook}
                            categoriesHook={categoriesHook}
                            recipeLogHook={recipeLogHook}
                            usersHook={usersHook}
                       />;
            default:
                return <BreadProductionScreen productionHook={productionHook} recipeLogHook={recipeLogHook} />;
        }
    };

    const getTitle = () => {
        switch (activeScreen) {
            case Screen.Baking:
                return 'Producción de Pan';
            case Screen.Operations:
                return 'Operaciones';
            case Screen.Inventory:
                return 'Inventario';
            case Screen.Settings:
                return 'Configuración';
            default:
                return 'Cafestesia';
        }
    };
    
    return (
        <div className="w-full min-h-screen md:p-4 flex items-center justify-center bg-gray-100 text-gray-800">
            <div className="app-container w-full h-screen max-w-5xl bg-white md:rounded-xl shadow-lg overflow-hidden relative border border-gray-200">
                
                {isMobileSidebarOpen && (
                    <div
                        className="md:hidden fixed inset-0 bg-black/60 z-40"
                        onClick={() => setIsMobileSidebarOpen(false)}
                        aria-hidden="true"
                    ></div>
                )}
                
                <div className="grid md:grid-cols-[240px_1fr] h-full">
                    <Sidebar 
                        activeScreen={activeScreen} 
                        setActiveScreen={setActiveScreen}
                        processes={processes}
                        urgentTasks={sidebarCriticalTasks}
                        shoppingListItems={shoppingListItems}
                        inProgressTasks={inProgressTasks}
                        isOpen={isMobileSidebarOpen}
                        onClose={() => setIsMobileSidebarOpen(false)}
                    />

                    <main className="main-content flex flex-col overflow-y-auto h-full">
                         <header className="main-content-header p-4 md:p-6 border-b border-gray-200 flex justify-between items-center flex-shrink-0">
                            <button className="md:hidden p-2 -ml-2 text-gray-600 hover:text-blue-600" onClick={() => setIsMobileSidebarOpen(true)}>
                                <Icon name="menu" size={24} />
                            </button>
                            <h2 className="text-xl md:text-3xl font-bold text-blue-600">{getTitle()}</h2>
                            <div className="md:hidden w-8"></div> {/* Spacer to center title on mobile */}
                        </header>
                        <div className="flex-grow relative">
                            <div className="absolute inset-0 overflow-y-auto relative">
                               <Suspense fallback={<LoadingFallback />}>
                                   {renderScreen()}
                               </Suspense>
                            </div>
                        </div>
                    </main>
                </div>

            </div>
        </div>
    );
};

export default App;

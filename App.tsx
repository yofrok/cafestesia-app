
import React, { useState, useEffect, useMemo, useRef, lazy, Suspense } from 'react';
import { Screen, KanbanTask } from './types';
import Sidebar from './components/Sidebar';
import { useKanban } from './services/useKanban';
import { useInventory } from './services/useInventory';
import { useProviders } from './services/useProviders';
import { useProduction } from './features/baking/useProduction';
import { useCategories } from './services/useCategories';
import { useRecipeLog } from './services/useRecipeLog';
import Icon from './components/Icon';
import { useUsers } from './services/useUsers';
import AudioUnlockBanner from './components/AudioUnlockBanner';
import { useRecipes } from './services/useRecipes';
import { useWakeLock } from './services/useWakeLock';

// --- Code Splitting ---
const BreadProductionScreen = lazy(() => import('./features/baking/BreadProductionScreen'));
const OperationsScreen = lazy(() => import('./features/operations/OperationsScreen'));
const InventoryScreen = lazy(() => import('./features/inventory/InventoryScreen'));
const SettingsScreen = lazy(() => import('./features/settings/SettingsScreen'));
const BeveragesScreen = lazy(() => import('./features/beverages/BeveragesScreen'));

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
    const [operationsDate, setOperationsDate] = useState(new Date());
    const [highlightedTaskId, setHighlightedTaskId] = useState<string | null>(null);

    // Initialize Wake Lock Globally (Prevent Screen Sleep)
    useWakeLock();

    // Centralized Hooks
    const productionHook = useProduction();
    const kanbanHook = useKanban();
    const inventoryHook = useInventory();
    const providersHook = useProviders();
    const categoriesHook = useCategories();
    const recipeLogHook = useRecipeLog();
    const usersHook = useUsers();
    const recipesHook = useRecipes();
    
    const { processes, playNotification, isSuspended, unlockAudio } = productionHook;
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
                if (task.date === todayStr && task.time && task.status !== 'done') {
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
        currentCriticalIds.forEach((id: string) => {
            if (!playedAlerts.current.has(id)) {
                playNotification();
                playedAlerts.current.add(id);
            }
        });
        // Clean up alerts for tasks that are no longer critical
        playedAlerts.current.forEach((id: string) => {
            if (id.startsWith('task-') && !currentCriticalIds.has(id)) {
                playedAlerts.current.delete(id);
            }
        });
    }, [criticalAndUpcomingTasks, playNotification]);

    const handleNavigateToTask = (task: KanbanTask) => {
        if (task.date) {
            const taskDate = new Date(task.date);
            // Adjust for timezone offset to prevent showing the previous day
            taskDate.setMinutes(taskDate.getMinutes() + taskDate.getTimezoneOffset());
            setOperationsDate(taskDate);
            setHighlightedTaskId(task.id);
        }
        setActiveScreen(Screen.Operations);
    };

    const shoppingListItems = useMemo(() => {
        return items.filter(item => item.currentStock <= item.minStock);
    }, [items]);

    const inProgressTasks = useMemo(() => {
        return tasks.filter(t => t.status === 'inprogress');
    }, [tasks]);
    
    const renderScreen = () => {
        switch(activeScreen) {
            case Screen.Baking:
                return <BreadProductionScreen productionHook={productionHook} recipeLogHook={recipeLogHook} recipesHook={recipesHook} inventoryHook={inventoryHook} categoriesHook={categoriesHook} />;
            case Screen.Beverages:
                return <BeveragesScreen 
                            inventoryHook={inventoryHook} 
                            recipesHook={recipesHook} 
                            usersHook={usersHook} 
                            onToggleSidebar={() => setIsMobileSidebarOpen(true)} 
                        />;
            case Screen.Operations:
                return <OperationsScreen 
                            kanbanHook={kanbanHook} 
                            criticalTasks={criticalAndUpcomingTasks} 
                            users={usersHook.users} 
                            selectedDate={operationsDate} 
                            setSelectedDate={setOperationsDate}
                            highlightedTaskId={highlightedTaskId}
                            setHighlightedTaskId={setHighlightedTaskId}
                        />;
            case Screen.Inventory:
                return <InventoryScreen inventoryHook={inventoryHook} providers={providersHook.providers} categories={categoriesHook.categories} />;
            case Screen.Settings:
                return <SettingsScreen providersHook={providersHook} categoriesHook={categoriesHook} recipeLogHook={recipeLogHook} usersHook={usersHook} recipesHook={recipesHook} inventoryHook={inventoryHook}/>;
            default:
                return <BreadProductionScreen productionHook={productionHook} recipeLogHook={recipeLogHook} recipesHook={recipesHook} inventoryHook={inventoryHook} categoriesHook={categoriesHook} />;
        }
    };

    // Zen Mode Logic: Hide the static sidebar if we are on the Beverages screen
    const isZenMode = activeScreen === Screen.Beverages;

    return (
        <div className="h-screen w-screen bg-gray-100">
            <div className="flex h-full w-full max-w-7xl mx-auto bg-gray-50 text-gray-800">
                
                {/* Static Sidebar: Visible only on Desktop AND NOT in Zen Mode */}
                {!isZenMode && (
                    <div className="hidden md:flex md:flex-shrink-0">
                        <Sidebar
                            activeScreen={activeScreen}
                            setActiveScreen={setActiveScreen}
                            processes={processes.filter(p => p.state !== 'finished')}
                            urgentTasks={criticalAndUpcomingTasks}
                            shoppingListItems={shoppingListItems}
                            inProgressTasks={inProgressTasks}
                            isOpen={true} // Always open on desktop static
                            onClose={() => {}} 
                            users={usersHook.users}
                            onNavigateToTask={handleNavigateToTask}
                            setOperationsDate={setOperationsDate}
                            setHighlightedTaskId={setHighlightedTaskId}
                        />
                    </div>
                )}

                {/* Overlay Sidebar: Visible on Mobile OR Zen Mode Desktop */}
                {/* If Zen Mode is active, we remove md:hidden so this overlay logic works on desktop too */}
                <div className={`${!isZenMode ? 'md:hidden' : ''}`}>
                     {isMobileSidebarOpen && (
                        <div 
                            className="fixed inset-0 bg-black/50 z-40" 
                            onClick={() => setIsMobileSidebarOpen(false)}
                            aria-hidden="true" 
                        />
                    )}
                    <Sidebar
                        activeScreen={activeScreen}
                        setActiveScreen={setActiveScreen}
                        processes={processes.filter(p => p.state !== 'finished')}
                        urgentTasks={criticalAndUpcomingTasks}
                        shoppingListItems={shoppingListItems}
                        inProgressTasks={inProgressTasks}
                        isOpen={isMobileSidebarOpen}
                        onClose={() => setIsMobileSidebarOpen(false)}
                        users={usersHook.users}
                        onNavigateToTask={handleNavigateToTask}
                        setOperationsDate={setOperationsDate}
                        setHighlightedTaskId={setHighlightedTaskId}
                    />
                </div>
                
                <main className="flex-1 flex flex-col relative overflow-hidden">
                    {/* Mobile Header (Hidden on Desktop unless in Zen Mode - but BeveragesScreen has its own button) */}
                    <header className={`md:hidden bg-white border-b border-gray-200 p-4 flex justify-start items-center gap-4 ${isZenMode ? 'hidden' : ''}`}>
                        <button onClick={() => setIsMobileSidebarOpen(true)}>
                            <Icon name="menu" size={24} />
                        </button>
                        <h1 className="text-xl font-bold text-blue-600">Cafestesia</h1>
                    </header>
                    <div className="flex-1 overflow-y-auto">
                        <Suspense fallback={<LoadingFallback />}>
                            {renderScreen()}
                        </Suspense>
                    </div>
                </main>
            </div>
            {isSuspended && <AudioUnlockBanner onUnlock={unlockAudio} />}
        </div>
    );
};

export default App;

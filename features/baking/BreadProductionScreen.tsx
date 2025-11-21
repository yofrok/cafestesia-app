
import React, { useState } from 'react';
import { useProduction } from './useProduction';
import Icon from '../../components/Icon';
import RecipeSelectionModal from './RecipeSelectionModal';
import ProcessCard from './ProcessCard';
import { useRecipeLog } from '../../services/useRecipeLog';
import { ProductionProcess } from '../../types';
import FeedbackModal from './FeedbackModal';
import { useRecipes } from '../../services/useRecipes';
import { useInventory } from '../../services/useInventory';
import BakeryStockDashboard from './BakeryStockDashboard';
import { useCategories } from '../../services/useCategories';
import { useUsers } from '../../services/useUsers'; // Import useUsers
import ProductionCompletionModal from './ProductionCompletionModal'; // Import new modal
import StockHistoryLog from '../inventory/StockHistoryLog'; // Import History View

interface BreadProductionScreenProps {
    productionHook: ReturnType<typeof useProduction>;
    recipeLogHook: ReturnType<typeof useRecipeLog>;
    recipesHook: ReturnType<typeof useRecipes>;
    inventoryHook: ReturnType<typeof useInventory>;
    categoriesHook: ReturnType<typeof useCategories>;
}

type BakingTab = 'processes' | 'dashboard';

const BreadProductionScreen: React.FC<BreadProductionScreenProps> = ({ productionHook, recipeLogHook, recipesHook, inventoryHook, categoriesHook }) => {
    const { users } = useUsers(); // Fetch users for selection
    const [activeTab, setActiveTab] = useState<BakingTab>('processes');
    const [isSelectionModalOpen, setSelectionModalOpen] = useState(false);
    const [processForFeedback, setProcessForFeedback] = useState<ProductionProcess | null>(null);
    
    // New States for Completion & History
    const [completionModalProcess, setCompletionModalProcess] = useState<ProductionProcess | null>(null);
    const [showHistory, setShowHistory] = useState(false);

    const { processes, startBakingProcess, startHeatingProcess, advanceProcess, goToPreviousStep, togglePauseProcess, cancelProcess, isSoundMuted, toggleSoundMute, isAudioReady, isSuspended, unlockAudio } = productionHook;
    const { addFeedback } = recipeLogHook;
    const { recipes } = recipesHook;
    const { produceBatch, stockLogs } = inventoryHook; // Get stockLogs

    const handleAcknowledgeFinish = (process: ProductionProcess) => {
        if (process.type === 'baking' && process.recipeId) {
            setProcessForFeedback(process);
        } else {
            cancelProcess(process.id);
        }
    };

    // Triggered by "Registrar Inventario" button in ProcessCard
    const handleOpenCompletionModal = (process: ProductionProcess) => {
        setCompletionModalProcess(process);
    };

    const handleConfirmProduction = (process: ProductionProcess, actualQuantity: number, responsible: string) => {
        // Use latest recipe data
        const latestRecipe = recipes.find(r => r.id === process.recipeId) || process.recipe;

        if (latestRecipe) {
            let multiplier = 1;
            if (latestRecipe.outputQuantity && latestRecipe.outputQuantity > 0) {
                multiplier = actualQuantity / latestRecipe.outputQuantity;
            }
            
            // Call produceBatch with the responsible person
            produceBatch(latestRecipe, multiplier, actualQuantity, responsible);
            
            // Close modal
            setCompletionModalProcess(null);
            
            // Optionally auto-archive if desired, but user might want to leave it visible for a moment.
            // For now, ProcessCard handles visual feedback "Inventario Actualizado".
        } else {
            alert("Error: No se encontró la receta vinculada.");
        }
    };

    const handleFeedbackSave = (rating: number, notes: string) => {
        if (processForFeedback && processForFeedback.recipeId) {
            addFeedback({
                recipeId: processForFeedback.recipeId,
                rating,
                notes
            });
            cancelProcess(processForFeedback.id);
        }
        setProcessForFeedback(null);
    };

    const handleFeedbackSkip = () => {
        if (processForFeedback) {
            cancelProcess(processForFeedback.id);
        }
        setProcessForFeedback(null);
    };
    
    const activeProcesses = processes.filter(p => p.state !== 'finished');
    const finishedProcesses = processes.filter(p => p.state === 'finished');

    if (showHistory) {
        return <StockHistoryLog logs={stockLogs} onClose={() => setShowHistory(false)} />;
    }

    return (
        <div className="h-full flex flex-col bg-gray-50">
            {/* Navigation Tabs */}
            <div className="bg-white border-b border-gray-200 flex justify-between items-center px-4 py-2 flex-shrink-0">
                <div className="flex gap-4 overflow-x-auto">
                    <button 
                        onClick={() => setActiveTab('processes')}
                        className={`flex items-center gap-2 py-2 px-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'processes' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
                    >
                        <Icon name="play-circle" size={18} />
                        Producción
                    </button>
                    <button 
                        onClick={() => setActiveTab('dashboard')}
                        className={`flex items-center gap-2 py-2 px-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'dashboard' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
                    >
                        <Icon name="bar-chart-2" size={18} />
                        Stock y Resumen
                    </button>
                </div>
                
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowHistory(true)}
                        className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
                        title="Ver Historial"
                    >
                        <Icon name="list" size={20} />
                    </button>

                    {activeTab === 'processes' && (
                        <>
                            <button
                                onClick={isSuspended ? unlockAudio : toggleSoundMute}
                                title={isSuspended ? "Sonidos bloqueados. Clic para activar." : isSoundMuted ? "Activar Sonidos" : "Silenciar Sonidos"}
                                className={`p-2 rounded-full transition-colors ${isSuspended ? 'text-yellow-600 animate-pulse' : 'text-gray-500 hover:text-blue-600 hover:bg-gray-100'}`}
                            >
                                <Icon name={(isSoundMuted || isSuspended) ? "volume-x" : "volume-2"} size={20} />
                            </button>
                            <button 
                                onClick={() => setSelectionModalOpen(true)}
                                className="flex items-center gap-2 bg-blue-600 text-white font-semibold py-1.5 px-3 rounded-lg hover:bg-blue-700 transition-colors text-sm whitespace-nowrap"
                            >
                                <Icon name="plus-circle" size={16} />
                                <span className="hidden sm:inline">Iniciar</span>
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-grow overflow-hidden">
                {activeTab === 'dashboard' ? (
                    <BakeryStockDashboard inventoryHook={inventoryHook} categoriesHook={categoriesHook} />
                ) : (
                    <div className="h-full overflow-y-auto p-4 md:p-6">
                        {activeProcesses.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {activeProcesses.map(process => (
                                    <ProcessCard 
                                        key={process.id} 
                                        process={process}
                                        onAdvance={advanceProcess}
                                        onPrevious={goToPreviousStep}
                                        onTogglePause={togglePauseProcess}
                                        onCancel={cancelProcess}
                                        onAcknowledgeFinish={() => {}} 
                                        isAudioReady={isAudioReady}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-16 text-gray-500">
                                <p>No hay procesos activos.</p>
                                <p className="text-sm mt-2">Ve a la pestaña "Stock y Resumen" para ver qué hace falta.</p>
                            </div>
                        )}

                        {finishedProcesses.length > 0 && (
                            <div className="mt-8">
                                <h3 className="text-lg font-bold text-gray-600 mb-3">Finalizados Recientemente</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {finishedProcesses.map(process => (
                                        <ProcessCard 
                                            key={process.id} 
                                            process={process}
                                            onAdvance={advanceProcess}
                                            onPrevious={goToPreviousStep}
                                            onTogglePause={() => {}}
                                            onCancel={cancelProcess}
                                            onAcknowledgeFinish={() => handleAcknowledgeFinish(process)}
                                            isAudioReady={isAudioReady}
                                            onRecordProduction={() => handleOpenCompletionModal(process)} // Open Modal
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <RecipeSelectionModal 
                isOpen={isSelectionModalOpen}
                onClose={() => setSelectionModalOpen(false)}
                onSelectRecipe={startBakingProcess}
                onSelectHeating={startHeatingProcess}
                recipes={recipes}
            />
            {processForFeedback && (
                <FeedbackModal
                    isOpen={!!processForFeedback}
                    processName={processForFeedback.name}
                    onSave={handleFeedbackSave}
                    onSkip={handleFeedbackSkip}
                />
            )}
            
            {completionModalProcess && (
                <ProductionCompletionModal 
                    isOpen={!!completionModalProcess}
                    onClose={() => setCompletionModalProcess(null)}
                    process={completionModalProcess}
                    users={users}
                    onConfirm={handleConfirmProduction}
                />
            )}
        </div>
    );
};

export default BreadProductionScreen;

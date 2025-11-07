import React, { useState } from 'react';
import { useProduction } from './useProduction';
import Icon from '../../components/Icon';
import RecipeSelectionModal from './RecipeSelectionModal';
import ProcessCard from './ProcessCard';
import { useRecipeLog } from '../../services/useRecipeLog';
import { ProductionProcess } from '../../types';
import FeedbackModal from './FeedbackModal';

interface BreadProductionScreenProps {
    productionHook: ReturnType<typeof useProduction>;
    recipeLogHook: ReturnType<typeof useRecipeLog>;
}

const BreadProductionScreen: React.FC<BreadProductionScreenProps> = ({ productionHook, recipeLogHook }) => {
    const [isSelectionModalOpen, setSelectionModalOpen] = useState(false);
    const [processForFeedback, setProcessForFeedback] = useState<ProductionProcess | null>(null);

    const { processes, startBakingProcess, startHeatingProcess, advanceProcess, togglePauseProcess, cancelProcess, isSoundMuted, toggleSoundMute, isAudioReady, isSuspended, unlockAudio } = productionHook;
    const { addFeedback } = recipeLogHook;

    const handleAcknowledgeFinish = (process: ProductionProcess) => {
        if (process.type === 'baking' && process.recipeId) {
            setProcessForFeedback(process);
        } else {
            // For non-baking processes like heating, just clear them
            cancelProcess(process.id);
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

    return (
        <div className="p-4 md:p-6 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6 flex-shrink-0">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-bold text-blue-700">Procesos Activos</h2>
                    <button
                        onClick={isSuspended ? unlockAudio : toggleSoundMute}
                        title={isSuspended ? "Sonidos bloqueados por el navegador. Haz clic para activar." : isSoundMuted ? "Activar Sonidos" : "Silenciar Sonidos"}
                        className={`p-2 rounded-full transition-colors ${isSuspended ? 'text-yellow-600 animate-pulse' : 'text-gray-500 hover:text-blue-600 hover:bg-gray-100'}`}
                    >
                        <Icon name={(isSoundMuted || isSuspended) ? "volume-x" : "volume-2"} size={20} />
                    </button>
                </div>
                <button 
                    onClick={() => setSelectionModalOpen(true)}
                    className="flex items-center gap-2 bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                    <Icon name="plus-circle" size={16} />
                    Iniciar Proceso
                </button>
            </div>

            <div className="flex-grow overflow-y-auto">
                {activeProcesses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {activeProcesses.map(process => (
                            <ProcessCard 
                                key={process.id} 
                                process={process}
                                onAdvance={advanceProcess}
                                onTogglePause={togglePauseProcess}
                                onCancel={cancelProcess}
                                onAcknowledgeFinish={() => {}} // This is handled by the finished list
                                isAudioReady={isAudioReady}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 text-gray-500">
                        <p>No hay procesos activos en este momento.</p>
                        <p>Haz clic en "Iniciar Proceso" para comenzar.</p>
                    </div>
                )}

                {finishedProcesses.length > 0 && (
                    <div className="mt-8">
                        <h3 className="text-lg font-bold text-gray-600">Finalizados Recientemente</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            {finishedProcesses.map(process => (
                                <ProcessCard 
                                    key={process.id} 
                                    process={process}
                                    onAdvance={advanceProcess}
                                    onTogglePause={() => {}}
                                    onCancel={cancelProcess}
                                    onAcknowledgeFinish={() => handleAcknowledgeFinish(process)}
                                    isAudioReady={isAudioReady}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <RecipeSelectionModal 
                isOpen={isSelectionModalOpen}
                onClose={() => setSelectionModalOpen(false)}
                onSelectRecipe={startBakingProcess}
                onSelectHeating={startHeatingProcess}
            />
            {processForFeedback && (
                <FeedbackModal
                    isOpen={!!processForFeedback}
                    processName={processForFeedback.name}
                    onSave={handleFeedbackSave}
                    onSkip={handleFeedbackSkip}
                />
            )}
        </div>
    );
};

export default BreadProductionScreen;
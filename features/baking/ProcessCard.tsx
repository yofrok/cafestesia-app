
import React, { useState } from 'react';
import { ProductionProcess, RecipeStep } from '../../types';
import Icon from '../../components/Icon';
import SwipeButton from '../../components/SwipeButton';

interface ProcessCardProps {
    process: ProductionProcess;
    onAdvance: (processId: string) => void;
    onPrevious: (processId: string) => void;
    onTogglePause: (processId: string) => void;
    onCancel: (processId: string) => void;
    onAcknowledgeFinish: (process: ProductionProcess) => void;
    isAudioReady: boolean;
    onRecordProduction?: (process: ProductionProcess) => void; // Simplified signature
}

const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) seconds = 0;
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    if (h > 0) {
        // If > 1 hour, show hours and minutes only (e.g., "2h 15m")
        return `${h}h ${String(m).padStart(2, '0')}m`;
    }
    // If < 1 hour, show minutes and seconds (e.g., "45:30")
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const StepItem: React.FC<{ step: RecipeStep, isCompleted: boolean, isCurrent: boolean }> = ({ step, isCompleted, isCurrent }) => {
    let stateStyles = 'text-gray-500';
    let iconClass = 'border-gray-300 text-gray-300';
    let containerClass = '';

    if (isCurrent) {
        stateStyles = 'font-bold text-gray-900';
        if (step.type === 'passive') {
            iconClass = 'border-teal-500 bg-teal-500 text-white animate-pulse';
            containerClass = 'bg-teal-50/80 shadow-md -mx-2 px-3 py-3 rounded-lg border-l-4 border-teal-500 transition-all duration-300 my-1';
        } else {
            iconClass = 'border-blue-600 bg-blue-600 text-white animate-pulse';
            containerClass = 'bg-blue-50/80 shadow-md -mx-2 px-3 py-3 rounded-lg border-l-4 border-blue-600 transition-all duration-300 my-1';
        }
    } else if (isCompleted) {
        stateStyles = 'text-gray-400 line-through decoration-gray-400';
        iconClass = 'border-green-500 text-green-500 bg-green-50';
        containerClass = 'py-1 opacity-75';
    } else {
        containerClass = 'py-1';
    }

    return (
        <div className={`flex items-center gap-3 transition-all duration-300 ${containerClass}`}>
            <div className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center ${iconClass}`}>
                 {isCompleted ? <Icon name="check" size={12} /> : isCurrent ? <div className="w-2 h-2 bg-white rounded-full"></div> : null}
            </div>
            <div className="flex-grow">
                 <p className={`text-sm leading-tight ${stateStyles}`}>{step.instruction}</p>
            </div>
            {isCurrent && (
                <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full flex-shrink-0 shadow-sm ${step.type === 'passive' ? 'bg-white text-teal-700 border border-teal-200' : 'bg-white text-blue-700 border border-blue-200'}`}>
                    {step.type === 'passive' ? 'Espera' : 'Manual'}
                </span>
            )}
        </div>
    );
};


const ProcessCard: React.FC<ProcessCardProps> = ({ process, onAdvance, onPrevious, onTogglePause, onCancel, onAcknowledgeFinish, onRecordProduction }) => {
    const { state, name, steps, currentStepIndex, totalTimeLeft, stepTimeLeft } = process;
    const [isConfirmingCancel, setIsConfirmingCancel] = useState(false);
    const [isConfirmingPrevious, setIsConfirmingPrevious] = useState(false);
    
    const currentStep = steps[currentStepIndex];
    const isPassive = currentStep?.type === 'passive';
    const isPausedState = state === 'paused' || state === 'intermission';

    // --- Visual Themes ---
    const passiveClasses = {
        card: 'bg-teal-50 text-teal-900 border-teal-300',
        header: 'bg-teal-100/60 border-b border-teal-200',
        textMain: 'text-teal-800',
        textSub: 'text-teal-600',
        timer: 'text-teal-700',
        stepList: 'bg-white/80 border-teal-200',
        controls: 'border-t border-teal-200 pt-3'
    };

    const activeClasses = {
        card: 'bg-white text-gray-800 border-blue-500',
        header: 'bg-blue-50/60 border-b border-blue-100',
        textMain: 'text-blue-800',
        textSub: 'text-gray-500',
        timer: 'text-blue-700',
        stepList: 'bg-gray-50 border-gray-200',
        controls: 'border-t border-gray-100 pt-3'
    };

    const pausedClasses = {
        card: 'bg-amber-50 text-amber-900 border-amber-400 shadow-md',
        header: 'bg-amber-100 border-b border-amber-200',
        textMain: 'text-amber-800',
        textSub: 'text-amber-700 font-bold',
        timer: 'text-amber-700',
        stepList: 'bg-white/60 border-amber-200',
        controls: 'border-t border-amber-200 pt-3'
    };

    const alarmClasses = {
        card: 'bg-red-50 text-red-900 border-red-500 animate-pulse-red',
        header: 'bg-red-100 border-b border-red-200',
        textMain: 'text-red-700',
        textSub: 'text-red-600',
        timer: 'text-red-600 animate-pulse',
        stepList: 'bg-white border-red-200',
        controls: 'border-t border-red-200 pt-3'
    };

    const finishedClasses = {
        card: 'bg-green-50 text-green-900 border-green-600',
        header: 'bg-green-100 border-b border-green-200',
        textMain: 'text-green-700',
        textSub: 'text-green-600',
        timer: 'text-green-700',
        stepList: 'bg-white border-green-200',
        controls: 'border-t border-green-200 pt-3'
    };

    let theme = activeClasses; // Default
    if (state === 'finished') theme = finishedClasses;
    else if (state === 'alarm') theme = alarmClasses;
    else if (isPausedState) theme = pausedClasses; // Priority: Attention needed
    else if (isPassive) theme = passiveClasses; 

    const renderControls = () => {
        if (state === 'finished') {
             const hasIngredients = process.recipe?.ingredients && process.recipe.ingredients.length > 0;
             
             return (
                 <div className="flex flex-col gap-3">
                     {onRecordProduction && hasIngredients && (
                        <button 
                            onClick={() => onRecordProduction(process)}
                            className="w-full bg-emerald-600 text-white font-bold py-3 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm flex items-center justify-center gap-2 text-sm"
                        >
                            <Icon name="check-circle" size={18} />
                            Registrar y Firmar Lote
                        </button>
                     )}
                     
                     <button onClick={() => onAcknowledgeFinish(process)} className="w-full bg-gray-600 text-white font-bold py-3 rounded-lg hover:bg-gray-700 transition-colors shadow-sm uppercase tracking-wider text-sm">
                         Archivar
                     </button>
                 </div>
             );
        }
        
        if (state === 'alarm') {
            return (
                <SwipeButton 
                    onSwipe={() => onAdvance(process.id)} 
                    text="Deslizar para apagar alarma" 
                    icon="check-circle"
                    className="bg-red-100 border-red-300"
                />
            );
        }

        if (isConfirmingPrevious) {
            return (
                <div className="flex flex-col gap-2 bg-orange-50 p-3 rounded-lg border border-orange-200 animate-fadeIn">
                    <p className="text-xs font-bold text-orange-800 text-center">¿Regresar? Se perderá el progreso de este paso.</p>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setIsConfirmingPrevious(false)}
                            className="flex-1 py-2 px-3 bg-white border border-gray-300 text-gray-700 font-bold rounded-lg text-xs hover:bg-gray-50"
                        >
                            Cancelar
                        </button>
                        <button 
                            onClick={() => {
                                onPrevious(process.id);
                                setIsConfirmingPrevious(false);
                            }}
                            className="flex-1 py-2 px-3 bg-orange-500 text-white font-bold rounded-lg text-xs hover:bg-orange-600 shadow-sm"
                        >
                            Sí, Regresar
                        </button>
                    </div>
                </div>
            );
        }

        const canGoBack = currentStepIndex > 0;
        const isPaused = state === 'paused' || state === 'intermission';
        
        // Logic to determine button text
        let mainButtonText = 'PAUSAR';
        if (isPaused) {
            if (state === 'intermission') {
                mainButtonText = 'INICIAR SIGUIENTE';
            } else if (currentStepIndex === 0 && stepTimeLeft === currentStep.duration) {
                mainButtonText = 'INICIAR PROCESO';
            } else {
                mainButtonText = 'REANUDAR';
            }
        }

        return (
            <div className="flex flex-col gap-3">
                <div className="flex gap-3">
                    <button 
                        onClick={() => setIsConfirmingPrevious(true)}
                        disabled={!canGoBack}
                        className={`p-3 rounded-lg transition-colors flex-shrink-0 ${canGoBack ? 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 shadow-sm' : 'bg-transparent border border-transparent text-gray-300 cursor-not-allowed'}`}
                        title="Paso Anterior"
                    >
                        <Icon name="rotate-ccw" size={20} />
                    </button>
                    
                    <button 
                        onClick={() => onTogglePause(process.id)}
                        className={`flex-grow flex items-center justify-center gap-2 font-bold rounded-lg transition-colors shadow-sm border text-sm md:text-base ${
                            isPaused 
                                ? 'bg-green-500 text-white border-green-600 hover:bg-green-600 animate-pulse' 
                                : 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200'
                        }`}
                    >
                        <Icon name={isPaused ? "play-circle" : "minus"} size={20} />
                        {mainButtonText}
                    </button>
                </div>
                
                <div className="relative z-0">
                    <SwipeButton 
                        onSwipe={() => onAdvance(process.id)} 
                        text="Deslizar al completar" 
                        disabled={state === 'intermission'} 
                        className={isPausedState ? "bg-amber-100 border-amber-300" : isPassive ? "bg-teal-100 border-teal-300" : "bg-gray-100 border-gray-300"}
                    />
                </div>
            </div>
        );
    };
    
    if (isConfirmingCancel) {
        return (
            <div className={`flex flex-col bg-white rounded-xl border-2 border-red-400 shadow-lg p-6 justify-center items-center text-center min-h-[320px]`}>
                <div className="bg-red-100 p-4 rounded-full mb-4">
                    <Icon name="alert-triangle" size={40} className="text-red-600" />
                </div>
                <h4 className="font-bold text-xl mb-2 text-gray-800">¿Cancelar Proceso?</h4>
                <p className="text-gray-600 mb-8">Se perderá el progreso actual de <span className="font-bold">{name}</span>.</p>
                <div className="flex gap-4 w-full">
                    <button onClick={() => setIsConfirmingCancel(false)} className="flex-1 py-3 px-4 bg-gray-100 text-gray-800 font-bold rounded-lg hover:bg-gray-200">Volver</button>
                    <button onClick={() => onCancel(process.id)} className="flex-1 py-3 px-4 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 shadow-md">Sí, Cancelar</button>
                </div>
            </div>
        );
    }

    return (
        <div className={`flex flex-col rounded-xl border-2 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden ${theme.card}`}>
            {/* Header */}
            <header className={`p-4 flex justify-between items-start ${theme.header}`}>
                <div>
                     <h3 className="font-bold text-xl leading-tight flex items-center gap-2 text-gray-800">
                        {isPassive ? <Icon name="thermometer" className={state === 'running' ? "animate-pulse text-teal-600" : "text-teal-600"} /> : <Icon name="cake-slice" className="text-blue-600" />}
                        {name}
                     </h3>
                     <p className={`text-xs font-bold uppercase tracking-wider mt-1 ${theme.textSub}`}>
                        {state === 'running' ? (isPassive ? '• Proceso Automático' : '• Acción Requerida') : 
                         state === 'paused' ? '• En Pausa - Requiere Atención' : 
                         state === 'intermission' ? '• Listo para iniciar - Dale Play' : 
                         state === 'alarm' ? '• ¡TIEMPO TERMINADO!' : '• Finalizado'}
                     </p>
                </div>
                {isPassive && state === 'running' && (
                    <div className="flex flex-col items-end">
                        <span className="bg-white border border-teal-300 text-teal-700 px-3 py-1 rounded-full text-xs font-bold shadow-sm animate-pulse">
                            LIBRE
                        </span>
                    </div>
                )}
            </header>

            {/* Setup Instruction */}
            {currentStepIndex === 0 && process.recipe?.setupInstruction && (
                <div className="bg-yellow-100 border-b-2 border-yellow-300 p-3 mb-0">
                    <div className="flex items-start gap-3">
                        <Icon name="settings" className="text-yellow-700 mt-1 flex-shrink-0" size={20} />
                        <div>
                            <h4 className="text-xs font-bold text-yellow-700 uppercase tracking-wider mb-0.5">Configuración Inicial</h4>
                            <p className="text-sm font-medium text-yellow-900 leading-snug">{process.recipe.setupInstruction}</p>
                        </div>
                    </div>
                </div>
            )}
            
            <div className="p-4 flex-grow flex flex-col justify-between gap-6">
                
                {/* Timer Section */}
                <div className="flex flex-col items-center justify-center relative">
                    <div className="text-center">
                        <span className={`text-[10px] uppercase font-bold tracking-widest mb-1 block opacity-60`}>Tiempo Restante</span>
                        <p className={`text-7xl font-bold tabular-nums tracking-tighter leading-none ${theme.timer} transition-colors duration-500`}>
                            {formatTime(stepTimeLeft)}
                        </p>
                    </div>
                    <div className={`flex items-center gap-2 mt-2 text-xs font-semibold opacity-60`}>
                        <Icon name="rotate-ccw" size={12} />
                        <span>Total lote: {formatTime(totalTimeLeft)}</span>
                    </div>
                </div>

                {/* Steps List */}
                <div className={`rounded-lg border overflow-hidden flex flex-col max-h-48 ${theme.stepList}`}>
                    <div className="overflow-y-auto p-2 space-y-1 custom-scrollbar">
                        {steps.map((step, index) => (
                            <StepItem 
                                key={index}
                                step={step}
                                isCompleted={index < currentStepIndex}
                                isCurrent={index === currentStepIndex && state !== 'finished'}
                            />
                        ))}
                    </div>
                </div>
                
                <div className={`${theme.controls}`}>
                    {renderControls()}
                    {state !== 'finished' && state !== 'alarm' && (
                        <div className="text-center mt-2">
                            <button 
                                onClick={() => setIsConfirmingCancel(true)}
                                className="text-xs text-gray-400 hover:text-red-500 font-semibold px-2 py-1 transition-colors"
                            >
                                Cancelar Todo
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProcessCard;

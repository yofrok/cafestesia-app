// Fix: Defined RecipeStep interface here as it was not exported from constants.
export interface RecipeStep {
    duration: number;
    instruction: string;
    isPauseStep?: boolean;
}

export enum Screen {
    Baking = 'baking-menu',
    BakingRecipeSelection = 'baking-recipe-selection',
    BakingProcess = 'baking-process',
    HeatingTimer = 'heating-timer',
    Operations = 'operations',
    Inventory = 'inventory',
    Settings = 'settings',
}

export interface Recipe {
    id: string;
    name: string;
    pluralName: string;
    setupInstruction: string;
    totalDuration: number;
    steps: RecipeStep[];
}

export type ProductionProcessState = 'paused' | 'running' | 'alarm' | 'finished';

export interface ProductionProcess {
    id: string;
    name: string;
    
    // Fix: Added missing properties to support different process types and recipe linking.
    type: 'baking' | 'heating';
    recipeId?: string;
    recipe?: Recipe;

    state: ProductionProcessState;
    
    currentStepIndex: number;
    steps: RecipeStep[];

    totalTime: number; // Initial total duration in seconds
    totalTimeLeft: number; 
    stepTimeLeft: number;

    lastTickTimestamp: number; // For offline calculation
}

export interface User {
    id: string;
    name: string;
    color: string;
    phone?: string;
}

export type Shift = 'matutino' | 'pre-apertura' | 'cierre' | 'default';

export type TaskStatus = 'todo' | 'inprogress' | 'done';

export interface Subtask {
    id: string;
    text: string;
    isCompleted: boolean;
}

export interface KanbanTask {
    id: string;
    text: string;
    employee: string;
    shift: Shift;
    time?: string; // "HH:mm" - Optional for unplanned tasks
    date?: string; // "YYYY-MM-DD" - Optional for unplanned tasks
    duration: number; // in minutes
    isCritical: boolean;
    zone: string;
    status: TaskStatus;
    subtasks?: Subtask[];
    notes?: string;
    recurrenceId?: string;
    addedBy: string;
}

export interface PurchaseRecord {
    id: string;
    date: string; // ISO string format
    quantity: number;
    totalPrice: number;
    providerName: string;
}

export interface InventoryItem {
    id: string;
    name: string;
    category: string;
    currentStock: number;
    unit: string;
    minStock: number;
    providerPreferido: string;
    purchaseHistory: PurchaseRecord[];
}

export interface Provider {
    id: string;
    name: string;
}

export interface Category {
    id: string;
    name: string;
}

export interface RecipeFeedback {
    id: string;
    recipeId: string;
    date: string; // ISO string format
    rating: number; // 1-5
    notes: string;
}
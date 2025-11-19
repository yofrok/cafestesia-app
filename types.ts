
// The RecipeStep interface is now defined centrally here to avoid module resolution issues.
export type StepType = 'active' | 'passive';

export interface RecipeStep {
    duration: number; // in seconds
    instruction: string;
    type: StepType;
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

export interface RecipeVariant {
    id: string;
    name: string;
    description?: string;
    // An array of step modifications. The index corresponds to the step in the base recipe.
    // If a step isn't overridden, it uses the base recipe's values.
    stepOverrides: Array<{
        duration?: number;
        instruction?: string;
        type?: StepType;
    } | null>; // null means no override for that step
}

export interface Recipe {
    id: string;
    name: string;
    pluralName: string;
    setupInstruction: string;
    baseVariantName: string;
    baseVariantDescription?: string;
    totalDuration: number; // This will now be calculated dynamically
    steps: RecipeStep[];
    variants?: RecipeVariant[];
}


export type ProductionProcessState = 'paused' | 'running' | 'alarm' | 'finished' | 'intermission';

export interface ProductionProcess {
    id: string;
    name: string;
    
    // Fix: Added missing properties to support different process types and recipe linking.
    type: 'baking' | 'heating';
    recipeId?: string;
    recipe?: Recipe;
    variantId?: string; // To know which variant is being used

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
    id:string;
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
    recurrenceId?: string; // Legacy: For old recurring tasks
    templateId?: string; // New: Link to the Master Routine
    addedBy: string;
}

// New Interface for Master Routines
export interface TaskTemplate {
    id: string;
    title: string;
    subtasks: Subtask[];
    notes: string;
    
    // Scheduling
    frequencyDays: number[]; // 0=Sun, 1=Mon, etc.
    time: string; // "14:00"
    duration: number;
    shift: Shift;
    zone: string;
    isCritical: boolean;

    // Smart Assignment
    defaultEmployee: string; // Fallback user name
    customAssignments: {
        [dayNumber: string]: string; // "1": "Ali", "4": "Fer"
    };
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

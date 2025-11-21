
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
    Beverages = 'beverages',
}

export interface RecipeVariant {
    id: string;
    name: string;
    description?: string;
    stepOverrides: Array<{
        duration?: number;
        instruction?: string;
        type?: StepType;
    } | null>;
}

export interface RecipeIngredient {
    inventoryItemId: string;
    quantity: number; // Amount required per batch (in the inventory item's unit)
}

export interface Recipe {
    id: string;
    name: string;
    pluralName: string;
    setupInstruction: string;
    baseVariantName: string;
    baseVariantDescription?: string;
    totalDuration: number;
    steps: RecipeStep[];
    variants?: RecipeVariant[];
    
    // Inventory Integration
    ingredients?: RecipeIngredient[];
    outputInventoryItemId?: string; // The inventory item this recipe produces (e.g., "Frozen Croissant")
    outputQuantity?: number; // How much it produces per batch
}


export type ProductionProcessState = 'paused' | 'running' | 'alarm' | 'finished' | 'intermission';

export interface ProductionProcess {
    id: string;
    name: string;
    
    type: 'baking' | 'heating';
    recipeId?: string;
    recipe?: Recipe;
    variantId?: string; 

    state: ProductionProcessState;
    
    currentStepIndex: number;
    steps: RecipeStep[];

    totalTime: number; 
    totalTimeLeft: number; 
    stepTimeLeft: number;

    lastTickTimestamp: number;
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
    time?: string; 
    date?: string; 
    duration: number;
    isCritical: boolean;
    zone: string;
    status: TaskStatus;
    subtasks?: Subtask[];
    notes?: string;
    recurrenceId?: string; 
    templateId?: string; 
    addedBy: string;
}

export interface TaskTemplate {
    id: string;
    title: string;
    subtasks: Subtask[];
    notes: string;
    
    frequencyDays: number[]; 
    time: string; 
    duration: number;
    shift: Shift;
    zone: string;
    isCritical: boolean;

    defaultEmployee: string; 
    customAssignments: {
        [dayNumber: string]: string; 
    };
}

export interface PurchaseRecord {
    id: string;
    date: string; 
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
    date: string; 
    rating: number; 
    notes: string;
}

// --- BEVERAGE SYSTEM TYPES ---

export type BeverageCategory = 'caliente' | 'frio' | 'metodo' | 'otro';

export interface BeverageSize {
    name: string; 
    recipe: string; 
}

export interface Beverage {
    id: string;
    name: string;
    category: BeverageCategory;
    recipe: string; 
    modifiers?: string[]; 
    hasSizes?: boolean; 
    sizes?: BeverageSize[]; 
}

export interface OrderItem {
    id: string; 
    beverageId: string;
    beverageName: string;
    sizeName?: string; 
    modifiers: string[];
    notes?: string;
    recipeRef?: string; 
}

export interface BeverageOrder {
    id: string;
    customerName: string; 
    items: OrderItem[];
    status: 'pending' | 'completed';
    createdAt: number; 
    completedAt?: number;
}

import { KanbanTask, InventoryItem } from './types';

// Recipes have been moved to Firestore and are now managed via useRecipes hook.
// This constant is no longer used for production baking.
export const RECIPES: Record<string, any> = {};

const today = new Date();
const todayStr = today.toISOString().split('T')[0];

export const INITIAL_TASKS: Omit<KanbanTask, 'id'>[] = [
    // Today's tasks
    { text: 'Roles: Descongelar en refrigeración', employee: 'Ali', shift: 'matutino', date: todayStr, time: '08:00', duration: 30, isCritical: true, zone: 'Panadería', status: 'todo', addedBy: 'Admin' },
    { text: 'Checar ingredientes diarios y comprarlos', employee: 'Ali', shift: 'pre-apertura', date: todayStr, time: '15:00', duration: 60, isCritical: true, zone: 'Cocina', status: 'todo', addedBy: 'Admin' },
    { text: 'Hornear Roles', employee: 'Claudia', shift: 'pre-apertura', date: todayStr, time: '16:00', duration: 45, isCritical: true, zone: 'Panadería', status: 'todo', addedBy: 'Admin' },
    { text: 'Hornear Croissants', employee: 'Claudia', shift: 'pre-apertura', date: todayStr, time: '16:30', duration: 45, isCritical: true, zone: 'Panadería', status: 'todo', addedBy: 'Admin' }, // Overlap for demo
    { text: 'Corte de caja', employee: 'Fer', shift: 'cierre', date: todayStr, time: '21:50', duration: 20, isCritical: true, zone: 'Admin', status: 'todo', addedBy: 'Admin' },
    // A couple more for today
    { text: 'Limpiar barra y area de barismo', employee: 'Claudia', shift: 'pre-apertura', date: todayStr, time: '17:00', duration: 30, isCritical: true, zone: 'Barra', status: 'todo', addedBy: 'Admin' },
    { text: 'Hacer masa para ciabatta (día siguiente)', employee: 'Fer', shift: 'cierre', date: todayStr, time: '21:40', duration: 20, isCritical: true, zone: 'Panadería', status: 'todo', addedBy: 'Admin' },
];

export const MOCK_INVENTORY_ITEMS: Omit<InventoryItem, 'id'>[] = [
    { name: 'Harina de Trigo', category: 'Secos', currentStock: 50, unit: 'kg', minStock: 10, providerPreferido: 'Proveedor A', purchaseHistory: [] },
    { name: 'Levadura Fresca', category: 'Refrigerados', currentStock: 1, unit: 'kg', minStock: 0.5, providerPreferido: 'Proveedor B', purchaseHistory: [] },
    { name: 'Mantequilla sin Sal', category: 'Refrigerados', currentStock: 5, unit: 'kg', minStock: 2, providerPreferido: 'Proveedor A', purchaseHistory: [] },
    { name: 'Chocolate Amargo 70%', category: 'Secos', currentStock: 3, unit: 'kg', minStock: 1, providerPreferido: 'Proveedor C', purchaseHistory: [] },
    { name: 'Leche Entera', category: 'Lácteos', currentStock: 8, unit: 'lt', minStock: 4, providerPreferido: 'Supermercado', purchaseHistory: [] },
    { name: 'Café en Grano', category: 'Bebidas', currentStock: 10, unit: 'kg', minStock: 5, providerPreferido: 'Tostador Local', purchaseHistory: [] },
    { name: 'Azúcar Morena', category: 'Secos', currentStock: 15, unit: 'kg', minStock: 5, providerPreferido: 'Proveedor A', purchaseHistory: [] },
    { name: 'Canela en Polvo', category: 'Secos', currentStock: 0.4, unit: 'kg', minStock: 0.5, providerPreferido: 'Proveedor C', purchaseHistory: [] },
];

export const INVENTORY_UNITS = ['kg', 'lt', 'pz', 'g', 'ml', 'unidad(es)'];

export const TIMELINE_START_HOUR = 0;
export const TIMELINE_END_HOUR = 24;

export const TASK_DURATIONS = [
    { value: 5, label: '5 min' },
    { value: 10, label: '10 min' },
    { value: 15, label: '15 min' },
    { value: 30, label: '30 min' },
    { value: 60, label: '1 hora' },
    { value: 120, label: '2 horas' },
];

export const OPERATIONS_PIN = '1234';
import { Recipe, KanbanTask, InventoryItem } from './types';

export const RECIPES: Record<string, Recipe> = {
    roles: {
        id: 'roles',
        name: 'Roles de Canela',
        pluralName: 'Roles de Canela listos',
        setupInstruction: 'Configura el horno a 230°C y programa 16 minutos.',
        totalDuration: 14 * 60,
        steps: [
            { duration: 2 * 60, instruction: 'Coloca los roles en los niveles 1 y 3. Deja que el calor eleve el producto sin presionar INICIO.', isPauseStep: true },
            { duration: 6 * 60, instruction: 'Baja la temperatura a 210°C y comienza el horneado.' },
            { duration: 4 * 60, instruction: 'Gira las charolas 180 grados.' },
            { duration: 2 * 60, instruction: 'Agrega 20 ml de leche y gira cada rol 1/3 de vuelta en sentido contrario del reloj.' },
            { duration: 2 * 60, instruction: 'Vuelve a girar cada rol 1/3 de vuelta para finalizar.' }
        ]
    },
    ciabattas: {
        id: 'ciabattas',
        name: 'Ciabattas',
        pluralName: 'Ciabattas listas',
        setupInstruction: 'Configura el horno a 230°C y programa 30 minutos.',
        totalDuration: 28 * 60,
        steps: [
            { duration: 2 * 60, instruction: 'Coloca las charolas (niveles 1 y 3) y pulveriza agua 12 veces. Deja que el calor eleve el producto sin presionar INICIO.', isPauseStep: true },
            { duration: 8 * 60, instruction: 'Baja la temperatura a 210°C y comienza el horneado.' },
            { duration: 8 * 60, instruction: 'Gira las charolas 180 grados y vuelve a pulverizar agua 12 veces.' },
            { duration: 6 * 60, instruction: 'Intercambia las charolas de nivel y da vuelta a cada pieza 180 grados.' },
            { duration: 6 * 60, instruction: 'Gira las charolas 180 grados por última vez.' }
        ]
    },
    croissants: {
        id: 'croissants',
        name: 'Croissants',
        pluralName: 'Croissants listos',
        setupInstruction: 'Configura el horno a 230°C y programa 21 minutos.',
        totalDuration: 21 * 60,
        steps: [
            { duration: 3 * 60, instruction: 'Coloca las charolas en los niveles 1 y 3. Pulveriza agua 12 veces.' },
            { duration: 6 * 60, instruction: 'Baja la temperatura a 200°C y continua horneando. (Nota: Si horneas solo 1 charola, baja a 180°C)' },
            { duration: 5 * 60, instruction: 'Gira las charolas 180 grados.' },
            { duration: 5 * 60, instruction: 'Intercambia las charolas de nivel y gíralas 180 grados.' },
            { duration: 2 * 60, instruction: 'Gira las charolas 180 grados por última vez.' }
        ]
    }
};

const today = new Date();
const todayStr = today.toISOString().split('T')[0];

export const INITIAL_TASKS: Omit<KanbanTask, 'id'>[] = [
    // Today's tasks
    { text: 'Roles: Descongelar en refrigeración', employee: 'Ali', shift: 'matutino', date: todayStr, time: '08:00', duration: 30, isCritical: true, zone: 'Panadería', status: 'todo' },
    { text: 'Checar ingredientes diarios y comprarlos', employee: 'Ali', shift: 'pre-apertura', date: todayStr, time: '15:00', duration: 60, isCritical: true, zone: 'Cocina', status: 'todo' },
    { text: 'Hornear Roles', employee: 'Claudia', shift: 'pre-apertura', date: todayStr, time: '16:00', duration: 45, isCritical: true, zone: 'Panadería', status: 'todo' },
    { text: 'Hornear Croissants', employee: 'Claudia', shift: 'pre-apertura', date: todayStr, time: '16:30', duration: 45, isCritical: true, zone: 'Panadería', status: 'todo' }, // Overlap for demo
    { text: 'Corte de caja', employee: 'Fer', shift: 'cierre', date: todayStr, time: '21:50', duration: 20, isCritical: true, zone: 'Admin', status: 'todo' },
    // A couple more for today
    { text: 'Limpiar barra y area de barismo', employee: 'Claudia', shift: 'pre-apertura', date: todayStr, time: '17:00', duration: 30, isCritical: true, zone: 'Barra', status: 'todo' },
    { text: 'Hacer masa para ciabatta (día siguiente)', employee: 'Fer', shift: 'cierre', date: todayStr, time: '21:40', duration: 20, isCritical: true, zone: 'Panadería', status: 'todo' },
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

export const TIMELINE_START_HOUR = 8;
export const TIMELINE_END_HOUR = 22;

export const TASK_DURATIONS = [
    { value: 5, label: '5 min' },
    { value: 10, label: '10 min' },
    { value: 15, label: '15 min' },
    { value: 30, label: '30 min' },
    { value: 60, label: '1 hora' },
    { value: 120, label: '2 horas' },
];
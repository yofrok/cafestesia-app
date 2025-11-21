
import React from 'react';

const AppDocumentation: React.FC = () => {
    return (
        <div className="space-y-8 max-w-3xl mx-auto pb-12">
            <section>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Cafestesia Operations Manager</h2>
                <p className="text-gray-600 leading-relaxed">
                    Una aplicación web progresiva (PWA) diseñada como el "Sistema Operativo" integral para la gestión operativa de Cafestesia. 
                    Su objetivo es digitalizar y sincronizar los flujos de trabajo entre la cocina (panadería), la barra (bebidas) y la administración.
                </p>
            </section>

            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="font-bold text-blue-600 mb-2 flex items-center gap-2">
                        <span>🍞</span> Producción de Panadería
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">Asistente digital para procesos de larga duración.</p>
                    <ul className="list-disc list-inside text-sm text-gray-500 space-y-1">
                        <li>Temporizadores persistentes (Horas/Min).</li>
                        <li>Pasos Activos (Manual) vs Pasivos (Espera).</li>
                        <li>Alertas sonoras y visuales.</li>
                    </ul>
                </div>

                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="font-bold text-purple-600 mb-2 flex items-center gap-2">
                        <span>📋</span> Operaciones (Kanban)
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">Gestión de tareas y rutinas del personal.</p>
                    <ul className="list-disc list-inside text-sm text-gray-500 space-y-1">
                        <li>Agenda Diaria (Timeline) y Tablero.</li>
                        <li>Rutinas Maestras con asignación inteligente.</li>
                        <li>Validación por PIN para acciones sensibles.</li>
                    </ul>
                </div>

                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="font-bold text-amber-600 mb-2 flex items-center gap-2">
                        <span>☕</span> Barra (KDS & POS)
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">Sistema de Comandas y Pantalla de Cocina.</p>
                    <ul className="list-disc list-inside text-sm text-gray-500 space-y-1">
                        <li>POS Simplificado (Botones grandes).</li>
                        <li>KDS Barista con semáforo de tiempos.</li>
                        <li>Ayuda en vivo (Recetas rápidas).</li>
                    </ul>
                </div>

                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="font-bold text-emerald-600 mb-2 flex items-center gap-2">
                        <span>📦</span> Inventario
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">Control de stock e insumos críticos.</p>
                    <ul className="list-disc list-inside text-sm text-gray-500 space-y-1">
                        <li>Listas de compras automáticas.</li>
                        <li>Historial de precios por proveedor.</li>
                    </ul>
                </div>
            </section>

            <section className="bg-gray-100 p-6 rounded-xl border border-gray-300">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Análisis para Web Design System (WDS)</h3>
                
                <div className="space-y-4">
                    <div>
                        <h4 className="font-bold text-sm text-gray-700 uppercase tracking-wider mb-2">Tokens de Diseño Implícitos</h4>
                        <div className="flex flex-wrap gap-3">
                            <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full border text-xs">
                                <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                                <span>Acción / Info</span>
                            </div>
                            <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full border text-xs">
                                <div className="w-3 h-3 rounded-full bg-red-600"></div>
                                <span>Alerta / Error</span>
                            </div>
                            <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full border text-xs">
                                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                <span>Precaución / Progreso</span>
                            </div>
                            <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full border text-xs">
                                <div className="w-3 h-3 rounded-full bg-teal-500"></div>
                                <span>Pasivo / Espera</span>
                            </div>
                            <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full border text-xs">
                                <div className="w-3 h-3 rounded-full bg-green-600"></div>
                                <span>Éxito / Completado</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                        <div>
                            <h4 className="font-bold text-sm text-gray-700 mb-1">Átomos</h4>
                            <p className="text-xs text-gray-500">Componentes base indivisibles.</p>
                            <ul className="mt-2 text-sm text-gray-600 space-y-1">
                                <li>• Button (Primary, Secondary, Danger)</li>
                                <li>• Icon (SVG System)</li>
                                <li>• Input / Select</li>
                                <li>• Badge / Tag</li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold text-sm text-gray-700 mb-1">Moléculas</h4>
                            <p className="text-xs text-gray-500">Agrupaciones funcionales simples.</p>
                            <ul className="mt-2 text-sm text-gray-600 space-y-1">
                                <li>• ProcessCard (Tarjeta de Proceso)</li>
                                <li>• KanbanCard (Tarjeta de Tarea)</li>
                                <li>• SwipeButton (Botón deslizante)</li>
                                <li>• InventoryItemRow</li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold text-sm text-gray-700 mb-1">Organismos</h4>
                            <p className="text-xs text-gray-500">Secciones complejas de la UI.</p>
                            <ul className="mt-2 text-sm text-gray-600 space-y-1">
                                <li>• Modal (Contenedor genérico)</li>
                                <li>• Sidebar (Navegación)</li>
                                <li>• DailyAgendaView (Timeline)</li>
                                <li>• BeveragePOS (Grid interactivo)</li>
                            </ul>
                        </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-gray-300">
                        <p className="text-sm font-semibold text-blue-800 bg-blue-50 p-3 rounded-lg border border-blue-100">
                            ℹ️ <strong>Conclusión:</strong> La integración en un WDS es altamente viable. La aplicación ya utiliza patrones consistentes que pueden extraerse y documentarse fácilmente para escalar el desarrollo de futuros módulos.
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default AppDocumentation;

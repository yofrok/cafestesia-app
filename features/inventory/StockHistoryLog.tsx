
import React, { useState, useMemo } from 'react';
import { StockLog, StockLogType } from '../../types';
import Icon from '../../components/Icon';

interface StockHistoryLogProps {
    logs: StockLog[];
    onClose: () => void;
}

const StockHistoryLog: React.FC<StockHistoryLogProps> = ({ logs, onClose }) => {
    const [filterType, setFilterType] = useState<StockLogType | 'all'>('all');

    const filteredLogs = useMemo(() => {
        if (filterType === 'all') return logs;
        return logs.filter(log => log.type === filterType);
    }, [logs, filterType]);

    const getTypeStyles = (type: StockLogType) => {
        switch (type) {
            case 'production': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'purchase': return 'bg-green-100 text-green-800 border-green-200';
            case 'waste': return 'bg-red-100 text-red-800 border-red-200';
            case 'consumption': return 'bg-gray-100 text-gray-600 border-gray-200';
            default: return 'bg-gray-50 text-gray-800 border-gray-200';
        }
    };

    const getTypeLabel = (type: StockLogType) => {
        switch (type) {
            case 'production': return 'Producción';
            case 'purchase': return 'Compra';
            case 'waste': return 'Merma';
            case 'consumption': return 'Insumo Receta';
            case 'adjustment': return 'Ajuste';
            default: return type;
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-100 z-50 flex flex-col animate-fadeIn">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                        <Icon name="list" size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">Historial de Movimientos</h2>
                        <p className="text-sm text-gray-500">Trazabilidad completa de stock y producción.</p>
                    </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition-colors">
                    <Icon name="x" size={24} />
                </button>
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-2 border-b border-gray-200 flex gap-2 overflow-x-auto">
                {(['all', 'production', 'purchase', 'waste', 'adjustment'] as const).map(type => (
                    <button
                        key={type}
                        onClick={() => setFilterType(type)}
                        className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${
                            filterType === type 
                                ? 'bg-gray-800 text-white' 
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        {type === 'all' ? 'Todos' : getTypeLabel(type)}
                    </button>
                ))}
            </div>

            {/* Table View */}
            <div className="flex-grow overflow-auto p-4">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-bold">
                            <tr>
                                <th className="p-4">Fecha / Hora</th>
                                <th className="p-4">Tipo</th>
                                <th className="p-4">Producto</th>
                                <th className="p-4 text-right">Cantidad</th>
                                <th className="p-4">Responsable</th>
                                <th className="p-4">Detalle / Motivo</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm divide-y divide-gray-100">
                            {filteredLogs.map(log => (
                                <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="p-4 whitespace-nowrap text-gray-600">
                                        {new Date(log.date).toLocaleDateString()} <br/>
                                        <span className="text-xs text-gray-400">{new Date(log.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold border ${getTypeStyles(log.type)}`}>
                                            {getTypeLabel(log.type)}
                                        </span>
                                    </td>
                                    <td className="p-4 font-medium text-gray-800">{log.itemName}</td>
                                    <td className={`p-4 text-right font-bold ${log.quantityChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {log.quantityChange > 0 ? '+' : ''}{log.quantityChange} {log.unit}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                                                {log.responsible.charAt(0)}
                                            </div>
                                            <span className="text-gray-700">{log.responsible}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-gray-500 italic max-w-xs truncate" title={log.reason || log.recipeName}>
                                        {log.reason || log.recipeName || '-'}
                                    </td>
                                </tr>
                            ))}
                            {filteredLogs.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-gray-400 italic">
                                        No hay registros que coincidan con el filtro.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default StockHistoryLog;

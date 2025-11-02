import React from 'react';
import Modal from '../../components/Modal';

interface EditOptionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectThisOne: () => void;
    onSelectFuture: () => void;
    isDelete?: boolean;
}

const EditOptionsModal: React.FC<EditOptionsModalProps> = ({ isOpen, onClose, onSelectThisOne, onSelectFuture, isDelete = false }) => {
    const verb = isDelete ? 'eliminar' : 'editar';
    const title = `¿Qué tareas quieres ${verb}?`;
    const option1Title = isDelete ? 'Eliminar solo esta tarea' : 'Editar solo esta tarea';
    const option1Desc = `La acción solo se aplicará a esta instancia. El resto de la serie no se verá afectado.`;
    const option2Title = isDelete ? 'Eliminar esta y futuras tareas' : 'Editar esta y futuras tareas';
    const option2Desc = `La acción se aplicará a esta y a todas las repeticiones futuras de la serie.`;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <div className="flex flex-col gap-4">
                <button
                    onClick={onSelectThisOne}
                    className="p-4 bg-gray-100 rounded-lg border-2 border-transparent hover:border-blue-500 transition-all text-left"
                >
                    <h4 className="font-bold text-gray-800">{option1Title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{option1Desc}</p>
                </button>
                <button
                    onClick={onSelectFuture}
                    className="p-4 bg-gray-100 rounded-lg border-2 border-transparent hover:border-blue-500 transition-all text-left"
                >
                    <h4 className="font-bold text-gray-800">{option2Title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{option2Desc}</p>
                </button>

                <div className="flex justify-end mt-4">
                    <button type="button" onClick={onClose} className="py-2 px-4 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300">Cancelar</button>
                </div>
            </div>
        </Modal>
    );
};

export default EditOptionsModal;
import React, { useState } from 'react';
import Modal from '../../components/Modal';
import Icon from '../../components/Icon';

interface FeedbackModalProps {
    isOpen: boolean;
    processName: string;
    onSave: (rating: number, notes: string) => void;
    onSkip: () => void;
}

const StarRating: React.FC<{ rating: number; setRating: (rating: number) => void }> = ({ rating, setRating }) => {
    return (
        <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    type="button"
                    key={star}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => {}}
                    onMouseLeave={() => {}}
                    className="transition-transform transform hover:scale-125"
                >
                    <Icon 
                        name="star" 
                        size={40} 
                        className={`cursor-pointer ${star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                    />
                </button>
            ))}
        </div>
    );
};

const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, processName, onSave, onSkip }) => {
    const [rating, setRating] = useState(3);
    const [notes, setNotes] = useState('');

    const handleSave = () => {
        onSave(rating, notes);
    };

    return (
        <Modal isOpen={isOpen} onClose={onSkip} title={`Feedback para: ${processName}`}>
            <div className="flex flex-col gap-6">
                <div className="text-center">
                    <label className="block text-sm font-medium text-gray-600 mb-2">¿Qué tal salió el resultado?</label>
                    <StarRating rating={rating} setRating={setRating} />
                </div>
                <div>
                    <label htmlFor="feedback-notes" className="block text-sm font-medium text-gray-600 mb-1">Notas (Opcional)</label>
                    <textarea
                        id="feedback-notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={4}
                        placeholder="Ej: El color fue perfecto, pero la próxima vez intentaré con 1 minuto menos..."
                        className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div className="flex justify-between items-center mt-4">
                    <button type="button" onClick={onSkip} className="py-2 px-4 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300">
                        Omitir
                    </button>
                    <button type="button" onClick={handleSave} className="py-2 px-6 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700">
                        Guardar
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default FeedbackModal;
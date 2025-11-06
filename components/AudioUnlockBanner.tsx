import React from 'react';
import Icon from './Icon';

interface AudioUnlockBannerProps {
    onUnlock: () => void;
}

const AudioUnlockBanner: React.FC<AudioUnlockBannerProps> = ({ onUnlock }) => {
    return (
        <div 
            className="absolute bottom-4 left-1/2 -translate-x-1/2 w-11/12 max-w-md bg-gray-800 text-white rounded-lg shadow-lg p-3 z-50 cursor-pointer transition-transform hover:scale-105 animate-pulse"
            onClick={onUnlock}
            role="button"
            tabIndex={0}
            aria-label="Activar sonidos"
        >
            <div className="flex items-center justify-center gap-3">
                <Icon name="volume-x" size={20} />
                <span className="font-semibold text-sm">Toca para activar los sonidos de alerta</span>
            </div>
        </div>
    );
};

export default AudioUnlockBanner;

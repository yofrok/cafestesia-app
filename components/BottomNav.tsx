
import React from 'react';
import { Screen } from '../types';
import Icon from './Icon';

interface BottomNavProps {
    activeScreen: Screen;
    setActiveScreen: (screen: Screen) => void;
    isBakingRelatedScreen: (screen: Screen) => boolean;
    urgentTasksCount: number;
    shoppingListCount: number;
    inProgressTasksCount: number;
}

const NavButton: React.FC<{ isActive: boolean; onClick: () => void; hasNotification: boolean; children: React.ReactNode; }> = ({ isActive, onClick, hasNotification, children }) => (
    <button onClick={onClick} className="relative flex flex-col items-center justify-center gap-1 p-2 h-full flex-grow text-xs font-bold transition-colors duration-200"
    >
        <div className={`transition-colors ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
            {children}
        </div>
        {hasNotification && <span className="absolute top-2 right-4 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>}
    </button>
);


const BottomNav: React.FC<BottomNavProps> = ({ activeScreen, setActiveScreen, isBakingRelatedScreen, urgentTasksCount, shoppingListCount, inProgressTasksCount }) => {
    
    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-white border-t border-gray-200 flex justify-around items-center z-50">
            <NavButton
                isActive={isBakingRelatedScreen(activeScreen)}
                onClick={() => setActiveScreen(Screen.Baking)}
                hasNotification={false} // Baking has its own prominent UI, no dot needed
            >
                <Icon name="cake-slice" size={24} />
                <span>Pan</span>
            </NavButton>
            <NavButton
                isActive={activeScreen === Screen.Operations}
                onClick={() => setActiveScreen(Screen.Operations)}
                hasNotification={urgentTasksCount > 0 || inProgressTasksCount > 0}
            >
                <Icon name="clipboard-kanban" size={24} />
                <span>Operaciones</span>
            </NavButton>
            <NavButton
                isActive={activeScreen === Screen.Inventory}
                onClick={() => setActiveScreen(Screen.Inventory)}
                hasNotification={shoppingListCount > 0}
            >
                <Icon name="archive" size={24} />
                <span>Inventario</span>
            </NavButton>
            <NavButton
                isActive={activeScreen === Screen.Settings}
                onClick={() => setActiveScreen(Screen.Settings)}
                hasNotification={false}
            >
                <Icon name="settings" size={24} />
                <span>Ajustes</span>
            </NavButton>
        </nav>
    );
};

export default BottomNav;

import { useProductionAlerts } from '../features/baking/useProductionAlerts';

/**
 * @deprecated This hook is now a wrapper for useProductionAlerts. 
 * Please use useProductionAlerts directly for new implementations.
 * This file is maintained for compatibility with existing components.
 */
export const useAudioAlerts = () => {
    // This now points to the single, unified audio hook for the entire application.
    const { playNotification } = useProductionAlerts();
    
    // Maintain the old 'playAlert' name for compatibility with App.tsx
    return { playAlert: playNotification };
};

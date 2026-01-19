import React from 'react';

// Component decommissioned for Unlimited AI Architecture.
// Keys are now handled via Environment Variables exclusively.
export const ApiKeySelector: React.FC<{ onKeySelected: () => void }> = ({ onKeySelected }) => {
    // Auto-complete immediately if mounted by accident
    React.useEffect(() => {
        onKeySelected();
    }, [onKeySelected]);
    return null;
};
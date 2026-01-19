import React from 'react';

// Component decommissioned for Unlimited AI Architecture.
// Keys are now handled via Environment Variables exclusively.
export const Setup: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
    // Auto-complete immediately if mounted by accident
    React.useEffect(() => {
        onComplete();
    }, [onComplete]);
    return null;
};
import { useState } from 'react';

/**
 * Hover-activated tooltip that displays content near a trigger element.
 * @param {Object} props
 * @param {import('react').ReactNode} props.children - Trigger element(s)
 * @param {import('react').ReactNode} props.content  - Tooltip content
 * @param {'top'|'bottom'|'left'|'right'} [props.position='top'] - Tooltip placement
 */
const Tooltip = ({ children, content, position = 'top' }) => {
    const [isVisible, setIsVisible] = useState(false);

    const positionClasses = {
        top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
        bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
        left: 'right-full top-1/2 -translate-y-1/2 mr-2',
        right: 'left-full top-1/2 -translate-y-1/2 ml-2'
    };

    return (
        <div
            className="relative inline-flex items-center"
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
        >
            {children}
            {isVisible && (
                <div className={`absolute ${positionClasses[position]} z-50 w-64 p-3 glass-card text-sm text-[#a09bb5] animate-in fade-in duration-200`}>
                    {content}
                    <div className={`absolute w-2 h-2 bg-[#1a1a2e] border-r border-b border-white/10 transform rotate-45 ${
                        position === 'top' ? 'top-full left-1/2 -translate-x-1/2 -mt-1' :
                        position === 'bottom' ? 'bottom-full left-1/2 -translate-x-1/2 -mb-1 rotate-[225deg]' :
                        position === 'left' ? 'left-full top-1/2 -translate-y-1/2 -ml-1 rotate-[135deg]' :
                        'right-full top-1/2 -translate-y-1/2 -mr-1 rotate-[315deg]'
                    }`} />
                </div>
            )}
        </div>
    );
};

export default Tooltip;

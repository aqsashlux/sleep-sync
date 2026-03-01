import { useEffect } from 'react';

/**
 * Registers mousedown and Escape key listeners to call onClose
 * when a click occurs outside the referenced element or Escape is pressed.
 * @param {import('react').RefObject<HTMLElement>} ref - Ref to the container element
 * @param {(() => void)|null} onClose - Callback to invoke on outside click/escape (no-op if null)
 */
export function useClickOutside(ref, onClose) {
    useEffect(() => {
        if (!onClose) return;
        const handleClickOutside = (e) => {
            if (ref.current && !ref.current.contains(e.target)) {
                onClose();
            }
        };
        const handleEscape = (e) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [ref, onClose]);
}

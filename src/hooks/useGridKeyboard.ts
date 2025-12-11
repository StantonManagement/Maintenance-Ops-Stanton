import { useEffect } from 'react';

interface UseGridKeyboardProps {
  selectedIds: string[];
  allIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onEnter: (id: string) => void;
  focusedId: string | null;
  setFocusedId: (id: string | null) => void;
}

export function useGridKeyboard({
  selectedIds,
  allIds,
  onSelectionChange,
  onEnter,
  focusedId,
  setFocusedId
}: UseGridKeyboardProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if no modal is open (checking body overflow or a specific class could be robust, but simplistic for now)
      if (document.body.style.overflow === 'hidden') return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const currentIndex = focusedId ? allIds.indexOf(focusedId) : -1;
        const nextIndex = Math.min(currentIndex + 1, allIds.length - 1);
        setFocusedId(allIds[nextIndex]);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const currentIndex = focusedId ? allIds.indexOf(focusedId) : 0;
        const prevIndex = Math.max(currentIndex - 1, 0);
        setFocusedId(allIds[prevIndex]);
      } else if (e.key === ' ' && focusedId) {
        e.preventDefault();
        if (selectedIds.includes(focusedId)) {
          onSelectionChange(selectedIds.filter(id => id !== focusedId));
        } else {
          onSelectionChange([...selectedIds, focusedId]);
        }
      } else if (e.key === 'Enter' && focusedId) {
        e.preventDefault();
        onEnter(focusedId);
      } else if (e.key === 'Escape') {
        if (selectedIds.length > 0) {
          e.preventDefault();
          onSelectionChange([]);
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        onSelectionChange(allIds);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [allIds, selectedIds, focusedId, onSelectionChange, onEnter, setFocusedId]);
}

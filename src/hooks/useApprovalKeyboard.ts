import { useEffect } from 'react';
import { WorkOrderForApproval } from '@/components/approval-queue/QuickReviewCard';

interface UseApprovalKeyboardOptions {
  items: WorkOrderForApproval[];
  focusedIndex: number;
  onFocusChange: (index: number) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onExpand: (id: string) => void;
}

export function useApprovalKeyboard(options: UseApprovalKeyboardOptions) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      const currentItem = options.items[options.focusedIndex];
      
      switch (e.key) {
        case 'ArrowUp':
        case 'k':
          e.preventDefault();
          options.onFocusChange(Math.max(0, options.focusedIndex - 1));
          break;
        case 'ArrowDown':
        case 'j':
          e.preventDefault();
          options.onFocusChange(Math.min(options.items.length - 1, options.focusedIndex + 1));
          break;
        case 'a':
        case 'A':
          e.preventDefault();
          if (currentItem) options.onApprove(currentItem.id);
          break;
        case 'r':
        case 'R':
          e.preventDefault();
          if (currentItem) options.onReject(currentItem.id);
          break;
        case 'Enter':
        case 'e':
          e.preventDefault();
          if (currentItem) options.onExpand(currentItem.id);
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [options]);
}

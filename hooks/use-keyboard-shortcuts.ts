import { useEffect } from 'react';

interface ShortcutHandlers {
  onSearch?: () => void;
  onNewDeal?: () => void;
  onEscape?: () => void;
}

export function useKeyboardShortcuts({ onSearch, onNewDeal, onEscape }: ShortcutHandlers) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable;

      // Cmd/Ctrl + K — focus search
      if (mod && e.key === 'k') {
        e.preventDefault();
        onSearch?.();
        return;
      }

      // Cmd/Ctrl + N — new deal (only when not in an input)
      if (mod && e.key === 'n' && !isInput) {
        e.preventDefault();
        onNewDeal?.();
        return;
      }

      // Escape — close modals
      if (e.key === 'Escape') {
        onEscape?.();
        return;
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onSearch, onNewDeal, onEscape]);
}

export const SHORTCUTS = [
  { keys: ['Ctrl', 'K'], description: 'Focus search bar' },
  { keys: ['Ctrl', 'N'], description: 'Create new deal' },
  { keys: ['Esc'], description: 'Close modal / dropdown' },
] as const;

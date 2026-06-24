import { useEffect } from 'react';
import { useData } from '../context/DataContext';
import { isTypingTarget } from './useIsTypingTarget';

/** Global shortcuts: Ctrl/Cmd+N → new problem */
export function useGlobalKeyboardShortcuts() {
  const { createNewProblem } = useData();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return;

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        createNewProblem();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [createNewProblem]);
}

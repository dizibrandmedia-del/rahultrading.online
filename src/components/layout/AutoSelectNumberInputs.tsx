'use client';

import { useEffect } from 'react';

/**
 * Global helper to automatically select all text when clicking or focusing on any number input.
 * Allows instant direct overwrite without manual backspacing or editing.
 */
export function AutoSelectNumberInputs() {
  useEffect(() => {
    const handleSelect = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target && target.tagName === 'INPUT') {
        const input = target as HTMLInputElement;
        if (
          input.type === 'number' ||
          input.inputMode === 'numeric' ||
          input.inputMode === 'decimal' ||
          input.classList.contains('auto-select-num')
        ) {
          // Use requestAnimationFrame so selection executes after browser mouseup cursor placement
          requestAnimationFrame(() => {
            try {
              input.select();
            } catch (err) {
              // Ignore if browser restricts select
            }
          });
        }
      }
    };

    // Use capture phase so all dynamic inputs in portals, modals, and tables are caught
    document.addEventListener('focusin', handleSelect, true);
    document.addEventListener('click', handleSelect, true);
    document.addEventListener('mouseup', handleSelect, true);

    // Suppress browser header title during printing
    let previousDocTitle = '';
    const handleBeforePrint = () => {
      previousDocTitle = document.title;
      document.title = ' ';
    };
    const handleAfterPrint = () => {
      if (previousDocTitle) {
        document.title = previousDocTitle;
      }
    };

    window.addEventListener('beforeprint', handleBeforePrint);
    window.addEventListener('afterprint', handleAfterPrint);

    return () => {
      document.removeEventListener('focusin', handleSelect, true);
      document.removeEventListener('click', handleSelect, true);
      document.removeEventListener('mouseup', handleSelect, true);
      window.removeEventListener('beforeprint', handleBeforePrint);
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, []);

  return null;
}

export default AutoSelectNumberInputs;

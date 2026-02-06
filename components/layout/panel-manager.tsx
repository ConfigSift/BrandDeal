'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NewDealForm } from '@/components/deals/new-deal-form';
import { DealDetailPanel } from '@/components/deals/deal-detail-panel';
import { toast } from '@/components/ui/toaster';

export type PanelType = 'new-deal' | 'deal-detail';

export type PanelState = {
  id: string;
  type: PanelType;
  title: string;
  dealId?: string;
};

type PanelContextValue = {
  panels: PanelState[];
  activePanelId: string | null;
  openPanel: (panel: PanelState) => void;
  closePanel: (id: string) => void;
  setActivePanel: (id: string) => void;
  closeActivePanel: () => void;
};

const PanelManagerContext = createContext<PanelContextValue | null>(null);

export function PanelProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [panels, setPanels] = useState<PanelState[]>([]);
  const [activePanelId, setActivePanelId] = useState<string | null>(null);

  const openPanel = useCallback((panel: PanelState) => {
    setPanels((prev) => {
      const exists = prev.find((p) => p.id === panel.id);
      if (exists) {
        return prev.map((p) => (p.id === panel.id ? { ...p, ...panel } : p));
      }
      return [...prev, panel];
    });
    setActivePanelId(panel.id);
  }, []);

  const closePanel = useCallback((id: string) => {
    setPanels((prev) => {
      const next = prev.filter((panel) => panel.id !== id);
      setActivePanelId((prevActive) => {
        if (prevActive !== id) return prevActive;
        return next.length ? next[next.length - 1].id : null;
      });
      return next;
    });
  }, []);

  const setActivePanel = useCallback((id: string) => {
    setActivePanelId(id);
  }, []);

  const closeActivePanel = useCallback(() => {
    if (activePanelId) closePanel(activePanelId);
  }, [activePanelId, closePanel]);

  useEffect(() => {
    if (!panels.length) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeActivePanel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [panels.length, closeActivePanel]);

  const isOpen = panels.length > 0;

  useEffect(() => {
    if (!isOpen) return;
    const body = document.body;
    const originalOverflow = body.style.overflow;
    const originalPaddingRight = body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      body.style.overflow = originalOverflow;
      body.style.paddingRight = originalPaddingRight;
    };
  }, [isOpen]);

  const value = useMemo(
    () => ({ panels, activePanelId, openPanel, closePanel, setActivePanel, closeActivePanel }),
    [panels, activePanelId, openPanel, closePanel, setActivePanel, closeActivePanel]
  );

  const activePanel = panels.find((panel) => panel.id === activePanelId) || null;
  const isOpenPanel = Boolean(activePanel);

  return (
    <PanelManagerContext.Provider value={value}>
      {children}
      <PanelOverlay
        isOpen={isOpenPanel}
        panel={activePanel}
        onClose={closeActivePanel}
        onCloseById={closePanel}
        onCreated={() => {
          toast({ title: 'Deal created', description: 'Your new deal has been added.' });
          router.refresh();
        }}
      />
    </PanelManagerContext.Provider>
  );
}

export function usePanelManager() {
  const context = useContext(PanelManagerContext);
  if (!context) {
    throw new Error('usePanelManager must be used within a PanelProvider');
  }
  return context;
}

function PanelOverlay({
  isOpen,
  panel,
  onClose,
  onCloseById,
  onCreated,
}: {
  isOpen: boolean;
  panel: PanelState | null;
  onClose: () => void;
  onCloseById: (id: string) => void;
  onCreated: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const titleId = panel ? `overlay-${panel.id}-title` : 'overlay-title';

  useEffect(() => {
    if (!isOpen) return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    requestAnimationFrame(() => {
      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => !el.hasAttribute('disabled'));
      const first = focusable[0] || dialog;
      if (first instanceof HTMLElement) {
        first.focus();
      } else {
        dialog.focus();
      }
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => !el.hasAttribute('disabled'));
      if (focusable.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    dialog.addEventListener('keydown', handleKeyDown);
    return () => {
      dialog.removeEventListener('keydown', handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [isOpen]);

  return (
    <div className={cn("fixed inset-0 z-50", isOpen ? "pointer-events-auto" : "pointer-events-none")}>
      <div
        className={cn(
          "absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity duration-200",
          isOpen ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
      />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-hidden={!isOpen}
          tabIndex={-1}
          className={cn(
            "w-full max-w-4xl max-h-[85vh] bg-white border border-gray-100 rounded-2xl shadow-2xl transition-all duration-200 overflow-hidden",
            isOpen ? "scale-100 opacity-100" : "scale-95 opacity-0"
          )}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="h-14 flex items-center justify-between px-5 border-b border-gray-100 bg-white">
            <div id={titleId} className="text-sm font-semibold text-midnight-800 truncate">
              {panel?.title}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
              aria-label="Close dialog"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="max-h-[calc(85vh-3.5rem)] overflow-y-auto bg-surface-50 p-6">
            {panel && panel.type === 'new-deal' && (
              <NewDealForm
                variant="panel"
                onCancel={onClose}
                onSuccess={() => {
                  onCloseById(panel.id);
                  onCreated();
                }}
              />
            )}
            {panel && panel.type === 'deal-detail' && panel.dealId && (
              <DealDetailPanel dealId={panel.dealId} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

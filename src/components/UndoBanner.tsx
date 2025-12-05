import { Check, RotateCcw } from "lucide-react";
import { Button } from "./ui/button";
import { useEffect, useState } from "react";

export interface UndoAction {
  id: string;
  message: string;
  onUndo: () => void;
  duration?: number;
}

interface UndoBannerProps {
  actions: UndoAction[];
  onActionExpire: (id: string) => void;
}

export function UndoBanner({ actions, onActionExpire }: UndoBannerProps) {
  const [countdowns, setCountdowns] = useState<Record<string, number>>({});

  useEffect(() => {
    // Initialize countdown for new actions
    actions.forEach(action => {
      if (!(action.id in countdowns)) {
        setCountdowns(prev => ({ ...prev, [action.id]: action.duration || 5 }));
      }
    });

    // Set up countdown timers
    const interval = setInterval(() => {
      setCountdowns(prev => {
        const newCountdowns = { ...prev };
        Object.keys(newCountdowns).forEach(id => {
          if (newCountdowns[id] > 0) {
            newCountdowns[id] -= 1;
          } else {
            onActionExpire(id);
            delete newCountdowns[id];
          }
        });
        return newCountdowns;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [actions, onActionExpire]);

  if (actions.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-40 flex flex-col">
      {actions.map((action) => (
        <div
          key={action.id}
          className="w-full border-b px-6 py-4 flex items-center justify-between animate-slide-down"
          style={{
            backgroundColor: 'var(--status-warning-bg)',
            borderColor: 'var(--status-warning-border)',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          <div className="flex items-center gap-3">
            <Check className="h-5 w-5" style={{ color: 'var(--status-success-icon)' }} />
            <span className="text-[16px]" style={{ color: 'var(--text-primary)' }}>
              {action.message}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Button
              className="h-10 px-5 text-[14px] gap-2 border"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-default)',
                color: 'var(--text-primary)',
                borderRadius: 'var(--radius-md)',
              }}
              onClick={action.onUndo}
            >
              <RotateCcw className="h-4 w-4" />
              UNDO
            </Button>
            <span className="text-[16px] font-mono min-w-[40px]" style={{ color: 'var(--text-secondary)' }}>
              ({countdowns[action.id] || 0}s)
            </span>
          </div>
        </div>
      ))}

      <style>{`
        @keyframes slide-down {
          from {
            transform: translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-down {
          animation: slide-down 200ms ease-out;
        }
      `}</style>
    </div>
  );
}

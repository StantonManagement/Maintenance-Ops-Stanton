import { useState, useRef, TouchEvent } from "react";
import { Check, UserPlus } from "lucide-react";
import { WorkOrder } from "../types";

interface SwipeableWorkOrderCardProps {
  workOrder: WorkOrder;
  onComplete: (id: string) => void;
  onAssign: (id: string) => void;
  onClick: () => void;
  children: React.ReactNode;
}

export default function SwipeableWorkOrderCard({
  workOrder,
  onComplete,
  onAssign,
  onClick,
  children,
}: SwipeableWorkOrderCardProps) {
  const [touchStart, setTouchStart] = useState(0);
  const [touchCurrent, setTouchCurrent] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
    setTouchCurrent(e.touches[0].clientX);
    setIsSwiping(true);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isSwiping) return;
    setTouchCurrent(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    const diff = touchCurrent - touchStart;
    const threshold = 100; // minimum swipe distance

    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        // Swipe right - complete
        onComplete(workOrder.id);
      } else {
        // Swipe left - assign
        onAssign(workOrder.id);
      }
    }

    setIsSwiping(false);
    setTouchStart(0);
    setTouchCurrent(0);
  };

  const swipeOffset = isSwiping ? touchCurrent - touchStart : 0;
  const isSwipingRight = swipeOffset > 0;
  const isSwipingLeft = swipeOffset < 0;
  const swipeProgress = Math.min(Math.abs(swipeOffset) / 100, 1);

  return (
    <div className="relative overflow-hidden">
      {/* Background actions */}
      <div className="absolute inset-0 flex">
        {/* Left side - Complete action (revealed on right swipe) */}
        <div
          className="flex items-center justify-start pl-6 flex-1 transition-opacity"
          style={{
            backgroundColor: "var(--status-success-bg)",
            opacity: isSwipingRight ? swipeProgress : 0,
          }}
        >
          <div className="flex items-center gap-2" style={{ color: "var(--status-success-text)" }}>
            <Check size={24} />
            <span style={{ fontSize: "16px", fontWeight: 600 }}>Complete</span>
          </div>
        </div>

        {/* Right side - Assign action (revealed on left swipe) */}
        <div
          className="flex items-center justify-end pr-6 flex-1 transition-opacity"
          style={{
            backgroundColor: "var(--action-primary)",
            opacity: isSwipingLeft ? swipeProgress : 0,
          }}
        >
          <div className="flex items-center gap-2" style={{ color: "white" }}>
            <span style={{ fontSize: "16px", fontWeight: 600 }}>Assign</span>
            <UserPlus size={24} />
          </div>
        </div>
      </div>

      {/* Card content */}
      <div
        ref={cardRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={onClick}
        className="relative transition-transform"
        style={{
          transform: `translateX(${swipeOffset}px)`,
          transition: isSwiping ? "none" : "transform 0.3s ease",
        }}
      >
        {children}
      </div>
    </div>
  );
}

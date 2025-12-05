import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "./ui/button";
import { PhaseProgressionIndicator } from "./PhaseProgressionIndicator";
import { Phase2Calendar } from "./Phase2Calendar";
import { Phase3Analytics } from "./Phase3Analytics";

type FeatureView =
  | "progression"
  | "phase2-calendar"
  | "phase2-map"
  | "phase2-ai-photo"
  | "phase2-auto-comm"
  | "phase2-workload"
  | "phase3-analytics"
  | "phase3-financial"
  | "phase3-unit-profile"
  | "phase3-tenant-profile"
  | "phase3-predictive"
  | "phase3-portfolio";

interface FutureFeaturesProps {
  onClose: () => void;
}

export default function FutureFeatures({ onClose }: FutureFeaturesProps) {
  const [view, setView] = useState<FeatureView>("progression");

  const phase2Features = [
    { id: "phase2-calendar" as const, label: "Calendar Scheduling", implemented: true },
    { id: "phase2-map" as const, label: "Real-time Tracking", implemented: false },
    { id: "phase2-ai-photo" as const, label: "AI Photo Analysis", implemented: false },
    { id: "phase2-auto-comm" as const, label: "Automated Communication", implemented: false },
    { id: "phase2-workload" as const, label: "Workload Protection", implemented: false },
  ];

  const phase3Features = [
    { id: "phase3-analytics" as const, label: "Advanced Analytics", implemented: true },
    { id: "phase3-financial" as const, label: "Financial Intelligence", implemented: false },
    { id: "phase3-unit-profile" as const, label: "Unit Profiles", implemented: false },
    { id: "phase3-tenant-profile" as const, label: "Tenant Profiles", implemented: false },
    { id: "phase3-predictive" as const, label: "Predictive Maintenance", implemented: false },
    { id: "phase3-portfolio" as const, label: "Portfolio Scaling", implemented: false },
  ];

  const renderContent = () => {
    switch (view) {
      case "progression":
        return <PhaseProgressionIndicator />;
      case "phase2-calendar":
        return <Phase2Calendar />;
      case "phase3-analytics":
        return <Phase3Analytics />;
      default:
        return (
          <div
            className="flex-1 flex items-center justify-center"
            style={{ backgroundColor: "var(--bg-primary)" }}
          >
            <div className="text-center max-w-lg p-8">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{
                  backgroundColor: view.startsWith("phase2")
                    ? "var(--phase-2-border)"
                    : "var(--phase-3-border)",
                  opacity: 0.2,
                }}
              >
                <div
                  className="text-4xl"
                  style={{
                    color: view.startsWith("phase2")
                      ? "var(--phase-2-icon)"
                      : "var(--phase-3-icon)",
                  }}
                >
                  🔒
                </div>
              </div>
              <h3 className="mb-2" style={{ fontSize: "20px", fontWeight: 600 }}>
                Coming Soon
              </h3>
              <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
                This feature preview is currently being developed. Check back soon for a detailed
                visual mockup.
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: "var(--bg-card)" }}>
      {/* Header */}
      <div
        className="h-16 border-b flex items-center justify-between px-6"
        style={{
          backgroundColor: "var(--bg-card)",
          borderColor: "var(--border-default)",
        }}
      >
        <div>
          <h2 style={{ fontSize: "20px", fontWeight: 600 }}>Future Features Preview</h2>
          <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>
            Phase 2 & 3 Product Roadmap
          </p>
        </div>
        <Button
          onClick={onClose}
          className="h-10 w-10 p-0 border"
          style={{
            backgroundColor: "var(--bg-card)",
            borderColor: "var(--border-default)",
          }}
        >
          <X size={20} style={{ color: "var(--text-secondary)" }} />
        </Button>
      </div>

      {/* Navigation Tabs */}
      <div
        className="border-b flex gap-6 px-6 overflow-x-auto"
        style={{
          backgroundColor: "var(--bg-card)",
          borderColor: "var(--border-default)",
        }}
      >
        <button
          onClick={() => setView("progression")}
          className="py-3 px-4 border-b-2 whitespace-nowrap"
          style={{
            borderColor: view === "progression" ? "var(--action-primary)" : "transparent",
            color: view === "progression" ? "var(--action-primary)" : "var(--text-secondary)",
            fontSize: "14px",
            fontWeight: 600,
          }}
        >
          Overview
        </button>

        <div
          className="w-px my-2"
          style={{ backgroundColor: "var(--border-default)" }}
        />

        {phase2Features.map((feature) => (
          <button
            key={feature.id}
            onClick={() => setView(feature.id)}
            className="py-3 px-4 border-b-2 whitespace-nowrap flex items-center gap-2"
            style={{
              borderColor: view === feature.id ? "var(--phase-2-border)" : "transparent",
              color: view === feature.id ? "var(--phase-2-icon)" : "var(--text-secondary)",
              fontSize: "14px",
              fontWeight: 600,
              opacity: feature.implemented ? 1 : 0.6,
            }}
          >
            {feature.label}
            {!feature.implemented && <span style={{ fontSize: "12px" }}>🔒</span>}
          </button>
        ))}

        <div
          className="w-px my-2"
          style={{ backgroundColor: "var(--border-default)" }}
        />

        {phase3Features.map((feature) => (
          <button
            key={feature.id}
            onClick={() => setView(feature.id)}
            className="py-3 px-4 border-b-2 whitespace-nowrap flex items-center gap-2"
            style={{
              borderColor: view === feature.id ? "var(--phase-3-border)" : "transparent",
              color: view === feature.id ? "var(--phase-3-icon)" : "var(--text-secondary)",
              fontSize: "14px",
              fontWeight: 600,
              opacity: feature.implemented ? 1 : 0.6,
            }}
          >
            {feature.label}
            {!feature.implemented && <span style={{ fontSize: "12px" }}>🔒</span>}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">{renderContent()}</div>
    </div>
  );
}

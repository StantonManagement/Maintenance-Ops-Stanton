import { useState } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Checkbox } from "./ui/checkbox";
import { Switch } from "./ui/switch";
import { 
  X, 
  Palette, 
  Type, 
  Layout, 
  Box, 
  Zap,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Info,
  Lock
} from "lucide-react";
import { toast } from "sonner";

interface DesignSystemShowcaseProps {
  onClose: () => void;
}

export default function DesignSystemShowcase({ onClose }: DesignSystemShowcaseProps) {
  const [activeTab, setActiveTab] = useState<
    "colors" | "typography" | "spacing" | "components" | "animations"
  >("colors");

  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: "var(--bg-primary)" }}>
      {/* Header */}
      <div
        className="border-b px-8 py-6 flex items-center justify-between"
        style={{
          backgroundColor: "var(--bg-card)",
          borderColor: "var(--border-default)",
        }}
      >
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 600, color: "var(--text-primary)" }}>
            Design System Documentation
          </h1>
          <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginTop: "4px" }}>
            Magazine editorial meets Financial Times - Comprehensive design tokens & components
          </p>
        </div>
        <Button
          onClick={onClose}
          variant="ghost"
          size="icon"
          className="rounded-full"
        >
          <X size={20} />
        </Button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation */}
        <div
          className="w-64 border-r overflow-y-auto"
          style={{
            backgroundColor: "var(--bg-card)",
            borderColor: "var(--border-default)",
          }}
        >
          <div className="p-4 space-y-1">
            {[
              { id: "colors", icon: Palette, label: "Color System" },
              { id: "typography", icon: Type, label: "Typography" },
              { id: "spacing", icon: Layout, label: "Spacing & Layout" },
              { id: "components", icon: Box, label: "Components" },
              { id: "animations", icon: Zap, label: "Animations" },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors"
                  style={{
                    backgroundColor: isActive ? "var(--bg-hover)" : "transparent",
                    color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                  }}
                >
                  <Icon size={20} />
                  <span style={{ fontSize: "14px", fontWeight: isActive ? 600 : 400 }}>
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-8">
          {activeTab === "colors" && <ColorSystemTab />}
          {activeTab === "typography" && <TypographyTab />}
          {activeTab === "spacing" && <SpacingTab />}
          {activeTab === "components" && <ComponentsTab />}
          {activeTab === "animations" && <AnimationsTab />}
        </div>
      </div>
    </div>
  );
}

function ColorSystemTab() {
  const colorGroups = [
    {
      title: "Base Backgrounds",
      colors: [
        { name: "Primary", variable: "--bg-primary", value: "#FAFAF8" },
        { name: "Card", variable: "--bg-card", value: "#FFFFFF" },
        { name: "Hover", variable: "--bg-hover", value: "#F5F5F3" },
      ],
    },
    {
      title: "Text Colors",
      colors: [
        { name: "Primary", variable: "--text-primary", value: "#1A1A1A" },
        { name: "Secondary", variable: "--text-secondary", value: "#6B7280" },
        { name: "Tertiary", variable: "--text-tertiary", value: "#9CA3AF" },
        { name: "Inverted", variable: "--text-inverted", value: "#FFFFFF" },
      ],
    },
    {
      title: "Status - Success",
      colors: [
        { name: "Background", variable: "--status-success-bg", value: "#D1FAE5" },
        { name: "Border", variable: "--status-success-border", value: "#6EE7B7" },
        { name: "Text", variable: "--status-success-text", value: "#059669" },
        { name: "Icon", variable: "--status-success-icon", value: "#10B981" },
      ],
    },
    {
      title: "Status - Warning",
      colors: [
        { name: "Background", variable: "--status-warning-bg", value: "#FEF3C7" },
        { name: "Border", variable: "--status-warning-border", value: "#FCD34D" },
        { name: "Text", variable: "--status-warning-text", value: "#D97706" },
        { name: "Icon", variable: "--status-warning-icon", value: "#F59E0B" },
      ],
    },
    {
      title: "Status - Critical",
      colors: [
        { name: "Background", variable: "--status-critical-bg", value: "#FEE2E2" },
        { name: "Border", variable: "--status-critical-border", value: "#FCA5A5" },
        { name: "Text", variable: "--status-critical-text", value: "#DC2626" },
        { name: "Icon", variable: "--status-critical-icon", value: "#EF4444" },
      ],
    },
    {
      title: "Action Colors",
      colors: [
        { name: "Primary", variable: "--action-primary", value: "#2563EB" },
        { name: "Primary Hover", variable: "--action-primary-hover", value: "#1D4ED8" },
        { name: "Primary Pressed", variable: "--action-primary-pressed", value: "#1E40AF" },
        { name: "Destructive", variable: "--action-destructive", value: "#DC2626" },
      ],
    },
    {
      title: "Phase Indicators",
      colors: [
        { name: "Phase 1 Active", variable: "--phase-1-active", value: "#2563EB" },
        { name: "Phase 2 Overlay", variable: "--phase-2-overlay", value: "#A855F7" },
        { name: "Phase 3 Overlay", variable: "--phase-3-overlay", value: "#6B7280" },
      ],
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "8px" }}>
          Color System
        </h2>
        <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
          Professional, muted palette inspired by financial and editorial design
        </p>
      </div>

      {colorGroups.map((group) => (
        <div key={group.title}>
          <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px" }}>
            {group.title}
          </h3>
          <div className="grid grid-cols-4 gap-4">
            {group.colors.map((color) => (
              <div
                key={color.variable}
                className="border rounded-lg overflow-hidden"
                style={{ borderColor: "var(--border-default)" }}
              >
                <div
                  className="h-24"
                  style={{ backgroundColor: `var(${color.variable})` }}
                />
                <div className="p-3">
                  <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "4px" }}>
                    {color.name}
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "var(--text-tertiary)",
                      fontFamily: "monospace",
                    }}
                  >
                    {color.value}
                  </div>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "var(--text-tertiary)",
                      fontFamily: "monospace",
                      marginTop: "4px",
                    }}
                  >
                    var({color.variable})
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function TypographyTab() {
  return (
    <div className="space-y-8">
      <div>
        <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "8px" }}>
          Typography System
        </h2>
        <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
          Clear hierarchy with system font stack for optimal readability
        </p>
      </div>

      <div className="space-y-6">
        <div className="border rounded-lg p-6" style={{ borderColor: "var(--border-default)", backgroundColor: "var(--bg-card)" }}>
          <h1>Headline Large (h1)</h1>
          <p style={{ fontSize: "12px", color: "var(--text-tertiary)", marginTop: "8px" }}>
            24px · Medium (500) · 1.5 line-height
          </p>
        </div>

        <div className="border rounded-lg p-6" style={{ borderColor: "var(--border-default)", backgroundColor: "var(--bg-card)" }}>
          <h2>Headline Medium (h2)</h2>
          <p style={{ fontSize: "12px", color: "var(--text-tertiary)", marginTop: "8px" }}>
            20px · Medium (500) · 1.5 line-height
          </p>
        </div>

        <div className="border rounded-lg p-6" style={{ borderColor: "var(--border-default)", backgroundColor: "var(--bg-card)" }}>
          <h3>Headline Small (h3)</h3>
          <p style={{ fontSize: "12px", color: "var(--text-tertiary)", marginTop: "8px" }}>
            18px · Medium (500) · 1.5 line-height
          </p>
        </div>

        <div className="border rounded-lg p-6" style={{ borderColor: "var(--border-default)", backgroundColor: "var(--bg-card)" }}>
          <p>Body Text (p)</p>
          <p style={{ fontSize: "12px", color: "var(--text-tertiary)", marginTop: "8px" }}>
            16px · Regular (400) · 1.5 line-height
          </p>
        </div>

        <div className="border rounded-lg p-6" style={{ borderColor: "var(--border-default)", backgroundColor: "var(--bg-card)" }}>
          <p style={{ fontSize: "14px" }}>Body Small</p>
          <p style={{ fontSize: "12px", color: "var(--text-tertiary)", marginTop: "8px" }}>
            14px · Regular (400) · 1.5 line-height
          </p>
        </div>

        <div className="border rounded-lg p-6" style={{ borderColor: "var(--border-default)", backgroundColor: "var(--bg-card)" }}>
          <p style={{ fontSize: "12px" }}>Data/Label</p>
          <p style={{ fontSize: "12px", color: "var(--text-tertiary)", marginTop: "8px" }}>
            12px · Regular (400) · 1.5 line-height
          </p>
        </div>
      </div>
    </div>
  );
}

function SpacingTab() {
  const spacingTokens = [
    { name: "XXS", variable: "--space-xxs", value: "4px" },
    { name: "XS", variable: "--space-xs", value: "8px" },
    { name: "SM", variable: "--space-sm", value: "12px" },
    { name: "MD", variable: "--space-md", value: "16px" },
    { name: "LG", variable: "--space-lg", value: "24px" },
    { name: "XL", variable: "--space-xl", value: "32px" },
    { name: "XXL", variable: "--space-xxl", value: "48px" },
    { name: "3XL", variable: "--space-3xl", value: "64px" },
  ];

  const radiusTokens = [
    { name: "None", variable: "--radius-none", value: "0px" },
    { name: "SM", variable: "--radius-sm", value: "4px" },
    { name: "MD", variable: "--radius-md", value: "6px" },
    { name: "LG", variable: "--radius-lg", value: "8px" },
    { name: "Full", variable: "--radius-full", value: "999px" },
  ];

  const shadowTokens = [
    { name: "SM", variable: "--shadow-sm", value: "0px 1px 2px rgba(0, 0, 0, 0.05)" },
    { name: "MD", variable: "--shadow-md", value: "0px 4px 6px rgba(0, 0, 0, 0.07)" },
    { name: "LG", variable: "--shadow-lg", value: "0px 10px 15px rgba(0, 0, 0, 0.10)" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "8px" }}>
          Spacing & Layout
        </h2>
        <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
          8px base grid system with consistent spacing tokens
        </p>
      </div>

      <div>
        <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px" }}>
          Spacing Scale
        </h3>
        <div className="space-y-3">
          {spacingTokens.map((token) => (
            <div
              key={token.variable}
              className="flex items-center gap-4 border rounded-lg p-4"
              style={{ borderColor: "var(--border-default)", backgroundColor: "var(--bg-card)" }}
            >
              <div
                className="flex-shrink-0"
                style={{
                  width: token.value,
                  height: "32px",
                  backgroundColor: "var(--action-primary)",
                  borderRadius: "4px",
                }}
              />
              <div>
                <div style={{ fontSize: "14px", fontWeight: 600 }}>{token.name}</div>
                <div style={{ fontSize: "12px", color: "var(--text-tertiary)", fontFamily: "monospace" }}>
                  {token.value} · var({token.variable})
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px" }}>
          Border Radius
        </h3>
        <div className="grid grid-cols-5 gap-4">
          {radiusTokens.map((token) => (
            <div
              key={token.variable}
              className="border p-4"
              style={{ borderColor: "var(--border-default)", backgroundColor: "var(--bg-card)" }}
            >
              <div
                className="w-full h-16 mb-3"
                style={{
                  backgroundColor: "var(--action-primary)",
                  borderRadius: `var(${token.variable})`,
                }}
              />
              <div style={{ fontSize: "14px", fontWeight: 600 }}>{token.name}</div>
              <div style={{ fontSize: "11px", color: "var(--text-tertiary)", fontFamily: "monospace" }}>
                {token.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px" }}>
          Shadows
        </h3>
        <div className="grid grid-cols-3 gap-4">
          {shadowTokens.map((token) => (
            <div
              key={token.variable}
              className="p-6 rounded-lg"
              style={{
                backgroundColor: "var(--bg-card)",
                boxShadow: `var(${token.variable})`,
              }}
            >
              <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "8px" }}>
                {token.name}
              </div>
              <div style={{ fontSize: "11px", color: "var(--text-tertiary)", fontFamily: "monospace" }}>
                var({token.variable})
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ComponentsTab() {
  return (
    <div className="space-y-8">
      <div>
        <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "8px" }}>
          Component Library
        </h2>
        <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
          All component states and variations
        </p>
      </div>

      {/* Buttons */}
      <div>
        <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px" }}>Buttons</h3>
        <div className="flex flex-wrap gap-4">
          <Button onClick={() => toast.success("Primary button clicked!")}>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="ghost">Ghost</Button>
          <Button disabled>Disabled</Button>
        </div>
      </div>

      {/* Badges */}
      <div>
        <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px" }}>Badges</h3>
        <div className="flex flex-wrap gap-3">
          <Badge style={{ backgroundColor: "var(--status-success-bg)", color: "var(--status-success-text)", border: "1px solid var(--status-success-border)" }}>
            <CheckCircle size={14} style={{ marginRight: "4px" }} />
            Success
          </Badge>
          <Badge style={{ backgroundColor: "var(--status-warning-bg)", color: "var(--status-warning-text)", border: "1px solid var(--status-warning-border)" }}>
            <AlertTriangle size={14} style={{ marginRight: "4px" }} />
            Warning
          </Badge>
          <Badge style={{ backgroundColor: "var(--status-critical-bg)", color: "var(--status-critical-text)", border: "1px solid var(--status-critical-border)" }}>
            <XCircle size={14} style={{ marginRight: "4px" }} />
            Critical
          </Badge>
          <Badge style={{ backgroundColor: "var(--status-neutral-bg)", color: "var(--status-neutral-text)", border: "1px solid var(--status-neutral-border)" }}>
            <Info size={14} style={{ marginRight: "4px" }} />
            Neutral
          </Badge>
        </div>
      </div>

      {/* Phase Lock Badges */}
      <div>
        <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px" }}>Phase Indicators</h3>
        <div className="flex flex-wrap gap-3">
          <Badge style={{ backgroundColor: "var(--phase-1-bg)", color: "var(--phase-1-active)", border: "1px solid var(--phase-1-border)" }}>
            <CheckCircle size={14} style={{ marginRight: "4px" }} />
            Phase 1 - Active
          </Badge>
          <Badge style={{ backgroundColor: "#F3E8FF", color: "var(--phase-2-overlay)", border: "1px solid var(--phase-2-border)" }}>
            <Lock size={14} style={{ marginRight: "4px" }} />
            Phase 2 - Locked
          </Badge>
          <Badge style={{ backgroundColor: "#F3F4F6", color: "var(--phase-3-overlay)", border: "1px solid var(--phase-3-border)" }}>
            <Lock size={14} style={{ marginRight: "4px" }} />
            Phase 3 - Future
          </Badge>
        </div>
      </div>

      {/* Form Elements */}
      <div>
        <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px" }}>Form Elements</h3>
        <div className="space-y-4 max-w-md">
          <div>
            <label style={{ display: "block", marginBottom: "8px", fontSize: "14px" }}>
              Text Input
            </label>
            <Input placeholder="Enter text..." />
          </div>
          <div className="flex items-center gap-3">
            <Checkbox id="checkbox-example" />
            <label htmlFor="checkbox-example" style={{ fontSize: "14px" }}>
              Checkbox Example
            </label>
          </div>
          <div className="flex items-center gap-3">
            <Switch id="switch-example" />
            <label htmlFor="switch-example" style={{ fontSize: "14px" }}>
              Switch Example
            </label>
          </div>
        </div>
      </div>

      {/* Toast Examples */}
      <div>
        <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px" }}>Toast Notifications</h3>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={() => toast.success("Work order completed successfully!")}>
            Success Toast
          </Button>
          <Button variant="outline" onClick={() => toast.error("Failed to assign technician")}>
            Error Toast
          </Button>
          <Button variant="outline" onClick={() => toast.info("Message sent to tenant")}>
            Info Toast
          </Button>
          <Button variant="outline" onClick={() => toast.warning("Daily workload limit reached")}>
            Warning Toast
          </Button>
        </div>
      </div>
    </div>
  );
}

function AnimationsTab() {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  return (
    <div className="space-y-8">
      <div>
        <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "8px" }}>
          Animations & Transitions
        </h2>
        <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
          Subtle, purposeful motion that enhances usability
        </p>
      </div>

      <div>
        <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px" }}>
          Hover Effects
        </h3>
        <div
          className="inline-block px-6 py-3 rounded-lg cursor-pointer"
          style={{
            backgroundColor: isHovered ? "var(--action-primary-hover)" : "var(--action-primary)",
            color: "white",
            transition: "all 0.2s ease",
            transform: isHovered ? "translateY(-2px)" : "translateY(0)",
            boxShadow: isHovered ? "var(--shadow-lg)" : "var(--shadow-sm)",
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          Hover over me
        </div>
      </div>

      <div>
        <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px" }}>
          Press States
        </h3>
        <div
          className="inline-block px-6 py-3 rounded-lg cursor-pointer select-none"
          style={{
            backgroundColor: isPressed ? "var(--action-primary-pressed)" : "var(--action-primary)",
            color: "white",
            transition: "all 0.1s ease",
            transform: isPressed ? "scale(0.98)" : "scale(1)",
          }}
          onMouseDown={() => setIsPressed(true)}
          onMouseUp={() => setIsPressed(false)}
          onMouseLeave={() => setIsPressed(false)}
        >
          Click and hold me
        </div>
      </div>

      <div>
        <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px" }}>
          Loading States
        </h3>
        <div className="flex gap-4">
          <div
            className="w-16 h-16 rounded-full border-4 animate-spin"
            style={{
              borderColor: "var(--border-default)",
              borderTopColor: "var(--action-primary)",
            }}
          />
          <div className="flex gap-2 items-center">
            <div
              className="w-3 h-3 rounded-full animate-pulse"
              style={{
                backgroundColor: "var(--action-primary)",
                animationDelay: "0ms",
              }}
            />
            <div
              className="w-3 h-3 rounded-full animate-pulse"
              style={{
                backgroundColor: "var(--action-primary)",
                animationDelay: "150ms",
              }}
            />
            <div
              className="w-3 h-3 rounded-full animate-pulse"
              style={{
                backgroundColor: "var(--action-primary)",
                animationDelay: "300ms",
              }}
            />
          </div>
        </div>
      </div>

      <div>
        <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px" }}>
          Transition Guidelines
        </h3>
        <div className="space-y-3">
          <div
            className="border rounded-lg p-4"
            style={{ borderColor: "var(--border-default)", backgroundColor: "var(--bg-card)" }}
          >
            <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "4px" }}>
              Fast (0.1s)
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
              Button press states, checkbox toggles, immediate feedback
            </div>
          </div>
          <div
            className="border rounded-lg p-4"
            style={{ borderColor: "var(--border-default)", backgroundColor: "var(--bg-card)" }}
          >
            <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "4px" }}>
              Standard (0.2s)
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
              Hover effects, color transitions, most UI interactions
            </div>
          </div>
          <div
            className="border rounded-lg p-4"
            style={{ borderColor: "var(--border-default)", backgroundColor: "var(--bg-card)" }}
          >
            <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "4px" }}>
              Slow (0.3s)
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
              Modal open/close, panel slides, page transitions
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

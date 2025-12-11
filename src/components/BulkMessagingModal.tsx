import { useState } from "react";
import { X, Send, Languages, CheckCircle, RefreshCw } from "lucide-react";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { Textarea } from "./ui/textarea";
import { Avatar } from "./ui/avatar";
import { WorkOrder } from "../types";
import { toast } from "sonner";

interface BulkMessagingModalProps {
  workOrders: WorkOrder[];
  onClose: () => void;
  onSend: (workOrderIds: string[], message: string) => Promise<void>;
}

export default function BulkMessagingModal({ workOrders, onClose, onSend }: BulkMessagingModalProps) {
  const [selectedWorkOrders, setSelectedWorkOrders] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [autoTranslate, setAutoTranslate] = useState(true);
  const [sending, setSending] = useState(false);

  const toggleWorkOrder = (id: string) => {
    setSelectedWorkOrders((prev) =>
      prev.includes(id) ? prev.filter((woId) => woId !== id) : [...prev, id]
    );
  };

  const selectAllWorkOrders = () => {
    if (selectedWorkOrders.length === workOrders.length) {
      setSelectedWorkOrders([]);
    } else {
      setSelectedWorkOrders(workOrders.map((wo) => wo.id));
    }
  };

  const handleSend = async () => {
    if (!message.trim() || selectedWorkOrders.length === 0) return;

    setSending(true);
    try {
      await onSend(selectedWorkOrders, message);
      toast.success(`Message sent to ${selectedWorkOrders.length} tenants${autoTranslate ? " (auto-translated)" : ""}`);
      onClose();
    } catch (error) {
      console.error("Failed to send messages", error);
      toast.error("Failed to send messages");
    } finally {
      setSending(false);
    }
  };

  const messagePreview = autoTranslate
    ? "Su orden de trabajo ha sido actualizada. Nos pondremos en contacto con usted pronto."
    : message;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl max-h-[85vh] rounded-lg flex flex-col animate-fade-in"
        style={{ backgroundColor: "var(--bg-card)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-6 border-b"
          style={{ borderColor: "var(--border-default)" }}
        >
          <div>
            <h2 style={{ fontSize: "20px", fontWeight: 600 }}>Bulk Messaging</h2>
            <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginTop: "4px" }}>
              Send a message to multiple tenants at once
            </p>
          </div>
          <Button onClick={onClose} variant="ghost" size="icon" className="rounded-full">
            <X size={20} />
          </Button>
        </div>

        <div className="flex-1 overflow-hidden flex">
          {/* Tenant/Work Order Selection */}
          <div className="w-80 overflow-y-auto border-r" style={{ borderColor: "var(--border-default)" }}>
            <div
              className="sticky top-0 px-6 py-3 border-b flex items-center justify-between"
              style={{
                backgroundColor: "var(--bg-hover)",
                borderColor: "var(--border-default)",
              }}
            >
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={selectedWorkOrders.length === workOrders.length && workOrders.length > 0}
                  onCheckedChange={selectAllWorkOrders}
                />
                <span style={{ fontSize: "14px", fontWeight: 600 }}>
                  Select All ({selectedWorkOrders.length})
                </span>
              </div>
            </div>

            <div className="p-4 space-y-2">
              {workOrders.map((wo) => (
                <div
                  key={wo.id}
                  className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-smooth hover-lift"
                  style={{
                    borderColor: selectedWorkOrders.includes(wo.id)
                      ? "var(--action-primary)"
                      : "var(--border-default)",
                    backgroundColor: selectedWorkOrders.includes(wo.id)
                      ? "rgba(37, 99, 235, 0.05)"
                      : "transparent",
                  }}
                  onClick={() => toggleWorkOrder(wo.id)}
                >
                  <Checkbox
                    checked={selectedWorkOrders.includes(wo.id)}
                    onCheckedChange={() => toggleWorkOrder(wo.id)}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Avatar className="w-6 h-6">
                        <div
                          className="w-full h-full flex items-center justify-center"
                          style={{
                            backgroundColor: "var(--status-neutral-bg)",
                            color: "var(--text-secondary)",
                            fontSize: "11px",
                          }}
                        >
                          {wo.residentName[0]}
                        </div>
                      </Avatar>
                      <span style={{ fontSize: "13px", fontWeight: 600 }}>{wo.residentName}</span>
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                      {wo.propertyCode} - {wo.propertyAddress} · Unit {wo.unit}
                    </div>
                    <div
                      className="flex items-center gap-1 mt-1"
                      style={{ fontSize: "11px", color: "var(--text-tertiary)" }}
                    >
                      <Languages size={12} />
                      {wo.originalLanguage || "English"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Message Composition */}
          <div className="flex-1 flex flex-col">
            <div
              className="px-6 py-3 border-b"
              style={{
                backgroundColor: "var(--bg-hover)",
                borderColor: "var(--border-default)",
              }}
            >
              <span style={{ fontSize: "14px", fontWeight: 600 }}>Compose Message</span>
            </div>

            <div className="flex-1 p-6 space-y-4">
              {/* Auto-translate toggle */}
              <div
                className="p-4 rounded-lg border"
                style={{
                  borderColor: "var(--border-default)",
                  backgroundColor: "var(--bg-hover)",
                }}
              >
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={autoTranslate}
                    onCheckedChange={(checked) => setAutoTranslate(checked as boolean)}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Languages size={16} style={{ color: "var(--action-primary)" }} />
                      <span style={{ fontSize: "14px", fontWeight: 600 }}>Auto-translate messages</span>
                    </div>
                    <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>
                      Automatically translate to each tenant's preferred language
                    </p>
                  </div>
                </div>
              </div>

              {/* Message input */}
              <div>
                <label
                  htmlFor="message"
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontSize: "14px",
                    fontWeight: 600,
                  }}
                >
                  Message (English)
                </label>
                <Textarea
                  id="message"
                  placeholder="Type your message here..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={6}
                  className="resize-none"
                  style={{
                    backgroundColor: "white",
                    borderColor: "var(--border-default)",
                  }}
                />
                <div style={{ fontSize: "12px", color: "var(--text-tertiary)", marginTop: "8px" }}>
                  {message.length} characters
                </div>
              </div>

              {/* Translation preview */}
              {autoTranslate && message.trim() && (
                <div
                  className="p-4 rounded-lg border"
                  style={{
                    borderColor: "var(--border-default)",
                    backgroundColor: "var(--bg-hover)",
                  }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Languages size={16} style={{ color: "var(--action-primary)" }} />
                    <span style={{ fontSize: "13px", fontWeight: 600 }}>Translation Preview (Spanish)</span>
                  </div>
                  <p style={{ fontSize: "14px", color: "var(--text-secondary)", fontStyle: "italic" }}>
                    {messagePreview}
                  </p>
                </div>
              )}

              {/* Recipients summary */}
              {selectedWorkOrders.length > 0 && (
                <div
                  className="p-4 rounded-lg border"
                  style={{
                    borderColor: "var(--status-success-border)",
                    backgroundColor: "var(--status-success-bg)",
                  }}
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle size={16} style={{ color: "var(--status-success-icon)" }} />
                    <span style={{ fontSize: "14px", color: "var(--status-success-text)" }}>
                      Ready to send to {selectedWorkOrders.length} tenant{selectedWorkOrders.length > 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="p-6 border-t flex gap-3"
          style={{ borderColor: "var(--border-default)" }}
        >
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="flex-1 gap-2"
            disabled={!message.trim() || selectedWorkOrders.length === 0 || sending}
            onClick={handleSend}
            style={{
              backgroundColor: "var(--action-primary)",
              color: "white",
              opacity: !message.trim() || selectedWorkOrders.length === 0 || sending ? 0.5 : 1,
            }}
          >
            {sending ? <RefreshCw className="animate-spin h-4 w-4" /> : <Send size={16} />}
            {sending ? "Sending..." : `Send to ${selectedWorkOrders.length} Tenant${selectedWorkOrders.length > 1 ? "s" : ""}`}
          </Button>
        </div>
      </div>
    </div>
  );
}

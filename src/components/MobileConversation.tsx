import { useState, useRef, useEffect } from "react";
import { ChevronLeft, MoreVertical, Phone, Globe, Send, Plus, ChevronRight, ChevronDown } from "lucide-react";
import { WorkOrder } from "../types";

interface MobileConversationProps {
  workOrder: WorkOrder;
  onBack: () => void;
}

interface Message {
  id: string;
  type: "tenant" | "coordinator" | "system";
  originalText: string;
  translatedText?: string;
  originalLanguage?: string;
  sentLanguage?: string;
  timestamp: string;
  status?: string;
}

const mockMessages: Message[] = [
  {
    id: "1",
    type: "tenant",
    originalText: "La tubería debajo del fregadero está goteando mucho",
    translatedText: "The pipe under the sink is leaking a lot",
    originalLanguage: "Spanish",
    timestamp: "2:34 PM",
    status: "Read",
  },
  {
    id: "2",
    type: "system",
    originalText: "Work order created from text message",
    timestamp: "2:35 PM",
  },
  {
    id: "3",
    type: "coordinator",
    originalText: "I can send Ramon today at 2pm. Does that work?",
    translatedText: "Puedo enviar a Ramon hoy a las 2pm. ¿Te funciona?",
    sentLanguage: "Spanish",
    timestamp: "2:45 PM",
    status: "Delivered",
  },
  {
    id: "4",
    type: "tenant",
    originalText: "Sí, perfecto. Estaré en casa todo el día.",
    translatedText: "Yes, perfect. I'll be home all day.",
    originalLanguage: "Spanish",
    timestamp: "2:47 PM",
    status: "Read",
  },
];

const quickReplies = [
  "When available?",
  "On the way",
  "Need photo",
  "Need access",
  "+ More",
];

export function MobileConversation({ workOrder, onBack }: MobileConversationProps) {
  const [message, setMessage] = useState("");
  const [showScrollButton, setShowScrollButton] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom on mount
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      setShowScrollButton(scrollHeight - scrollTop - clientHeight > 100);
    }
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: "var(--bg-primary)" }}>
      {/* Header */}
      <div
        className="border-b"
        style={{
          backgroundColor: "var(--bg-card)",
          borderColor: "var(--border-default)",
          paddingTop: "env(safe-area-inset-top, 20px)",
          paddingLeft: "var(--space-md)",
          paddingRight: "var(--space-md)",
          paddingBottom: "var(--space-md)",
        }}
      >
        {/* Row 1: Back button and More */}
        <div className="flex items-center justify-between mb-2">
          <button onClick={onBack} className="p-2 -ml-2">
            <ChevronLeft size={24} style={{ color: "var(--text-primary)" }} />
          </button>
          <span style={{ fontSize: "12px", fontFamily: "monospace", color: "var(--text-secondary)" }}>
            {workOrder.id}
          </span>
          <button className="p-2">
            <MoreVertical size={24} style={{ color: "var(--text-primary)" }} />
          </button>
        </div>

        {/* Row 2: Title and Location */}
        <div>
          <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "4px" }}>
            Kitchen Leak
          </h2>
          <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
            {workOrder.propertyAddress} · {workOrder.unit}
          </p>
        </div>
      </div>

      {/* Tenant Info Bar */}
      <div
        className="flex items-center justify-between border-b"
        style={{
          height: "60px",
          backgroundColor: "var(--bg-primary)",
          borderColor: "var(--border-default)",
          padding: "var(--space-sm) var(--space-md)",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="rounded-full flex items-center justify-center"
            style={{
              width: "40px",
              height: "40px",
              backgroundColor: "var(--action-primary)",
              color: "var(--text-inverted)",
              fontSize: "16px",
              fontWeight: 600,
            }}
          >
            ML
          </div>
          <div>
            <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>
              {workOrder.residentName}
            </div>
            <div className="flex items-center gap-1">
              <Globe size={12} style={{ color: "var(--text-secondary)" }} />
              <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                Spanish
              </span>
            </div>
          </div>
        </div>
        <button
          className="rounded-full flex items-center justify-center"
          style={{
            width: "40px",
            height: "40px",
            backgroundColor: "var(--action-secondary)",
            border: "1px solid var(--border-default)",
          }}
        >
          <Phone size={20} style={{ color: "var(--action-primary)" }} />
        </button>
      </div>

      {/* Message Thread */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto"
        style={{
          padding: "var(--space-sm) var(--space-md)",
          paddingBottom: "var(--space-xl)",
        }}
      >
        {mockMessages.map((msg) => {
          if (msg.type === "system") {
            return (
              <div
                key={msg.id}
                className="flex items-center justify-center gap-2 my-4"
                style={{ fontSize: "12px", color: "var(--text-tertiary)", fontStyle: "italic" }}
              >
                <span>🤖</span>
                <span>{msg.originalText}</span>
              </div>
            );
          }

          if (msg.type === "tenant") {
            return (
              <div key={msg.id} className="flex justify-start mb-4">
                <div style={{ maxWidth: "85%" }}>
                  <div
                    className="rounded-lg border"
                    style={{
                      backgroundColor: "var(--bg-card)",
                      borderColor: "var(--border-default)",
                      padding: "var(--space-sm) var(--space-md)",
                      borderTopLeftRadius: "0",
                      boxShadow: "var(--shadow-sm)",
                      position: "relative",
                    }}
                  >
                    {/* Tail */}
                    <div
                      style={{
                        position: "absolute",
                        left: "-8px",
                        top: "0",
                        width: "0",
                        height: "0",
                        borderTop: "8px solid var(--bg-card)",
                        borderLeft: "8px solid transparent",
                      }}
                    />

                    {/* Original Text */}
                    <div style={{ fontSize: "14px", color: "var(--text-primary)", marginBottom: "8px" }}>
                      {msg.originalText}
                    </div>

                    {/* Translation */}
                    {msg.translatedText && (
                      <>
                        <div
                          style={{
                            height: "1px",
                            backgroundColor: "var(--border-default)",
                            margin: "8px 0",
                          }}
                        />
                        <div className="flex items-start gap-2">
                          <Globe size={12} style={{ color: "var(--text-tertiary)", marginTop: "2px" }} />
                          <div>
                            <div style={{ fontSize: "10px", color: "var(--text-tertiary)", marginBottom: "2px" }}>
                              English
                            </div>
                            <div
                              style={{
                                fontSize: "12px",
                                color: "var(--text-secondary)",
                                fontStyle: "italic",
                              }}
                            >
                              {msg.translatedText}
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Timestamp */}
                  <div style={{ fontSize: "11px", color: "var(--text-tertiary)", marginTop: "4px", paddingLeft: "8px" }}>
                    {msg.timestamp} · {msg.status}
                  </div>
                </div>
              </div>
            );
          }

          if (msg.type === "coordinator") {
            return (
              <div key={msg.id} className="flex justify-end mb-4">
                <div style={{ maxWidth: "85%" }}>
                  <div
                    className="rounded-lg"
                    style={{
                      backgroundColor: "rgba(37, 99, 235, 0.08)",
                      border: "1px solid rgba(37, 99, 235, 0.2)",
                      padding: "var(--space-sm) var(--space-md)",
                      borderTopRightRadius: "0",
                      position: "relative",
                    }}
                  >
                    {/* Tail */}
                    <div
                      style={{
                        position: "absolute",
                        right: "-8px",
                        top: "0",
                        width: "0",
                        height: "0",
                        borderTop: "8px solid rgba(37, 99, 235, 0.08)",
                        borderRight: "8px solid transparent",
                      }}
                    />

                    {/* Original Text (English) */}
                    <div style={{ fontSize: "14px", color: "var(--text-primary)", marginBottom: "8px" }}>
                      {msg.originalText}
                    </div>

                    {/* Sent Translation */}
                    {msg.translatedText && (
                      <>
                        <div
                          style={{
                            height: "1px",
                            backgroundColor: "rgba(37, 99, 235, 0.2)",
                            margin: "8px 0",
                          }}
                        />
                        <div className="flex items-start gap-2">
                          <Globe size={12} style={{ color: "var(--text-tertiary)", marginTop: "2px" }} />
                          <div>
                            <div style={{ fontSize: "10px", color: "var(--text-tertiary)", marginBottom: "2px" }}>
                              Sent in {msg.sentLanguage}
                            </div>
                            <div
                              style={{
                                fontSize: "12px",
                                color: "var(--text-secondary)",
                                fontStyle: "italic",
                              }}
                            >
                              {msg.translatedText}
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Timestamp */}
                  <div style={{ fontSize: "11px", color: "var(--text-tertiary)", marginTop: "4px", paddingRight: "8px", textAlign: "right" }}>
                    {msg.timestamp} · {msg.status}
                  </div>
                </div>
              </div>
            );
          }

          return null;
        })}
      </div>

      {/* Scroll to Bottom Button */}
      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          className="fixed rounded-full flex items-center justify-center"
          style={{
            bottom: "240px",
            right: "var(--space-md)",
            width: "48px",
            height: "48px",
            backgroundColor: "var(--action-primary)",
            boxShadow: "var(--shadow-lg)",
          }}
        >
          <ChevronDown size={24} style={{ color: "var(--text-inverted)" }} />
        </button>
      )}

      {/* Quick Replies */}
      <div
        className="border-t overflow-x-auto no-scrollbar"
        style={{
          backgroundColor: "var(--bg-card)",
          borderColor: "var(--border-default)",
          padding: "var(--space-sm) var(--space-md)",
        }}
      >
        <div className="flex gap-2">
          {quickReplies.map((reply, index) => (
            <button
              key={index}
              onClick={() => setMessage(reply === "+ More" ? message : reply)}
              className="rounded-full border whitespace-nowrap flex items-center gap-1"
              style={{
                height: "36px",
                padding: "0 16px",
                fontSize: "12px",
                backgroundColor: "var(--bg-primary)",
                borderColor: "var(--border-default)",
                color: "var(--text-primary)",
              }}
            >
              {reply}
              <ChevronRight size={12} style={{ color: "var(--text-tertiary)" }} />
            </button>
          ))}
        </div>
      </div>

      {/* Message Input */}
      <div
        className="border-t"
        style={{
          backgroundColor: "var(--bg-card)",
          borderColor: "var(--border-default)",
          padding: "var(--space-sm) var(--space-md)",
          paddingBottom: "calc(var(--space-sm) + env(safe-area-inset-bottom, 20px))",
        }}
      >
        {/* Auto-translate indicator */}
        <div className="flex items-center gap-1 mb-2">
          <Globe size={12} style={{ color: "var(--text-tertiary)" }} />
          <span style={{ fontSize: "12px", color: "var(--text-tertiary)" }}>
            → Spanish
          </span>
        </div>

        {/* Input Row */}
        <div className="flex items-end gap-2">
          {/* Plus Button */}
          <button
            className="rounded-full flex items-center justify-center flex-shrink-0"
            style={{
              width: "40px",
              height: "40px",
              backgroundColor: "var(--action-secondary)",
              border: "1px solid var(--border-default)",
            }}
          >
            <Plus size={20} style={{ color: "var(--action-primary)" }} />
          </button>

          {/* Text Input */}
          <div className="flex-1 relative">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Message..."
              rows={1}
              className="w-full resize-none rounded-lg border outline-none"
              style={{
                backgroundColor: "var(--bg-primary)",
                borderColor: message ? "var(--action-primary)" : "var(--border-default)",
                padding: "var(--space-sm)",
                fontSize: "14px",
                color: "var(--text-primary)",
                minHeight: "40px",
                maxHeight: "120px",
              }}
            />
          </div>

          {/* Send Button */}
          <button
            disabled={!message}
            className="rounded-full flex items-center justify-center flex-shrink-0"
            style={{
              width: "40px",
              height: "40px",
              backgroundColor: message ? "var(--action-primary)" : "var(--action-primary-disabled)",
              opacity: message ? 1 : 0.4,
            }}
          >
            <Send size={20} style={{ color: "var(--text-inverted)" }} />
          </button>
        </div>
      </div>
    </div>
  );
}

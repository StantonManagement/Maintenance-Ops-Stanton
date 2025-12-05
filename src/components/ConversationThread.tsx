import { useState, useEffect, useRef } from "react";
import { MoreVertical, Send, Paperclip, Languages, Globe, Phone, ChevronRight, Image, X } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Textarea } from "./ui/textarea";
import { WorkOrder } from "../types";
import TypingIndicator from "./TypingIndicator";

interface Message {
  id: string;
  from: "tenant" | "coordinator";
  originalText: string;
  translatedText?: string;
  originalLanguage?: string;
  targetLanguage?: string;
  timestamp: string;
  status?: "delivered" | "read";
  type?: "text" | "system";
}

interface ConversationThreadProps {
  workOrder?: WorkOrder;
}

const mockMessages: Message[] = [
  {
    id: "1",
    from: "tenant",
    originalText: "La tubería debajo del fregadero está goteando mucho",
    translatedText: "The pipe under the sink is leaking a lot",
    originalLanguage: "Spanish",
    targetLanguage: "English",
    timestamp: "2:34 PM",
    status: "read",
  },
  {
    id: "2",
    from: "coordinator",
    originalText: "I can send Ramon today at 2pm. Does that work?",
    translatedText: "Puedo enviar a Ramon hoy a las 2pm. ¿Te funciona?",
    originalLanguage: "English",
    targetLanguage: "Spanish",
    timestamp: "2:45 PM",
    status: "delivered",
  },
  {
    id: "3",
    from: "tenant",
    originalText: "Sí, perfecto. Estaré en casa después de las 2pm.",
    translatedText: "Yes, perfect. I'll be home after 2pm.",
    originalLanguage: "Spanish",
    targetLanguage: "English",
    timestamp: "2:48 PM",
    status: "read",
  },
];

const quickReplyTemplates = [
  "When can you be available?",
  "Technician is on the way",
  "Do you need emergency service?",
  "Can you send a photo?",
  "We need access to the unit",
];

export function ConversationThread({ workOrder }: ConversationThreadProps) {
  const [messageText, setMessageText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [attachedImages, setAttachedImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Simulate typing indicator
  useEffect(() => {
    if (!workOrder) return;
    
    const showTyping = setTimeout(() => {
      setIsTyping(true);
      setTimeout(() => setIsTyping(false), 3000);
    }, 5000);

    return () => clearTimeout(showTyping);
  }, [workOrder]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setAttachedImages((prev) => [...prev, event.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setAttachedImages((prev) => prev.filter((_, i) => i !== index));
  };

  if (!workOrder) {
    return (
      <div className="w-[480px] border-l flex flex-col" style={{ borderColor: 'var(--border-default)' }}>
        <div className="flex-1 flex items-center justify-center px-12">
          <div className="text-center">
            <div 
              className="h-16 w-16 mx-auto mb-4 flex items-center justify-center"
              style={{ color: 'var(--text-tertiary)' }}
            >
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <h3 className="text-[20px] leading-[28px] mb-2" style={{ color: 'var(--text-primary)' }}>
              Select a work order to view conversation
            </h3>
            <p className="text-[14px]" style={{ color: 'var(--text-secondary)' }}>
              Tenant messages will appear here
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[480px] border-l flex flex-col" style={{ borderColor: 'var(--border-default)' }}>
      {/* Header */}
      <div 
        className="h-16 border-b px-6 flex items-center justify-between"
        style={{ 
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-default)'
        }}
      >
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[14px] font-mono" style={{ color: 'var(--text-secondary)' }}>
              {workOrder.id}
            </span>
            <span className="text-[20px] leading-[28px]" style={{ color: 'var(--text-primary)' }}>
              Kitchen Leak
            </span>
          </div>
          <p className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>
            {workOrder.propertyAddress} · Unit {workOrder.unit}
          </p>
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8"
        >
          <MoreVertical className="h-5 w-5" style={{ color: 'var(--text-secondary)' }} />
        </Button>
      </div>

      {/* Tenant Info Card */}
      <div 
        className="m-4 p-4"
        style={{ 
          backgroundColor: 'var(--bg-primary)',
          borderRadius: 'var(--radius-md)'
        }}
      >
        <div className="flex items-start gap-3">
          <div 
            className="h-10 w-10 flex items-center justify-center text-[14px]"
            style={{ 
              backgroundColor: 'var(--action-primary)',
              color: 'var(--text-inverted)',
              borderRadius: 'var(--radius-full)'
            }}
          >
            ML
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[16px]" style={{ color: 'var(--text-primary)' }}>
                {workOrder.residentName}
              </span>
              <div className="flex items-center gap-1">
                <Phone className="h-3 w-3" style={{ color: 'var(--text-tertiary)' }} />
                <span className="text-[12px] font-mono" style={{ color: 'var(--text-secondary)' }}>
                  (555) 123-4567
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4" style={{ color: 'var(--text-secondary)' }} />
              <span className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>
                Preferred Language: Spanish
              </span>
              <Badge
                className="h-5 px-2 text-[11px]"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  color: 'var(--text-secondary)',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                ES
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Message Thread */}
      <div 
        className="flex-1 overflow-y-auto px-4 pb-4"
        style={{ backgroundColor: 'var(--bg-primary)' }}
      >
        {/* Date Separator */}
        <div className="sticky top-0 py-2 text-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
          <span className="text-[12px] px-3 py-1" style={{ color: 'var(--text-secondary)' }}>
            Today
          </span>
        </div>

        {mockMessages.map((message) => (
          <div key={message.id} className="mb-4">
            {message.from === "tenant" ? (
              <div className="flex justify-start">
                <div 
                  className="max-w-[75%] p-3 border"
                  style={{ 
                    backgroundColor: 'var(--bg-card)',
                    borderColor: 'var(--border-default)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  {/* Original Message */}
                  <p className="text-[14px] mb-3" style={{ color: 'var(--text-primary)' }}>
                    {message.originalText}
                  </p>

                  {/* Translation */}
                  {message.translatedText && (
                    <>
                      <div className="h-px mb-3" style={{ backgroundColor: 'var(--border-default)' }} />
                      <div className="flex items-center gap-2 mb-2">
                        <Languages className="h-3 w-3" style={{ color: 'var(--text-tertiary)' }} />
                        <span className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
                          Auto-translated
                        </span>
                      </div>
                      <p className="text-[12px] italic" style={{ color: 'var(--text-secondary)' }}>
                        {message.translatedText}
                      </p>
                    </>
                  )}

                  {/* Timestamp */}
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
                      {message.timestamp}
                    </span>
                    <span className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
                      · {message.status}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex justify-end">
                <div 
                  className="max-w-[75%] p-3 border"
                  style={{ 
                    backgroundColor: 'rgba(37, 99, 235, 0.08)',
                    borderColor: 'rgba(37, 99, 235, 0.2)',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  {/* Message in English */}
                  <p className="text-[14px] mb-3" style={{ color: 'var(--text-primary)' }}>
                    {message.originalText}
                  </p>

                  {/* Translation sent to tenant */}
                  {message.translatedText && (
                    <>
                      <div className="h-px mb-3" style={{ backgroundColor: 'rgba(37, 99, 235, 0.2)' }} />
                      <div className="flex items-center gap-2 mb-2">
                        <Languages className="h-3 w-3" style={{ color: 'var(--text-tertiary)' }} />
                        <span className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
                          Sent in Spanish
                        </span>
                      </div>
                      <p className="text-[12px] italic" style={{ color: 'var(--text-secondary)' }}>
                        {message.translatedText}
                      </p>
                    </>
                  )}

                  {/* Timestamp */}
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
                      {message.timestamp}
                    </span>
                    <span className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
                      · {message.status}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Typing Indicator */}
        {isTyping && <TypingIndicator userName={workOrder.residentName} />}
      </div>

      {/* Quick Replies */}
      <div 
        className="border-t px-4 py-3"
        style={{ 
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-default)'
        }}
      >
        <div className="flex gap-2 overflow-x-auto pb-2">
          {quickReplyTemplates.map((template, index) => (
            <button
              key={index}
              className="h-8 px-4 flex items-center gap-2 whitespace-nowrap text-[12px] border transition-all"
              style={{
                backgroundColor: 'var(--bg-primary)',
                borderColor: 'var(--border-default)',
                color: 'var(--text-secondary)',
                borderRadius: 'var(--radius-full)',
              }}
              onClick={() => setMessageText(template)}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                e.currentTarget.style.transform = 'translateX(2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--bg-primary)';
                e.currentTarget.style.transform = 'translateX(0)';
              }}
            >
              {template}
              <ChevronRight className="h-3 w-3" />
            </button>
          ))}
        </div>
      </div>

      {/* Message Input */}
      <div 
        className="border-t p-4"
        style={{ 
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-default)'
        }}
      >
        <div className="relative">
          {/* Image Attachments Preview */}
          {attachedImages.length > 0 && (
            <div className="flex gap-2 mb-3 flex-wrap">
              {attachedImages.map((img, index) => (
                <div key={index} className="relative group">
                  <img
                    src={img}
                    alt={`Attachment ${index + 1}`}
                    className="w-20 h-20 object-cover rounded-lg border"
                    style={{ borderColor: 'var(--border-default)' }}
                  />
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{
                      backgroundColor: 'var(--status-critical-icon)',
                      color: 'white',
                    }}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <Textarea
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Type your message in English..."
            className="min-h-[80px] pr-12 text-[14px] resize-none border"
            style={{
              backgroundColor: 'var(--bg-primary)',
              borderColor: 'var(--border-default)',
              borderRadius: 'var(--radius-md)',
            }}
          />
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2">
              <Languages className="h-3 w-3" style={{ color: 'var(--text-tertiary)' }} />
              <span className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
                Will be translated to Spanish for tenant
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileSelect}
              />
              <Button
                size="icon"
                variant="ghost"
                className="h-10 w-10"
                onClick={() => fileInputRef.current?.click()}
              >
                <Image className="h-5 w-5" style={{ color: 'var(--text-secondary)' }} />
              </Button>
              <Button
                className="h-10 px-5 text-[14px] gap-2"
                disabled={!messageText.trim() && attachedImages.length === 0}
                style={{
                  backgroundColor: (messageText.trim() || attachedImages.length > 0) ? 'var(--action-primary)' : 'var(--action-primary-disabled)',
                  color: 'var(--text-inverted)',
                  borderRadius: 'var(--radius-md)',
                  opacity: (messageText.trim() || attachedImages.length > 0) ? 1 : 0.4,
                }}
              >
                <Send className="h-4 w-4" />
                Send
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

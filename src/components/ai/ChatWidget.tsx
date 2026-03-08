/**
 * Floating Claude chat widget. Mobile-first slide-up panel.
 * Uses useClaude hook and claude-chat Edge Function.
 */
import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useClaude } from "@/hooks/useClaude";
import type { SystemPromptKey } from "@/lib/ai/systemPrompts";

export interface ChatWidgetProps {
  vertical: SystemPromptKey;
  placeholder?: string;
}

const defaultPlaceholder = "Ask me anything...";

export function ChatWidget({ vertical, placeholder = defaultPlaceholder }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const { messages, sendMessage, clearHistory, isLoading, error } = useClaude(vertical);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;
    setInput("");
    sendMessage(text);
  };

  return (
    <>
      {/* Floating button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all",
          "bg-primary text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
          "min-[44px] min-h-[44px]"
        )}
        aria-label="Open chat"
      >
        <MessageCircle className="h-6 w-6" />
      </button>

      {/* Slide-up panel overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          aria-hidden
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Panel — only when open */}
      {isOpen && (
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 flex max-h-[85vh] flex-col rounded-t-2xl bg-background shadow-xl",
          "md:inset-auto md:right-6 md:bottom-24 md:left-auto md:max-h-[480px] md:w-full md:max-w-sm md:rounded-xl"
        )}
        role="dialog"
        aria-label="Chat"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <span className="font-semibold text-foreground">Assistant</span>
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearHistory}
                className="text-muted-foreground hover:text-foreground"
              >
                Clear
              </Button>
            )}
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label="Close chat"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[200px]"
        >
          {messages.length === 0 && !error && (
            <p className="text-center text-sm text-muted-foreground py-8">
              Send a message to start the conversation.
            </p>
          )}
          {error && (
            <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={cn(
                "flex",
                msg.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                )}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 rounded-2xl bg-muted px-4 py-2.5 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Thinking...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="border-t p-4">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={placeholder}
              disabled={isLoading}
              className="min-h-[44px] flex-1"
              aria-label="Message"
            />
            <Button
              type="submit"
              disabled={!input.trim() || isLoading}
              size="icon"
              className="h-11 w-11 shrink-0"
              aria-label="Send"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
        </form>
      </div>
      )}
    </>
  );
}

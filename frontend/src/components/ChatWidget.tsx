"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { api, ApiRequestError } from "@/lib/api";
import type { ChatMessage } from "@/types";

const SUGGESTED_QUESTIONS = [
  "What's his GenAI experience?",
  "Has he worked with AWS?",
  "What's his best project?",
  "Tell me about his internship experience",
  "What's his ML experience?",
  "What's his backend experience?",
  "Why should I hire him?",
];

const SUGGESTED_CHIPS = [
  { label: "GenAI", query: "What's his GenAI experience?" },
  { label: "AWS", query: "Has he worked with AWS?" },
  { label: "Best project", query: "What's his best project and why?" },
  { label: "Internships", query: "Walk me through his internship experience." },
  { label: "Machine learning", query: "What's his machine learning experience?" },
  { label: "Backend", query: "What's his backend engineering experience?" },
  { label: "Why hire me?", query: "Why should I hire him?" },
];

function useTypewriterPlaceholder(active: boolean) {
  const [placeholder, setPlaceholder] = useState("Ask about his AWS experience");
  const prefersReducedMotion = useRef(false);

  useEffect(() => {
    prefersReducedMotion.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
  }, []);

  useEffect(() => {
    if (!active) return;

    if (prefersReducedMotion.current) {
      let qIndex = 0;
      const interval = setInterval(() => {
        qIndex = (qIndex + 1) % SUGGESTED_QUESTIONS.length;
        setPlaceholder(SUGGESTED_QUESTIONS[qIndex]);
      }, 3500);
      return () => clearInterval(interval);
    }

    let questionIndex = 0;
    let charIndex = 0;
    let deleting = false;
    let timeoutId: ReturnType<typeof setTimeout>;

    const tick = () => {
      const current = SUGGESTED_QUESTIONS[questionIndex];

      if (!deleting) {
        charIndex++;
        setPlaceholder(current.slice(0, charIndex));
        if (charIndex === current.length) {
          deleting = true;
          timeoutId = setTimeout(tick, 1800);
          return;
        }
        timeoutId = setTimeout(tick, 45);
      } else {
        charIndex--;
        setPlaceholder(current.slice(0, charIndex));
        if (charIndex === 0) {
          deleting = false;
          questionIndex = (questionIndex + 1) % SUGGESTED_QUESTIONS.length;
          timeoutId = setTimeout(tick, 400);
          return;
        }
        timeoutId = setTimeout(tick, 25);
      }
    };

    timeoutId = setTimeout(tick, 500);
    return () => clearTimeout(timeoutId);
  }, [active]);

  return placeholder;
}

function RetrievalTrace() {
  return (
    <div className="flex items-center gap-2 text-xs text-paper-faint">
      <span className="flex gap-1">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-signal-gold [animation-delay:0ms]" />
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-signal-gold [animation-delay:150ms]" />
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-signal-gold [animation-delay:300ms]" />
      </span>
      Searching knowledge base
    </div>
  );
}

function SourceChips({ sources }: { sources: ChatMessage["sources"] }) {
  if (!sources || sources.length === 0) return null;

  return (
    <div className="mt-3 flex flex-wrap gap-2 animate-fade-in">
      {sources.map((source, i) =>
        source.url ? (
          <a
            key={i}
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-full border border-signal-gold/40 bg-signal-gold/10 px-3 py-1 text-xs text-paper transition-colors hover:bg-signal-gold/20"
          >
            {source.title}
          </a>
        ) : (
          <span
            key={i}
            className="inline-flex items-center rounded-full border border-ink-border bg-ink-surface px-3 py-1 text-xs text-paper-muted"
          >
            {source.title}
          </span>
        )
      )}
    </div>
  );
}

export function ChatWidget() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const placeholder = useTypewriterPlaceholder(!isFocused && input.length === 0);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  async function sendMessage(query: string) {
    if (!query.trim() || isSending) return;

    setError(null);
    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", content: query };
    const loadingMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "",
      isLoading: true,
    };

    setMessages((prev) => [...prev, userMsg, loadingMsg]);
    setInput("");
    setIsSending(true);

    try {
      const response = await api.sendChat(query);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === loadingMsg.id
            ? { ...m, content: response.answer, sources: response.sources, isLoading: false }
            : m
        )
      );
    } catch (err) {
      const message =
        err instanceof ApiRequestError
          ? err.status === 429
            ? "Too many questions at once — give it a few seconds and try again."
            : err.message
          : "Something went wrong. Please try again.";

      setMessages((prev) => prev.filter((m) => m.id !== loadingMsg.id));
      setError(message);
    } finally {
      setIsSending(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    sendMessage(input);
  }

  return (
    <div className="w-full">
      {messages.length > 0 && (
        <div className="mb-4 max-h-[420px] space-y-4 overflow-y-auto rounded-2xl border border-white/10 bg-black/40 p-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`animate-slide-up ${msg.role === "user" ? "text-right" : "text-left"}`}
            >
              {msg.role === "user" ? (
                <p className="inline-block rounded-lg bg-signal-gold px-4 py-2 text-sm text-paper">
                  {msg.content}
                </p>
              ) : msg.isLoading ? (
                <RetrievalTrace />
              ) : (
                <div className="inline-block max-w-[90%] text-left">
                  <div className="prose-invert prose-sm rounded-lg border border-white/10 bg-ink/80 px-4 py-3 text-sm leading-relaxed text-paper [&_p]:m-0 [&_strong]:text-signal-gold">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                  <SourceChips sources={msg.sources} />
                </div>
              )}
            </div>
          ))}
          <div ref={scrollRef} />
        </div>
      )}

      {error && (
        <p className="mb-2 text-xs text-signal-gold">{error}</p>
      )}

      <form onSubmit={handleSubmit} className="relative">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          disabled={isSending}
          maxLength={500}
          className="w-full rounded-full border border-white/20 bg-black/45 py-4 pl-5 pr-24 text-sm text-paper placeholder:text-paper-faint focus:border-signal-gold/70 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={isSending || !input.trim()}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full bg-signal-gold px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-paper transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-30"
        >
          {isSending ? "..." : "Ask"}
        </button>
      </form>

      <div className="mt-4 flex flex-wrap gap-2">
        {SUGGESTED_CHIPS.map((chip) => (
          <button
            key={chip.label}
            type="button"
            onClick={() => sendMessage(chip.query)}
            disabled={isSending}
            className="rounded-full border border-white/15 bg-black/30 px-3 py-1.5 text-xs text-paper-muted transition-colors hover:border-signal-gold/50 hover:text-paper disabled:opacity-40"
          >
            {chip.label}
          </button>
        ))}
      </div>
    </div>
  );
}

import { useState, useRef, useEffect, useCallback } from "react";
import { sendChatQuestion } from "../api/chatApi";
import { streamAssistantResponse } from "../services/streamAssistant";
import { useModal } from "../hooks/useModal";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  isAnchor?: boolean;
};

const createMessage = (
  role: Message["role"],
  content: string
): Message => ({
  id:
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${role}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  role,
  content,
});

const INITIAL_GREETING = `This R.A.G. assistant is my approach to exploring and adapting to modern AI testing practices using production engineering standards to showcase my foundation in Development & QA Automation.

Conversations may be logged, but no personal information is stored.`;

export default function ChatWidget({
  disableBackdrop = false,
  runContext,
  greeting,
  externalQuery,
  onExternalQueryConsumed,
  externalContext,
  onExternalContextConsumed,
  conversationKey,
  pageSource,
}: {
  disableBackdrop?: boolean;
  runContext?: string;
  greeting?: string;
  externalQuery?: string;
  onExternalQueryConsumed?: () => void;
  externalContext?: string;
  onExternalContextConsumed?: () => void;
  conversationKey?: string;
  pageSource?: "home" | "dashboard";
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isTypingGreeting, setIsTypingGreeting] = useState(false);
  const [greetingIndex, setGreetingIndex] = useState(0);
  const [keyboardOffset, setKeyboardOffset] = useState(0);

  const greetingText = greeting ?? INITIAL_GREETING;
  const pendingContextRef = useRef<string | null>(null);

  const TYPING_SPEED = 13;
  const isTestRuntime =
  typeof window !== "undefined" &&
  (window as any).__TEST__ === true;
  const savedScrollTopRef = useRef(0);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const bubbleRef = useRef<HTMLButtonElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const navIndexRef = useRef(-1);
  const isOpenRef = useRef(false);
  isOpenRef.current = isOpen;

  const userMessageRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const pendingScrollUserIdRef = useRef<string | null>(null);
  const lastCompletedUserIdRef = useRef<string | null>(null);
  const pendingAnchorScrollRef = useRef<string | null>(null);
  const setNav = (i: number) => {
    navIndexRef.current = i;
  };

  const scrollUserToTop = useCallback((el: HTMLDivElement | null) => {
    if (!el) return;
    el.scrollIntoView({ block: "start", behavior: "auto" });
  }, []);

  const keepInputFocus = useCallback(() => {
    const el = inputRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.focus({ preventScroll: true });
    });
  }, []);

  const preventButtonFocus = (
    e:
      | React.PointerEvent<HTMLButtonElement>
      | React.MouseEvent<HTMLButtonElement>
  ) => {
    e.preventDefault();
  };

  const requestClose = () => {
    if (scrollContainerRef.current) {
      savedScrollTopRef.current = scrollContainerRef.current.scrollTop;
    }
    setVisible(false);
    setTimeout(() => setIsOpen(false), 200);
  };

  const modalRef = useModal({
    isOpen,
    onRequestClose: requestClose,
    initialFocusRef: inputRef,
    restoreFocusRef: bubbleRef,
  });

  // Restore scroll position when chat reopens
  useEffect(() => {
    if (!isOpen) return;
    const id = requestAnimationFrame(() => {
      const id2 = requestAnimationFrame(() => {
        const container = scrollContainerRef.current;
        if (!container) return;
        container.scrollTop = savedScrollTopRef.current;
      });
      return () => cancelAnimationFrame(id2);
    });
    return () => cancelAnimationFrame(id);
  }, [isOpen]);

  // Start greeting typewriter when messages are empty
  useEffect(() => {
    if (messages.length !== 0) return;
    setIsTypingGreeting(true);
    setGreetingIndex(0);
    setMessages([createMessage("assistant", "")]);
  }, [messages.length]);

  // Scroll user message into view while streaming
  useEffect(() => {
    if (!isStreaming) return;
    const id = pendingScrollUserIdRef.current;
    if (!id) return;
    const el = userMessageRefs.current[id];
    if (!el) return;
    scrollUserToTop(el);
  }, [messages, isStreaming, scrollUserToTop]);

  const handleStreamingFinishedScroll = useCallback(() => {
    const id = lastCompletedUserIdRef.current;
    if (!id) return;
    const el = userMessageRefs.current[id];
    if (!el) return;
    requestAnimationFrame(() => { scrollUserToTop(el); });
    lastCompletedUserIdRef.current = null;
  }, [scrollUserToTop]);

  useEffect(() => {
    if (!isStreaming) {
      handleStreamingFinishedScroll();
    }
  }, [isStreaming, handleStreamingFinishedScroll]);

 // Typewriter effect for greeting
useEffect(() => {
  if (!isTypingGreeting) return;

  // ✅ TEST MODE: render instantly (no streaming)
  if (isTestRuntime) {
    setMessages((prev) => {
      const updated = [...prev];
      const last = updated[updated.length - 1];

      if (last && last.role === "assistant") {
        updated[updated.length - 1] = {
          ...last,
          content: greetingText,
        };
      }

      return updated;
    });

    setIsTypingGreeting(false);

    requestAnimationFrame(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop =
          scrollContainerRef.current.scrollHeight;
      }
    });

    return;
  }

  // ✅ NORMAL MODE: typewriter effect
  if (greetingIndex >= greetingText.length) {
    setIsTypingGreeting(false);

    requestAnimationFrame(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop =
          scrollContainerRef.current.scrollHeight;
      }
    });

    return;
  }

  const timeout = setTimeout(() => {
    const nextChar = greetingText[greetingIndex];

    setMessages((prev) => {
      const updated = [...prev];
      const last = updated[updated.length - 1];

      if (last && last.role === "assistant") {
        updated[updated.length - 1] = {
          ...last,
          content: last.content + nextChar,
        };
      }

      return updated;
    });

    setGreetingIndex((prev) => prev + 1);
  }, TYPING_SPEED);

  return () => clearTimeout(timeout);
}, [greetingIndex, isTypingGreeting, greetingText]);

  // External query: open chat and pre-fill input.
  // If an externalContext was provided alongside the query, capture it into the
  // pending ref so sendMessage can attach it as hidden backend context.
  useEffect(() => {
    if (!externalQuery) return;
    setInput(externalQuery);
    onExternalQueryConsumed?.();
    if (externalContext) {
      pendingContextRef.current = externalContext;
      onExternalContextConsumed?.();
    }
    if (!isOpenRef.current) {
      setIsOpen(true);
      setTimeout(() => setVisible(true), 10);
    }
    requestAnimationFrame(() => inputRef.current?.focus({ preventScroll: true }));
  }, [externalQuery, onExternalQueryConsumed, externalContext, onExternalContextConsumed]);

  // Append a new context greeting when the selected run changes
  const prevConversationKeyRef = useRef<string | undefined>(conversationKey);
  useEffect(() => {
    const prev = prevConversationKeyRef.current;
    prevConversationKeyRef.current = conversationKey;
    if (!prev || !conversationKey || prev === conversationKey) return;
    const newMsg = { ...createMessage("assistant", greetingText), isAnchor: true };
    pendingAnchorScrollRef.current = newMsg.id;
    setMessages((msgs) => [...msgs, newMsg]);
  }, [conversationKey, greetingText]);

  // Scroll to a newly appended anchor greeting after React commits the render
  useEffect(() => {
    const id = pendingAnchorScrollRef.current;
    if (!id) return;
    const el = userMessageRefs.current[id];
    if (!el) return;
    pendingAnchorScrollRef.current = null;
    requestAnimationFrame(() => scrollUserToTop(el));
  }, [messages, scrollUserToTop]);

  // Track visual viewport to keep chat above the software keyboard on mobile
  useEffect(() => {
    if (!isOpen) { setKeyboardOffset(0); return; }
    const vv = window.visualViewport;
    if (!vv) return;

    const update = () => {
      const offset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      setKeyboardOffset(offset);
    };

    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    update();

    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
      setKeyboardOffset(0);
    };
  }, [isOpen]);

  // Auto-resize textarea whenever input changes
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [input]);

  const goPrevQuestion = useCallback(() => {
    const navMessages = messages.filter((m) => m.role === "user" || m.isAnchor);
    if (!navMessages.length) return;
    const current = navIndexRef.current;
    const next = current <= 0 ? navMessages.length - 1 : current - 1;
    const el = userMessageRefs.current[navMessages[next].id];
    if (!el) return;
    scrollUserToTop(el);
    setNav(next);
  }, [messages, scrollUserToTop]);

  const goNextQuestion = useCallback(() => {
    const navMessages = messages.filter((m) => m.role === "user" || m.isAnchor);
    if (!navMessages.length) return;
    const current = navIndexRef.current;
    const next = current >= navMessages.length - 1 ? 0 : current + 1;
    const el = userMessageRefs.current[navMessages[next].id];
    if (!el) return;
    scrollUserToTop(el);
    setNav(next);
  }, [messages, scrollUserToTop]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKey = (e: KeyboardEvent) => {
      const input = inputRef.current;

      if (input && document.activeElement === input) {
        const caret = input.selectionStart ?? 0;
        const end = input.value.length;
        if (e.key === "ArrowUp" && caret === 0) { e.preventDefault(); goPrevQuestion(); }
        if (e.key === "ArrowDown" && caret === end) { e.preventDefault(); goNextQuestion(); }
        return;
      }

      if (e.key === "ArrowUp") { e.preventDefault(); goPrevQuestion(); }
      if (e.key === "ArrowDown") { e.preventDefault(); goNextQuestion(); }
    };

    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [goNextQuestion, goPrevQuestion, isOpen]);

  const sendMessage = async () => {
    const question = input.trim();
    if (!question || isStreaming) return;

    const userMessage = createMessage("user", question);
    const assistantMessage = createMessage("assistant", "");

    setInput("");
    if (inputRef.current) inputRef.current.style.height = "auto";
    setIsStreaming(true);
    pendingScrollUserIdRef.current = userMessage.id;
    lastCompletedUserIdRef.current = userMessage.id;

    setMessages((prev) => [...prev, userMessage, assistantMessage]);

    try {
      const sectionContext = pendingContextRef.current;
      pendingContextRef.current = null;
      const combinedContext = [runContext, sectionContext].filter(Boolean).join("\n\n") || undefined;
      const response = await sendChatQuestion(question, combinedContext, pageSource);
      await streamAssistantResponse(response, (chunk) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessage.id
              ? { ...msg, content: msg.content + chunk }
              : msg
          )
        );
      });
    } catch (err) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessage.id
            ? { ...msg, content: "Something went wrong. Please try again." }
            : msg
        )
      );
      console.error("Error in sendMessage:", err);
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <>
      <button
        id="chat-bubble-widget"
        ref={bubbleRef}
        onClick={() => {
          if (!isOpen) {
            setIsOpen(true);
            setTimeout(() => setVisible(true), 10);
          } else {
            requestClose();
          }
        }}
      >
        💬
      </button>

      {isOpen && (
        <div
          id="chat-window"
          className={`chat-backdrop ${visible ? "open" : "close"}`}
          onPointerDown={disableBackdrop ? undefined : requestClose}
          style={{
            position: "fixed",
            inset: 0,
            pointerEvents: disableBackdrop ? "none" : undefined,
            background: disableBackdrop ? "transparent" : "rgb(0,0,0,.4)",
            backdropFilter: disableBackdrop ? "none" : "blur(3px) saturate(140%)",
            WebkitBackdropFilter: disableBackdrop ? "none" : "blur(3px) saturate(140%)",
            zIndex: 999,
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "flex-end",
            transition: disableBackdrop
              ? undefined
              : "backdrop-filter 20s cubic-bezier(0.4,0,0.2,1), -webkit-backdrop-filter 20s cubic-bezier(0.4,0,0.2,1)",
          }}
        >
          <div
            ref={modalRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label="chat window section"
            onPointerDown={(e) => e.stopPropagation()}
            id="chat-window-section"
            className={`chat-widget ${visible ? "open" : "close"}`}
            style={{
              ...(keyboardOffset > 0 ? { bottom: `${keyboardOffset + 10}px` } : {}),
              ...(disableBackdrop ? { pointerEvents: "auto" } : {}),
            }}
          >
            <div id="chat-title">
              Welcome to Dave's Interactive Portfolio
            </div>

            <div ref={scrollContainerRef} className="chat-scroll">
              {messages.map((msg, index) => {
                const isUser = msg.role === "user";
                return (
                  <div
                    key={msg.id}
                    ref={
                      (isUser || msg.isAnchor)
                        ? (node) => { userMessageRefs.current[msg.id] = node; }
                        : undefined
                    }
                    className={`chat-message ${isUser ? "chat-user" : "chat-assistant"}`}
                    style={{ whiteSpace: "pre-wrap", lineHeight: "1.6" }}
                  >
                    {isUser && "> "}
                    {msg.content}
                    {msg.role === "assistant" &&
                      isStreaming &&
                      index === messages.length - 1 && (
                        <span className="typing-cursor">|</span>
                      )}
                  </div>
                );
              })}
            </div>

            <div className="chat-nav-controls">
              <button
                type="button"
                aria-label="Previous question"
                onPointerDown={preventButtonFocus}
                onMouseDown={preventButtonFocus}
                onClick={() => { goPrevQuestion(); keepInputFocus(); }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24">
                  <path d="M6 14l6-6 6 6" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              <button
                type="button"
                aria-label="Next question"
                onPointerDown={preventButtonFocus}
                onMouseDown={preventButtonFocus}
                onClick={() => { goNextQuestion(); keepInputFocus(); }}
              >
                <svg width="28" height="28px" viewBox="0 0 24 24">
                  <path d="M6 10l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

            <div style={{ display: "flex", borderTop: "1px solid var(--soft)" }}>
              <textarea
                value={input}
                ref={inputRef}
                rows={1}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: "#fff",
                  padding: "12px",
                  fontSize: "14px",
                  resize: "none",
                  overflowY: "hidden",
                  lineHeight: "1.4",
                  minHeight: "40px",
                  maxHeight: "120px",
                  display: "block",
                  width: "100%",
                  boxSizing: "border-box",
                  fontFamily: "inherit",
                }}
                placeholder="Ask me anything in any language"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

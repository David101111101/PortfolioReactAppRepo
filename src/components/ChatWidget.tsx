import { useState, useRef, useEffect, useCallback } from "react";
import { sendChatQuestion } from "../api/chatApi";
import { streamAssistantResponse } from "../services/streamAssistant";
import { useModal } from "../hooks/useModal";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
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

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isTypingGreeting, setIsTypingGreeting] = useState(false);
  const [greetingIndex, setGreetingIndex] = useState(0);

  const TYPING_SPEED = 13;
  const savedScrollTopRef = useRef(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const bubbleRef = useRef<HTMLButtonElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const navIndexRef = useRef(-1);
  
  const userMessageRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const pendingScrollUserIdRef = useRef<string | null>(null);
  const lastCompletedUserIdRef = useRef<string | null>(null);
  const setNav = (i: number) => {
    navIndexRef.current = i;
  };

  const scrollUserToTop = useCallback((el: HTMLDivElement | null) => {
  if (!el) return;

  el.scrollIntoView({
    block: "start",
    behavior: "auto",
  });
}, []);

  const keepInputFocus = useCallback(() => {
    const input = inputRef.current;
    if (!input) return;

    requestAnimationFrame(() => {
      input.focus({ preventScroll: true });
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

  useEffect(() => {
    if (messages.length !== 0) return;
    setIsTypingGreeting(true);
    setGreetingIndex(0);
    setMessages([createMessage("assistant", "")]);
  }, [messages.length]);

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

  requestAnimationFrame(() => {
    scrollUserToTop(el);
  });

  lastCompletedUserIdRef.current = null;
}, [scrollUserToTop]);

useEffect(() => {
  if (!isStreaming) {
    handleStreamingFinishedScroll();
  }
}, [isStreaming, handleStreamingFinishedScroll]);

  useEffect(() => {
    if (!isTypingGreeting) return;
    if (greetingIndex >= INITIAL_GREETING.length) {
      setIsTypingGreeting(false);

      requestAnimationFrame(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = 0;
        }
      });
      return;
    }

    const timeout = setTimeout(() => {
      const nextChar = INITIAL_GREETING[greetingIndex];

      setMessages((prev) => {
        const updated = [...prev];
        if (updated.length > 0 && updated[0].role === "assistant") {
          updated[0] = {
            ...updated[0],
            content: updated[0].content + nextChar,
          };
        }
        return updated;
      });

      setGreetingIndex((prev) => prev + 1);
    }, TYPING_SPEED);

    return () => clearTimeout(timeout);
  }, [greetingIndex, isTypingGreeting]);

  const goPrevQuestion = useCallback(() => {
    const userMessages = messages.filter((m) => m.role === "user");
    if (!userMessages.length) return;

    const current = navIndexRef.current;
    const next =
      current <= 0 ? userMessages.length - 1 : current - 1;

    const el = userMessageRefs.current[userMessages[next].id];
    if (!el) return;

    scrollUserToTop(el);
    setNav(next);
  }, [messages, scrollUserToTop]);

  const goNextQuestion = useCallback(() => {
    const userMessages = messages.filter((m) => m.role === "user");
    if (!userMessages.length) return;

    const current = navIndexRef.current;
    const next =
      current >= userMessages.length - 1 ? 0 : current + 1;

    const el = userMessageRefs.current[userMessages[next].id];
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

        if (e.key === "ArrowUp" && caret === 0) {
          e.preventDefault();
          goPrevQuestion();
        }

        if (e.key === "ArrowDown" && caret === end) {
          e.preventDefault();
          goNextQuestion();
        }

        return;
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        goPrevQuestion();
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        goNextQuestion();
      }
    };

    document.addEventListener("keydown", handleKey);

    return () =>
      document.removeEventListener("keydown", handleKey);
  }, [goNextQuestion, goPrevQuestion, isOpen]);

  const sendMessage = async () => {
    const question = input.trim();
    if (!question || isStreaming) return;

    const userMessage = createMessage("user", question);
    const assistantMessage = createMessage("assistant", "");

    setInput("");
    setIsStreaming(true);
    pendingScrollUserIdRef.current = userMessage.id;
    lastCompletedUserIdRef.current = userMessage.id;

    setMessages((prev) => [...prev, userMessage, assistantMessage]);

    try {
      const response = await sendChatQuestion(question);

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
            ? {
                ...msg,
                content: "Something went wrong. Please try again.",
              }
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
          onPointerDown={requestClose}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgb(0,0,0,.4)",
            backdropFilter: "blur(3px) saturate(140%)",
            WebkitBackdropFilter: "blur(3px) saturate(140%)",
            zIndex: 999,
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "flex-end",
            transition:
              "backdrop-filter 20s cubic-bezier(0.4,0,0.2,1), -webkit-backdrop-filter 20s cubic-bezier(0.4,0,0.2,1)",
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
                      isUser
                        ? (node) => {
                            userMessageRefs.current[msg.id] = node;
                          }
                        : undefined
                    }
                    className={`chat-message ${
                      isUser ? "chat-user" : "chat-assistant"
                    }`}
                    style={{
                      whiteSpace: "pre-wrap",
                      lineHeight: "1.6",
                    }}
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
                onClick={() => {
                  goPrevQuestion();
                  keepInputFocus();
                }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24">
                  <path
                    d="M6 14l6-6 6 6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              <button
                type="button"
                aria-label="Next question"
                onPointerDown={preventButtonFocus}
                onMouseDown={preventButtonFocus}
                onClick={() => {
                  goNextQuestion();
                  keepInputFocus();
                }}
              >
                <svg width="28" height="28px" viewBox="0 0 24 24">
                  <path
                    d="M6 10l6 6 6-6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>

            <div
              style={{
                display: "flex",
                borderTop: "1px solid var(--soft)",
              }}
            >
              <input
                value={input}
                ref={inputRef}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: "#fff",
                  padding: "12px",
                  fontSize: "14px",
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
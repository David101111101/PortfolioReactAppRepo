import { useState, useRef, useEffect, useLayoutEffect, useCallback } from "react";
import { sendChatQuestion } from "../api/chatApi";
import { streamAssistantResponse } from "../services/streamAssistant";
import { useModal } from "../hooks/useModal";


type Message = {
  role: "user" | "assistant";
  content: string;
};

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
  const TYPING_SPEED = 10; // milliseconds per character
  const savedScrollTopRef = useRef(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const bubbleRef = useRef<HTMLButtonElement | null>(null);
  const userAnchorsRef = useRef<HTMLDivElement[]>([]);
  const hasUserAskedRef = useRef(false);
  const streamStartedRef = useRef(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const navIndexRef = useRef(-1);
  const setNav = (i: number) => {
    navIndexRef.current = i;
  };
  const scrollToAnchorTop = useCallback((el: HTMLDivElement) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const top = el.offsetTop - container.offsetTop;

    container.scrollTo({
      top,
      behavior: "auto"
    });
  }, []);

const requestClose = () => {
  if (scrollContainerRef.current) {
    savedScrollTopRef.current =
      scrollContainerRef.current.scrollTop;
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
  setMessages([
    {
      role: "assistant",
      content: "",
    },
  ]);
}, [messages.length]);

useLayoutEffect(() => {
  const container = scrollContainerRef.current;
  if (!container) return;
  const nodes =
    container.querySelectorAll<HTMLDivElement>(".chat-user");
  userAnchorsRef.current = Array.from(nodes);
}, [messages, isStreaming]);


useEffect(() => {
  if (!isTypingGreeting) return;
  if (greetingIndex >= INITIAL_GREETING.length) {
    setIsTypingGreeting(false);
      // ensure greeting starts at top
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

useEffect(() => {
  if (!isStreaming) return;
  if (!streamStartedRef.current) return;

  streamStartedRef.current = false;

  const anchors = userAnchorsRef.current;
  if (!anchors.length) return;

  const lastIndex = anchors.length - 1;

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      scrollToAnchorTop(anchors[lastIndex]);
      setNav(lastIndex);
    });
  });

}, [isStreaming, scrollToAnchorTop]);

useEffect(() => {
  if (!hasUserAskedRef.current) return;

  const anchors = userAnchorsRef.current;
  if (!anchors.length) return;

  const lastIndex = anchors.length - 1;

  requestAnimationFrame(() => {
    scrollToAnchorTop(anchors[lastIndex]);
    setNav(lastIndex);
  });

}, [messages.length, scrollToAnchorTop]);

const goPrevQuestion = useCallback(() => {
  const anchors = userAnchorsRef.current;
  if (!anchors.length) return;
  const current = navIndexRef.current;
  const next =
    current <= 0 ? anchors.length - 1 : current - 1;

  scrollToAnchorTop(anchors[next]);
  setNav(next);
}, [scrollToAnchorTop]);

const goNextQuestion = useCallback(() => {
  const anchors = userAnchorsRef.current;
  if (!anchors.length) return;
  const current = navIndexRef.current;
  const next =
    current >= anchors.length - 1 ? 0 : current + 1;
    scrollToAnchorTop(anchors[next]);
    setNav(next);
}, [scrollToAnchorTop]);

// keyboard navigation for user messages
useEffect(() => {
  if (!isOpen) return;

  const handleKey = (e: KeyboardEvent) => {
    const input = inputRef.current;

    // ===== CASE 1 — input is focused
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

      return; // do not run global navigation
    }

    // ===== CASE 2 — global navigation
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
    if (!input.trim() || isStreaming) return;
    const question = input;
    try {
        setInput(""); 
        hasUserAskedRef.current = true;
        setMessages(prev => [
          ...prev,
          { role: "user", content: question },
          { role: "assistant", content: "" }
        ]);
        await Promise.resolve();
          const response = await sendChatQuestion(question);
            let firstChunk = true;
            await streamAssistantResponse(response, (chunk) => {
            setMessages((prev) => {
              const updated = [...prev];
              const lastIndex = updated.length - 1;
                if (updated[lastIndex]?.role === "assistant") {
                  updated[lastIndex] = {
                    ...updated[lastIndex],
                    content: updated[lastIndex].content + chunk,
                  };
                }
              return updated;
              });
              if (firstChunk) {
                firstChunk = false;
                streamStartedRef.current = true;
                setIsStreaming(true);    
              }          
            });
      } catch (err) {
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: "Something went wrong. Please try again.",
            },
          ]);
          console.error("Error in sendMessage:", err);
        } finally {
          setIsStreaming(false);
        }
    };    
  return (
    <>
      {/* Floating Bubble */}
      <button id="chat-bubble-widget" ref={bubbleRef}
        onClick={() => {
            if (!isOpen) {
                setIsOpen(true);
                setTimeout(() => setVisible(true), 10);
            } else {
                requestClose();
            }
        }}
         /* Chat Bubble Widget */
        style={{}}
      >💬</button>

      {/* Chat Window */}
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
      transition: "backdrop-filter 20s cubic-bezier(0.4,0,0.2,1), -webkit-backdrop-filter 20s cubic-bezier(0.4,0,0.2,1)",
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
      }}
    >
          <div id="chat-title">
            Welcome to Dave's Interactive Portfolio
          </div>
          <div
            ref={scrollContainerRef}
            className="chat-scroll">
          {messages.map((msg, index) => {
            const isUser = msg.role === "user";            
            return (
              <div
                key={index}
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
              aria-label="Previous question"
              onClick={goPrevQuestion}
            >
              <svg width="28" height="28" viewBox="0 0 24 24">
                <path d="M6 14l6-6 6 6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"/>
              </svg>
            </button>

            <button
              aria-label="Next question"
              onClick={goNextQuestion}
            >
              <svg width="28" height="28px" viewBox="0 0 24 24">
                <path d="M6 10l6 6 6-6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"/>
              </svg>
            </button>

          </div>
          <div style={{display: "flex",borderTop: "1px solid var(--soft)",}}> 
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
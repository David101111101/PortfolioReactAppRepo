import { useState, useRef, useEffect } from "react";
import { sendChatQuestion } from "../api/chatApi";
import { streamAssistantResponse } from "../services/streamAssistant";
import { useModal } from "../hooks/useModal";


type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const lockScrollRef = useRef(false);
  const anchorOffsetRef = useRef(0);
  const [isTypingGreeting, setIsTypingGreeting] = useState(false);
  const [greetingIndex, setGreetingIndex] = useState(0);
  const TYPING_SPEED = 10; // milliseconds per character
  const savedScrollTopRef = useRef(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const bubbleRef = useRef<HTMLButtonElement | null>(null);
  
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

  requestAnimationFrame(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop =
        savedScrollTopRef.current;
    }
  });
  }, [isOpen]);

  const INITIAL_GREETING = `This R.A.G. assistant is my approach to exploring and adapting to modern AI testing practices using production engineering standards to showcase my foundation in Development & QA Automation.

Conversations may be logged, but no personal information is stored.`;

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
}, []);

useEffect(() => {
  if (!isTypingGreeting) return;

  if (greetingIndex >= INITIAL_GREETING.length) {
    setIsTypingGreeting(false);
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
  if (!lockScrollRef.current) return;
  if (!isStreaming) {
    lockScrollRef.current = false;
    return;
  }

  const container = scrollContainerRef.current;
  const anchor = userAnchorRef.current;

  if (!container || !anchor) return;

  const desired =
    anchor.offsetTop - anchorOffsetRef.current;

  container.scrollTop = desired;
});

const scrollContainerRef = useRef<HTMLDivElement>(null);
const userAnchorRef = useRef<HTMLDivElement | null>(null);
const sendMessage = async () => {
    if (!input.trim() || isStreaming) return;
    const question = input;
    try {
        setInput("");
        setIsStreaming(true);  
        
          setMessages((prev) => {
            const updated = [
              ...prev,
              { role: "user" as const, content: question },
              { role: "assistant" as const, content: "" },
            ];
            return updated;
          });

          
            requestAnimationFrame(() => {
            const container = scrollContainerRef.current;
            const anchor = userAnchorRef.current;

            if (container && anchor) {
              anchorOffsetRef.current =
                anchor.offsetTop - container.scrollTop;

              lockScrollRef.current = true;

              anchor.scrollIntoView({
                block: "start",
                behavior: "smooth",
              });
            }
          });
          const response = await sendChatQuestion(question);

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
            });

      } catch (err) {
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: "Something went wrong. Please try again.",
            },
          ]);
        } finally {
          setIsStreaming(false);
        }
    };

  return (
    <>
      {/* Floating Bubble */}
      <button id="chatBubbleWidget" ref={bubbleRef}
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
      background: "rgba(0,0,0,.4)",
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
            className="chat-scroll"
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "12px",
              fontSize: "14px",
            }}
            >
            
          {messages.map((msg, index) => {
            const isLastUser =
              msg.role === "user" &&
              index === messages.length - 2; // because assistant placeholder is last

            return (
              <div
                key={index}
                ref={isLastUser ? userAnchorRef : null}
                className={`chat-message ${
                  msg.role === "user" ? "chat-user" : "chat-assistant"
                }`}
                style={{
                  whiteSpace: "pre-wrap",
                  lineHeight: "1.6",
                }}
              >
                {msg.role === "user" && "> "}
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
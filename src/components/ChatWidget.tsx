import { useState, useRef, useEffect } from "react";

const WORKER_URL =
  import.meta.env.DEV
    ? "http://127.0.0.1:8787"
    : "https://portfolio-chatbot.davidstevenabril.workers.dev/";

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [hasGreeted, setHasGreeted] = useState(false);
  const [isTypingGreeting, setIsTypingGreeting] = useState(false);
  const [greetingIndex, setGreetingIndex] = useState(0);
  const TYPING_SPEED = 70;
  const INITIAL_GREETING = `I've been trained on his CV and all repository documentation.
  Ask me about his projects, architecture decisions, tech stack, or career experience.`;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
  if (!isOpen || hasGreeted) return;

  setHasGreeted(true);
  setIsTypingGreeting(true);
  setGreetingIndex(0);

  const assistantMessage: Message = {
    role: "assistant",
    content: "",
  };

  setMessages([assistantMessage]);
}, [isOpen, hasGreeted]);

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

  const sendMessage = async () => {
    if (!input.trim() || isStreaming) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsStreaming(true);

    const response = await fetch(WORKER_URL, {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
    },
    body: JSON.stringify({ question: input }),
    });
    if (!response.body) {
      setIsStreaming(false);
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");

    let assistantMessage: Message = { role: "assistant", content: "" };
    setMessages((prev) => [...prev, assistantMessage]);

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);

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

    }

    setIsStreaming(false);
  };

  return (
    <>
      {/* Floating Bubble */}
      <div id="chatBubbleWidget"
        onClick={() => {
            if (!isOpen) {
                setIsOpen(true);
                setTimeout(() => setVisible(true), 10);
            } else {
                setVisible(false);
                setTimeout(() => setIsOpen(false), 200);
            }
        }}
         /* Chat Bubble Widget */
        style={{

        }}
      >
        💬
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div id="chat-window-section" className={`chat-widget ${visible ? "open" : "close"}`}
          style={{
          }}
        >
          <div id="chat-title"
            style={{
              padding: "12px",
              borderBottom: "1px solid var(--soft)",
              fontSize: "0.9rem",
              fontWeight: "bold",
            }}
          >
            Welcome to Dave's RAG-LLM terminal.
          </div>

          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "12px",
              fontSize: "14px",
            }}
          >
                {messages.map((msg, index) => {
                const isLast = index === messages.length - 1;

                return (
                    <div
                    key={index}
                    className={`chat-message ${
                        msg.role === "user"
                        ? "chat-user"
                        : "chat-assistant"
                    }`}
                    >
                    {msg.role === "user" && "> "}
                    {msg.content}
                    {msg.role === "assistant" && isStreaming && isLast && (
                        <span className="terminal-cursor" />
                    )}
                    </div>
                );
                })}
            <div ref={messagesEndRef} />
          </div>

          <div
            style={{
              display: "flex",
              borderTop: "1px solid var(--soft)",
            }}
          > 
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                color: "#fff",
                padding: "12px",
              }}
              placeholder=""
              
            />
            
          </div>
        </div>
      )}
    </>
  );
}
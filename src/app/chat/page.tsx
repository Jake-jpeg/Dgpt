"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

export default function ChatPage() {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    const newMessages = [...messages, { role: "user", content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      const data = await response.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, something went wrong. Please try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-[#1a365d] text-white border-b-4 border-[#c59d5f]">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition">
            <div className="w-10 h-10 bg-[#c59d5f] rounded-lg flex items-center justify-center text-xl">⚖️</div>
            <div>
              <h1 className="text-xl font-semibold">DivorceGPT</h1>
              <p className="text-xs opacity-80">Form Assistant</p>
            </div>
          </Link>
          <div className="text-sm opacity-80">
            Questions about your forms? Ask below.
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 overflow-y-auto">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-[#c59d5f] rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6">
              ⚖️
            </div>
            <h2 className="text-2xl font-semibold text-[#1a365d] mb-3">Welcome to DivorceGPT</h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              I can help explain your New York divorce forms, what they ask for, and how to file them.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {[
                "What is form UD-1?",
                "How do I file in Queens County?",
                "What does 'irretrievable breakdown' mean?",
                "What are the filing fees?",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setInput(suggestion)}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm text-gray-700 hover:border-[#1a365d] hover:text-[#1a365d] transition"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`mb-4 flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                msg.role === "user"
                  ? "bg-[#1a365d] text-white rounded-br-sm"
                  : "bg-white text-gray-800 rounded-bl-sm shadow-sm border border-gray-100"
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start mb-4">
            <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm border border-gray-100">
              <span className="text-gray-500">Thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </main>

      {/* Input Area */}
      <footer className="border-t bg-white p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
              placeholder="Ask about your divorce forms..."
              className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#1a365d] transition"
            />
            <button
              onClick={sendMessage}
              disabled={isLoading || !input.trim()}
              className="px-6 py-3 bg-[#1a365d] text-white rounded-xl hover:bg-[#2c5282] disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
            >
              Send
            </button>
          </div>
          <p className="text-center text-xs text-gray-400 mt-3">
            DivorceGPT explains forms and procedures. It is not legal advice. Consult an attorney for your specific situation.
          </p>
        </div>
      </footer>
    </div>
  );
}

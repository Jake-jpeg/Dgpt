"use client";

import { useState, useRef, useEffect } from "react";

export default function Home() {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const WEBHOOK_URL = "https://hook.us2.make.com/wowvn4y288pk4fs80s2ipf9dcp354rly";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
      });

      const text = await response.text();
      setMessages((prev) => [...prev, { role: "assistant", content: text }]);
    } catch (error) {
      setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, something went wrong." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-[#1a365d] text-white p-4 border-b-4 border-[#c59d5f]">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <div className="w-10 h-10 bg-[#c59d5f] rounded-lg flex items-center justify-center text-xl">⚖️</div>
          <div>
            <h1 className="text-xl font-semibold">DivorceGPT</h1>
            <p className="text-sm opacity-80">Uncontested Divorce Guidance</p>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 overflow-y-auto">
        {messages.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <h2 className="text-2xl font-semibold text-[#1a365d] mb-2">Welcome to DivorceGPT</h2>
            <p>I'm here to help guide you through the uncontested divorce process in New York.</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`mb-4 flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                msg.role === "user"
                  ? "bg-[#1a365d] text-white rounded-br-sm"
                  : "bg-gray-200 text-gray-800 rounded-bl-sm"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start mb-4">
            <div className="bg-gray-200 px-4 py-3 rounded-2xl rounded-bl-sm">
              <span className="animate-pulse">Thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </main>

      {/* Input Area */}
      <footer className="border-t bg-white p-4">
        <div className="max-w-4xl mx-auto flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Type your question..."
            className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#1a365d]"
          />
          <button
            onClick={sendMessage}
            disabled={isLoading}
            className="px-6 py-3 bg-[#1a365d] text-white rounded-xl hover:bg-[#2c5282] disabled:opacity-50"
          >
            Send
          </button>
        </div>
        <p className="text-center text-xs text-gray-400 mt-2">
          This is general information, not legal advice. Consult an attorney for your specific situation.
        </p>
      </footer>
    </div>
  );
}
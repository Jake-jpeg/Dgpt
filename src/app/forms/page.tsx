"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { 
  loadSession, 
  createSession, 
  saveSession, 
  NY_COUNTIES,
  type SessionData,
  type UD1FormData 
} from "../../lib/session";

function FormsContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  
  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [session, setSession] = useState<SessionData | null>(null);
  
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<UD1FormData>>({});
  const [isComplete, setIsComplete] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Validate session on mount
  useEffect(() => {
    const validateSession = async () => {
      if (!sessionId) {
        setIsValidating(false);
        return;
      }

      try {
        const res = await fetch("/api/validate-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });
        
        const data = await res.json();
        
        if (data.valid && data.paymentIntentId) {
          setIsValid(true);
          setPaymentIntentId(data.paymentIntentId);
          
          // Load or create session
          let existingSession = loadSession(data.paymentIntentId);
          if (!existingSession) {
            existingSession = createSession(data.paymentIntentId);
          }
          
          setSession(existingSession);
          setFormData(existingSession.ud1Data || {});
          setMessages(existingSession.chatHistory || []);
          setIsComplete(existingSession.ud1Complete || false);
          
          // Send initial greeting if no chat history
          if (existingSession.chatHistory.length === 0) {
            setTimeout(() => sendInitialGreeting(), 500);
          }
        }
      } catch (error) {
        console.error("Session validation error:", error);
      } finally {
        setIsValidating(false);
      }
    };

    validateSession();
  }, [sessionId]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Save session whenever formData or messages change
  useEffect(() => {
    if (paymentIntentId && messages.length > 0) {
      const updatedSession: SessionData = {
        paymentIntentId,
        createdAt: session?.createdAt || new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        phase: 1,
        ud1Data: formData,
        ud1Complete: isComplete,
        chatHistory: messages,
      };
      saveSession(updatedSession);
    }
  }, [formData, messages, isComplete, paymentIntentId]);

  const sendInitialGreeting = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/forms/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          messages: [{ role: "user", content: "Hi, I'm ready to start filling out my divorce forms." }],
          currentData: {},
        }),
      });
      
      const data = await res.json();
      setMessages([
        { role: "assistant", content: data.reply },
      ]);
    } catch (error) {
      console.error("Initial greeting error:", error);
      setMessages([
        { role: "assistant", content: "Welcome! I'll help you complete your Summons with Notice (UD-1). Let's start with the basics. What is the full legal name of the Plaintiff (the person filing for divorce)?" },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    const newMessages: { role: "user" | "assistant"; content: string }[] = [...messages, { role: "user", content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const res = await fetch("/api/forms/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          currentData: formData,
        }),
      });

      const data = await res.json();
      
      console.log("Chat response:", { 
        reply: data.reply?.substring(0, 100) + "...", 
        extractedData: data.extractedData, 
        isComplete: data.isComplete 
      });
      
      // Update form data if extracted
      if (data.extractedData) {
        console.log("Updating form data with:", data.extractedData);
        setFormData(prev => ({ ...prev, ...data.extractedData }));
      }
      
      // Check if form is complete
      if (data.isComplete) {
        console.log("Form marked as complete!");
        setIsComplete(true);
      }
      
      setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
    } catch (error) {
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: "Sorry, something went wrong. Please try again." },
      ]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const generateDocument = async () => {
    setIsGenerating(true);
    
    console.log("Generating document with data:", formData);
    
    // Validate we have all required fields
    if (!formData.plaintiffName || !formData.defendantName || !formData.qualifyingCounty || 
        !formData.qualifyingParty || !formData.qualifyingAddress || !formData.plaintiffAddress) {
      alert("Missing required fields. Please complete all fields before generating.");
      setIsGenerating(false);
      return;
    }
    
    try {
      const res = await fetch("/api/forms/ud1", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plaintiffName: formData.plaintiffName,
          defendantName: formData.defendantName,
          filingCounty: formData.qualifyingCounty,  // Map qualifyingCounty to filingCounty
          qualifyingParty: formData.qualifyingParty,
          qualifyingAddress: formData.qualifyingAddress,
          plaintiffAddress: formData.plaintiffAddress,
          plaintiffPhone: formData.plaintiffPhone || '',
        }),
      });

      console.log("Response status:", res.status);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error("Generation error:", errorData);
        throw new Error(errorData.error || "Failed to generate document");
      }

      // Download the PDF directly
      const blob = await res.blob();
      console.log("Received PDF, size:", blob.size);
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `UD-1_Summons_${(formData.plaintiffName || "Document").replace(/\s+/g, "_")}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      console.log("PDF downloaded successfully");
    } catch (error) {
      console.error("Download error:", error);
      alert("Failed to generate document: " + (error instanceof Error ? error.message : "Unknown error"));
    } finally {
      setIsGenerating(false);
    }
  };

  // Check if all required fields are filled (phone is optional but recommended)
  const allFieldsFilled = !!(
    formData.plaintiffName &&
    formData.defendantName &&
    formData.qualifyingCounty &&
    formData.qualifyingParty &&
    formData.qualifyingAddress &&
    formData.plaintiffAddress
  );
  
  // Count completed fields including phone
  const completedFields = [
    formData.plaintiffName,
    formData.defendantName,
    formData.qualifyingCounty,
    formData.qualifyingParty,
    formData.qualifyingAddress,
    formData.plaintiffPhone,
    formData.plaintiffAddress,
  ].filter(Boolean).length;

  // Loading state
  if (isValidating) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-[#1a365d] border-t-transparent" />
          <p className="mt-4 text-zinc-600">Validating your session...</p>
        </div>
      </div>
    );
  }

  // Invalid session
  if (!isValid || !sessionId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4">
        <div className="mx-auto max-w-md rounded-2xl bg-white p-8 text-center shadow-xl ring-1 ring-zinc-100">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <h2 className="mt-4 text-xl font-bold text-zinc-900">Session Not Found</h2>
          <p className="mt-2 text-zinc-600">
            Your session may have expired or the link is invalid. Please complete the eligibility check and payment to continue.
          </p>
          <Link
            href="/qualify"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#c59d5f] px-6 py-3 font-semibold text-white shadow-lg transition hover:bg-[#d4ac6e]"
          >
            Start Over
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-zinc-100 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3 transition hover:opacity-80">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#1a365d] to-[#2c5282] shadow-lg shadow-[#1a365d]/20">
              <span className="text-lg">⚖️</span>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-zinc-900">DivorceGPT</h1>
              <p className="text-xs text-zinc-500">Phase 1: Summons with Notice (UD-1)</p>
            </div>
          </Link>
          
          <div className="flex items-center gap-4">
            <div className="hidden items-center gap-2 sm:flex">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm text-zinc-500">Session active • 30 days</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Dual Panel */}
      <main className="flex flex-1 flex-col lg:flex-row">
        {/* Left Panel - Chat */}
        <div className="flex flex-1 flex-col lg:w-2/3 lg:border-r lg:border-zinc-200">
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            <div className="mx-auto max-w-2xl space-y-4">
              {messages.length === 0 && !isLoading && (
                <div className="py-12 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1a365d] to-[#2c5282] shadow-xl">
                    <span className="text-3xl">📝</span>
                  </div>
                  <h2 className="mt-6 text-xl font-bold text-zinc-900">Preparing your session...</h2>
                </div>
              )}
              
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                      msg.role === "user"
                        ? "bg-gradient-to-br from-[#1a365d] to-[#2c5282] text-white shadow-lg shadow-[#1a365d]/20"
                        : "bg-white text-zinc-800 shadow-sm ring-1 ring-zinc-100"
                    }`}
                  >
                    <p className="whitespace-pre-wrap text-sm sm:text-base">{msg.content}</p>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-zinc-100">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 animate-bounce rounded-full bg-[#c59d5f] [animation-delay:-0.3s]" />
                      <div className="h-2 w-2 animate-bounce rounded-full bg-[#c59d5f] [animation-delay:-0.15s]" />
                      <div className="h-2 w-2 animate-bounce rounded-full bg-[#c59d5f]" />
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Chat Input */}
          <div className="border-t border-zinc-100 bg-white/80 p-4 backdrop-blur-sm">
            <div className="mx-auto max-w-2xl">
              <div className="flex gap-3">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                  placeholder="Type your answer..."
                  className="flex-1 rounded-full border-0 bg-zinc-100 px-5 py-3 text-zinc-900 shadow-sm ring-1 ring-zinc-200 transition-all duration-200 placeholder:text-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#c59d5f]"
                />
                <button
                  onClick={sendMessage}
                  disabled={isLoading || !input.trim()}
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#1a365d] to-[#2c5282] text-white shadow-lg shadow-[#1a365d]/20 transition-all duration-200 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                  </svg>
                </button>
              </div>
              <p className="mt-2 text-center text-xs text-zinc-400">
                Your progress is saved automatically
              </p>
            </div>
          </div>
        </div>

        {/* Right Panel - Form Preview */}
        <div className="border-t border-zinc-200 bg-white p-4 sm:p-6 lg:w-1/3 lg:border-t-0 lg:overflow-y-auto">
          <div className="mx-auto max-w-md">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-zinc-900">UD-1 Progress</h2>
                <p className="text-sm text-zinc-500">Summons with Notice</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-lg font-bold text-zinc-700">
                {completedFields}/7
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-zinc-200">
              <div 
                className="h-full bg-gradient-to-r from-[#1a365d] to-[#c59d5f] transition-all duration-500"
                style={{ width: `${(completedFields / 7) * 100}%` }}
              />
            </div>
            
            <div className="mt-6 space-y-3">
              {/* Plaintiff Name */}
              <FieldCard 
                label="Plaintiff Name" 
                value={formData.plaintiffName} 
                description="Person filing for divorce"
              />

              {/* Defendant Name */}
              <FieldCard 
                label="Defendant Name" 
                value={formData.defendantName}
                description="Other spouse"
              />

              {/* Qualifying County */}
              <FieldCard 
                label="Filing County" 
                value={formData.qualifyingCounty ? `${formData.qualifyingCounty} County` : undefined}
                description="Where you'll file"
              />

              {/* Qualifying Party */}
              <FieldCard 
                label="Residency Basis" 
                value={formData.qualifyingParty ? `${formData.qualifyingParty.charAt(0).toUpperCase() + formData.qualifyingParty.slice(1)} meets requirement` : undefined}
                description="Who qualifies under NY law"
              />

              {/* Qualifying Address */}
              <FieldCard 
                label="Qualifying Address" 
                value={formData.qualifyingAddress}
                description="Address of qualifying party"
              />

              {/* Plaintiff Phone */}
              <FieldCard 
                label="Phone Number" 
                value={formData.plaintiffPhone}
                description="For court contact"
              />

              {/* Plaintiff Address */}
              <FieldCard 
                label="Mailing Address" 
                value={formData.plaintiffAddress}
                description="For service of papers"
              />
            </div>

            {/* Generate Button */}
            {(allFieldsFilled || isComplete) && (
              <button
                onClick={generateDocument}
                disabled={isGenerating}
                className="mt-8 w-full rounded-full bg-[#c59d5f] py-4 text-lg font-semibold text-white shadow-xl shadow-[#c59d5f]/30 transition-all duration-200 hover:bg-[#d4ac6e] hover:shadow-2xl hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isGenerating ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Generating...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                    </svg>
                    Download UD-1 PDF
                  </span>
                )}
              </button>
            )}

            {/* Help Text */}
            <div className="mt-6 rounded-xl bg-blue-50 p-4">
              <div className="flex gap-3">
                <svg className="h-5 w-5 flex-shrink-0 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                </svg>
                <div className="text-sm text-blue-800">
                  <p className="font-medium">Need help?</p>
                  <p className="mt-1 text-blue-700">Just ask in the chat! I can explain any term or field.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-100 bg-white py-4">
        <p className="text-center text-xs text-zinc-500">
          DivorceGPT explains forms and procedures. This is not legal advice.
        </p>
      </footer>
    </div>
  );
}

// Field Card Component
function FieldCard({ label, value, description }: { label: string; value?: string; description: string }) {
  const isComplete = !!value;
  
  return (
    <div className={`rounded-xl p-4 transition-all duration-300 ${
      isComplete 
        ? "bg-green-50 ring-1 ring-green-200" 
        : "bg-zinc-50 ring-1 ring-zinc-200"
    }`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-zinc-700">{label}</span>
          </div>
          {isComplete ? (
            <p className="mt-1 truncate text-sm text-zinc-900">{value}</p>
          ) : (
            <p className="mt-1 text-xs text-zinc-400">{description}</p>
          )}
        </div>
        {isComplete ? (
          <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-green-500">
            <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
        ) : (
          <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-zinc-200">
            <span className="text-xs text-zinc-400">...</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Main export with Suspense boundary
export default function FormsPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-[#1a365d] border-t-transparent" />
          <p className="mt-4 text-zinc-600">Loading...</p>
        </div>
      </div>
    }>
      <FormsContent />
    </Suspense>
  );
}

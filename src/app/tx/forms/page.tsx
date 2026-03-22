"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import TypewriterMessage from "../../../components/TypewriterMessage";
import {
  loadSession,
  createSession,
  saveSession,
  terminateSession,
  type SessionData,
} from "../../../lib/session";

const PDF_SERVICE_URL = process.env.NEXT_PUBLIC_PDF_SERVICE_URL || "http://localhost:8080";

// NV phase1 field keys — used for data routing
const TX_FIELDS = [
  'plaintiffName', 'firstSpouseAddress', 'firstSpouseCityStateZip', 'firstSpousePhone', 'firstSpouseEmail', 'firstSpouseDOB',
  'defendantName', 'secondSpouseAddress', 'secondSpouseCityStateZip', 'secondSpousePhone', 'secondSpouseEmail', 'secondSpouseDOB',
  'county', 'marriageDate', 'marriageCity', 'marriageState',
  'residentSpouseName', 'communityPropertyOption', 'communityDebtOption',
  'nameChange1', 'nameChange1MarriedName', 'nameChange1MaidenName',
  'nameChange2', 'nameChange2MarriedName', 'nameChange2MaidenName',
  'witnessName', 'witnessAddress', 'witnessCityStateZip', 'witnessPhone', 'witnessEmail',
  'witnessYearsInNV', 'witnessRelationship', 'residencySinceDate', 'witnessTimesPerWeek',
];

// Sidebar display fields (subset shown in the panel)
const SIDEBAR_FIELDS: { key: string; label: string }[] = [
  { key: 'plaintiffName', label: 'Petitioner' },
  { key: 'defendantName', label: 'Respondent' },
  { key: 'county', label: 'County' },
  { key: 'marriageDate', label: 'Marriage Date' },
  { key: 'marriageCity', label: 'Marriage City' },
  { key: 'marriageState', label: 'Marriage State' },
  { key: 'firstSpouseAddress', label: '1st Address' },
  { key: 'firstSpouseCityStateZip', label: '1st City/ST/ZIP' },
  { key: 'firstSpousePhone', label: '1st Phone' },
  { key: 'firstSpouseEmail', label: '1st Email' },
  { key: 'firstSpouseDOB', label: '1st DOB' },
  { key: 'secondSpouseAddress', label: '2nd Address' },
  { key: 'secondSpouseCityStateZip', label: '2nd City/ST/ZIP' },
  { key: 'secondSpousePhone', label: '2nd Phone' },
  { key: 'secondSpouseEmail', label: '2nd Email' },
  { key: 'secondSpouseDOB', label: '2nd DOB' },
  { key: 'residentSpouseName', label: 'Resident Spouse' },
  { key: 'communityPropertyOption', label: 'Property' },
  { key: 'communityDebtOption', label: 'Debt' },
  { key: 'nameChange1', label: 'Name Change (1st)' },
  { key: 'nameChange2', label: 'Name Change (2nd)' },
  { key: 'witnessName', label: 'Witness Name' },
  { key: 'witnessRelationship', label: 'Witness Relation' },
  { key: 'residencySinceDate', label: 'Resident Since' },
];

function NVFormsContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [session, setSession] = useState<SessionData | null>(null);

  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamingIndex, setStreamingIndex] = useState<number | null>(null);

  const addAssistantMessage = (content: string) => {
    setMessages(prev => {
      const next = [...prev, { role: "assistant" as const, content }];
      setStreamingIndex(next.length - 1);
      return next;
    });
  };
  const setAssistantMessages = (content: string) => {
    setMessages([{ role: "assistant", content }]);
    setStreamingIndex(0);
  };

  const [phase1Data, setPhase1Data] = useState<Record<string, string>>({});
  const [phase1Complete, setPhase1Complete] = useState(false);
  const [isDisqualified, setIsDisqualified] = useState(false);
  const [isTerminated, setIsTerminated] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [messageCount, setMessageCount] = useState(0);
  const [isExhausted, setIsExhausted] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [customerEmail, setCustomerEmail] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<'chat' | 'panel'>('chat');
  const [showBookmarkBar, setShowBookmarkBar] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    try {
      if (localStorage.getItem('dgpt_bookmark_dismissed') === 'true') {
        setShowBookmarkBar(false);
      }
    } catch {}
  }, []);

  const MAX_MESSAGES = 200;
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const validateSession = async () => {
      if (!sessionId) { setIsValidating(false); return; }
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
          let existingSession = loadSession(data.paymentIntentId);

          if (existingSession && (existingSession as SessionData & { expired?: boolean }).expired) {
            setIsExpired(true);
            setIsValidating(false);
            return;
          }

          if (!existingSession) existingSession = createSession(data.paymentIntentId);

          saveSession(existingSession);

          setSession(existingSession);
          setPhase1Data((existingSession.phase1Data || {}) as Record<string, string>);
          setPhase1Complete(existingSession.phase1Complete);
          setMessages(existingSession.chatHistory || []);
          setIsDisqualified(existingSession.disqualified);
          const count = existingSession.messageCount || 0;
          setMessageCount(count);

          if ((existingSession.phase1Generated || 0) >= 5) {
            // Session complete — max generations reached
          } else if (count >= MAX_MESSAGES) {
            setIsExhausted(true);
          } else if (existingSession.chatHistory.length === 0) {
            setTimeout(() => sendInitialGreeting(), 500);

            if (data.customerEmail) {
              setCustomerEmail(data.customerEmail);
              const sessionUrl = window.location.href;
              fetch('/api/send-session-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: data.customerEmail, sessionUrl }),
              })
                .then(res => { if (res.ok) setEmailSent(true); })
                .catch(err => console.error('Email send failed:', err));
            }
          }
        }
      } catch (error) { console.error("Session validation error:", error); }
      finally { setIsValidating(false); }
    };
    validateSession();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  useEffect(() => {
    if (paymentIntentId && messages.length > 0) {
      const updatedSession: SessionData = {
        paymentIntentId,
        createdAt: session?.createdAt || new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        currentPhase: 1,
        phase1Complete, phase2Complete: false, phase3Complete: false,
        phase1Data, phase2Data: {}, phase3Data: {},
        disqualified: isDisqualified, disqualifyReason: '',
        chatHistory: messages,
        dateWarningIssued: session?.dateWarningIssued || false,
        addressValidationResults: session?.addressValidationResults || {},
        messageCount,
        generationCount: session?.generationCount || 0,
        phase1Generated: session?.phase1Generated || 0,
        phase2Generated: 0,
        phase3Generated: 0,
      };
      saveSession(updatedSession);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase1Data, messages, phase1Complete, paymentIntentId, isDisqualified, messageCount]);

  const sendInitialGreeting = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/forms/chat/tx", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: "Hi, I'm ready to start." }], currentPhase: 1, phase1Data: {}, phase2Data: {}, phase3Data: {} }),
      });
      const data = await res.json();
      setAssistantMessages(data.reply);
    } catch {
      setAssistantMessages("Welcome to DivorceGPT. I'll help you prepare your uncontested divorce forms for Texas.\n\n**Quick note:** Bookmark this page now. This URL is your login \u2014 no accounts or passwords.\n\nSay **'Let's start'** or ask questions first. Session valid for 12 months.");
    }
    finally { setIsLoading(false); }
  };

  const copySessionLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2500);
    } catch {
      const inp = document.createElement('input');
      inp.value = window.location.href;
      document.body.appendChild(inp);
      inp.select();
      document.execCommand('copy');
      document.body.removeChild(inp);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2500);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    if (messageCount >= MAX_MESSAGES) {
      setIsExhausted(true);
      return;
    }

    const userMessage = input.trim();

    // Check restart
    const restartKeywords = ['start over', 'restart', 'go back', 'made a mistake', 'redo', 'begin again'];
    const wantsRestart = restartKeywords.some(kw => userMessage.toLowerCase().includes(kw));

    if (wantsRestart) {
      setInput("");
      setPhase1Data({});
      setPhase1Complete(false);
      setAssistantMessages("Let's start fresh.\n\nYou can give me all your information at once, or we can go one question at a time. Just say **\"Let's start\"**.");
      return;
    }

    setInput("");
    const newMessages = [...messages, { role: "user" as const, content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    const newCount = messageCount + 1;
    setMessageCount(newCount);

    try {
      const res = await fetch("/api/forms/chat/tx", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages, currentPhase: 1, phase1Data, phase2Data: {}, phase3Data: {} }),
      });
      const data = await res.json();

      if (data.extractedData) {
        const newData: Record<string, string> = {};
        for (const [key, value] of Object.entries(data.extractedData)) {
          if (TX_FIELDS.includes(key)) {
            newData[key] = value as string;
          }
        }
        if (Object.keys(newData).length > 0) {
          setPhase1Data(prev => ({ ...prev, ...newData }));
        }
      }

      if (data.phase1Complete) setPhase1Complete(true);
      if (data.isDisqualified) setIsDisqualified(true);

      // Handle termination
      if (data.isTerminated) {
        setIsTerminated(true);
        addAssistantMessage(data.reply);

        try {
          fetch('/api/send-monitor-alert', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: 'admin@divorcegpt.com',
              subject: `[DivorceGPT] SESSION TERMINATED \u2014 NV \u2014 ${phase1Data.plaintiffName || 'Unknown'}`,
              body: `SESSION TERMINATED\n\nState: Texas\nSession ID: ${sessionId}\nPayment Intent: ${paymentIntentId}\nCustomer Email: ${customerEmail || 'Not available'}\nPetitioner: ${phase1Data.plaintiffName || 'Not collected'}\nRespondent: ${phase1Data.defendantName || 'Not collected'}\nTermination Reason: ${data.terminateReason || 'policy_violation'}\nTimestamp: ${new Date().toISOString()}\n\nNote: Chat content is not included. DivorceGPT does not retain or transmit conversation data.`,
            }),
          }).catch(err => console.error('Termination email failed:', err));
        } catch {}

        if (paymentIntentId) terminateSession(paymentIntentId);
        return;
      }

      addAssistantMessage(data.reply);
    } catch { addAssistantMessage("Sorry, something went wrong."); }
    finally { setIsLoading(false); if (!isMobile) inputRef.current?.focus(); }
  };

  const generateDocuments = async () => {
    if (session) {
      const MAX_PHASE_GENERATIONS = 5;
      if ((session.phase1Generated || 0) >= MAX_PHASE_GENERATIONS) {
        alert('You have reached the maximum number of document generations (5). For technical support, email admin@divorcegpt.com.');
        return;
      }
    }

    setIsGenerating(true);
    try {
      // Build the form data for NV phase1-package
      const formData: Record<string, string> = {};
      for (const key of TX_FIELDS) {
        formData[key] = phase1Data[key] || '';
      }
      // Derive witnessStreetCityState and residentSpouseAddress for the affidavit
      formData.witnessStreetCityState = `${phase1Data.witnessAddress || ''}, ${(phase1Data.witnessCityStateZip || '').replace(/\s+\d{5}(-\d{4})?$/, '')}`;
      // residentSpouseAddress: find which spouse is the resident and use their full address
      if (phase1Data.residentSpouseName === phase1Data.plaintiffName) {
        formData.residentSpouseAddress = `${phase1Data.firstSpouseAddress || ''}, ${phase1Data.firstSpouseCityStateZip || ''}`;
      } else {
        formData.residentSpouseAddress = `${phase1Data.secondSpouseAddress || ''}, ${phase1Data.secondSpouseCityStateZip || ''}`;
      }

      const res = await fetch(`${PDF_SERVICE_URL}/generate/tx/phase1-package`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to generate filing packet");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `TX_Filing_Packet_${(phase1Data.plaintiffName || "Document").replace(/\s+/g, "_")}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Update generation count
      if (session && paymentIntentId) {
        const updated = { ...session, phase1Generated: (session.phase1Generated || 0) + 1 };
        saveSession(updated);
        setSession(updated);
      }

      const used = (session?.phase1Generated || 0) + 1;
      const remaining = 5 - used;
      if (remaining > 0) {
        alert(`Filing packet downloaded successfully!\n\nYou have ${remaining} download${remaining === 1 ? '' : 's'} remaining.\nSave your files now.\n\nRemember: Both spouses must sign the Joint Petition and Decree before a notary. The witness signs the Affidavit before a notary.`);
      } else {
        alert(`Filing packet downloaded. This was your final download.\nMake sure you have saved your files.`);
      }
    } catch (error) {
      console.error('TX packet generation error:', error);
      alert('Failed to generate filing packet. Please try again.');
    }
    finally { setIsGenerating(false); }
  };

  const resetSession = () => {
    setPhase1Data({});
    setPhase1Complete(false);
    setIsDisqualified(false);
    setAssistantMessages("Let's start fresh.\n\nYou can give me all your information at once, or we can go one question at a time. Just say **\"Let's start\"**.");
  };

  // Loading state
  if (isValidating) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#1a365d] border-t-transparent" />
      </div>
    );
  }

  // Invalid session
  if (!sessionId || !isValid) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="max-w-md text-center px-4">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-100 mb-6">
            <svg className="h-10 w-10 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-zinc-900">Invalid Session</h2>
          <p className="mt-2 text-zinc-600">This session link is invalid or has expired. Please start a new session.</p>
          <Link href="/tx" className="mt-6 inline-flex items-center gap-2 text-[#1a365d] font-medium">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Back to Texas
          </Link>
        </div>
      </div>
    );
  }

  // Expired session
  if (isExpired) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="max-w-md text-center px-4">
          <h2 className="text-2xl font-bold text-zinc-900">Session Expired</h2>
          <p className="mt-2 text-zinc-600">Your 12-month session has expired.</p>
          <Link href="/tx" className="mt-6 inline-flex items-center gap-2 text-[#1a365d] font-medium">Back to Texas</Link>
        </div>
      </div>
    );
  }

  // Terminated session
  if (isTerminated) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="max-w-md text-center px-4">
          <h2 className="text-2xl font-bold text-zinc-900">Session Terminated</h2>
          <p className="mt-2 text-zinc-600">This session has been terminated. Your payment will be refunded.</p>
        </div>
      </div>
    );
  }

  // Disqualified
  if (isDisqualified) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="max-w-md text-center px-4">
          <h2 className="text-2xl font-bold text-zinc-900">Outside Our Scope</h2>
          <p className="mt-2 text-zinc-600">Your situation falls outside what DivorceGPT can handle. We recommend consulting with a Texas family law attorney.</p>
          <Link href="/tx" className="mt-6 inline-flex items-center gap-2 text-[#1a365d] font-medium">Back to Texas</Link>
        </div>
      </div>
    );
  }

  // Count filled fields
  const filledFields = SIDEBAR_FIELDS.filter(f => phase1Data[f.key]).length;

  // =========== MAIN CHAT UI ===========
  return (
    <div className="flex h-screen flex-col bg-zinc-50">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-sm bg-white/80 border-b border-zinc-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/tx" className="flex items-center gap-3 transition hover:opacity-80">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#1a365d] to-[#2c5282]">
                  <span className="text-sm">&#9878;&#65039;</span>
                </div>
                <div>
                  <h1 className="text-base font-semibold text-zinc-900">DivorceGPT</h1>
                  <p className="text-[10px] text-zinc-500">Texas Filing Packet</p>
                </div>
              </Link>
            </div>

            <div className="flex items-center gap-2">
              {/* Mobile tab toggle */}
              {isMobile && (
                <div className="flex rounded-full bg-zinc-100 p-1">
                  <button onClick={() => setMobileTab('chat')} className={`rounded-full px-3 py-1 text-xs font-medium transition ${mobileTab === 'chat' ? 'bg-white text-zinc-900 shadow' : 'text-zinc-500'}`}>Chat</button>
                  <button onClick={() => setMobileTab('panel')} className={`rounded-full px-3 py-1 text-xs font-medium transition ${mobileTab === 'panel' ? 'bg-white text-zinc-900 shadow' : 'text-zinc-500'}`}>
                    Fields {filledFields > 0 && <span className="ml-1 text-[10px] text-[#c59d5f]">{filledFields}</span>}
                  </button>
                </div>
              )}

              {/* Copy link button */}
              <button onClick={copySessionLink} className="rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-200" title="Copy session link">
                {linkCopied ? 'Copied!' : 'Copy Link'}
              </button>

              {/* Desktop sidebar toggle */}
              {!isMobile && (
                <button onClick={() => setShowSidebar(!showSidebar)} className="rounded-full bg-zinc-100 p-2 text-zinc-600 transition hover:bg-zinc-200">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d={showSidebar ? "M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" : "M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"} />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Bookmark bar */}
      {showBookmarkBar && (
        <div className="bg-[#1a365d] text-white px-4 py-2 text-center text-sm flex items-center justify-center gap-2">
          <span>Bookmark this page now &mdash; this URL is how you return to your session.</span>
          <button onClick={() => { setShowBookmarkBar(false); try { localStorage.setItem('dgpt_bookmark_dismissed', 'true'); } catch {} }} className="text-white/60 hover:text-white ml-2 text-lg">&times;</button>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Chat panel */}
        <div className={`flex flex-1 flex-col ${isMobile && mobileTab !== 'chat' ? 'hidden' : ''}`}>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-6">
            <div className="mx-auto max-w-3xl space-y-4">
              {messages.map((msg, i) => {
                const isLastAssistant = msg.role === "assistant" && i === messages.length - 1 && streamingIndex === i;
                return (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                    msg.role === 'user'
                      ? 'bg-[#1a365d] text-white'
                      : 'bg-white text-zinc-800 shadow-sm ring-1 ring-zinc-100'
                  }`}>
                    {isLastAssistant ? (
                      <TypewriterMessage content={msg.content} onComplete={() => setStreamingIndex(null)} />
                    ) : (
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                    )}
                  </div>
                </div>
                );
              })}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-zinc-100">
                    <div className="flex gap-1">
                      <div className="h-2 w-2 rounded-full bg-zinc-300 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="h-2 w-2 rounded-full bg-zinc-300 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="h-2 w-2 rounded-full bg-zinc-300 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input */}
          {!isExhausted && (
            <div className="border-t border-zinc-100 bg-white px-4 py-3">
              <div className="mx-auto flex max-w-3xl gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  placeholder="Type your message..."
                  disabled={isLoading}
                  className="flex-1 rounded-full border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm focus:border-[#1a365d] focus:outline-none focus:ring-1 focus:ring-[#1a365d] disabled:opacity-50"
                />
                <button
                  onClick={sendMessage}
                  disabled={isLoading || !input.trim()}
                  className="rounded-full bg-[#1a365d] p-2.5 text-white transition hover:bg-[#2c5282] disabled:opacity-50"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                  </svg>
                </button>
              </div>
              <p className="mt-1 text-center text-[10px] text-zinc-400">
                DivorceGPT is a document preparation service. This is not legal advice.
              </p>
            </div>
          )}

          {isExhausted && (
            <div className="border-t border-zinc-100 bg-amber-50 px-4 py-4 text-center">
              <p className="text-sm text-amber-800">Message limit reached (200). For support: admin@divorcegpt.com</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        {((!isMobile && showSidebar) || (isMobile && mobileTab === 'panel')) && (
          <div className={`${isMobile ? 'w-full' : 'w-80'} border-l border-zinc-100 bg-white overflow-y-auto`}>
            <div className="p-4">
              {/* Filing Packet header */}
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-zinc-900">Texas Filing Packet</h3>
                <p className="text-xs text-zinc-500 mt-1">
                  {filledFields}/{SIDEBAR_FIELDS.length} fields collected
                </p>
                <div className="mt-2 h-1.5 rounded-full bg-zinc-100">
                  <div
                    className="h-1.5 rounded-full bg-gradient-to-r from-[#1a365d] to-[#c59d5f] transition-all duration-500"
                    style={{ width: `${(filledFields / SIDEBAR_FIELDS.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Documents list */}
              <div className="mb-4 rounded-xl bg-zinc-50 p-3">
                <h4 className="text-xs font-semibold text-zinc-700 mb-2">Documents</h4>
                {[
                  'Cover Sheet',
                  'Joint Petition for Divorce',
                  'Decree of Divorce',
                  'Affidavit of Resident Witness',
                ].map((doc, i) => (
                  <div key={i} className="flex items-center gap-2 py-1">
                    <div className={`h-2 w-2 rounded-full ${phase1Complete ? 'bg-green-500' : 'bg-zinc-300'}`} />
                    <span className="text-xs text-zinc-600">{doc}</span>
                  </div>
                ))}
              </div>

              {/* Generate button */}
              {phase1Complete && (
                <div className="space-y-2 mb-4">
                  <button
                    onClick={generateDocuments}
                    disabled={isGenerating}
                    className={`w-full rounded-xl py-3 text-sm font-semibold transition-all duration-200 ${
                      isGenerating
                        ? 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
                        : 'bg-[#c59d5f] text-white shadow-lg shadow-[#c59d5f]/30 hover:bg-[#d4ac6e] hover:shadow-xl'
                    }`}
                  >
                    {isGenerating ? (
                      <span className="inline-flex items-center gap-2">
                        <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Generating...
                      </span>
                    ) : (
                      'Download Filing Packet'
                    )}
                  </button>
                  <button
                    onClick={resetSession}
                    className="w-full rounded-lg border border-red-200 bg-red-50 py-2 text-sm font-medium text-red-600 hover:bg-red-100 hover:border-red-300 transition-colors"
                  >
                    Start Over
                  </button>
                </div>
              )}

              {/* Field values */}
              <div className="space-y-2">
                {SIDEBAR_FIELDS.map(({ key, label }) => (
                  <div key={key} className={`rounded-lg p-2 ${phase1Data[key] ? 'bg-green-50 ring-1 ring-green-200' : 'bg-zinc-50'}`}>
                    <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">{label}</p>
                    <p className={`text-sm ${phase1Data[key] ? 'text-zinc-900' : 'text-zinc-300'}`}>
                      {phase1Data[key] || '\u2014'}
                    </p>
                  </div>
                ))}
              </div>

              {/* Start over link (when not yet complete) */}
              {!phase1Complete && Object.keys(phase1Data).length > 0 && (
                <button onClick={resetSession} className="mt-4 w-full text-sm text-zinc-500 hover:text-zinc-700 underline">
                  Start over
                </button>
              )}

              {/* Email confirmation */}
              {emailSent && customerEmail && (
                <div className="mt-4 rounded-lg bg-blue-50 p-3">
                  <p className="text-xs text-blue-700">Session link sent to {customerEmail}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function NVFormsPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#1a365d] border-t-transparent" />
      </div>
    }>
      <NVFormsContent />
    </Suspense>
  );
}

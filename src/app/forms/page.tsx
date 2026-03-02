"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "../../components/LanguageProvider";
import { Locale } from "../../lib/dictionary";
import { 
  loadSession, 
  createSession, 
  saveSession, 
  terminateSession,
  type SessionData,
  type Phase1Data,
  type Phase2Data,
  type Phase3Data,
} from "../../lib/session";

// PDF Service URL - set this in your environment variables
const PDF_SERVICE_URL = process.env.NEXT_PUBLIC_PDF_SERVICE_URL || "http://localhost:8080";

function FormsContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const { t, lang, setLang } = useLanguage();
  
  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [session, setSession] = useState<SessionData | null>(null);
  
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [currentPhase, setCurrentPhase] = useState<1 | 2 | 3>(1);
  const [phase1Data, setPhase1Data] = useState<Partial<Phase1Data>>({});
  const [phase2Data, setPhase2Data] = useState<Partial<Phase2Data>>({});
  const [phase3Data, setPhase3Data] = useState<Partial<Phase3Data>>({});
  const [phase1Complete, setPhase1Complete] = useState(false);
  const [phase2Complete, setPhase2Complete] = useState(false);
  const [phase3Complete, setPhase3Complete] = useState(false);
  const [isDisqualified, setIsDisqualified] = useState(false);
  const [isTerminated, setIsTerminated] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [allComplete, setAllComplete] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const [isExhausted, setIsExhausted] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  
  const MAX_MESSAGES = 200;
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Check if all phases complete
  useEffect(() => {
    if (phase1Complete && phase2Complete && phase3Complete) {
      setAllComplete(true);
    }
  }, [phase1Complete, phase2Complete, phase3Complete]);

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
          
          // Check if session expired
          if (existingSession && (existingSession as SessionData & { expired?: boolean }).expired) {
            setIsExpired(true);
            setIsValidating(false);
            return;
          }
          
          if (!existingSession) existingSession = createSession(data.paymentIntentId);
          
          // ═══════════════════════════════════════════════════════════
          // SESSION DATA INTEGRITY CHECK
          // If a phase is marked complete but required fields are missing,
          // reset the completion flag. Prevents corrupt/stale sessions.
          // ═══════════════════════════════════════════════════════════
          const p1 = existingSession.phase1Data || {};
          const p1Fields = ['plaintiffName', 'defendantName', 'qualifyingCounty', 'qualifyingParty', 
                           'qualifyingAddress', 'plaintiffPhone', 'plaintiffAddress', 'defendantAddress', 'ceremonyType'];
          const p1Valid = p1Fields.every(f => (p1 as Record<string, string>)[f]);
          let wasRepaired = false;
          if (existingSession.phase1Complete && !p1Valid) {
            existingSession.phase1Complete = false;
            wasRepaired = true;
          }
          
          const p2 = existingSession.phase2Data || {};
          const p2Fields = ['indexNumber', 'summonsDate', 'marriageDate', 'marriageCity', 'marriageState', 'breakdownDate'];
          const p2Valid = p2Fields.every(f => (p2 as Record<string, string>)[f]);
          if (existingSession.phase2Complete && !p2Valid) {
            existingSession.phase2Complete = false;
            wasRepaired = true;
          }
          
          const p3 = existingSession.phase3Data || {};
          const p3Fields = ['judgmentEntryDate', 'defendantCurrentAddress'];
          const p3Valid = p3Fields.every(f => (p3 as Record<string, string>)[f]);
          if (existingSession.phase3Complete && !p3Valid) {
            existingSession.phase3Complete = false;
            wasRepaired = true;
          }
          
          // If phase completion was downgraded, also fix currentPhase
          if (!existingSession.phase1Complete && existingSession.currentPhase > 1) {
            existingSession.currentPhase = 1;
          }
          if (!existingSession.phase2Complete && existingSession.currentPhase > 2) {
            existingSession.currentPhase = 2;
          }
          
          // If session was repaired, clear stale chat and inject recovery message
          if (wasRepaired) {
            existingSession.chatHistory = [{
              role: 'assistant' as const,
              content: "Welcome back. Your previous session had incomplete data, so I've reset it. Let's pick up where we left off.\n\nPlease provide your information again and I'll prepare your forms. You can give me everything at once:\n• Your full legal name\n• Your spouse's full legal name\n• Your address (with ZIP)\n• Your spouse's address (with ZIP)\n• Your phone number\n• Which county you're filing in\n• Whether you or your spouse meets the residency requirement\n• Whether the marriage was civil or religious"
            }];
          }
          
          // Save the corrected session back
          saveSession(existingSession);
          
          setSession(existingSession);
          setCurrentPhase(existingSession.currentPhase);
          setPhase1Data(existingSession.phase1Data || {});
          setPhase2Data(existingSession.phase2Data || {});
          setPhase3Data(existingSession.phase3Data || {});
          setPhase1Complete(existingSession.phase1Complete);
          setPhase2Complete(existingSession.phase2Complete);
          setPhase3Complete(existingSession.phase3Complete);
          setMessages(existingSession.chatHistory || []);
          setIsDisqualified(existingSession.disqualified);
          // Load message count and check if exhausted
          const count = existingSession.messageCount || 0;
          setMessageCount(count);
          if (count >= MAX_MESSAGES) {
            setIsExhausted(true);
          } else if (existingSession.chatHistory.length === 0) {
            setTimeout(() => sendInitialGreeting(), 500);
          }
        }
      } catch (error) { console.error("Session validation error:", error); }
      finally { setIsValidating(false); }
    };
    validateSession();
  }, [sessionId]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  useEffect(() => {
    if (paymentIntentId && messages.length > 0) {
      const updatedSession: SessionData = {
        paymentIntentId,
        createdAt: session?.createdAt || new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        currentPhase, phase1Complete, phase2Complete, phase3Complete,
        phase1Data, phase2Data, phase3Data,
        disqualified: isDisqualified, disqualifyReason: '', chatHistory: messages,
        dateWarningIssued: session?.dateWarningIssued || false,
        addressValidationResults: session?.addressValidationResults || {},
        messageCount,
        generationCount: session?.generationCount || 0,
        phase1Generated: session?.phase1Generated || false,
        phase2Generated: session?.phase2Generated || false,
        phase3Generated: session?.phase3Generated || false,
      };
      saveSession(updatedSession);
    }
  }, [phase1Data, phase2Data, phase3Data, messages, currentPhase, phase1Complete, phase2Complete, phase3Complete, paymentIntentId, isDisqualified, session, messageCount]);

  const sendInitialGreeting = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/forms/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: "Hi, I'm ready to start." }], currentPhase: 1, phase1Data: {}, phase2Data: {}, phase3Data: {} }),
      });
      const data = await res.json();
      setMessages([{ role: "assistant", content: data.reply }]);
    } catch { setMessages([{ role: "assistant", content: "Welcome to DivorceGPT. I'll help you prepare your uncontested divorce forms for New York State.\n\n**Before we begin:** Do you have any questions about how this system works? I can explain:\n• What the three phases mean (Phase 1, 2, and 3)\n• What happens after you complete each phase\n• How long the process typically takes\n• Technical support options\n\nIf you'd like to learn more first, just ask. Otherwise, say **'Let's start'** and we'll begin collecting your information for the UD-1 (Summons with Notice).\n\nYour session is valid for 12 months with up to 3 document generations included." }]); }
    finally { setIsLoading(false); }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    
    // Check if session is exhausted
    if (messageCount >= MAX_MESSAGES) {
      setIsExhausted(true);
      return;
    }
    
    const userMessage = input.trim();
    
    // Check if user wants to restart/go back
    const restartKeywords = ['start over', 'restart', 'go back', 'made a mistake', 'redo', 'begin again', 'phase 1 again'];
    const wantsRestart = restartKeywords.some(kw => userMessage.toLowerCase().includes(kw));
    
    if (wantsRestart && currentPhase > 1) {
      setInput("");
      resetToPhase1();
      return;
    }
    
    setInput("");
    const newMessages = [...messages, { role: "user" as const, content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);
    
    // Increment message count
    const newCount = messageCount + 1;
    setMessageCount(newCount);
    
    try {
      const res = await fetch("/api/forms/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages, currentPhase, phase1Data, phase2Data, phase3Data }),
      });
      const data = await res.json();
      if (data.extractedData) {
        // Route fields to correct phase based on field name, not current phase
        const phase1Fields = ['plaintiffName', 'defendantName', 'qualifyingCounty', 'qualifyingParty', 
                             'qualifyingAddress', 'plaintiffPhone', 'plaintiffAddress', 'defendantAddress', 'ceremonyType'];
        const phase2Fields = ['indexNumber', 'summonsDate', 'marriageDate', 'marriageCity', 'marriageState', 'breakdownDate'];
        const phase3Fields = ['judgmentEntryDate', 'defendantCurrentAddress'];
        
        const p1Data: Record<string, string> = {};
        const p2Data: Record<string, string> = {};
        const p3Data: Record<string, string> = {};
        
        for (const [key, value] of Object.entries(data.extractedData)) {
          if (phase1Fields.includes(key)) p1Data[key] = value as string;
          else if (phase2Fields.includes(key)) p2Data[key] = value as string;
          else if (phase3Fields.includes(key)) p3Data[key] = value as string;
        }
        
        if (Object.keys(p1Data).length > 0) setPhase1Data(prev => ({ ...prev, ...p1Data }));
        if (Object.keys(p2Data).length > 0) setPhase2Data(prev => ({ ...prev, ...p2Data }));
        if (Object.keys(p3Data).length > 0) setPhase3Data(prev => ({ ...prev, ...p3Data }));
      }
      if (data.phase1Complete) setPhase1Complete(true);
      if (data.phase2Complete) setPhase2Complete(true);
      if (data.phase3Complete) setPhase3Complete(true);
      if (data.isDisqualified) setIsDisqualified(true);
      
      // Handle termination - pure disengagement
      if (data.isTerminated) {
        setIsTerminated(true);
        setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
        // Clear all session data immediately
        if (paymentIntentId) {
          terminateSession(paymentIntentId);
        }
        return; // Stop processing
      }
      
      setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
    } catch { setMessages(prev => [...prev, { role: "assistant", content: "Sorry, something went wrong." }]); }
    finally { setIsLoading(false); inputRef.current?.focus(); }
  };

  const advancePhase = () => {
    if (currentPhase === 1 && phase1Complete) {
      setCurrentPhase(2);
      setMessages(prev => [...prev, { role: "assistant", content: "Welcome to Phase 2! What is your Index Number? (Format: 12345/2026)" }]);
    } else if (currentPhase === 2 && phase2Complete) {
      setCurrentPhase(3);
      setMessages(prev => [...prev, { role: "assistant", content: "Welcome to Phase 3! What date was the Judgment entered?" }]);
    }
  };

  const goToPhase = (phase: 1 | 2 | 3) => {
    if (phase === 1) {
      setCurrentPhase(1);
      setMessages(prev => [...prev, { role: "assistant", content: "Returning to Phase 1. How can I help you with your UD-1 information?" }]);
    } else if (phase === 2 && phase1Complete) {
      setCurrentPhase(2);
      setMessages(prev => [...prev, { role: "assistant", content: "Returning to Phase 2. How can I help you with your submission package?" }]);
    } else if (phase === 3 && phase2Complete) {
      setCurrentPhase(3);
      setMessages(prev => [...prev, { role: "assistant", content: "Returning to Phase 3. How can I help you with the post-judgment forms?" }]);
    }
  };

  const resetToPhase1 = () => {
    setCurrentPhase(1);
    setPhase1Data({});
    setPhase1Complete(false);
    setPhase2Data({});
    setPhase2Complete(false);
    setPhase3Data({});
    setPhase3Complete(false);
    setAllComplete(false);
    // Clean slate - wipe old chat so user isn't confused by stale messages
    setMessages([{ role: "assistant", content: "Let's start fresh with Phase 1.\n\nYou can give me all your information at once:\n• Your full legal name\n• Your spouse's full legal name\n• Your address (with ZIP)\n• Your spouse's address (with ZIP)\n• Your phone number\n• Which county you're filing in\n• Whether you or your spouse meets the residency requirement\n• Whether the marriage was civil or religious\n\nOr we can go one question at a time — just say **\"Let's start\"**." }]);
  };

  const generateDocuments = async () => {
    // Per-phase generation lock check
    if (session) {
      if (currentPhase === 1 && session.phase1Generated) {
        alert('Phase 1 documents have already been generated and downloaded. Please save your files when downloading — documents cannot be regenerated.');
        return;
      }
      if (currentPhase === 2 && session.phase2Generated) {
        alert('Phase 2 documents have already been generated and downloaded. Please save your files when downloading — documents cannot be regenerated.');
        return;
      }
      if (currentPhase === 3 && session.phase3Generated) {
        alert('Phase 3 documents have already been generated and downloaded. Your session is now complete. Thank you for using DivorceGPT.');
        return;
      }
    }
    
    setIsGenerating(true);
    try {
      if (currentPhase === 1) {
        // Generate UD-1 via Python ReportLab microservice (unified pipeline)
        const formData = {
          plaintiffName: phase1Data.plaintiffName || '',
          defendantName: phase1Data.defendantName || '',
          county: phase1Data.qualifyingCounty || '',
          qualifyingParty: phase1Data.qualifyingParty || '',
          qualifyingAddress: phase1Data.qualifyingAddress || '',
          plaintiffAddress: phase1Data.plaintiffAddress || '',
          plaintiffPhone: phase1Data.plaintiffPhone || '',
        };
        
        try {
          const res = await fetch(`${PDF_SERVICE_URL}/generate/ny/ud1`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData),
          });
          
          if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || "Failed to generate UD-1");
          }
          
          const blob = await res.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `UD-1_Summons_${(phase1Data.plaintiffName || "Document").replace(/\s+/g, "_")}.pdf`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        } catch (error) {
          console.error('UD-1 generation error:', error);
          alert('Failed to generate UD-1. Please try again.');
        }
      } else if (currentPhase === 2) {
        // Generate Phase 2 package using Python PDF microservice
        const formData = {
          plaintiffName: phase1Data.plaintiffName || '',
          defendantName: phase1Data.defendantName || '',
          county: phase1Data.qualifyingCounty || '',
          indexNumber: phase2Data.indexNumber || '',
          summonsDate: phase2Data.summonsDate || '',
          plaintiffAddress: phase1Data.plaintiffAddress || '',
          plaintiffPhone: phase1Data.plaintiffPhone || '',
          defendantAddress: phase1Data.defendantAddress || '',
          marriageDate: phase2Data.marriageDate || '',
          marriageCity: phase2Data.marriageCity || '',
          marriageState: phase2Data.marriageState || '',
          marriagePlace: `${phase2Data.marriageCity || ''}, ${phase2Data.marriageState || ''}`,
          breakdownDate: phase2Data.breakdownDate || '',
          religiousCeremony: phase1Data.ceremonyType === 'religious',
          // Additional fields for UD-5, UD-6
          serviceWithinNY: true,
          defendantAppeared: true,
          residencyType: 'A',
        };
        
        try {
          const res = await fetch(`${PDF_SERVICE_URL}/generate/phase2-package`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData),
          });
          
          if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || "Failed to generate package");
          }
          
          const blob = await res.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `Phase2_Filing_Package_${(phase1Data.plaintiffName || "Document").replace(/\s+/g, "_")}.zip`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          
          const formCount = phase1Data.ceremonyType === 'religious' ? 8 : 7;
          alert(`Downloaded ${formCount} forms in ZIP package:\n• UD-5 Affirmation of Regularity\n• UD-6 Affirmation of Plaintiff\n• UD-7 Affirmation of Defendant\n• UD-9 Note of Issue\n• UD-10 Findings of Fact\n• UD-11 Judgment of Divorce\n• UD-12 Part 130 Certification${phase1Data.ceremonyType === 'religious' ? '\n• UD-4 Barriers to Remarriage' : ''}`);
        } catch (error) {
          console.error('PDF generation error:', error);
          alert('Failed to generate PDFs. Please try again.');
        }
      } else if (currentPhase === 3) {
        // Generate Phase 3 package using Python PDF microservice
        const formData = {
          plaintiffName: phase1Data.plaintiffName || '',
          defendantName: phase1Data.defendantName || '',
          county: phase1Data.qualifyingCounty || '',
          indexNumber: phase2Data.indexNumber || '',
          plaintiffAddress: phase1Data.plaintiffAddress || '',
          defendantAddress: phase1Data.defendantAddress || '',
          defendantCurrentAddress: phase3Data.defendantCurrentAddress || phase1Data.defendantAddress || '',
        };
        
        try {
          const res = await fetch(`${PDF_SERVICE_URL}/generate/phase3-package`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData),
          });
          
          if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || "Failed to generate package");
          }
          
          const blob = await res.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `Phase3_Final_Forms_${(phase1Data.plaintiffName || "Document").replace(/\s+/g, "_")}.zip`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          
          alert(`Downloaded Phase 3 forms:\n• UD-14 Notice of Entry\n• UD-15 Affidavit of Service by Mail`);
        } catch (error) {
          console.error('PDF generation error:', error);
          alert('Failed to generate PDFs. Please try again.');
        }
      }
    } catch (error) {
      console.error("Document generation error:", error);
      alert("Failed to generate document. Please try again.");
    } finally {
      // Lock the phase after successful generation
      if (session && paymentIntentId) {
        session.generationCount = (session.generationCount || 0) + 1;
        if (currentPhase === 1) session.phase1Generated = true;
        if (currentPhase === 2) session.phase2Generated = true;
        if (currentPhase === 3) session.phase3Generated = true;
        saveSession(session);
        setSession({ ...session });
      }
      setIsGenerating(false);
    }
  };

  const phase1Fields = [
    { key: 'plaintiffName', label: t.qualify.fields?.plaintiffName?.label || 'Plaintiff Name', desc: t.qualify.fields?.plaintiffName?.desc || 'Person filing' },
    { key: 'defendantName', label: t.qualify.fields?.defendantName?.label || 'Defendant Name', desc: t.qualify.fields?.defendantName?.desc || 'Other spouse' },
    { key: 'qualifyingCounty', label: t.qualify.fields?.filingCounty?.label || 'Filing County', desc: t.qualify.fields?.filingCounty?.desc || 'Where to file' },
    { key: 'qualifyingParty', label: t.qualify.fields?.residencyBasis?.label || 'Residency Basis', desc: t.qualify.fields?.residencyBasis?.desc || 'Who qualifies' },
    { key: 'qualifyingAddress', label: t.qualify.fields?.qualifyingAddress?.label || 'Qualifying Address', desc: t.qualify.fields?.qualifyingAddress?.desc || 'Residency address' },
    { key: 'plaintiffPhone', label: t.qualify.fields?.phone?.label || 'Phone', desc: t.qualify.fields?.phone?.desc || 'Court contact' },
    { key: 'plaintiffAddress', label: t.qualify.fields?.plaintiffAddress?.label || 'Plaintiff Address', desc: t.qualify.fields?.plaintiffAddress?.desc || 'Mailing address' },
    { key: 'defendantAddress', label: t.qualify.fields?.defendantAddress?.label || 'Defendant Address', desc: t.qualify.fields?.defendantAddress?.desc || 'Service address' },
    { key: 'ceremonyType', label: t.qualify.fields?.ceremonyType?.label || 'Ceremony Type', desc: t.qualify.fields?.ceremonyType?.desc || 'Civil or Religious' },
  ];

  // Remove hasWaiver - UD-7 IS the waiver
  const phase2Fields = [
    { key: 'indexNumber', label: t.qualify.fields?.indexNumber?.label || 'Index Number', desc: t.qualify.fields?.indexNumber?.desc || 'From clerk' },
    { key: 'summonsDate', label: t.qualify.fields?.summonsDate?.label || 'Summons Date', desc: t.qualify.fields?.summonsDate?.desc || 'Date on UD-1' },
    { key: 'marriageDate', label: t.qualify.fields?.marriageDate?.label || 'Marriage Date', desc: t.qualify.fields?.marriageDate?.desc || 'When married' },
    { key: 'marriageCity', label: t.qualify.fields?.marriageCity?.label || 'Marriage City', desc: t.qualify.fields?.marriageCity?.desc || 'Where married' },
    { key: 'marriageState', label: t.qualify.fields?.marriageState?.label || 'Marriage State', desc: t.qualify.fields?.marriageState?.desc || 'State/Country' },
    { key: 'breakdownDate', label: t.qualify.fields?.breakdownDate?.label || 'Breakdown Date', desc: t.qualify.fields?.breakdownDate?.desc || 'DRL §170(7)' },
  ];

  const phase3Fields = [
    { key: 'judgmentEntryDate', label: t.qualify.fields?.entryDate?.label || 'Entry Date', desc: t.qualify.fields?.entryDate?.desc || 'JOD filed date' },
    { key: 'defendantCurrentAddress', label: t.qualify.fields?.currentAddress?.label || 'Current Address', desc: t.qualify.fields?.currentAddress?.desc || 'For mailing' },
  ];

  const getPhaseData = (p: number) => p === 1 ? phase1Data : p === 2 ? phase2Data : phase3Data;
  const getPhaseFields = (p: number) => p === 1 ? phase1Fields : p === 2 ? phase2Fields : phase3Fields;
  const currentFields = getPhaseFields(currentPhase);
  const currentData = getPhaseData(currentPhase) as Record<string, string | undefined>;
  const completedCount = currentFields.filter(f => currentData[f.key]).length;

  // Determine theme colors based on completion status
  const isPhaseComplete = currentPhase === 1 ? phase1Complete : currentPhase === 2 ? phase2Complete : phase3Complete;
  const themeColor = allComplete ? 'green' : isPhaseComplete ? 'green' : 'default';

  if (isValidating) return <div className="flex min-h-screen items-center justify-center bg-zinc-50"><div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-[#1a365d] border-t-transparent" /></div>;
  if (!isValid || !sessionId) return <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4"><div className="text-center"><h2 className="text-xl font-bold">Session Not Found</h2><Link href="/qualify" className="mt-4 inline-block rounded-full bg-[#c59d5f] px-6 py-3 text-white">Start Over</Link></div></div>;

  // Termination screen - pure disengagement, no details
  if (isTerminated) return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-zinc-900 mb-4">Session Ended</h2>
        <p className="text-zinc-600 mb-6">
          This session has been terminated. Your payment will be refunded within 5-10 business days.
        </p>
        <div className="bg-blue-50 rounded-xl p-4 text-left text-sm text-blue-800 mb-6">
          <p className="font-semibold mb-2">If you need support:</p>
          <ul className="space-y-1">
            <li>• National Domestic Violence Hotline: 1-800-799-7233</li>
            <li>• Crisis Text Line: Text HOME to 741741</li>
            <li>• Emergency Services: 911</li>
          </ul>
        </div>
        <Link href="/" className="inline-block rounded-full bg-zinc-200 px-6 py-3 text-zinc-700 hover:bg-zinc-300">
          Return Home
        </Link>
      </div>
    </div>
  );

  // Exhausted session screen - message limit reached
  if (isExhausted) return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
          <svg className="h-8 w-8 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-zinc-900 mb-4">Session Limit Reached</h2>
        <p className="text-zinc-600 mb-6">
          You've reached the maximum number of messages for this session ({MAX_MESSAGES} messages). 
          This limit ensures fair usage for all users.
        </p>
        <div className="bg-amber-50 rounded-xl p-4 text-left text-sm text-amber-800 mb-6">
          <p className="font-semibold mb-2">Your options:</p>
          <ul className="space-y-1">
            <li>• If you've completed your forms, you can still download them from your browser's saved files</li>
            <li>• To continue with additional assistance, you'll need to start a new session</li>
            <li>• For technical support, email admin@divorcegpt.com</li>
          </ul>
        </div>
        <Link href="/qualify" className="inline-block rounded-full bg-[#c59d5f] px-6 py-3 text-white hover:bg-[#d4ac6e]">
          Start New Session ($29)
        </Link>
      </div>
    </div>
  );

  // Expired session screen - 12-month window elapsed
  if (isExpired) return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-200">
          <svg className="h-8 w-8 text-zinc-500" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-zinc-900 mb-4">Session Expired</h2>
        <p className="text-zinc-600 mb-6">
          Your 12-month access window has elapsed. If you still need to generate documents, you can start a new session.
        </p>
        <div className="bg-zinc-100 rounded-xl p-4 text-left text-sm text-zinc-700 mb-6">
          <p className="font-semibold mb-2">Please note:</p>
          <ul className="space-y-1">
            <li>• A new session requires re-entry of all information</li>
            <li>• Previously downloaded documents remain valid — check your saved files</li>
            <li>• For technical support, email admin@divorcegpt.com</li>
          </ul>
        </div>
        <Link href="/qualify" className="inline-block rounded-full bg-[#c59d5f] px-6 py-3 text-white hover:bg-[#d4ac6e]">
          Start New Session ($39)
        </Link>
      </div>
    </div>
  );

  return (
    <div className={`flex h-screen flex-col overflow-hidden ${allComplete ? 'bg-green-50' : 'bg-zinc-50'}`}>
      <header className={`sticky top-0 z-50 border-b ${allComplete ? 'border-green-200 bg-green-50/80' : 'border-zinc-100 bg-white/80'} backdrop-blur-sm`}>
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-full ${allComplete ? 'bg-gradient-to-br from-green-600 to-green-500' : 'bg-gradient-to-br from-[#1a365d] to-[#2c5282]'}`}>
              <span className="text-lg">{allComplete ? '✓' : '⚖️'}</span>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-zinc-900">DivorceGPT</h1>
              <p className="text-xs text-zinc-500">
                {allComplete ? 'All Phases Complete!' : `Phase ${currentPhase}: ${currentPhase === 1 ? 'Commencement' : currentPhase === 2 ? 'Submission' : 'Post-Judgment'}`}
              </p>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            {/* Language Selector */}
            <select 
              value={lang} 
              onChange={(e) => setLang(e.target.value as Locale)}
              className="text-sm bg-transparent border border-zinc-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[#c59d5f]"
            >
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="zh">中文</option>
              <option value="ko">한국어</option>
              <option value="ru">Русский</option>
              <option value="ht">Kreyòl</option>
            </select>
            <button 
              onClick={() => setShowSidebar(!showSidebar)}
              className={`text-sm underline ${allComplete ? 'text-green-700 hover:text-green-900' : 'text-zinc-500 hover:text-zinc-700'}`}
            >
              {showSidebar ? t.forms?.hidePanel || 'Hide Panel' : t.forms?.showPanel || 'Show Panel'}
            </button>
            <div className="hidden items-center gap-2 sm:flex">
              <div className={`h-2 w-2 rounded-full ${allComplete ? 'bg-green-500' : 'bg-green-500'} animate-pulse`} />
              <span className="text-sm text-zinc-500">{allComplete ? t.forms?.complete || 'Complete' : t.forms?.sessionActive || 'Session active'}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col lg:flex-row lg:overflow-hidden">
        <div className={`flex flex-1 flex-col ${showSidebar ? 'lg:w-2/3' : 'lg:w-full'} ${showSidebar ? 'lg:border-r lg:border-zinc-200' : ''} lg:overflow-hidden`}>
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            <div className="mx-auto max-w-2xl space-y-4">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${msg.role === "user" 
                    ? allComplete 
                      ? "bg-gradient-to-br from-green-600 to-green-500 text-white" 
                      : "bg-gradient-to-br from-[#1a365d] to-[#2c5282] text-white" 
                    : "bg-white text-zinc-800 ring-1 ring-zinc-100"}`}>
                    <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                  </div>
                </div>
              ))}
              {isLoading && <div className="flex justify-start"><div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-zinc-100"><div className="flex gap-1"><div className="h-2 w-2 animate-bounce rounded-full bg-[#c59d5f]" /><div className="h-2 w-2 animate-bounce rounded-full bg-[#c59d5f] [animation-delay:0.15s]" /><div className="h-2 w-2 animate-bounce rounded-full bg-[#c59d5f] [animation-delay:0.3s]" /></div></div></div>}
              <div ref={messagesEndRef} />
            </div>
          </div>
          <div className={`border-t ${allComplete ? 'border-green-200 bg-green-50/80' : 'border-zinc-100 bg-white/80'} p-4`}>
            <div className="mx-auto max-w-2xl flex gap-3">
              <input ref={inputRef} type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendMessage()} placeholder={allComplete ? t.forms?.askAnything || "Ask me anything about your forms..." : t.forms?.typeAnswer || "Type your answer..."} className={`flex-1 rounded-full px-5 py-3 text-zinc-900 ring-1 focus:outline-none focus:ring-2 ${allComplete ? 'bg-white ring-green-300 focus:ring-green-500' : 'bg-zinc-100 ring-zinc-200 focus:ring-[#c59d5f]'}`} />
              <button onClick={sendMessage} disabled={isLoading || !input.trim()} className={`flex h-12 w-12 items-center justify-center rounded-full text-white disabled:opacity-50 ${allComplete ? 'bg-gradient-to-br from-green-600 to-green-500' : 'bg-gradient-to-br from-[#1a365d] to-[#2c5282]'}`}>
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>
              </button>
            </div>
          </div>
        </div>

        {showSidebar && (
          <div className={`border-t ${allComplete ? 'border-green-200 bg-green-50' : 'border-zinc-200 bg-white'} p-4 sm:p-6 lg:w-1/3 lg:border-t-0 lg:overflow-y-auto`}>
            <div className="mx-auto max-w-md">
              {/* Phase Navigation */}
              <div className="mb-6">
                <div className="text-xs font-medium text-zinc-500 mb-2">{t.forms?.divorceWorkflow || 'DIVORCE WORKFLOW'}</div>
                <div className="flex gap-1">
                  {[1, 2, 3].map((p) => (
                    <button 
                      key={p} 
                      onClick={() => goToPhase(p as 1 | 2 | 3)}
                      disabled={p === 2 && !phase1Complete || p === 3 && !phase2Complete}
                      className={`flex-1 h-2 rounded-full transition-all cursor-pointer hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50 ${
                        p < currentPhase || (p === 1 && phase1Complete) || (p === 2 && phase2Complete) || (p === 3 && phase3Complete)
                          ? 'bg-green-500' 
                          : p === currentPhase 
                            ? allComplete ? 'bg-green-500' : 'bg-[#c59d5f]' 
                            : 'bg-zinc-200'
                      }`} 
                    />
                  ))}
                </div>
                <div className="flex justify-between mt-1">
                  <button onClick={() => goToPhase(1)} className="text-xs text-zinc-400 hover:text-zinc-600">{t.forms?.commence || 'Commence'}</button>
                  <button onClick={() => goToPhase(2)} disabled={!phase1Complete} className="text-xs text-zinc-400 hover:text-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed">{t.forms?.submit || 'Submit'}</button>
                  <button onClick={() => goToPhase(3)} disabled={!phase2Complete} className="text-xs text-zinc-400 hover:text-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed">{t.forms?.finalize || 'Finalize'}</button>
                </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className={`text-lg font-bold ${allComplete ? 'text-green-800' : 'text-zinc-900'}`}>{t.forms?.phase || 'Phase'} {currentPhase}</h2>
                  <p className={`text-sm ${allComplete ? 'text-green-600' : 'text-zinc-500'}`}>{currentPhase === 1 ? 'UD-1 Summons' : currentPhase === 2 ? 'Filing Package' : 'Notice & Service'}</p>
                </div>
                <div className={`flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold ${
                  isPhaseComplete ? 'bg-green-500 text-white' : 'bg-zinc-100 text-zinc-700'
                }`}>
                  {isPhaseComplete ? '✓' : `${completedCount}/${currentFields.length}`}
                </div>
              </div>
              
              <div className={`mb-6 h-2 w-full overflow-hidden rounded-full ${allComplete ? 'bg-green-200' : 'bg-zinc-200'}`}>
                <div className={`h-full transition-all ${allComplete ? 'bg-green-500' : 'bg-gradient-to-r from-[#1a365d] to-[#c59d5f]'}`} style={{ width: `${(completedCount / currentFields.length) * 100}%` }} />
              </div>

              <div className={`mb-6 rounded-xl p-4 ${allComplete ? 'bg-green-100' : 'bg-zinc-50'}`}>
                <h3 className={`text-sm font-semibold mb-3 ${allComplete ? 'text-green-800' : 'text-zinc-700'}`}>{t.forms?.forms || 'FORMS'}</h3>
                <div className="space-y-2 text-sm">
                  {currentPhase === 1 && <FormItem label="UD-1" desc={t.qualify.fields?.summonsWithNotice || "Summons with Notice"} done={phase1Complete} complete={allComplete} />}
                  {currentPhase === 2 && (<>
                    {phase1Data.ceremonyType === 'religious' && <FormItem label="UD-4" desc="DRL §253 Barriers" done={phase2Complete} highlight complete={allComplete} />}
                    <FormItem label="UD-5" desc="Affirmation of Regularity" done={phase2Complete} complete={allComplete} />
                    <FormItem label="UD-6" desc="Plaintiff's Affirmation" done={phase2Complete} complete={allComplete} />
                    <FormItem label="UD-7" desc="Defendant's Affirmation" done={phase2Complete} complete={allComplete} />
                    <FormItem label="UD-9" desc="Note of Issue" done={phase2Complete} complete={allComplete} />
                    <FormItem label="UD-10" desc="Findings of Fact" done={phase2Complete} complete={allComplete} />
                    <FormItem label="UD-11" desc="Judgment of Divorce" done={phase2Complete} complete={allComplete} />
                    <FormItem label="UD-12" desc="Part 130 Certification" done={phase2Complete} complete={allComplete} />
                  </>)}
                  {currentPhase === 3 && (<>
                    <FormItem label="UD-14" desc="Notice of Entry" done={phase3Complete} complete={allComplete} />
                    <FormItem label="UD-15" desc="Affidavit of Service" done={phase3Complete} complete={allComplete} />
                  </>)}
                </div>
              </div>
              
              <div className="space-y-3">{currentFields.map((f) => (<FieldCard key={f.key} label={f.label} value={currentData[f.key]} description={f.desc} complete={allComplete} fieldKey={f.key} />))}</div>

              {/* Phase 1 Actions */}
              {(currentPhase === 1 && phase1Complete) && (
                <div className="mt-6 space-y-3">
                  <button onClick={generateDocuments} disabled={isGenerating} className="w-full rounded-full bg-green-600 py-4 text-lg font-semibold text-white shadow-xl hover:bg-green-700 disabled:opacity-50">{isGenerating ? t.forms?.generating || 'Generating...' : `✓ ${t.forms?.downloadUD1 || 'Download UD-1'}`}</button>
                  <button onClick={advancePhase} className="w-full rounded-full border-2 border-[#1a365d] py-3 text-sm font-semibold text-[#1a365d] hover:bg-[#1a365d] hover:text-white">{t.forms?.haveIndexNumber || 'I have my Index Number → Phase 2'}</button>
                  <button onClick={resetToPhase1} className="w-full text-sm text-zinc-500 hover:text-zinc-700 underline">{t.forms?.startOver || 'Start over'}</button>
                </div>
              )}

              {/* Phase 2 Actions */}
              {(currentPhase === 2 && !phase2Complete) && (
                <div className="mt-6">
                  <button onClick={() => goToPhase(1)} className="w-full text-sm text-zinc-500 hover:text-zinc-700 underline">{t.forms?.goBackPhase1 || '← Go back to Phase 1'}</button>
                </div>
              )}
              {(currentPhase === 2 && phase2Complete) && (
                <div className="mt-6 space-y-3">
                  <button onClick={generateDocuments} disabled={isGenerating} className="w-full rounded-full bg-green-600 py-4 text-lg font-semibold text-white shadow-xl hover:bg-green-700 disabled:opacity-50">{isGenerating ? t.forms?.generating || 'Generating...' : `✓ ${t.forms?.downloadPackage || 'Download Package'}`}</button>
                  <button onClick={advancePhase} className="w-full rounded-full border-2 border-[#1a365d] py-3 text-sm font-semibold text-[#1a365d] hover:bg-[#1a365d] hover:text-white">{t.forms?.judgmentEntered || 'Judgment Entered → Phase 3'}</button>
                  <button onClick={() => goToPhase(1)} className="w-full text-sm text-zinc-500 hover:text-zinc-700 underline">{t.forms?.goBackPhase1 || '← Go back to Phase 1'}</button>
                </div>
              )}

              {/* Phase 3 Actions */}
              {(currentPhase === 3 && !phase3Complete) && (
                <div className="mt-6 space-y-2">
                  <button onClick={() => goToPhase(2)} className="w-full text-sm text-zinc-500 hover:text-zinc-700 underline">{t.forms?.goBackPhase2 || '← Go back to Phase 2'}</button>
                  <button onClick={() => goToPhase(1)} className="w-full text-sm text-zinc-500 hover:text-zinc-700 underline">{t.forms?.goBackPhase1 || '← Go back to Phase 1'}</button>
                </div>
              )}
              {(currentPhase === 3 && phase3Complete) && (
                <div className="mt-6 space-y-3">
                  <button onClick={generateDocuments} disabled={isGenerating} className="w-full rounded-full bg-green-600 py-4 text-lg font-semibold text-white shadow-xl hover:bg-green-700 disabled:opacity-50">{isGenerating ? t.forms?.generating || 'Generating...' : `✓ ${t.forms?.downloadFinalForms || 'Download Final Forms'}`}</button>
                  <button onClick={() => setShowSidebar(false)} className="w-full rounded-full border-2 border-green-600 py-3 text-sm font-semibold text-green-700 hover:bg-green-600 hover:text-white">{t.forms?.hidePanelContinue || 'Hide Panel & Continue Chatting'}</button>
                  <div className="flex gap-2">
                    <button onClick={() => goToPhase(1)} className="flex-1 text-sm text-zinc-500 hover:text-zinc-700 underline">{t.forms?.phase || 'Phase'} 1</button>
                    <button onClick={() => goToPhase(2)} className="flex-1 text-sm text-zinc-500 hover:text-zinc-700 underline">{t.forms?.phase || 'Phase'} 2</button>
                  </div>
                </div>
              )}

              {/* Always-visible Start Fresh - recovery escape hatch */}
              <div className="mt-4">
                <button onClick={resetToPhase1} className="w-full rounded-lg border border-red-200 bg-red-50 py-2 text-sm font-medium text-red-600 hover:bg-red-100 hover:border-red-300 transition-colors">
                  ↺ Start fresh (clear all data)
                </button>
              </div>

              <div className={`mt-6 rounded-xl p-4 ${allComplete ? 'bg-green-200' : 'bg-blue-50'}`}>
                <div className="flex gap-3">
                  <svg className={`h-5 w-5 ${allComplete ? 'text-green-700' : 'text-blue-600'}`} fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>
                  <div className={`text-sm ${allComplete ? 'text-green-800' : 'text-blue-800'}`}>
                    <p className="font-medium">{allComplete ? t.forms?.allDone || 'All done!' : t.forms?.needHelp || 'Need help?'}</p>
                    <p className={allComplete ? 'text-green-700' : 'text-blue-700'}>{allComplete ? t.forms?.askQuestions || 'Ask questions about filing, procedures, or forms.' : t.forms?.askInChat || 'Just ask in the chat!'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className={`border-t py-4 ${allComplete ? 'border-green-200 bg-green-50' : 'border-zinc-100 bg-white'}`}>
        <p className="text-center text-xs text-zinc-500">DivorceGPT is a document preparation service. This is not legal advice.</p>
      </footer>
    </div>
  );
}

function FormItem({ label, desc, done, highlight, complete }: { label: string; desc: string; done: boolean; highlight?: boolean; complete?: boolean }) {
  return (
    <div className={`flex items-center justify-between py-1 ${highlight ? 'text-amber-700' : ''}`}>
      <div className="flex items-center gap-2">
        {done ? <svg className={`h-4 w-4 ${complete ? 'text-green-600' : 'text-green-500'}`} fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg> : <div className={`h-4 w-4 rounded-full border-2 ${highlight ? 'border-amber-400' : 'border-zinc-300'}`} />}
        <span className="font-medium">{label}</span>
      </div>
      <span className={`text-xs ${highlight ? 'text-amber-600' : complete ? 'text-green-600' : 'text-zinc-400'}`}>{desc}</span>
    </div>
  );
}

function FieldCard({ label, value, description, complete, fieldKey }: { label: string; value?: string; description: string; complete?: boolean; fieldKey?: string }) {
  const done = !!value;
  
  // Format phone number for display
  const formatPhoneNumber = (phone: string): string => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
    if (digits.length === 11 && digits[0] === '1') {
      return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
    }
    return phone; // Return as-is if not standard format
  };
  
  const displayValue = fieldKey === 'plaintiffPhone' && value ? formatPhoneNumber(value) : value;
  const displayLabel = fieldKey === 'plaintiffPhone' ? 'Phone Number' : label;
  
  return (
    <div className={`rounded-xl p-4 ${done ? complete ? "bg-green-100 ring-1 ring-green-300" : "bg-green-50 ring-1 ring-green-200" : "bg-zinc-50 ring-1 ring-zinc-200"}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <span className={`text-sm font-medium ${complete ? 'text-green-800' : 'text-zinc-700'}`}>{displayLabel}</span>
          {done ? <p className={`mt-1 truncate text-sm ${complete ? 'text-green-900' : 'text-zinc-900'}`}>{displayValue}</p> : <p className="mt-1 text-xs text-zinc-400">{description}</p>}
        </div>
        {done ? <div className={`flex h-6 w-6 items-center justify-center rounded-full ${complete ? 'bg-green-600' : 'bg-green-500'}`}><svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg></div> : <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-200"><span className="text-xs text-zinc-400">...</span></div>}
      </div>
    </div>
  );
}

export default function FormsPage() {
  return (<Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-zinc-50"><div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-[#1a365d] border-t-transparent" /></div>}><FormsContent /></Suspense>);
}

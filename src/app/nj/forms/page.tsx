"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "../../../components/LanguageProvider";
import { Locale } from "../../../lib/dictionary";
import { 
  loadSession, 
  createSession, 
  saveSession, 
  terminateSession,
  type SessionData,
} from "../../../lib/session";

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
  const [phase1Data, setPhase1Data] = useState<Record<string, string>>({});
  const [phase2Data, setPhase2Data] = useState<Record<string, string>>({});
  const [phase3Data, setPhase3Data] = useState<Record<string, string>>({});
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
  const [showSessionInfo, setShowSessionInfo] = useState(false);
  const [isSessionComplete, setIsSessionComplete] = useState(false);
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
          
          if (existingSession && (existingSession as SessionData & { expired?: boolean }).expired) {
            setIsExpired(true);
            setIsValidating(false);
            return;
          }
          
          if (!existingSession) existingSession = createSession(data.paymentIntentId);
          
          // NJ Phase 1 field validation
          const p1 = existingSession.phase1Data || {};
          const p1Fields = ['plaintiffName', 'defendantName', 'plaintiffAddress', 'defendantAddress', 
                           'plaintiffPhone', 'filingCounty', 'marriageDate', 'marriageCity', 
                           'marriageState', 'ceremonyType', 'breakdownDate', 'residencyDate', 'residencyParty'];
          const p1Valid = p1Fields.every(f => (p1 as Record<string, string>)[f]);
          let wasRepaired = false;
          if (existingSession.phase1Complete && !p1Valid) {
            existingSession.phase1Complete = false;
            wasRepaired = true;
          }
          
          // NJ Phase 2 field validation
          const p2 = existingSession.phase2Data || {};
          const p2Fields = ['docketNumber', 'complaintDate'];
          const p2Valid = p2Fields.every(f => (p2 as Record<string, string>)[f]);
          if (existingSession.phase2Complete && !p2Valid) {
            existingSession.phase2Complete = false;
            wasRepaired = true;
          }
          
          // NJ Phase 3 field validation
          const p3 = existingSession.phase3Data || {};
          const p3Fields = ['serviceDate', 'serviceMethod', 'appearanceDate'];
          const p3Valid = p3Fields.every(f => (p3 as Record<string, string>)[f]);
          if (existingSession.phase3Complete && !p3Valid) {
            existingSession.phase3Complete = false;
            wasRepaired = true;
          }
          
          if (!existingSession.phase1Complete && existingSession.currentPhase > 1) {
            existingSession.currentPhase = 1;
          }
          if (!existingSession.phase2Complete && existingSession.currentPhase > 2) {
            existingSession.currentPhase = 2;
          }
          
          if (wasRepaired) {
            existingSession.chatHistory = [{
              role: 'assistant' as const,
              content: "Welcome back. Your previous session had incomplete data, so I've reset it. Let's pick up where we left off.\n\nPlease provide your information again and I'll prepare your NJ divorce forms."
            }];
          }
          
          saveSession(existingSession);
          
          setSession(existingSession);
          setCurrentPhase(Math.min(existingSession.currentPhase, 3) as 1 | 2 | 3);
          setPhase1Data((existingSession.phase1Data || {}) as Record<string, string>);
          setPhase2Data((existingSession.phase2Data || {}) as Record<string, string>);
          setPhase3Data((existingSession.phase3Data || {}) as Record<string, string>);
          setPhase1Complete(existingSession.phase1Complete);
          setPhase2Complete(existingSession.phase2Complete);
          setPhase3Complete(existingSession.phase3Complete);
          setMessages(existingSession.chatHistory || []);
          setIsDisqualified(existingSession.disqualified);
          const count = existingSession.messageCount || 0;
          setMessageCount(count);
          
          if ((existingSession.phase3Generated || 0) >= 5) {
            setIsSessionComplete(true);
          } else if (count >= MAX_MESSAGES) {
            setIsExhausted(true);
          } else if (existingSession.chatHistory.length === 0) {
            setShowSessionInfo(true);
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
        phase1Generated: session?.phase1Generated || 0,
        phase2Generated: session?.phase2Generated || 0,
        phase3Generated: session?.phase3Generated || 0,
      };
      saveSession(updatedSession);
    }
  }, [phase1Data, phase2Data, phase3Data, messages, currentPhase, phase1Complete, phase2Complete, phase3Complete, paymentIntentId, isDisqualified, session, messageCount]);

  const sendInitialGreeting = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/forms/chat/nj", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: "Hi, I'm ready to start." }], currentPhase: 1, phase1Data: {}, phase2Data: {}, phase3Data: {} }),
      });
      const data = await res.json();
      setMessages([{ role: "assistant", content: data.reply }]);
    } catch { setMessages([{ role: "assistant", content: "Welcome to DivorceGPT for New Jersey. I'll help you prepare your uncontested divorce forms.\n\n**Before we begin:**\n• DivorceGPT handles uncontested, no-fault NJ divorces — no children, no property to divide, no alimony.\n• At least one spouse must have lived in NJ for 12 consecutive months.\n• Court filing fee: $300. Spouse's Appearance fee: $175.\n\nSay **'Let's start'** or ask me questions first. Your session is valid for 12 months." }]); }
    finally { setIsLoading(false); }
  };

  const copySessionLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2500);
    } catch {
      const input = document.createElement('input');
      input.value = window.location.href;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2500);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    if (messageCount >= MAX_MESSAGES) { setIsExhausted(true); return; }
    
    const userMessage = input.trim();
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
    const newCount = messageCount + 1;
    setMessageCount(newCount);
    
    try {
      const res = await fetch("/api/forms/chat/nj", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages, currentPhase, phase1Data, phase2Data, phase3Data }),
      });
      const data = await res.json();
      if (data.extractedData) {
        const njPhase1Fields = ['plaintiffName', 'defendantName', 'plaintiffAddress', 'defendantAddress', 
                                'plaintiffPhone', 'filingCounty', 'marriageDate', 'marriageCity', 
                                'marriageState', 'ceremonyType', 'breakdownDate', 'residencyDate', 'residencyParty'];
        const njPhase2Fields = ['docketNumber', 'complaintDate'];
        const njPhase3Fields = ['serviceDate', 'serviceMethod', 'appearanceDate'];
        
        const p1Data: Record<string, string> = {};
        const p2Data: Record<string, string> = {};
        const p3Data: Record<string, string> = {};
        
        for (const [key, value] of Object.entries(data.extractedData)) {
          if (njPhase1Fields.includes(key)) p1Data[key] = value as string;
          else if (njPhase2Fields.includes(key)) p2Data[key] = value as string;
          else if (njPhase3Fields.includes(key)) p3Data[key] = value as string;
        }
        
        if (Object.keys(p1Data).length > 0) setPhase1Data(prev => ({ ...prev, ...p1Data }));
        if (Object.keys(p2Data).length > 0) setPhase2Data(prev => ({ ...prev, ...p2Data }));
        if (Object.keys(p3Data).length > 0) setPhase3Data(prev => ({ ...prev, ...p3Data }));
      }
      if (data.phase1Complete) setPhase1Complete(true);
      if (data.phase2Complete) setPhase2Complete(true);
      if (data.phase3Complete) setPhase3Complete(true);
      if (data.isDisqualified) setIsDisqualified(true);
      
      if (data.isTerminated) {
        setIsTerminated(true);
        setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
        
        // Send termination alert to admin
        try {
          const triggerMsg = userMessage;
          const allMsgs = [...newMessages, { role: "assistant", content: data.reply }];
          const chatLog = allMsgs.slice(-6).map(m => `[${m.role}] ${m.content}`).join('\n\n');
          
          fetch('/api/send-monitor-alert', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: 'admin@divorcegpt.com',
              subject: `[DivorceGPT] SESSION TERMINATED — NJ — ${phase1Data.plaintiffName || 'Unknown'}`,
              body: `SESSION TERMINATED\n\nState: New Jersey\nSession ID: ${sessionId}\nPayment Intent: ${paymentIntentId}\nCustomer Email: ${customerEmail || 'Not available (free key session)'}\nPlaintiff: ${phase1Data.plaintiffName || 'Not collected'}\nDefendant: ${phase1Data.defendantName || 'Not collected'}\nTermination Reason: ${data.terminateReason || 'policy_violation'}\nTimestamp: ${new Date().toISOString()}\n\nTRIGGERING MESSAGE:\n"${triggerMsg}"\n\nLAST 6 MESSAGES:\n${chatLog}\n\n${'—'.repeat(40)}\nACTION REQUIRED: Review and process refund if applicable.`,
            }),
          }).catch(err => console.error('Termination email failed:', err));
        } catch {}
        
        if (paymentIntentId) terminateSession(paymentIntentId);
        return;
      }
      
      setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
    } catch { setMessages(prev => [...prev, { role: "assistant", content: "Sorry, something went wrong." }]); }
    finally { setIsLoading(false); if (!isMobile) inputRef.current?.focus(); }
  };

  const advancePhase = () => {
    if (currentPhase === 1 && phase1Complete) {
      setCurrentPhase(2);
      setMessages(prev => [...prev, { role: "assistant", content: "Welcome to Phase 2 — Service Package!\n\nYou've filed your documents. Now I need your docket number to regenerate everything with it.\n\nWhat is your docket number? (Format: FM-XX-XXXXXX-XX)\n\nIf you filed via JEDS, the docket number is usually available immediately." }]);
    } else if (currentPhase === 2 && phase2Complete) {
      setCurrentPhase(3);
      setMessages(prev => [...prev, { role: "assistant", content: "Welcome to Phase 3 — Final Judgment!\n\nYou've served your spouse. Now I need a few details to generate the final judgment package.\n\nWhat date was the defendant served?" }]);
    }
  };

  const goToPhase = (phase: 1 | 2 | 3) => {
    if (phase === 1) {
      setCurrentPhase(1);
      setMessages(prev => [...prev, { role: "assistant", content: "Returning to Phase 1. How can I help you with your filing information?" }]);
    } else if (phase === 2 && phase1Complete) {
      setCurrentPhase(2);
      setMessages(prev => [...prev, { role: "assistant", content: "Returning to Phase 2. How can I help you with your service package?" }]);
    } else if (phase === 3 && phase2Complete) {
      setCurrentPhase(3);
      setMessages(prev => [...prev, { role: "assistant", content: "Returning to Phase 3. How can I help you with the final judgment package?" }]);
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
    setMessages([{ role: "assistant", content: "Let's start fresh with Phase 1.\n\nI'll need the following information to prepare your NJ divorce filing package:\n• Your full legal name and your spouse's full legal name\n• Your address and your spouse's address\n• Your phone number\n• Which NJ county you're filing in\n• Date and location of your marriage\n• When irreconcilable differences began (6+ months ago)\n• When NJ residency began (12+ months ago)\n• Who meets the residency requirement (you or your spouse)\n\nYou can give me everything at once or we can go step by step." }]);
  };

  const generateDocuments = async () => {
    if (session) {
      const MAX_PHASE_GENERATIONS = 5;
      if (currentPhase === 1 && (session.phase1Generated || 0) >= MAX_PHASE_GENERATIONS) {
        alert('You have reached the maximum number of Phase 1 document generations (5). For technical support, email admin@divorcegpt.com.');
        return;
      }
      if (currentPhase === 2 && (session.phase2Generated || 0) >= MAX_PHASE_GENERATIONS) {
        alert('You have reached the maximum number of Phase 2 document generations (5). For technical support, email admin@divorcegpt.com.');
        return;
      }
      if (currentPhase === 3 && (session.phase3Generated || 0) >= MAX_PHASE_GENERATIONS) {
        alert('You have reached the maximum number of Phase 3 document generations (5). For technical support, email admin@divorcegpt.com.');
        return;
      }
    }
    
    setIsGenerating(true);
    try {
      if (currentPhase === 1) {
        const formData = {
          plaintiffName: phase1Data.plaintiffName || '',
          defendantName: phase1Data.defendantName || '',
          plaintiffAddress: phase1Data.plaintiffAddress || '',
          defendantAddress: phase1Data.defendantAddress || '',
          plaintiffPhone: phase1Data.plaintiffPhone || '',
          filingCounty: phase1Data.filingCounty || '',
          marriageDate: phase1Data.marriageDate || '',
          marriageCity: phase1Data.marriageCity || '',
          marriageState: phase1Data.marriageState || '',
          breakdownDate: phase1Data.breakdownDate || '',
          residencyDate: phase1Data.residencyDate || '',
          residencyParty: phase1Data.residencyParty || '',
          ceremonyType: phase1Data.ceremonyType || 'civil',
        };
        
        try {
          const res = await fetch(`${PDF_SERVICE_URL}/generate/nj/phase1-package`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData),
          });
          
          if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || "Failed to generate filing package");
          }
          
          const blob = await res.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `NJ_Filing_Package_${(phase1Data.plaintiffName || "Document").replace(/\s+/g, "_")}.zip`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          
          const used = (session?.phase1Generated || 0) + 1;
          const remaining = 5 - used;
          const formList = `• Complaint for Divorce/Dissolution\n• Certification of Verification & Non-Collusion\n• Confidential Litigant Info Sheet (CN 10486)\n• CDR Certification — Plaintiff (CN 10889)\n• CDR Certification — Defendant (CN 10889)\n• Certification of Insurance Coverage\n• Summons (for service — does not need to be filed)`;
          if (remaining > 0) {
            alert(`Downloaded NJ Filing Package:\n${formList}\n\nIMPORTANT: The Summons does not need to be filed with the court. It is for serving your spouse in Phase 2.\n\nYou have ${remaining} download${remaining === 1 ? '' : 's'} remaining for Phase 1.\nSave your files now.`);
          } else {
            alert(`Downloaded NJ Filing Package:\n${formList}\n\nThis was your final download for Phase 1.\nMake sure you have saved your files.`);
          }
        } catch (error) {
          console.error('NJ Phase 1 generation error:', error);
          alert('Failed to generate filing package. Please try again.');
        }
      } else if (currentPhase === 2) {
        // Phase 2: Regenerate all Phase 1 docs WITH docket number + Acknowledgment of Service
        const formData = {
          plaintiffName: phase1Data.plaintiffName || '',
          defendantName: phase1Data.defendantName || '',
          plaintiffAddress: phase1Data.plaintiffAddress || '',
          defendantAddress: phase1Data.defendantAddress || '',
          plaintiffPhone: phase1Data.plaintiffPhone || '',
          filingCounty: phase1Data.filingCounty || '',
          marriageDate: phase1Data.marriageDate || '',
          marriageCity: phase1Data.marriageCity || '',
          marriageState: phase1Data.marriageState || '',
          ceremonyType: phase1Data.ceremonyType || 'civil',
          breakdownDate: phase1Data.breakdownDate || '',
          residencyDate: phase1Data.residencyDate || '',
          residencyParty: phase1Data.residencyParty || '',
          docketNumber: phase2Data.docketNumber || '',
          complaintDate: phase2Data.complaintDate || '',
        };
        
        try {
          const res = await fetch(`${PDF_SERVICE_URL}/generate/nj/phase2-package`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData),
          });
          
          if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || "Failed to generate service package");
          }
          
          const blob = await res.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `NJ_Service_Package_${(phase1Data.plaintiffName || "Document").replace(/\s+/g, "_")}.zip`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          
          const used2 = (session?.phase2Generated || 0) + 1;
          const remaining2 = 5 - used2;
          const formList2 = `• All Phase 1 documents (with docket number)\n• Acknowledgment of Service`;
          if (remaining2 > 0) {
            alert(`Downloaded NJ Service Package:\n${formList2}\n\nIMPORTANT: These documents do NOT need to be refiled. They are for serving your spouse.\nThe only document you must file back with the court is the signed Acknowledgment of Service.\n\nYou have ${remaining2} download${remaining2 === 1 ? '' : 's'} remaining for Phase 2.\nSave your files now.`);
          } else {
            alert(`Downloaded NJ Service Package:\n${formList2}\n\nThis was your final download for Phase 2.\nMake sure you have saved your files.`);
          }
        } catch (error) {
          console.error('NJ Phase 2 generation error:', error);
          alert('Failed to generate service package. Please try again.');
        }
      } else if (currentPhase === 3) {
        // Phase 3: Final Judgment package
        const formData = {
          plaintiffName: phase1Data.plaintiffName || '',
          defendantName: phase1Data.defendantName || '',
          plaintiffAddress: phase1Data.plaintiffAddress || '',
          defendantAddress: phase1Data.defendantAddress || '',
          plaintiffPhone: phase1Data.plaintiffPhone || '',
          filingCounty: phase1Data.filingCounty || '',
          docketNumber: phase2Data.docketNumber || '',
          complaintDate: phase2Data.complaintDate || '',
          serviceDate: phase3Data.serviceDate || '',
          serviceMethod: phase3Data.serviceMethod || '',
          appearanceDate: phase3Data.appearanceDate || '',
          marriageDate: phase1Data.marriageDate || '',
          marriageCity: phase1Data.marriageCity || '',
          marriageState: phase1Data.marriageState || '',
          ceremonyType: phase1Data.ceremonyType || 'civil',
          breakdownDate: phase1Data.breakdownDate || '',
        };
        
        try {
          const res = await fetch(`${PDF_SERVICE_URL}/generate/nj/phase3-package`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData),
          });
          
          if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || "Failed to generate judgment package");
          }
          
          const blob = await res.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `NJ_Final_Judgment_Package_${(phase1Data.plaintiffName || "Document").replace(/\s+/g, "_")}.zip`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          
          const used3 = (session?.phase3Generated || 0) + 1;
          const remaining3 = 5 - used3;
          const formList3 = `• Plaintiff's Certification for Divorce on Papers (CN 12620)\n• Defendant's Certification for Divorce on Papers (CN 12620)\n• Certification of Non-Military Service (CN 11191)\n• Proposed Final Judgment of Divorce/Dissolution`;
          if (remaining3 > 0) {
            alert(`Downloaded NJ Final Judgment Package:\n${formList3}\n\nFile this package with the court. Judge reviews on the papers.\n\nYou have ${remaining3} download${remaining3 === 1 ? '' : 's'} remaining for Phase 3.\nSave your files now.`);
          } else {
            alert(`Downloaded NJ Final Judgment Package:\n${formList3}\n\nThis was your final download for Phase 3. Your session is now complete.\nMake sure you have saved your files.`);
          }
        } catch (error) {
          console.error('NJ Phase 3 generation error:', error);
          alert('Failed to generate judgment package. Please try again.');
        }
      }
    } catch (error) {
      console.error("Document generation error:", error);
      alert("Failed to generate document. Please try again.");
    } finally {
      if (session && paymentIntentId) {
        session.generationCount = (session.generationCount || 0) + 1;
        if (currentPhase === 1) session.phase1Generated = (session.phase1Generated || 0) + 1;
        if (currentPhase === 2) session.phase2Generated = (session.phase2Generated || 0) + 1;
        if (currentPhase === 3) session.phase3Generated = (session.phase3Generated || 0) + 1;
        saveSession(session);
        setSession({ ...session });
      }
      setIsGenerating(false);
    }
  };

  // NJ Phase 1 fields — actual form field labels
  const phase1Fields = [
    { key: 'plaintiffName', label: 'Plaintiff Name', desc: 'Person filing' },
    { key: 'defendantName', label: 'Defendant Name', desc: 'Other spouse' },
    { key: 'plaintiffAddress', label: 'Plaintiff Address', desc: 'Current address' },
    { key: 'defendantAddress', label: 'Defendant Address', desc: 'Current address' },
    { key: 'plaintiffPhone', label: 'Phone', desc: 'Court contact' },
    { key: 'filingCounty', label: 'Filing County', desc: 'NJ county' },
    { key: 'marriageDate', label: 'Marriage Date', desc: 'When married' },
    { key: 'marriageCity', label: 'Marriage City', desc: 'Where married' },
    { key: 'marriageState', label: 'Marriage State', desc: 'State/Country' },
    { key: 'ceremonyType', label: 'Ceremony Type', desc: 'Civil or Religious' },
    { key: 'breakdownDate', label: 'Breakdown Date', desc: '6+ months ago' },
    { key: 'residencyDate', label: 'NJ Residency Since', desc: '12+ months ago' },
    { key: 'residencyParty', label: 'Residency Basis', desc: 'Who qualifies' },
  ];

  const phase2Fields = [
    { key: 'docketNumber', label: 'Docket Number', desc: 'FM-XX-XXXXXX-XX' },
    { key: 'complaintDate', label: 'Filing Date', desc: 'Date complaint accepted' },
  ];

  const phase3Fields = [
    { key: 'serviceDate', label: 'Service Date', desc: 'Date spouse served' },
    { key: 'serviceMethod', label: 'Service Method', desc: 'How served' },
    { key: 'appearanceDate', label: 'Appearance/Default', desc: 'Spouse response' },
  ];

  const phase1Forms = [
    { label: 'Complaint for Divorce', desc: 'Complaint for Divorce/Dissolution (Irreconcilable Differences)' },
    { label: 'Verification Cert.', desc: 'Certification of Verification & Non-Collusion' },
    { label: 'CN 10486', desc: 'Confidential Litigant Information Sheet (both parties, partial)' },
    { label: 'CDR (Plaintiff)', desc: 'CDR Certification — Plaintiff (CN 10889)' },
    { label: 'CDR (Defendant)', desc: 'CDR Certification — Defendant (CN 10889)' },
    { label: 'Insurance Cert.', desc: 'Certification of Insurance Coverage' },
    { label: 'Summons', desc: 'Summons (for service — does not need to be filed)' },
  ];

  const phase2Forms = [
    { label: 'All Phase 1 docs', desc: 'Regenerated with docket number' },
    { label: 'Acknowledgment', desc: 'Acknowledgment of Service (defendant signs before notary)' },
  ];

  const phase3Forms = [
    { label: 'CN 12620 (P)', desc: "Plaintiff's Cert for Divorce on Papers" },
    { label: 'CN 12620 (D)', desc: "Defendant's Cert for Divorce on Papers" },
    { label: 'CN 11191', desc: 'Cert of Non-Military Service' },
    { label: 'Final Judgment', desc: 'Proposed Final Judgment of Divorce' },
  ];

  const getPhaseData = (p: number) => p === 1 ? phase1Data : p === 2 ? phase2Data : phase3Data;
  const getPhaseFields = (p: number) => p === 1 ? phase1Fields : p === 2 ? phase2Fields : phase3Fields;
  const getPhaseForms = (p: number) => p === 1 ? phase1Forms : p === 2 ? phase2Forms : phase3Forms;
  const currentFields = getPhaseFields(currentPhase);
  const currentData = getPhaseData(currentPhase) as Record<string, string | undefined>;
  const completedCount = currentFields.filter(f => currentData[f.key]).length;
  const isPhaseComplete = currentPhase === 1 ? phase1Complete : currentPhase === 2 ? phase2Complete : phase3Complete;

  const formatPhoneNumber = (phone: string): string => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10) return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    if (digits.length === 11 && digits[0] === '1') return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
    return phone;
  };

  if (!sessionId) return <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4"><div className="text-center"><h2 className="text-xl font-bold">Session Not Found</h2><Link href="/nj" className="mt-4 inline-block rounded-full bg-[#c59d5f] px-6 py-3 text-white">Start Over</Link></div></div>;
  if (!isValidating && !isValid) return <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4"><div className="text-center"><h2 className="text-xl font-bold">Session Not Found</h2><Link href="/nj" className="mt-4 inline-block rounded-full bg-[#c59d5f] px-6 py-3 text-white">Start Over</Link></div></div>;

  if (isTerminated) return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </div>
        <h2 className="text-xl font-bold text-zinc-900 mb-4">Session Ended</h2>
        <p className="text-zinc-600 mb-6">This session has been terminated. Your payment will be refunded within 5-10 business days.</p>
        <div className="bg-blue-50 rounded-xl p-4 text-left text-sm text-blue-800 mb-6">
          <p className="font-semibold mb-2">If you need support:</p>
          <ul className="space-y-1"><li>• National Domestic Violence Hotline: 1-800-799-7233</li><li>• Crisis Text Line: Text HOME to 741741</li><li>• Emergency Services: 911</li></ul>
        </div>
        <Link href="/nj" className="inline-block rounded-full bg-zinc-200 px-6 py-3 text-zinc-700 hover:bg-zinc-300">Return Home</Link>
      </div>
    </div>
  );

  if (isExhausted) return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
          <svg className="h-8 w-8 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
        </div>
        <h2 className="text-xl font-bold text-zinc-900 mb-4">Session Limit Reached</h2>
        <p className="text-zinc-600 mb-6">You've reached the maximum number of messages ({MAX_MESSAGES}). For technical support, email admin@divorcegpt.com.</p>
        <Link href="/nj" className="inline-block rounded-full bg-[#c59d5f] px-6 py-3 text-white hover:bg-[#d4ac6e]">Start New Session</Link>
      </div>
    </div>
  );

  if (isExpired) return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-200">
          <svg className="h-8 w-8 text-zinc-500" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>
        <h2 className="text-xl font-bold text-zinc-900 mb-4">Session Expired</h2>
        <p className="text-zinc-600 mb-6">Your 12-month access window has elapsed. Start a new session to continue.</p>
        <Link href="/nj" className="inline-block rounded-full bg-[#c59d5f] px-6 py-3 text-white hover:bg-[#d4ac6e]">Start New Session</Link>
      </div>
    </div>
  );

  if (isSessionComplete) return (
    <div className="flex min-h-screen items-center justify-center bg-green-50 p-4">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>
        <h2 className="text-xl font-bold text-zinc-900 mb-4">Your NJ Divorce Forms Are Complete</h2>
        <p className="text-zinc-600 mb-6">Both phases have been generated and downloaded. Your session is complete.</p>
        <div className="bg-green-100 rounded-xl p-4 text-left text-sm text-green-800 mb-6">
          <p className="font-semibold mb-2">Next steps:</p>
          <ul className="space-y-1">
            <li>• Submit Final Judgment package to the court</li>
            <li>• Judge reviews on the papers — no hearing needed in most cases</li>
            <li>• Your downloaded documents remain valid</li>
          </ul>
        </div>
        <Link href="/nj" className="inline-block rounded-full bg-zinc-200 px-6 py-3 text-zinc-700 hover:bg-zinc-300">Return Home</Link>
      </div>
    </div>
  );

  return (
    <div className={`flex h-screen flex-col overflow-hidden ${allComplete ? 'bg-green-50' : 'bg-zinc-50'}`} style={{ overscrollBehaviorX: 'none', touchAction: 'pan-y' }}>
      <header className={`sticky top-0 z-50 border-b ${allComplete ? 'border-green-200 bg-green-50/80' : 'border-zinc-100 bg-white/80'} backdrop-blur-sm`}>
        <div className="mx-auto flex h-12 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full ${allComplete ? 'bg-gradient-to-br from-green-600 to-green-500' : 'bg-gradient-to-br from-[#1a365d] to-[#2c5282]'}`}>
              <span className="text-sm">{allComplete ? '✓' : '⚖️'}</span>
            </div>
            <div>
              <h1 className="text-base font-semibold text-zinc-900 leading-tight">DivorceGPT — NJ</h1>
              <p className="text-[10px] text-zinc-500 leading-tight">
                {allComplete ? 'All Phases Complete!' : `Phase ${currentPhase}: ${currentPhase === 1 ? 'Filing' : currentPhase === 2 ? 'Service' : 'Final Judgment'}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {!isMobile && (
              <button onClick={() => setShowSidebar(!showSidebar)} className={`text-sm underline ${allComplete ? 'text-green-700 hover:text-green-900' : 'text-zinc-500 hover:text-zinc-700'}`}>
                {showSidebar ? 'Hide Panel' : 'Show Panel'}
              </button>
            )}
            <div className="hidden items-center gap-2 sm:flex">
              <div className={`h-2 w-2 rounded-full ${allComplete ? 'bg-green-500' : 'bg-green-500'} animate-pulse`} />
              <span className="text-sm text-zinc-500">{allComplete ? 'Complete' : 'Session active'}</span>
            </div>
          </div>
        </div>
      </header>

      {showBookmarkBar && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2">
          <div className="mx-auto max-w-4xl flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-amber-600 text-lg shrink-0">🔑</span>
              <p className="text-sm text-amber-800 font-medium truncate">
                <span className="underline decoration-2 decoration-amber-400">This page is your only way back.</span> No accounts. No passwords.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={copySessionLink} className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-all ${linkCopied ? 'bg-green-600 text-white' : 'bg-amber-600 text-white hover:bg-amber-700'}`}>
                {linkCopied ? '✓ Copied!' : '📋 Copy Link'}
              </button>
              {emailSent && <span className="hidden sm:inline text-xs text-green-700 font-medium">✓ Emailed</span>}
              <button onClick={() => { setShowBookmarkBar(false); try { localStorage.setItem('dgpt_bookmark_dismissed', 'true'); } catch {} }} className="text-amber-400 hover:text-amber-700 text-lg leading-none ml-1" aria-label="Dismiss">✕</button>
            </div>
          </div>
        </div>
      )}

      {showSessionInfo && (
        <div className="bg-[#1a365d] text-white px-4 py-4">
          <div className="mx-auto max-w-4xl">
            <div className="flex items-start justify-between gap-4 mb-3">
              <h3 className="font-bold text-base">Welcome to DivorceGPT for New Jersey</h3>
              <button onClick={() => setShowSessionInfo(false)} className="shrink-0 text-zinc-400 hover:text-white text-lg leading-none" aria-label="Dismiss">✕</button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 mb-4">
              <div className="bg-white/10 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-[#c59d5f] text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">1</span>
                  <span className="font-semibold text-sm">Filing</span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">Answer questions in the chat. I generate your Complaint, Summons, certifications, and cover letter. File with the court ($300), serve your spouse, and wait for their response.</p>
              </div>
              <div className="bg-white/10 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-[#c59d5f] text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">2</span>
                  <span className="font-semibold text-sm">Final Judgment</span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">Return with your docket number. I generate the CN 12620 certifications and proposed Final Judgment. The judge can grant your divorce on the papers — no hearing needed.</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-300">
              <span>✓ 12-month access</span>
              <span>✓ Up to 5 downloads per phase</span>
              <span>✓ Progress saved in this browser</span>
              {emailSent && customerEmail && <span className="text-green-300">✓ Session link emailed to {customerEmail}</span>}
            </div>
          </div>
        </div>
      )}

      {isMobile && (
        <div className={`flex border-b ${allComplete ? 'border-green-200 bg-green-50' : 'border-zinc-200 bg-white'}`}>
          <button onClick={() => setMobileTab('chat')} className={`flex-1 py-2.5 text-sm font-semibold text-center transition-colors ${mobileTab === 'chat' ? allComplete ? 'text-green-700 border-b-2 border-green-600' : 'text-[#1a365d] border-b-2 border-[#1a365d]' : 'text-zinc-400'}`}>
            💬 Chat
          </button>
          <button onClick={() => setMobileTab('panel')} className={`flex-1 py-2.5 text-sm font-semibold text-center transition-colors ${mobileTab === 'panel' ? allComplete ? 'text-green-700 border-b-2 border-green-600' : 'text-[#1a365d] border-b-2 border-[#1a365d]' : 'text-zinc-400'}`}>
            📋 Forms {isPhaseComplete ? '✓' : `(${completedCount}/${currentFields.length})`}
          </button>
        </div>
      )}

      <main className={`flex flex-1 ${isMobile ? 'flex-col' : 'flex-row'} overflow-hidden`}>
        {isValidating ? (
          <div className="flex flex-1 items-center justify-center"><div className="h-12 w-12 animate-spin rounded-full border-4 border-[#1a365d] border-t-transparent" /></div>
        ) : (
        <>
        {(!isMobile || mobileTab === 'chat') && (
          <div className={`flex flex-1 flex-col ${!isMobile ? (showSidebar ? 'w-2/3 border-r border-zinc-200' : 'w-full') : ''} overflow-hidden`}>
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            <div className="mx-auto max-w-2xl space-y-4">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${msg.role === "user" 
                    ? allComplete ? "bg-gradient-to-br from-green-600 to-green-500 text-white" : "bg-gradient-to-br from-[#1a365d] to-[#2c5282] text-white" 
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
              <input ref={inputRef} type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendMessage()} placeholder={allComplete ? "Ask me anything about your forms..." : "Type your answer..."} className={`flex-1 rounded-full px-5 py-3 text-zinc-900 ring-1 focus:outline-none focus:ring-2 ${allComplete ? 'bg-white ring-green-300 focus:ring-green-500' : 'bg-zinc-100 ring-zinc-200 focus:ring-[#c59d5f]'}`} />
              <button onClick={sendMessage} disabled={isLoading || !input.trim()} className={`flex h-12 w-12 items-center justify-center rounded-full text-white disabled:opacity-50 ${allComplete ? 'bg-gradient-to-br from-green-600 to-green-500' : 'bg-gradient-to-br from-[#1a365d] to-[#2c5282]'}`}>
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>
              </button>
            </div>
          </div>
          </div>
        )}

        {/* Panel */}
        {(isMobile ? mobileTab === 'panel' : showSidebar) && (
          <div className={`${allComplete ? 'border-green-200 bg-green-50' : 'border-zinc-200 bg-white'} p-4 sm:p-6 ${isMobile ? 'flex-1 overflow-y-auto' : 'w-1/3 border-t-0 overflow-y-auto'}`}>
            <div className="mx-auto max-w-md">
              {/* Phase Navigation — 3 phases for NJ */}
              <div className="mb-6">
                <div className="text-xs font-medium text-zinc-500 mb-2">NJ DIVORCE WORKFLOW</div>
                <div className="flex gap-1">
                  {[1, 2, 3].map((p) => {
                    const phaseComplete = p === 1 ? phase1Complete : p === 2 ? phase2Complete : phase3Complete;
                    const canAccess = p === 1 || (p === 2 && phase1Complete) || (p === 3 && phase2Complete);
                    return (
                      <button key={p} onClick={() => { if (canAccess) goToPhase(p as 1 | 2 | 3); }}
                        className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-all ${
                          currentPhase === p
                            ? phaseComplete ? 'bg-green-600 text-white' : 'bg-[#1a365d] text-white'
                            : phaseComplete ? 'bg-green-100 text-green-700' : 'bg-zinc-100 text-zinc-400'
                        }`}>
                        {p === 1 ? 'Filing' : p === 2 ? 'Service' : 'Judgment'}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Current Phase Forms */}
              <div className="mb-6">
                <h3 className={`text-sm font-bold mb-2 ${allComplete ? 'text-green-800' : 'text-zinc-900'}`}>
                  {currentPhase === 1 ? 'Phase 1 — Filing Package' : currentPhase === 2 ? 'Phase 2 — Service Package' : 'Phase 3 — Final Judgment'}
                </h3>
                <div className="space-y-1">
                  {getPhaseForms(currentPhase).map((form, i) => (
                    <FormItem key={i} label={form.label} desc={form.desc} done={isPhaseComplete} complete={allComplete} />
                  ))}
                </div>
              </div>

              {/* Field Cards */}
              <div className="mb-6">
                <h3 className={`text-sm font-bold mb-3 ${allComplete ? 'text-green-800' : 'text-zinc-900'}`}>
                  {currentPhase === 1 ? 'Filing Information' : currentPhase === 2 ? 'Service Information' : 'Judgment Information'} ({completedCount}/{currentFields.length})
                </h3>
                <div className="space-y-2">
                  {currentFields.map((field) => (
                    <FieldCard key={field.key} label={field.label} value={currentData[field.key]} description={field.desc} complete={allComplete} fieldKey={field.key} formatPhone={formatPhoneNumber} />
                  ))}
                </div>
              </div>

              {/* Phase 1 Actions */}
              {(currentPhase === 1 && phase1Complete) && (
                <div className="mt-6 space-y-3">
                  <button onClick={generateDocuments} disabled={isGenerating} className="w-full rounded-full bg-green-600 py-4 text-lg font-semibold text-white shadow-xl hover:bg-green-700 disabled:opacity-50">{isGenerating ? 'Generating...' : '✓ Download Filing Package'}</button>
                  <button onClick={advancePhase} className="w-full rounded-full border-2 border-[#1a365d] py-3 text-sm font-semibold text-[#1a365d] hover:bg-[#1a365d] hover:text-white">I have my Docket Number → Phase 2</button>
                  <button onClick={resetToPhase1} className="w-full text-sm text-zinc-500 hover:text-zinc-700 underline">Start over</button>
                </div>
              )}

              {/* Phase 2 Actions */}
              {(currentPhase === 2 && !phase2Complete) && (
                <div className="mt-6">
                  <button onClick={() => goToPhase(1)} className="w-full text-sm text-zinc-500 hover:text-zinc-700 underline">← Go back to Phase 1</button>
                </div>
              )}
              {(currentPhase === 2 && phase2Complete) && (
                <div className="mt-6 space-y-3">
                  <button onClick={generateDocuments} disabled={isGenerating} className="w-full rounded-full bg-green-600 py-4 text-lg font-semibold text-white shadow-xl hover:bg-green-700 disabled:opacity-50">{isGenerating ? 'Generating...' : '✓ Download Service Package'}</button>
                  <button onClick={advancePhase} className="w-full rounded-full border-2 border-[#1a365d] py-3 text-sm font-semibold text-[#1a365d] hover:bg-[#1a365d] hover:text-white">Spouse served → Phase 3</button>
                  <button onClick={() => goToPhase(1)} className="w-full text-sm text-zinc-500 hover:text-zinc-700 underline">← Go back to Phase 1</button>
                </div>
              )}

              {/* Phase 3 Actions */}
              {(currentPhase === 3 && !phase3Complete) && (
                <div className="mt-6 space-y-2">
                  <button onClick={() => goToPhase(2)} className="w-full text-sm text-zinc-500 hover:text-zinc-700 underline">← Go back to Phase 2</button>
                  <button onClick={() => goToPhase(1)} className="w-full text-sm text-zinc-500 hover:text-zinc-700 underline">← Go back to Phase 1</button>
                </div>
              )}
              {(currentPhase === 3 && phase3Complete) && (
                <div className="mt-6 space-y-3">
                  <button onClick={generateDocuments} disabled={isGenerating} className="w-full rounded-full bg-green-600 py-4 text-lg font-semibold text-white shadow-xl hover:bg-green-700 disabled:opacity-50">{isGenerating ? 'Generating...' : '✓ Download Final Judgment Package'}</button>
                  <button onClick={() => setShowSidebar(false)} className="w-full rounded-full border-2 border-green-600 py-3 text-sm font-semibold text-green-700 hover:bg-green-600 hover:text-white">Hide Panel & Continue Chatting</button>
                  <div className="flex gap-2">
                    <button onClick={() => goToPhase(1)} className="flex-1 text-sm text-zinc-500 hover:text-zinc-700 underline">Phase 1</button>
                    <button onClick={() => goToPhase(2)} className="flex-1 text-sm text-zinc-500 hover:text-zinc-700 underline">Phase 2</button>
                  </div>
                </div>
              )}

              <div className="mt-4">
                <button onClick={resetToPhase1} className="w-full rounded-lg border border-red-200 bg-red-50 py-2 text-sm font-medium text-red-600 hover:bg-red-100 hover:border-red-300 transition-colors">
                  ↺ Start fresh (clear all data)
                </button>
              </div>

              <div className={`mt-6 rounded-xl p-4 ${allComplete ? 'bg-green-200' : 'bg-blue-50'}`}>
                <div className="flex gap-3">
                  <svg className={`h-5 w-5 ${allComplete ? 'text-green-700' : 'text-blue-600'}`} fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>
                  <div className={`text-sm ${allComplete ? 'text-green-800' : 'text-blue-800'}`}>
                    <p className="font-medium">{allComplete ? 'All done!' : 'Need help?'}</p>
                    <p className={allComplete ? 'text-green-700' : 'text-blue-700'}>{allComplete ? 'Ask questions about filing, procedures, or forms.' : 'Just ask in the chat!'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        </>
        )}
      </main>

      <footer className={`border-t py-3 ${allComplete ? 'border-green-200 bg-green-50' : 'border-zinc-100 bg-white'}`}>
        <div className="flex items-center justify-center gap-4">
          <p className="text-center text-xs text-zinc-500">DivorceGPT is a document preparation service. This is not legal advice.</p>
          <select value={lang} onChange={(e) => setLang(e.target.value as Locale)} className="text-xs bg-transparent border border-zinc-200 rounded px-1.5 py-0.5 text-zinc-500 focus:outline-none focus:ring-1 focus:ring-[#c59d5f]">
            <option value="en">English</option>
            <option value="es">Español</option>
            <option value="zh">中文</option>
            <option value="ko">한국어</option>
            <option value="ru">Русский</option>
            <option value="ht">Kreyòl</option>
          </select>
        </div>
      </footer>
    </div>
  );
}

function FormItem({ label, desc, done, complete }: { label: string; desc: string; done: boolean; highlight?: boolean; complete?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1">
      <div className="flex items-center gap-2">
        {done ? <svg className={`h-4 w-4 ${complete ? 'text-green-600' : 'text-green-500'}`} fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg> : <div className="h-4 w-4 rounded-full border-2 border-zinc-300" />}
        <span className="font-medium text-sm">{label}</span>
      </div>
      <span className={`text-xs ${complete ? 'text-green-600' : 'text-zinc-400'}`}>{desc}</span>
    </div>
  );
}

function FieldCard({ label, value, description, complete, fieldKey, formatPhone }: { label: string; value?: string; description: string; complete?: boolean; fieldKey?: string; formatPhone: (p: string) => string }) {
  const done = !!value;
  const displayValue = fieldKey === 'plaintiffPhone' && value ? formatPhone(value) : value;
  
  return (
    <div className={`rounded-xl p-4 ${done ? complete ? "bg-green-100 ring-1 ring-green-300" : "bg-green-50 ring-1 ring-green-200" : "bg-zinc-50 ring-1 ring-zinc-200"}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <span className={`text-sm font-medium ${complete ? 'text-green-800' : 'text-zinc-700'}`}>{label}</span>
          {done ? <p className={`mt-1 truncate text-sm ${complete ? 'text-green-900' : 'text-zinc-900'}`}>{displayValue}</p> : <p className="mt-1 text-xs text-zinc-400">{description}</p>}
        </div>
        {done ? <div className={`flex h-6 w-6 items-center justify-center rounded-full ${complete ? 'bg-green-600' : 'bg-green-500'}`}><svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg></div> : <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-200"><span className="text-xs text-zinc-400">...</span></div>}
      </div>
    </div>
  );
}

export default function NJFormsPage() {
  useEffect(() => {
    let v = document.querySelector('meta[name="viewport"]') as HTMLMetaElement | null;
    if (!v) { v = document.createElement('meta'); v.name = 'viewport'; document.head.appendChild(v); }
    v.content = 'width=device-width, initial-scale=1, maximum-scale=1';
  }, []);
  return (<Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-zinc-50"><div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-[#1a365d] border-t-transparent" /></div>}><FormsContent /></Suspense>);
}

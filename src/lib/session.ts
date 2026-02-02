// Session management with 30-day TTL
// Stores form progress in localStorage, keyed by Stripe payment intent ID

const SESSION_TTL_DAYS = 30;
const STORAGE_PREFIX = 'divorcegpt_';

// Phase 1: Commencement (UD-1)
export interface Phase1Data {
  plaintiffName: string;
  defendantName: string;
  qualifyingCounty: string;
  qualifyingParty: 'plaintiff' | 'defendant' | '';
  qualifyingAddress: string;
  plaintiffPhone: string;
  plaintiffAddress: string;
  defendantAddress: string;
  ceremonyType: 'civil' | 'religious' | '';
}

// Phase 2: Submission Package (after Index Number)
export interface Phase2Data {
  indexNumber: string;
  summonsDate: string; // Date on the UD-1 Summons with Notice
  marriageDate: string;
  marriageCity: string;
  marriageState: string;
  breakdownDate: string; // When relationship became irretrievably broken (DRL §170(7))
  // UD-4 (religious only)
  hasWaiver: 'yes' | 'no' | '';
  // Service info for UD-4a if applicable
  serverName: string;
  serverAddress: string;
  ud4ServiceMethod: 'personal' | 'mail' | '';
  serviceAddress: string;
  ud4ManualFill: boolean;
}

// Phase 3: Post-Judgment Service
export interface Phase3Data {
  judgmentEntryDate: string;
  defendantCurrentAddress: string; // May differ from Phase 1 if defendant moved
}

export interface SessionData {
  paymentIntentId: string;
  createdAt: string;
  lastUpdated: string;
  currentPhase: 1 | 2 | 3;
  // Phase completion flags
  phase1Complete: boolean;
  phase2Complete: boolean;
  phase3Complete: boolean;
  // Phase data
  phase1Data: Partial<Phase1Data>;
  phase2Data: Partial<Phase2Data>;
  phase3Data: Partial<Phase3Data>;
  // Disqualification
  disqualified: boolean;
  disqualifyReason: string;
  // Chat history
  chatHistory: { role: 'user' | 'assistant'; content: string }[];
}

// Legacy type alias for backwards compatibility
export type UD1FormData = Phase1Data;

const getStorageKey = (paymentIntentId: string) => `${STORAGE_PREFIX}${paymentIntentId}`;

export const createSession = (paymentIntentId: string): SessionData => {
  const now = new Date().toISOString();
  const session: SessionData = {
    paymentIntentId,
    createdAt: now,
    lastUpdated: now,
    currentPhase: 1,
    phase1Complete: false,
    phase2Complete: false,
    phase3Complete: false,
    phase1Data: {},
    phase2Data: {},
    phase3Data: {},
    disqualified: false,
    disqualifyReason: '',
    chatHistory: [],
  };
  
  if (typeof window !== 'undefined') {
    localStorage.setItem(getStorageKey(paymentIntentId), JSON.stringify(session));
  }
  
  return session;
};

export const loadSession = (paymentIntentId: string): SessionData | null => {
  if (typeof window === 'undefined') return null;
  
  const raw = localStorage.getItem(getStorageKey(paymentIntentId));
  if (!raw) return null;
  
  try {
    const data = JSON.parse(raw);
    
    // Migration: convert old session format to new
    if (data.ud1Data !== undefined && data.phase1Data === undefined) {
      data.phase1Data = data.ud1Data;
      data.phase2Data = {};
      data.phase3Data = {};
      data.currentPhase = data.phase || 1;
      data.phase1Complete = data.ud1Complete || false;
      data.phase2Complete = false;
      data.phase3Complete = false;
      data.disqualified = false;
      data.disqualifyReason = '';
      delete data.ud1Data;
      delete data.ud1Complete;
      delete data.phase;
    }
    
    const createdAt = new Date(data.createdAt);
    const now = new Date();
    const daysElapsed = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
    
    // Check 30-day expiry
    if (daysElapsed > SESSION_TTL_DAYS) {
      localStorage.removeItem(getStorageKey(paymentIntentId));
      return null;
    }
    
    return data as SessionData;
  } catch {
    return null;
  }
};

export const saveSession = (session: SessionData): void => {
  if (typeof window === 'undefined') return;
  
  session.lastUpdated = new Date().toISOString();
  localStorage.setItem(getStorageKey(session.paymentIntentId), JSON.stringify(session));
};

export const updatePhase1Data = (paymentIntentId: string, data: Partial<Phase1Data>): SessionData | null => {
  const session = loadSession(paymentIntentId);
  if (!session) return null;
  
  session.phase1Data = { ...session.phase1Data, ...data };
  saveSession(session);
  return session;
};

export const updatePhase2Data = (paymentIntentId: string, data: Partial<Phase2Data>): SessionData | null => {
  const session = loadSession(paymentIntentId);
  if (!session) return null;
  
  session.phase2Data = { ...session.phase2Data, ...data };
  saveSession(session);
  return session;
};

export const updatePhase3Data = (paymentIntentId: string, data: Partial<Phase3Data>): SessionData | null => {
  const session = loadSession(paymentIntentId);
  if (!session) return null;
  
  session.phase3Data = { ...session.phase3Data, ...data };
  saveSession(session);
  return session;
};

export const advanceToPhase = (paymentIntentId: string, phase: 1 | 2 | 3): SessionData | null => {
  const session = loadSession(paymentIntentId);
  if (!session) return null;
  
  session.currentPhase = phase;
  if (phase === 2) session.phase1Complete = true;
  if (phase === 3) session.phase2Complete = true;
  saveSession(session);
  return session;
};

export const markPhaseComplete = (paymentIntentId: string, phase: 1 | 2 | 3): SessionData | null => {
  const session = loadSession(paymentIntentId);
  if (!session) return null;
  
  if (phase === 1) session.phase1Complete = true;
  if (phase === 2) session.phase2Complete = true;
  if (phase === 3) session.phase3Complete = true;
  saveSession(session);
  return session;
};

export const addChatMessage = (
  paymentIntentId: string, 
  role: 'user' | 'assistant', 
  content: string
): SessionData | null => {
  const session = loadSession(paymentIntentId);
  if (!session) return null;
  
  session.chatHistory.push({ role, content });
  saveSession(session);
  return session;
};

export const clearSession = (paymentIntentId: string): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(getStorageKey(paymentIntentId));
};

// NY Counties for validation
export const NY_COUNTIES = [
  'Albany', 'Allegany', 'Bronx', 'Broome', 'Cattaraugus', 'Cayuga', 'Chautauqua',
  'Chemung', 'Chenango', 'Clinton', 'Columbia', 'Cortland', 'Delaware', 'Dutchess',
  'Erie', 'Essex', 'Franklin', 'Fulton', 'Genesee', 'Greene', 'Hamilton', 'Herkimer',
  'Jefferson', 'Kings', 'Lewis', 'Livingston', 'Madison', 'Monroe', 'Montgomery',
  'Nassau', 'New York', 'Niagara', 'Oneida', 'Onondaga', 'Ontario', 'Orange',
  'Orleans', 'Oswego', 'Otsego', 'Putnam', 'Queens', 'Rensselaer', 'Richmond',
  'Rockland', 'Saratoga', 'Schenectady', 'Schoharie', 'Schuyler', 'Seneca',
  'St. Lawrence', 'Steuben', 'Suffolk', 'Sullivan', 'Tioga', 'Tompkins', 'Ulster',
  'Warren', 'Washington', 'Wayne', 'Westchester', 'Wyoming', 'Yates'
];

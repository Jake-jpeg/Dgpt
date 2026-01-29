// Session management with 30-day TTL
// Stores form progress in localStorage, keyed by Stripe payment intent ID

const SESSION_TTL_DAYS = 30;
const STORAGE_PREFIX = 'divorcegpt_';

export interface UD1FormData {
  plaintiffName: string;
  defendantName: string;
  qualifyingCounty: string;
  qualifyingParty: 'plaintiff' | 'defendant' | '';
  qualifyingAddress: string;
  plaintiffPhone: string;
  plaintiffAddress: string;
}

export interface SessionData {
  paymentIntentId: string;
  createdAt: string;
  lastUpdated: string;
  phase: number;
  ud1Data: Partial<UD1FormData>;
  ud1Complete: boolean;
  chatHistory: { role: 'user' | 'assistant'; content: string }[];
}

const getStorageKey = (paymentIntentId: string) => `${STORAGE_PREFIX}${paymentIntentId}`;

export const createSession = (paymentIntentId: string): SessionData => {
  const now = new Date().toISOString();
  const session: SessionData = {
    paymentIntentId,
    createdAt: now,
    lastUpdated: now,
    phase: 1,
    ud1Data: {},
    ud1Complete: false,
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
    const data: SessionData = JSON.parse(raw);
    const createdAt = new Date(data.createdAt);
    const now = new Date();
    const daysElapsed = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
    
    // Check 30-day expiry
    if (daysElapsed > SESSION_TTL_DAYS) {
      localStorage.removeItem(getStorageKey(paymentIntentId));
      return null;
    }
    
    return data;
  } catch {
    return null;
  }
};

export const saveSession = (session: SessionData): void => {
  if (typeof window === 'undefined') return;
  
  session.lastUpdated = new Date().toISOString();
  localStorage.setItem(getStorageKey(session.paymentIntentId), JSON.stringify(session));
};

export const updateUD1Data = (paymentIntentId: string, data: Partial<UD1FormData>): SessionData | null => {
  const session = loadSession(paymentIntentId);
  if (!session) return null;
  
  session.ud1Data = { ...session.ud1Data, ...data };
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

export const markUD1Complete = (paymentIntentId: string): SessionData | null => {
  const session = loadSession(paymentIntentId);
  if (!session) return null;
  
  session.ud1Complete = true;
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

# DivorceGPT - Phase 1 Form Filling

## Overview

DivorceGPT now includes AI-powered form filling for New York uncontested divorce documents. Phase 1 covers the UD-1 (Summons with Notice) form.

## Architecture

### No Backend Data Storage

- **Zero server-side user data** - All form progress stored in browser localStorage
- **30-day session TTL** - Sessions auto-expire after 30 days
- **Keyed by Stripe Payment Intent ID** - Secure, unique identifier per purchase

### Flow

```
/qualify → Stripe Checkout → /forms?session_id=xxx → Chat-driven form filling → Download DOCX
```

## New Files

### API Routes

- `/app/api/create-checkout/route.ts` - Creates Stripe checkout session
- `/app/api/validate-session/route.ts` - Validates Stripe payment status
- `/app/api/forms/chat/route.ts` - AI chat for form filling
- `/app/api/forms/ud1/route.ts` - Generates UD-1 DOCX document

### Frontend

- `/app/forms/page.tsx` - Dual-panel form filler UI (chat + preview)

### Library

- `/lib/session.ts` - localStorage session management with 30-day TTL

## Environment Variables

```env
AI_PROVIDER_API_KEY=your-api-key-here
STRIPE_SECRET_KEY=sk_test_xxxxx
```

## How It Works

### 1. Payment
User completes Stripe checkout → redirected to `/forms?session_id=cs_xxx`

### 2. Session Validation
- Server validates session_id with Stripe API
- Extracts payment_intent ID (permanent, unlike checkout session)
- Creates/loads localStorage session keyed by payment_intent

### 3. Form Filling Chat
- AI asks questions one at a time
- Extracts structured data via JSON blocks in responses
- Right panel shows real-time progress
- All data saved to localStorage automatically

### 4. Document Generation
- When all fields collected, "Download UD-1" button appears
- Server generates DOCX using `docx` library
- User downloads filled form

## Session Storage Format

```typescript
interface SessionData {
  paymentIntentId: string;      // Stripe payment intent ID
  createdAt: string;            // ISO timestamp
  lastUpdated: string;          // ISO timestamp  
  phase: number;                // Current phase (1 = UD-1)
  ud1Data: Partial<UD1FormData>;// Collected form data
  ud1Complete: boolean;         // Form completion status
  chatHistory: Message[];       // Chat history for continuity
}
```

## 30-Day TTL Logic

```typescript
const daysElapsed = (now - createdAt) / (1000 * 60 * 60 * 24);
if (daysElapsed > 30) {
  localStorage.removeItem(key);
  return null; // Session expired
}
```

## Dependencies

Add to package.json:
```json
{
  "dependencies": {
    "stripe": "^14.0.0",
    "docx": "^8.0.0"
  }
}
```

## Magic Link Resume

Users receive Stripe confirmation email with session_id. They can return via:
```
https://yourdomain.com/forms?session_id=cs_xxxxx
```

As long as:
1. Payment was successful (validated via Stripe API)
2. Less than 30 days have passed
3. Same browser (localStorage persists)

## Security Notes

- No PII stored on server
- Payment intent ID is not sensitive (can't be used to charge)
- localStorage cleared on session expiry
- SSN (future phases) held in React state only, never localStorage

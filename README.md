# DivorceGPT

AI-powered document preparation for uncontested divorces. Built by a licensed attorney. Open source under MIT.

**Live:** [divorcegpt.com](https://divorcegpt.com)
**Transparency disclosure:** [divorcegpt.com/transparency](https://divorcegpt.com/transparency)

---

## What This Is

DivorceGPT prepares court-ready divorce documents for pro se litigants — people representing themselves in uncontested divorces without an attorney. The system collects information through a conversational AI interface, validates every field server-side, and generates the complete filing package.

Currently supports **New York** and **New Jersey**.

This is not a chatbot that gives legal advice. It is a document preparation tool that adopts the posture of a county courthouse clerk: it explains what forms ask for, translates legalese into plain English, and populates documents based on exactly what the user provides. It does not recommend, predict, or assess.

## Why It Exists

An uncontested divorce with no kids and no property to divide should be straightforward. In practice, the paperwork costs $3,000+ and takes months — not because the law is complex, but because the forms are. DivorceGPT exists to close that gap.

The full story is on the [transparency page](https://divorcegpt.com/transparency).

## Architecture

```
src/
├── app/
│   ├── api/forms/chat/
│   │   ├── route.ts              # General engine (state-agnostic)
│   │   └── [state]/route.ts      # Dynamic state route
│   ├── ny/                       # New York frontend
│   ├── nj/                       # New Jersey frontend
│   └── ...
├── lib/
│   └── states/
│       ├── index.ts              # State registry
│       ├── ny.ts                 # NY system prompt + config
│       ├── ny-form-language.ts   # NY form descriptions
│       ├── nj.ts                 # NJ system prompt + config
│       └── nj-form-language.ts   # NJ form descriptions
├── components/
└── middleware.ts                  # Maintenance mode
```

**How it works:** The chat engine (`route.ts`) is state-agnostic. It loads state-specific AI instructions and field definitions from `lib/states/{code}.ts` at runtime. To add a new state, you create a state config file and register it in `index.ts`. No new routes required.

**Three-phase workflow:** Phase 1 generates the commencement document. The user files it, gets a case number, and returns. Phase 2 generates the full submission package. Phase 3 generates post-judgment service documents.

## Compliance Architecture

DivorceGPT enforces five layers of compliance, described in detail at [divorcegpt.com/transparency](https://divorcegpt.com/transparency):

1. **No legal advice** — The AI is instructed to never recommend, predict, or assess. Hard-prohibited language patterns enforced at the system prompt level.
2. **Sensitive data redaction** — SSNs, bank accounts, credit cards, and driver's license numbers are stripped server-side before messages reach the AI provider. The system retains no chat data.
3. **Session termination** — Threats of violence, child safety concerns, fraud requests, and criminal admissions trigger immediate, irreversible session termination with crisis resources.
4. **Scope enforcement** — Cases involving children, contested assets, spousal maintenance, attorney involvement, active military service, or any domestic violence history are automatically disqualified. DV disqualification is permanent and cannot be retracted.
5. **Server-side validation** — Every extracted field (names, addresses, dates, phone numbers, case numbers) passes through hard-coded validators. The AI is the interface. The server is the authority.

## Stack

- **Framework:** Next.js 16 (App Router)
- **AI:** Anthropic Claude (Sonnet)
- **Payments:** Stripe
- **PDF generation:** Separate ReportLab server (not included in this repo)
- **Styling:** Tailwind CSS 4
- **Language:** TypeScript
- **Deployment:** DigitalOcean

## Setup

### Prerequisites

- Node.js 18+
- npm
- Anthropic API key
- Stripe account (for payment flow)

### Install

```bash
git clone https://github.com/Jake-jpeg/Dgpt.git
cd Dgpt
npm install
```

### Environment

Copy `.env.example` and fill in your keys:

```bash
cp .env.example .env
```

Required variables:

| Variable | Purpose |
|---|---|
| `ANTHROPIC_API_KEY` | Claude API access |
| `STRIPE_SECRET_KEY` | Payment processing |
| `RESEND_API_KEY` | Email delivery |
| `RESEND_FROM_EMAIL` | Sender address |
| `MONITOR_SECRET` | Admin endpoint auth |
| `NEXT_PUBLIC_APP_URL` | Public URL |
| `NEXT_PUBLIC_BASE_URL` | Base URL |
| `NEXT_PUBLIC_MAINTENANCE_MODE` | `true` to enable maintenance page |

### Run

```bash
npm run dev
```

The app runs at `http://localhost:3000`.

**Note:** PDF generation requires the separate ReportLab server running on port 8080. The chat interface and form collection work without it — you just won't be able to generate final documents.

## Adding a New State

1. Create `src/lib/states/{code}.ts` with the state's system prompt, qualification questions, field definitions, and phase structure. Use `ny.ts` or `nj.ts` as reference.
2. Create `src/lib/states/{code}-form-language.ts` for form descriptions.
3. Register the state in `src/lib/states/index.ts`.
4. Create the frontend pages under `src/app/{code}/`.

The chat engine picks up new states automatically via `getStateConfig()`.

## Known Limitations

- Address/county mismatch detection works for NYC boroughs but does not cover all 62 NY counties or NJ counties by ZIP code lookup. It relies on keyword matching.
- The compliance monitor checks court websites but does not auto-update. Changes require manual review.
- PDF generation depends on an external ReportLab server not included in this repo.
- Session data lives in browser localStorage. Switching browsers or clearing data loses progress.

## Security

If you find a vulnerability, please email **admin@divorcegpt.com**. Do not open a public issue.

This project serves people going through one of the most difficult experiences of their lives. Responsible disclosure is appreciated.

## Who Built This

**Jake Kim** — Licensed attorney in New York and New Jersey. Self-taught developer. Built DivorceGPT because making a simple divorce actually simple required someone who understood both the law and the technology.

## License

MIT — see [LICENSE](LICENSE).

"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function OpenSourcePage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return <div className="min-h-screen bg-zinc-50 flex items-center justify-center"><div className="h-12 w-12 animate-spin rounded-full border-4 border-[#1a365d] border-t-transparent" /></div>;

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="sticky top-0 z-50 backdrop-blur-sm bg-white/80 border-b border-zinc-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#1a365d] to-[#2c5282] shadow-lg shadow-[#1a365d]/20"><span className="text-lg">⚖️</span></div>
              <div><h1 className="text-lg font-semibold text-zinc-900">DivorceGPT</h1><p className="text-xs text-zinc-500">by <span className="underline">June Guided Solutions, LLC</span></p></div>
            </Link>
            <Link href="/" className="text-sm font-medium text-zinc-600 hover:text-[#1a365d] transition">← Home</Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden bg-gradient-to-b from-[#0f2440] via-[#1a365d] to-[#1e3a5f] pt-20 pb-16 lg:pt-24 lg:pb-20">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-[#c59d5f]/8 blur-[100px]" />
          <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-[#c59d5f]/5 blur-[100px]" />
        </div>
        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-[56px] lg:leading-[1.1]">
            DivorceGPT is Open Source
          </h1>
          <p className="mt-6 text-lg text-zinc-300 leading-relaxed max-w-2xl mx-auto">
            Full source code. MIT Licensed. Free.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="https://github.com/Jake-jpeg/Dgpt" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-[#c59d5f] px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#c59d5f]/25 hover:bg-[#d4ac6e] hover:shadow-xl transition-all">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
              Frontend — Dgpt
            </a>
            <a href="https://github.com/Jake-jpeg/RL" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm px-8 py-3.5 text-sm font-bold text-white ring-1 ring-white/20 hover:bg-white/20 transition-all">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
              PDF Server — RL
            </a>
          </div>
        </div>
      </section>

      <section className="py-24 bg-white">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">What You Get</h3>
          </div>
          <div className="grid gap-8 md:grid-cols-2">
            <div className="rounded-2xl bg-gradient-to-b from-[#1a365d] to-[#234876] p-8 text-white shadow-xl shadow-[#1a365d]/20">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-[#c59d5f] text-xl font-bold text-white shadow-lg shadow-[#c59d5f]/30">UI</div>
              <h4 className="mt-6 text-2xl font-bold text-white">Dgpt — Frontend</h4>
              <p className="mt-3 text-sm text-zinc-300">Next.js application. Qualification flow, Stripe checkout, Claude API integration, form chat interface, multi-state architecture.</p>
              <ul className="mt-6 space-y-3">
                {["Next.js 15 + React 19", "Claude API — direct integration", "Stripe payment flow", "Multi-state support (NY, NJ)", "Tailwind CSS", "DigitalOcean deployment-ready"].map((f, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-zinc-200">
                    <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#c59d5f]" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl bg-white p-8 ring-1 ring-zinc-200 hover:shadow-lg transition-all duration-300">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-zinc-200 text-xl font-bold text-zinc-600">PDF</div>
              <h4 className="mt-6 text-2xl font-bold text-zinc-900">RL — PDF Server</h4>
              <p className="mt-3 text-sm text-zinc-500">ReportLab PDF generation server. Takes form data, produces court-ready documents.</p>
              <ul className="mt-6 space-y-3">
                {["Python + Flask", "ReportLab PDF generation", "python-docx for new state templates", "LibreOffice headless (docx → PDF)", "Docker container", "DigitalOcean deployment-ready"].map((f, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-zinc-600">
                    <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#c59d5f]" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-zinc-50">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">Set Up</h3>
            <p className="mt-4 text-lg text-zinc-600">Clone. Configure. Deploy.</p>
          </div>
          <div className="rounded-2xl bg-zinc-900 p-6 sm:p-8 shadow-xl overflow-x-auto">
            <pre className="text-sm text-zinc-300 leading-relaxed font-mono">
{`# Clone the frontend
git clone https://github.com/Jake-jpeg/Dgpt.git
cd Dgpt

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Add your API keys (Anthropic, Stripe, Resend)

# Run locally
npm run dev
# → http://localhost:3000

# ---

# Clone the PDF server
git clone https://github.com/Jake-jpeg/RL.git
cd RL

# Run with Docker
docker build -t dgpt-pdf .
docker run -p 8080:8080 dgpt-pdf
# → http://localhost:8080`}
            </pre>
          </div>
          <p className="mt-6 text-center text-sm text-zinc-500">
            Each repo has a <code className="bg-zinc-200 px-1.5 py-0.5 rounded text-xs">.env.example</code> with every variable you need.
          </p>
        </div>
      </section>

      <section className="py-24 bg-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">Add Your State</h3>
          <p className="mt-4 text-lg text-zinc-600 max-w-2xl mx-auto">
            The architecture supports multi-state expansion. NY and NJ are live references. Add a state config, map the court forms, set up a PDF template, and deploy.
          </p>
        </div>
      </section>

      <section className="py-16 bg-zinc-50">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-gradient-to-b from-[#1a365d] to-[#234876] p-8 text-center">
            <h3 className="text-xl font-bold text-white">Just want your divorce forms done?</h3>
            <p className="mt-2 text-sm text-zinc-300">DivorceGPT handles everything for $99. Plain language. Court-ready documents.</p>
            <Link href="/#states" className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#c59d5f] px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-[#c59d5f]/30 hover:bg-[#d4ac6e] transition">Get AI Assistance — $99 →</Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-zinc-100 bg-zinc-900 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <div className="flex items-center gap-3 mb-4"><div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#1a365d] to-[#2c5282]"><span className="text-sm">⚖️</span></div><span className="font-semibold text-white">DivorceGPT</span></div>
              <p className="text-sm text-zinc-400">AI-powered divorce document preparation.</p>
              <p className="mt-1 text-xs text-zinc-500">Designed by an Experienced Matrimonial Attorney</p>
              <p className="mt-2 text-xs text-zinc-500">© 2025 June Guided Solutions, LLC</p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3">Open Source</h4>
              <div className="space-y-2 text-sm">
                <a href="https://github.com/Jake-jpeg/Dgpt" className="block text-zinc-400 hover:text-[#c59d5f] transition">Frontend — Dgpt</a>
                <a href="https://github.com/Jake-jpeg/RL" className="block text-zinc-400 hover:text-[#c59d5f] transition">PDF Server — RL</a>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3">Company</h4>
              <div className="space-y-2 text-sm">
                <a href="https://juneguidedsolutions.com" className="block text-zinc-400 hover:text-[#c59d5f] transition">June Guided Solutions, LLC</a>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3">Legal</h4>
              <div className="space-y-2 text-sm">
                <Link href="/privacy" className="block text-zinc-400 hover:text-[#c59d5f] transition">Privacy Policy</Link>
                <Link href="/terms" className="block text-zinc-400 hover:text-[#c59d5f] transition">Terms of Service</Link>
              </div>
              <p className="mt-4 text-xs text-zinc-500">Document preparation by June Guided Solutions, LLC. This is not legal advice.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

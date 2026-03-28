"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

const states = [
  { code: "ny", name: "New York", abbr: "NY", live: true, href: "/ny", tagline: "Uncontested divorce — AI-assisted document preparation.", counties: "All 62 counties" },
  { code: "nj", name: "New Jersey", abbr: "NJ", live: true, href: "/nj", tagline: "Uncontested divorce for New Jersey residents.", counties: "All 21 counties" },
];

const YOUTUBE_VIDEO_ID = "nA9bf64rrA8";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return <div className="min-h-screen bg-zinc-50 flex items-center justify-center"><div className="h-12 w-12 animate-spin rounded-full border-4 border-[#1a365d] border-t-transparent" /></div>;

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="sticky top-0 z-50 backdrop-blur-sm bg-white/80 border-b border-zinc-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#1a365d] to-[#2c5282] shadow-lg shadow-[#1a365d]/20"><span className="text-lg">⚖️</span></div>
              <div><h1 className="text-lg font-semibold text-zinc-900">DivorceGPT</h1><p className="text-xs text-zinc-500">by <a href="https://juneguidedsolutions.com" className="underline hover:text-[#1a365d]">June Guided Solutions, LLC</a></p></div>
            </div>
              
              
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#0f2440] via-[#1a365d] to-[#1e3a5f] pt-20 pb-16 lg:pt-20 lg:pb-20">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-[#c59d5f]/8 blur-[100px]" />
          <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-[#c59d5f]/5 blur-[100px]" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

            {/* Left Column: Text + Trust Signals + State Selector */}
            <div className="order-1">
              <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-[56px] lg:leading-[1.1]">
                Fast &amp; Affordable Uncontested Divorce Online
              </h1>
              <p className="mt-5 text-lg text-zinc-300 leading-relaxed max-w-xl">
                Prepare your divorce forms with an automated AI clerk — $99. A self-guided tool for individuals in simple, uncontested cases.
              </p>

              {/* Trust Signals */}
              <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
                {["Designed by an Experienced Matrimonial Attorney", "Court-ready documents", "For uncontested cases"].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-zinc-300">
                    <svg className="h-4 w-4 text-[#c59d5f] flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                    {item}
                  </li>
                ))}
              </ul>

              {/* State Selector + CTA */}
              <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="relative">
                  <select
                    defaultValue=""
                    onChange={(e) => { if (e.target.value) window.location.href = e.target.value; }}
                    className="appearance-none w-full sm:w-52 rounded-full bg-white/10 backdrop-blur-sm text-white pl-5 pr-10 py-3.5 text-sm font-medium ring-1 ring-white/20 focus:ring-[#c59d5f] focus:outline-none cursor-pointer"
                  >
                    <option value="" disabled className="text-zinc-900">Select Your State</option>
                    <option value="/ny" className="text-zinc-900">New York</option>
                    <option value="/nj" className="text-zinc-900">New Jersey</option>
                  </select>
                  <svg className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
                </div>
                <Link href="#states" className="inline-flex items-center justify-center gap-2 rounded-full bg-[#c59d5f] px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#c59d5f]/25 hover:bg-[#d4ac6e] hover:shadow-xl transition-all">
                  Start Your Divorce →
                </Link>
              </div>
              <div className="mt-3">
                <Link href="#pricing" className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-400 hover:text-white transition">
                  See Pricing ↓
                </Link>
              </div>
            </div>

            {/* Right Column: Video Facade */}
            <div className="order-2">
              <div className="relative rounded-2xl bg-[#1f3a5c] p-2 shadow-2xl shadow-black/30">
                <div
                  className="relative rounded-xl overflow-hidden aspect-video bg-black cursor-pointer group"
                  onClick={(e) => {
                    const container = e.currentTarget;
                    container.innerHTML = '<iframe src="https://www.youtube.com/embed/' + YOUTUBE_VIDEO_ID + '?rel=0&modestbranding=1&autoplay=1" title="DivorceGPT Demo" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen class="absolute inset-0 w-full h-full" style="border:0" />';
                  }}
                >
                  {/* Lazy facade: thumbnail + play button */}
                  <img
                    src={`https://img.youtube.com/vi/${YOUTUBE_VIDEO_ID}/maxresdefault.jpg`}
                    alt="DivorceGPT demo video — AI-powered divorce document preparation"
                    className="absolute inset-0 w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#c59d5f] shadow-xl shadow-[#c59d5f]/40 group-hover:scale-110 transition-transform">
                      <svg className="h-7 w-7 text-white ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 3 Cards */}
      <section id="pricing" className="py-24 bg-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">Choose Your Path</h3>
            <p className="mt-4 text-lg text-zinc-600">Simple case? Do it yourself for free, or let AI handle the paperwork for $99.</p>
          </div>
          <div className="grid gap-8 md:grid-cols-3 max-w-6xl mx-auto">

            {/* Card 1: Free DIY — white */}
            <div className="rounded-2xl bg-white p-8 ring-1 ring-zinc-200 hover:shadow-lg transition-all duration-300 flex flex-col min-h-[620px]">
              <h4 className="text-xl font-bold text-zinc-900">DIY — Do It Yourself</h4>
              <div className="mt-3"><span className="text-4xl font-bold text-[#1a365d]">Free</span></div>
              <p className="mt-3 text-sm text-zinc-500">Download official court forms directly from your state court website. No cost.</p>
              <ul className="mt-6 space-y-3 flex-1">
                {["Official court forms — no charge", "Available from your state court website", "Self-guided — you fill out everything", "File at your county courthouse or e-file", "No assistance included"].map((f, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-zinc-600"><svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#c59d5f]" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>{f}</li>
                ))}
              </ul>
              <div className="mt-8"><Link href="/free-forms" className="block w-full rounded-full py-3 text-center text-sm font-semibold bg-zinc-100 text-zinc-700 hover:bg-zinc-200 transition">Get Free Court Forms →</Link></div>
            </div>

            {/* Card 2: AI-Assisted $99 — blue/gold FEATURED */}
            <div className="relative rounded-2xl bg-gradient-to-b from-[#1a365d] to-[#234876] p-8 text-white shadow-xl shadow-[#1a365d]/20 ring-2 ring-[#c59d5f] md:-translate-y-4 flex flex-col min-h-[620px]">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2"><span className="inline-flex items-center rounded-full bg-[#c59d5f] px-4 py-1 text-xs font-bold text-white shadow-lg shadow-[#c59d5f]/30">Most Popular</span></div>
              <h4 className="text-xl font-bold text-white">DIY with AI Assistance</h4>
              <div className="mt-3"><span className="text-4xl font-bold text-[#c59d5f]">$99</span></div>
              <p className="mt-3 text-sm text-zinc-300">AI prepares your court forms in plain language. You review and file.</p>
              <ul className="mt-6 space-y-3 flex-1">
                {["AI fills your forms — plain language guidance", "Every field explained before you answer", "State & county-specific documents", "Court filing instructions included", "12-month session access", "Email support"].map((f, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-zinc-200"><svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#c59d5f]" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>{f}</li>
                ))}
              </ul>
              <div className="mt-8"><Link href="#states" className="block w-full rounded-full py-3 text-center text-sm font-semibold bg-[#c59d5f] text-white shadow-lg shadow-[#c59d5f]/30 hover:bg-[#d4ac6e] transition" onClick={(e) => { e.preventDefault(); document.getElementById('states')?.scrollIntoView({ behavior: 'smooth' }); }}>Select Your State ↓</Link></div>
            </div>

            {/* Card 3: Resource Guides — white */}
            <div className="rounded-2xl bg-white p-8 ring-1 ring-zinc-200 hover:shadow-lg transition-all duration-300 flex flex-col min-h-[620px]">
              <h4 className="text-xl font-bold text-zinc-900">Resource Guides</h4>
              <div className="mt-3"><span className="text-4xl font-bold text-[#1a365d]">Free</span></div>
              <p className="mt-3 text-sm text-zinc-500">Plain-language guides to every divorce form — what it means, why the court needs it, and how to fill it out.</p>
              <ul className="mt-6 space-y-3 flex-1">
                {["Line-by-line form explanations", "Written by a licensed attorney", "NY & NJ forms covered", "Educational purposes only", "New guides added regularly"].map((f, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-zinc-600"><svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#c59d5f]" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>{f}</li>
                ))}
              </ul>
              <div className="mt-8"><Link href="/guides" className="block w-full rounded-full py-3 text-center text-sm font-semibold bg-zinc-100 text-zinc-700 hover:bg-zinc-200 transition">Browse Resource Guides →</Link></div>
            </div>

          </div>
        </div>
      </section>

      {/* Select State for $99 AI */}
      <section id="states" className="py-24 bg-zinc-50">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">AI-Assisted Divorce — Select Your State</h3>
            <p className="mt-4 text-lg text-zinc-600">$99 for a complete court-ready document packet. Eligibility check required.</p>
          </div>
          <div className="grid gap-8 md:grid-cols-2">
            {states.map((s) => (
              <Link key={s.code} href={s.live ? `/${s.code}` : s.href} className={`group relative rounded-2xl p-8 transition-all duration-300 ${s.live ? "bg-gradient-to-b from-[#1a365d] to-[#234876] text-white shadow-xl shadow-[#1a365d]/20 hover:shadow-2xl hover:-translate-y-1" : "bg-white text-zinc-900 ring-1 ring-zinc-200 hover:ring-zinc-300 hover:shadow-lg"}`}>
                <div className={`inline-flex h-14 w-14 items-center justify-center rounded-xl text-xl font-bold ${s.live ? "bg-[#c59d5f] text-white shadow-lg shadow-[#c59d5f]/30" : "bg-zinc-200 text-zinc-400"}`}>{s.abbr}</div>
                <div className="mt-6">
                  <h4 className={`text-2xl font-bold ${s.live ? "text-white" : "text-zinc-900"}`}>{s.name}</h4>
                  {s.live ? (<span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-green-500/20 px-3 py-1 text-xs font-semibold text-green-300"><span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />Live Now</span>) : (<span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-yellow-500/20 px-3 py-1 text-xs font-semibold text-yellow-600"><span className="h-1.5 w-1.5 rounded-full bg-yellow-500 animate-pulse" />Under Construction</span>)}
                </div>
                <p className={`mt-4 text-sm ${s.live ? "text-zinc-300" : "text-zinc-500"}`}>{s.tagline}</p>
                <div className={`mt-6 flex items-center justify-between border-t pt-4 ${s.live ? "border-white/10" : "border-zinc-200"}`}>
                  <span className="text-sm text-zinc-400">{s.counties}</span>
                  {s.live && <span className="text-sm font-semibold text-[#c59d5f]">$99</span>}
                </div>
                {s.live && <div className="absolute top-8 right-8 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition-all group-hover:bg-[#c59d5f] group-hover:shadow-lg"><svg className="h-5 w-5 text-white transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg></div>}
              </Link>
            ))}
          </div>

        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-white">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16"><h3 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">How It Works</h3></div>
          <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto">
            {[
              { icon: "📋", title: "Free DIY", steps: ["Visit your state court website", "Download official divorce forms", "Fill them out yourself", "File at the courthouse or e-file"] },
              { icon: "🤖", title: "AI-Assisted ($99)", steps: ["Select your state & qualify", "AI guides you through every field", "Forms prepared in plain language", "Download & file with the court"] },
            ].map((p, i) => (
              <div key={i} className="rounded-2xl bg-zinc-50 p-8 ring-1 ring-zinc-100">
                <span className="text-3xl">{p.icon}</span>
                <h4 className="mt-4 text-lg font-bold text-zinc-900">{p.title}</h4>
                <ol className="mt-4 space-y-3">{p.steps.map((s, j) => (<li key={j} className="flex items-start gap-3 text-sm text-zinc-600"><span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#1a365d] text-xs font-bold text-white">{j+1}</span>{s}</li>))}</ol>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
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
              <h4 className="font-semibold text-white mb-3">Services</h4>
              <div className="space-y-2 text-sm">
                <Link href="#states" className="block text-zinc-400 hover:text-[#c59d5f] transition">AI-Assisted Divorce ($99)</Link>
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

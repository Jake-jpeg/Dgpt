"use client";

import Link from "next/link";
import { useState } from "react";

const languages = [
  { code: "en", label: "English", cta: "Check If You Qualify" },
  { code: "es", label: "Español", cta: "Verifique Si Califica" },
  { code: "zh", label: "中文", cta: "检查您是否符合资格" },
  { code: "ko", label: "한국어", cta: "자격 확인하기" },
  { code: "ru", label: "Русский", cta: "Проверьте, подходите ли вы" },
  { code: "ht", label: "Kreyòl Ayisyen", cta: "Tcheke Si Ou Kalifye" },
];

const features = [
  {
    title: "Form Explanation",
    description: "Understand what each court form asks for and why.",
    icon: "📄",
  },
  {
    title: "Filing Guidance",
    description: "Learn where and how to file your papers in New York.",
    icon: "📍",
  },
  {
    title: "Multilingual Support",
    description: "Get help in English, Spanish, Chinese, Korean, Russian, or Haitian Creole.",
    icon: "🌐",
  },
  {
    title: "No Legal Jargon",
    description: "Plain language explanations of complex legal terms.",
    icon: "💬",
  },
];

const steps = [
  { number: "1", title: "Check Eligibility", description: "Answer a few questions to confirm this service is right for you." },
  { number: "2", title: "Pay $20", description: "One-time payment. No hidden fees. No subscriptions." },
  { number: "3", title: "Get Your Forms", description: "Receive your prepared divorce forms ready for filing." },
  { number: "4", title: "Ask Questions", description: "Use DivorceGPT to understand any part of the process." },
];

export default function Home() {
  const [selectedLang, setSelectedLang] = useState(languages[0]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-[#1a365d] text-white">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#c59d5f] rounded-lg flex items-center justify-center text-xl">⚖️</div>
            <div>
              <h1 className="text-xl font-semibold">DivorceGPT</h1>
              <p className="text-xs opacity-80">New York Uncontested Divorce</p>
            </div>
          </div>
          <nav className="hidden md:flex gap-6 text-sm">
            <a href="#how-it-works" className="hover:text-[#c59d5f] transition">How It Works</a>
            <a href="#features" className="hover:text-[#c59d5f] transition">Features</a>
            <a href="#faq" className="hover:text-[#c59d5f] transition">FAQ</a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-[#1a365d] text-white pb-20 pt-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            New York Uncontested Divorce
            <span className="block text-[#c59d5f] mt-2">Made Simple</span>
          </h2>
          <p className="text-lg md:text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Get your divorce forms prepared and explained in plain language. 
            No lawyers needed for simple, uncontested cases.
          </p>
          
          {/* Language Selector */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setSelectedLang(lang)}
                className={`px-4 py-2 rounded-full text-sm transition ${
                  selectedLang.code === lang.code
                    ? "bg-[#c59d5f] text-white"
                    : "bg-white/10 hover:bg-white/20"
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>

          {/* CTA Button */}
          <Link
            href="/qualify"
            className="inline-block bg-[#c59d5f] hover:bg-[#b08a4f] text-white font-semibold text-lg px-8 py-4 rounded-xl transition shadow-lg hover:shadow-xl"
          >
            {selectedLang.cta} →
          </Link>
          
          <p className="mt-4 text-sm opacity-70">$20 one-time fee • No hidden costs</p>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h3 className="text-3xl font-bold text-center text-[#1a365d] mb-12">How It Works</h3>
          <div className="grid md:grid-cols-4 gap-8">
            {steps.map((step) => (
              <div key={step.number} className="text-center">
                <div className="w-12 h-12 bg-[#1a365d] text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {step.number}
                </div>
                <h4 className="font-semibold text-lg mb-2 text-[#1a365d]">{step.title}</h4>
                <p className="text-gray-600 text-sm">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <h3 className="text-3xl font-bold text-center text-[#1a365d] mb-12">What You Get</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => (
              <div key={feature.title} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="text-3xl mb-4">{feature.icon}</div>
                <h4 className="font-semibold text-lg mb-2 text-[#1a365d]">{feature.title}</h4>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Eligibility Preview */}
      <section className="py-20 bg-[#1a365d] text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h3 className="text-3xl font-bold mb-6">Is This Right For You?</h3>
          <p className="text-lg opacity-90 mb-8">This service is for New York uncontested divorces with:</p>
          <div className="grid md:grid-cols-2 gap-4 text-left max-w-2xl mx-auto">
            {[
              "No children of the marriage",
              "No property or debts to divide",
              "No spousal support requests",
              "Both spouses agree to divorce",
              "Spouse will cooperate with paperwork",
              "At least one spouse meets NY residency",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <span className="text-[#c59d5f] text-xl">✓</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
          <Link
            href="/qualify"
            className="inline-block mt-10 bg-[#c59d5f] hover:bg-[#b08a4f] text-white font-semibold px-8 py-4 rounded-xl transition"
          >
            Check Your Eligibility →
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4">
          <h3 className="text-3xl font-bold text-center text-[#1a365d] mb-12">Frequently Asked Questions</h3>
          <div className="space-y-6">
            {[
              {
                q: "Is this legal advice?",
                a: "No. DivorceGPT explains what divorce forms ask for and how to file them. It does not provide legal advice or tell you what to do. For legal advice, consult an attorney.",
              },
              {
                q: "How long does the process take?",
                a: "You can complete your forms in one session. After filing, New York courts typically process uncontested divorces in 2-4 months.",
              },
              {
                q: "What if my spouse won't cooperate?",
                a: "This service is for uncontested divorces where both spouses agree. If your spouse won't cooperate, you may need to pursue a contested divorce with an attorney.",
              },
              {
                q: "Can I get a refund?",
                a: "If you don't qualify after completing the eligibility check, you won't be charged. Once forms are generated, refunds are not available.",
              },
            ].map((faq) => (
              <div key={faq.q} className="border-b border-gray-200 pb-6">
                <h4 className="font-semibold text-lg text-[#1a365d] mb-2">{faq.q}</h4>
                <p className="text-gray-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1a365d] text-white py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#c59d5f] rounded-lg flex items-center justify-center">⚖️</div>
              <span className="font-semibold">DivorceGPT</span>
            </div>
            <p className="text-sm opacity-70 text-center">
              This tool explains NY divorce forms and procedures. It is not legal advice and may contain errors. Consult an attorney for your specific situation.
            </p>
            <div className="flex gap-4 text-sm">
              <a href="#" className="hover:text-[#c59d5f]">Privacy</a>
              <a href="#" className="hover:text-[#c59d5f]">Terms</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

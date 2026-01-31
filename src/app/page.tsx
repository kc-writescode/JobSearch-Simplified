'use client';

import './landing.css';
import Link from 'next/link';
import { useState } from 'react';

// Helper components
const CheckIcon = () => (
  <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-md shadow-blue-200/50">
    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
      <path d="M5 13l4 4L19 7" />
    </svg>
  </div>
);

const CrossIcon = () => (
  <div className="w-7 h-7 flex items-center justify-center rounded-full bg-red-50">
    <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path d="M6 18L18 6M6 6l12 12" />
    </svg>
  </div>
);

function PricingSection() {
  const [showCustomResume, setShowCustomResume] = useState(false);

  const noCustomResumePlans = [
    {
      name: "Starter",
      price: 99,
      duration: "1 month",
      jobsTotal: "500",
      savings: null,
      popular: false,
      serviceNote: "You send job links",
      bestFor: "Testing our service",
      whyBest: "Low commitment, see results fast",
      features: ["AI Cover Letters", "Real-Time Dashboard", "WhatsApp/Slack Support", "Application Proof"],
    },
    {
      name: "Growth",
      price: 249,
      duration: "3 months",
      jobsTotal: "1,500",
      savings: "16% off",
      popular: true,
      serviceNote: "We find jobs for you",
      bestFor: "Active job seekers",
      whyBest: "Best value for serious searches",
      features: ["AI Cover Letters", "Daily Job Scouting", "Priority Support", "Real-Time Dashboard", "Application Proof", "Credits Roll Over"],
    },
    {
      name: "Scale",
      price: 449,
      duration: "6 months",
      jobsTotal: "3,000",
      savings: "24% off",
      popular: false,
      serviceNote: "Dedicated job scout",
      bestFor: "Long-term career moves",
      whyBest: "Maximum coverage & savings",
      features: ["AI Cover Letters", "Dedicated Job Scout", "Priority Support", "Real-Time Dashboard", "Application Proof", "Credits Roll Over"],
    }
  ];

  const customResumePlans = [
    {
      name: "Kickstart",
      price: 199,
      duration: "1 month",
      jobsTotal: "500",
      savings: null,
      popular: false,
      serviceNote: "You send job links",
      bestFor: "Quick job search boost",
      whyBest: "Full service, short commitment",
      features: ["AI-Tailored Resumes", "AI Cover Letters", "Real-Time Dashboard", "WhatsApp/Slack Support", "Application Proof"],
    },
    {
      name: "Accelerate",
      price: 349,
      duration: "3 months",
      jobsTotal: "1,500",
      savings: "42% off",
      popular: true,
      serviceNote: "We find jobs for you",
      bestFor: "Serious job seekers",
      whyBest: "Best ROI for your career",
      features: ["AI-Tailored Resumes", "AI Cover Letters", "Daily Job Scouting", "Priority Support", "Real-Time Dashboard", "Application Proof", "Credits Roll Over"],
    },
    {
      name: "Elite",
      price: 649,
      duration: "6 months",
      jobsTotal: "3,000",
      savings: "46% off",
      popular: false,
      serviceNote: "Dedicated account manager",
      bestFor: "Executive & senior roles",
      whyBest: "White-glove service",
      features: ["AI-Tailored Resumes", "AI Cover Letters", "Dedicated Account Manager", "Priority Support", "Real-Time Dashboard", "Application Proof", "Credits Roll Over"],
    }
  ];

  const plans = showCustomResume ? customResumePlans : noCustomResumePlans;

  return (
    <section id="pricing" className="py-20 md:py-28 px-6 bg-gradient-to-b from-slate-50 to-white" aria-labelledby="pricing-heading">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <header className="text-center mb-12">
          <span className="inline-block px-4 py-1.5 bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider rounded-full mb-4 animate-pulse">
            Pricing
          </span>
          <h2 id="pricing-heading" className="text-3xl md:text-5xl font-bold text-neutral-900 tracking-tight mb-4">
            Invest in Your Career
          </h2>
          <p className="text-lg text-neutral-600 max-w-xl mx-auto mb-8">
            No hidden fees. No commission on your salary. Cancel anytime.
          </p>

          {/* Toggle */}
          <div className="inline-flex items-center p-1.5 bg-neutral-200 rounded-xl shadow-inner">
            <button
              onClick={() => setShowCustomResume(false)}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${
                !showCustomResume
                  ? 'bg-white text-neutral-900 shadow-md'
                  : 'text-neutral-500 hover:text-neutral-700'
              }`}
            >
              Cover Letter Only
            </button>
            <button
              onClick={() => setShowCustomResume(true)}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${
                showCustomResume
                  ? 'bg-white text-neutral-900 shadow-md'
                  : 'text-neutral-500 hover:text-neutral-700'
              }`}
            >
              Resume + Cover Letter
              <span className="px-1.5 py-0.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-[10px] font-bold rounded">PRO</span>
            </button>
          </div>
        </header>

        {/* Plans */}
        <div className="grid md:grid-cols-3 gap-5 md:gap-6">
          {plans.map((plan, index) => (
            <div
              key={plan.name}
              className={`group relative rounded-2xl transition-all duration-500 hover:scale-[1.02] ${
                plan.popular
                  ? 'bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white shadow-2xl shadow-blue-500/30 md:-my-4 md:py-2 ring-4 ring-blue-400/30'
                  : 'bg-white border border-neutral-200 hover:border-blue-200 hover:shadow-xl shadow-lg'
              }`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Popular badge */}
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                  <span className="px-4 py-1.5 bg-gradient-to-r from-amber-400 to-yellow-400 text-amber-900 text-xs font-bold rounded-full shadow-lg animate-bounce">
                    Best Value
                  </span>
                </div>
              )}

              <div className={`p-6 ${plan.popular ? 'pt-8' : ''}`}>
                {/* Name & Jobs */}
                <h3 className={`text-2xl font-bold mb-1 ${plan.popular ? 'text-white' : 'text-neutral-900'}`}>
                  {plan.name}
                </h3>
                <p className={`text-sm mb-5 ${plan.popular ? 'text-blue-200' : 'text-neutral-500'}`}>
                  {plan.jobsTotal} applications
                </p>

                {/* Price & Duration */}
                <div className={`mb-5 p-4 rounded-xl ${
                  plan.popular
                    ? 'bg-white/10 border border-white/20'
                    : 'bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100'
                }`}>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-4xl font-extrabold tracking-tight ${plan.popular ? 'text-white' : 'text-neutral-900'}`}>
                      ${plan.price}
                    </span>
                    <span className={`text-sm font-medium ${plan.popular ? 'text-blue-200' : 'text-neutral-500'}`}>
                      / {plan.duration}
                    </span>
                  </div>
                  {plan.savings && (
                    <span className={`inline-block mt-2 px-2.5 py-1 rounded-full text-xs font-bold ${
                      plan.popular ? 'bg-green-400/20 text-green-300' : 'bg-green-100 text-green-700'
                    }`}>
                      {plan.savings}
                    </span>
                  )}
                </div>

                {/* Features */}
                <ul className={`space-y-2.5 mb-6 text-sm ${plan.popular ? 'text-blue-100' : 'text-neutral-600'}`}>
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2.5">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                        plan.popular ? 'bg-green-400/20' : 'bg-green-100'
                      }`}>
                        <svg className={`w-3 h-3 ${plan.popular ? 'text-green-300' : 'text-green-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* Hover info */}
                <div className={`mb-5 p-3.5 rounded-xl text-sm transition-all duration-300 transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 ${
                  plan.popular ? 'bg-white/10 backdrop-blur-sm' : 'bg-blue-50 border border-blue-100'
                }`}>
                  <p className={`font-bold mb-1 ${plan.popular ? 'text-white' : 'text-neutral-900'}`}>
                    Best for: {plan.bestFor}
                  </p>
                  <p className={plan.popular ? 'text-blue-200' : 'text-neutral-600'}>
                    {plan.whyBest}
                  </p>
                </div>

                {/* Service Note */}
                {'serviceNote' in plan && (
                  <div className={`mb-4 flex items-center justify-center gap-2 text-xs font-medium ${
                    plan.popular ? 'text-blue-200' : 'text-neutral-500'
                  }`}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    {plan.serviceNote}
                  </div>
                )}

                {/* CTA */}
                <a
                  href="https://cal.id/krishna-chaitanya/connect-with-founder"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`block w-full py-3.5 rounded-xl font-bold text-sm text-center transition-all duration-300 ${
                    plan.popular
                      ? 'bg-white text-blue-700 hover:bg-blue-50 shadow-lg hover:shadow-xl'
                      : 'bg-gradient-to-r from-neutral-900 to-neutral-800 text-white hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl'
                  }`}
                >
                  Get Started →
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Trust badges */}
        <div className="mt-12 flex flex-wrap justify-center gap-8 text-sm">
          {[
            { text: "Zero commission", icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" },
            { text: "Cancel anytime", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
            { text: "Credits roll over", icon: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" },
          ].map((badge, i) => (
            <div key={i} className="flex items-center gap-2 text-neutral-600">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d={badge.icon} />
                </svg>
              </div>
              <span className="font-medium">{badge.text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ROICalculator() {
  const [timeValue, setTimeValue] = useState(25);
  const [appsPerMonth, setAppsPerMonth] = useState(100);
  const [minsPerApp, setMinsPerApp] = useState(10);

  const totalMinutesSaved = appsPerMonth * minsPerApp;
  const hoursSaved = Math.round(totalMinutesSaved / 60);
  const moneySaved = hoursSaved * timeValue;

  return (
    <section className="py-24 md:py-32 px-6 bg-gradient-to-b from-white to-neutral-50" aria-labelledby="roi-heading">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white border border-neutral-100 rounded-3xl md:rounded-[3rem] p-8 md:p-16 relative shadow-xl shadow-neutral-100/50">
          {/* Subtle Background Accent */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-50 to-transparent rounded-full blur-3xl opacity-60 -z-10"></div>

          <div className="relative z-10">
            <header className="max-w-3xl mb-16">
              <span className="inline-block px-4 py-2 bg-blue-50 text-blue-600 text-xs font-bold uppercase tracking-wider rounded-full mb-6">
                ROI Calculator
              </span>
              <h2 id="roi-heading" className="font-display text-3xl md:text-5xl font-extrabold text-neutral-900 tracking-tight mb-6 leading-tight">
                Calculate Your <span className="text-gradient-primary">Return on Investment</span>
              </h2>
              <p className="text-lg text-neutral-500 leading-relaxed">
                See how much time and money you'll save by letting us handle your job applications.
              </p>
            </header>

            <div className="grid lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-7 space-y-10">
                {/* Slider 1 */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label htmlFor="time-value" className="text-sm font-semibold text-neutral-600">What's your time worth?</label>
                    <span className="text-2xl font-bold text-blue-600">${timeValue}<span className="text-sm font-medium text-neutral-400 ml-1">/hr</span></span>
                  </div>
                  <input
                    id="time-value"
                    type="range" min="15" max="150" step="5" value={timeValue}
                    onChange={(e) => setTimeValue(parseInt(e.target.value))}
                    className="w-full"
                    aria-label="Hourly rate value"
                  />
                  <div className="flex justify-between text-xs font-medium text-neutral-400">
                    <span>$15/hr</span>
                    <span>$150/hr</span>
                  </div>
                </div>

                {/* Slider 2 */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label htmlFor="mins-per-app" className="text-sm font-semibold text-neutral-600">Time per application</label>
                    <span className="text-2xl font-bold text-blue-600">{minsPerApp}<span className="text-sm font-medium text-neutral-400 ml-1">min</span></span>
                  </div>
                  <input
                    id="mins-per-app"
                    type="range" min="5" max="30" step="1" value={minsPerApp}
                    onChange={(e) => setMinsPerApp(parseInt(e.target.value))}
                    className="w-full"
                    aria-label="Minutes per application"
                  />
                  <div className="flex justify-between text-xs font-medium text-neutral-400">
                    <span>5 min (quick)</span>
                    <span>30 min (detailed)</span>
                  </div>
                </div>

                {/* Slider 3 */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label htmlFor="apps-per-month" className="text-sm font-semibold text-neutral-600">Applications per month</label>
                    <span className="text-2xl font-bold text-blue-600">{appsPerMonth}<span className="text-sm font-medium text-neutral-400 ml-1">jobs</span></span>
                  </div>
                  <input
                    id="apps-per-month"
                    type="range" min="20" max="1000" step="10" value={appsPerMonth}
                    onChange={(e) => setAppsPerMonth(parseInt(e.target.value))}
                    className="w-full"
                    aria-label="Applications per month"
                  />
                  <div className="flex justify-between text-xs font-medium text-neutral-400">
                    <span>20 jobs</span>
                    <span>1,000 jobs</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-1"></div>

              {/* Results Card */}
              <div className="lg:col-span-4">
                <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl p-10 text-center shadow-2xl shadow-blue-600/20 transform lg:scale-105">
                  <div className="mb-8">
                    <div className="text-6xl md:text-7xl font-extrabold text-white tracking-tight mb-2">{hoursSaved}</div>
                    <div className="text-sm font-semibold uppercase tracking-wider text-blue-100">Hours Saved / Month</div>
                  </div>

                  <div className="pt-8 border-t border-white/20">
                    <div className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-3">${moneySaved.toLocaleString()}</div>
                    <div className="text-sm font-medium text-blue-100 leading-relaxed">
                      Value returned to you monthly
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Hidden Cost Cards */}
            <div className="mt-24 pt-16 border-t border-neutral-100">
              <div className="text-center mb-12">
                <h3 className="font-display text-2xl md:text-3xl font-bold text-neutral-900 tracking-tight mb-4">
                  The Hidden Costs of Job Searching
                </h3>
                <p className="text-neutral-500 max-w-xl mx-auto">
                  Think our plans are expensive? Consider what you're already paying.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { title: "The 'Ghosted' Tax", cost: "$500+", desc: "20+ hours on jobs where you never hear back", icon: "👻" },
                  { title: "Agency Commission", cost: "$15,000+", desc: "20% cut from your first year salary", icon: "💸" },
                  { title: "Resume Rewrite", cost: "$300+", desc: "Generic template that doesn't stand out", icon: "📄" },
                  { title: "Burnout Cost", cost: "Priceless", desc: "Late nights filling endless Workday forms", icon: "🧠" }
                ].map((item, i) => (
                  <article key={i} className="bg-neutral-50 border border-neutral-100 rounded-2xl p-6 hover:bg-white hover:shadow-lg hover:shadow-neutral-100/50 transition-all duration-300 text-center feature-card">
                    <div className="text-4xl mb-4" aria-hidden="true">{item.icon}</div>
                    <h4 className="text-sm font-bold text-neutral-900 mb-2">{item.title}</h4>
                    <div className="text-2xl font-bold text-blue-600 mb-3">{item.cost}</div>
                    <p className="text-xs text-neutral-500 leading-relaxed">{item.desc}</p>
                  </article>
                ))}
              </div>

              {/* CTA Banner */}
              <div className="mt-12 p-8 md:p-10 bg-gradient-to-r from-teal-600 to-teal-700 rounded-2xl md:rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-teal-900/10">
                <div>
                  <p className="text-teal-100 text-sm font-medium mb-2">Plans Starting At</p>
                  <h4 className="text-white text-xl md:text-2xl font-bold">
                    Get started for just <span className="underline decoration-teal-300">$99/month</span>
                  </h4>
                </div>
                <a
                  href="https://cal.id/krishna-chaitanya/connect-with-founder"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-8 py-4 rounded-xl bg-white text-teal-700 font-bold text-sm hover:bg-teal-50 transition-all shadow-lg whitespace-nowrap"
                >
                  Book Free Consultation
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function LandingPage() {
  return (
    <div className="landing-container min-h-screen bg-white text-neutral-900 selection:bg-blue-100 selection:text-blue-900">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/95 backdrop-blur-xl border-b border-neutral-100 shadow-sm" role="navigation" aria-label="Main navigation">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group" aria-label="JobHuntSimplified Home">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200/50 group-hover:shadow-blue-300/50 transition-shadow">
              <span className="text-white font-extrabold text-xl">J</span>
            </div>
            <span className="text-xl font-bold text-neutral-900 tracking-tight">
              JobHunt<span className="text-blue-600">Simplified</span>
            </span>
          </Link>
          <div className="hidden md:flex gap-6 items-center">
            <a href="#how-it-works" className="px-4 py-2 text-sm font-medium text-neutral-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
              How it Works
            </a>
            <a href="#pricing" className="relative px-4 py-2 text-sm font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all border border-blue-200">
              Pricing
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full animate-ping"></span>
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full"></span>
            </a>
            <Link href="/login" className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-300/30 hover:shadow-blue-400/40">
              Sign In
            </Link>
          </div>
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <section className="relative pt-32 md:pt-44 pb-20 md:pb-32 px-6 overflow-hidden" aria-labelledby="hero-heading">
          {/* Background Elements */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-20 left-1/4 w-96 h-96 bg-blue-100 rounded-full blur-[100px] opacity-40"></div>
            <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-teal-100 rounded-full blur-[80px] opacity-30"></div>
          </div>

          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
              {/* Hero Content */}
              <div className="flex-1 text-center lg:text-left max-w-2xl mx-auto lg:mx-0">
                <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100/80 text-blue-700 text-xs font-semibold mb-8 animate-fade-in shadow-sm">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                  </span>
                  US Application Experts Ready
                </div>

                <h1 id="hero-heading" className="font-display text-4xl md:text-5xl lg:text-6xl font-extrabold text-neutral-900 tracking-tight mb-6 leading-[1.1] animate-fade-in-up">
                  Stop Wasting Hours
                  <br />
                  <span className="text-gradient-primary">on Job Applications</span>
                </h1>

                <p className="text-lg md:text-xl text-neutral-600 mb-10 leading-relaxed animate-fade-in-up stagger-1">
                  We handle the entire application process — from finding jobs to tailoring resumes to submitting applications. <span className="text-neutral-900 font-medium">You focus on interview prep.</span>
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-fade-in-up stagger-2">
                  <a
                    href="https://cal.id/krishna-chaitanya/connect-with-founder"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-teal-600 to-teal-700 text-white font-semibold text-sm rounded-xl shadow-lg shadow-teal-600/20 hover:shadow-xl hover:shadow-teal-600/30 hover:-translate-y-0.5 transition-all"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Book Free Consultation
                  </a>
                  <a href="#how-it-works" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-neutral-700 font-semibold text-sm rounded-xl border-2 border-neutral-200 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50/50 transition-all">
                    Learn How It Works
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </a>
                </div>

                {/* Trust Indicators */}
                <div className="mt-10 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-sm">
                  <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-full border border-green-100">
                    <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-green-700 font-medium">Zero Commission</span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full border border-blue-100">
                    <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-blue-700 font-medium">24-Hour Turnaround</span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 rounded-full border border-purple-100">
                    <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <span className="text-purple-700 font-medium">Real-Time Tracking</span>
                  </div>
                </div>
              </div>

              {/* Hero Visual */}
              <div className="flex-1 w-full max-w-lg lg:max-w-none animate-fade-in-up stagger-3">
                <div className="relative">
                  <div className="bg-white border border-neutral-200 rounded-3xl p-6 shadow-2xl shadow-neutral-200/50">
                    <div className="bg-neutral-50 rounded-2xl p-6">
                      <div className="flex items-center justify-between mb-6 pb-4 border-b border-neutral-100">
                        <span className="font-bold text-sm text-neutral-700">Dashboard Overview</span>
                        <span className="flex items-center gap-2 text-xs font-medium text-green-600 bg-green-50 px-3 py-1 rounded-full">
                          <span className="w-2 h-2 rounded-full bg-green-500"></span>
                          Live
                        </span>
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between py-3 border-b border-neutral-100">
                          <span className="text-sm text-neutral-500">Applications This Week</span>
                          <span className="font-bold text-neutral-900">47</span>
                        </div>
                        <div className="flex items-center justify-between py-3 border-b border-neutral-100">
                          <span className="text-sm text-neutral-500">Interview Requests</span>
                          <span className="font-bold text-blue-600">8</span>
                        </div>
                        <div className="flex items-center justify-between py-3">
                          <span className="text-sm text-neutral-500">Response Rate</span>
                          <span className="font-bold text-green-600">17%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Floating notification */}
                  <div className="absolute -bottom-6 -left-6 p-4 bg-white border border-neutral-100 rounded-2xl shadow-xl animate-bounce-slow">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-neutral-400">Just Applied</p>
                        <p className="text-sm font-semibold text-neutral-900">Google SWE III</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="py-20 md:py-32 px-6 bg-neutral-50" aria-labelledby="how-it-works-heading">
          <div className="max-w-7xl mx-auto">
            <header className="text-center mb-16">
              <span className="inline-block px-4 py-2 bg-blue-50 text-blue-600 text-xs font-bold uppercase tracking-wider rounded-full mb-6">
                Our Process
              </span>
              <h2 id="how-it-works-heading" className="font-display text-3xl md:text-5xl font-extrabold text-neutral-900 tracking-tight mb-6">
                How We Simplify Your Job Hunt
              </h2>
              <p className="text-lg text-neutral-500 max-w-2xl mx-auto">
                A proven 3-step process that gets you more interviews with less effort.
              </p>
            </header>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  step: "01",
                  title: "Strategic Job Scouting",
                  desc: "Our team identifies high-quality US roles that match your background, targeting positions where you're most likely to get responses.",
                  icon: (
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  )
                },
                {
                  step: "02",
                  title: "AI-Tailored Applications",
                  desc: "We use AI to customize your resume and cover letter for each role, optimizing for ATS systems and highlighting relevant experience.",
                  icon: (
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  )
                },
                {
                  step: "03",
                  title: "Real-Time Transparency",
                  desc: "Track every submission through your dashboard with proof of application. Stay informed and in control of your job search.",
                  icon: (
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  )
                }
              ].map((item, i) => (
                <article key={i} className="bg-white p-8 md:p-10 rounded-2xl md:rounded-3xl border border-neutral-100 shadow-sm hover:shadow-xl hover:shadow-neutral-100/50 transition-all duration-300 feature-card group">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    {item.icon}
                  </div>
                  <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-3">Step {item.step}</div>
                  <h3 className="font-display text-xl font-bold text-neutral-900 mb-4">{item.title}</h3>
                  <p className="text-neutral-500 leading-relaxed">{item.desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <PricingSection />

        {/* ROI Calculator */}
        <ROICalculator />

        {/* Comparison Table */}
        <section className="py-20 md:py-32 px-6 bg-white" aria-labelledby="comparison-heading">
          <div className="max-w-5xl mx-auto">
            <header className="text-center mb-16">
              <h2 id="comparison-heading" className="font-display text-3xl md:text-4xl font-extrabold text-neutral-900 tracking-tight mb-4">
                Why Choose JobHuntSimplified?
              </h2>
              <p className="text-lg text-neutral-500 max-w-2xl mx-auto">
                See how we compare to other job search approaches.
              </p>
            </header>

            <div className="bg-white border border-neutral-200 rounded-2xl md:rounded-3xl overflow-hidden shadow-xl">
              <table className="w-full" role="table">
                <thead>
                  <tr className="bg-neutral-50 border-b border-neutral-200">
                    <th className="p-5 text-sm font-semibold text-neutral-600 text-left w-[40%]" scope="col">Feature</th>
                    <th className="p-5 text-sm font-semibold text-neutral-400 text-center w-[20%]" scope="col">Going Solo</th>
                    <th className="p-5 text-sm font-semibold text-neutral-400 text-center w-[20%]" scope="col">AI Bots</th>
                    <th className="p-5 text-sm font-bold text-blue-600 text-center bg-blue-50 w-[20%]" scope="col">JobHuntSimplified</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: "AI-Tailored Resumes", solo: false, ai: false, jhs: true },
                    { label: "Custom Cover Letters", solo: false, ai: true, jhs: true },
                    { label: "Proof of Application", solo: false, ai: false, jhs: true },
                    { label: "Human Job Scouting", solo: false, ai: false, jhs: true },
                    { label: "Daily Execution", solo: false, ai: true, jhs: true },
                    { label: "Real Human Support", solo: false, ai: false, jhs: true },
                  ].map((row, i) => (
                    <tr key={i} className="border-b border-neutral-100 hover:bg-neutral-50/50 transition-colors">
                      <td className="p-5 text-sm font-medium text-neutral-700 text-left">{row.label}</td>
                      <td className="p-5">
                        <div className="flex justify-center">{row.solo ? <CheckIcon /> : <CrossIcon />}</div>
                      </td>
                      <td className="p-5">
                        <div className="flex justify-center">{row.ai ? <CheckIcon /> : <CrossIcon />}</div>
                      </td>
                      <td className="p-5 bg-blue-50/50">
                        <div className="flex justify-center"><CheckIcon /></div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 md:py-32 px-6 bg-gradient-to-br from-blue-600 to-blue-700" aria-labelledby="cta-heading">
          <div className="max-w-4xl mx-auto text-center">
            <h2 id="cta-heading" className="font-display text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-6">
              Ready to Simplify Your Job Hunt?
            </h2>
            <p className="text-lg text-blue-100 mb-10 max-w-2xl mx-auto">
              Join hundreds of job seekers who've reclaimed their time and landed interviews faster.
            </p>
            <a
              href="https://cal.id/krishna-chaitanya/connect-with-founder"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-3 px-10 py-5 rounded-xl bg-white text-blue-600 font-bold text-lg hover:bg-blue-50 transition-all shadow-2xl shadow-blue-900/20"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Book Your Free Consultation
            </a>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-12 border-t border-neutral-100 px-6 bg-white" role="contentinfo">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">J</span>
              </div>
              <span className="font-bold text-neutral-900">
                JobHunt<span className="text-blue-600">Simplified</span>
              </span>
            </div>
            <nav className="flex gap-6 text-sm text-neutral-500" aria-label="Footer navigation">
              <Link href="/login" className="hover:text-blue-600 transition-colors">Sign In</Link>
              <a href="#how-it-works" className="hover:text-blue-600 transition-colors">How It Works</a>
              <a href="#pricing" className="hover:text-blue-600 transition-colors">Pricing</a>
            </nav>
            <p className="text-sm text-neutral-400">
              © {new Date().getFullYear()} JobHuntSimplified. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

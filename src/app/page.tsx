'use client';

import './landing.css';
import Link from 'next/link';
import { useState } from 'react';
import { Logo } from '@/components/Logo';

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
      price: 149,
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
      price: 349,
      duration: "3 months",
      jobsTotal: "1,500",
      savings: "22% off",
      popular: true,
      serviceNote: "We find jobs for you",
      bestFor: "Active job seekers",
      whyBest: "Best value for serious searches",
      features: ["AI Cover Letters", "Daily Job Scouting", "Priority Support", "Real-Time Dashboard", "Application Proof", "Credits Roll Over"],
    },
    {
      name: "Scale",
      price: 599,
      duration: "6 months",
      jobsTotal: "3,000",
      savings: "33% off",
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
      price: 249,
      duration: "1 month",
      jobsTotal: "500",
      savings: null,
      popular: false,
      serviceNote: "we find jobs for you",
      bestFor: "Quick job search boost",
      whyBest: "Full service, short commitment",
      features: ["AI-Tailored Resumes", "AI Cover Letters", "Real-Time Dashboard", "WhatsApp/Slack Support", "Application Proof"],
    },
    {
      name: "Accelerate",
      price: 549,
      duration: "3 months",
      jobsTotal: "1,500",
      savings: "27% off",
      popular: true,
      serviceNote: "We find jobs for you",
      bestFor: "Serious job seekers",
      whyBest: "Best ROI for your career",
      features: ["AI-Tailored Resumes", "AI Cover Letters", "Daily Job Scouting", "Priority Support", "Real-Time Dashboard", "Application Proof", "Credits Roll Over"],
    },
    {
      name: "Elite",
      price: 899,
      duration: "6 months",
      jobsTotal: "3,000",
      savings: "40% off",
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
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${!showCustomResume
                ? 'bg-white text-neutral-900 shadow-md'
                : 'text-neutral-500 hover:text-neutral-700'
                }`}
            >
              Cover Letter Only
            </button>
            <button
              onClick={() => setShowCustomResume(true)}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${showCustomResume
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
              className={`group relative rounded-2xl transition-all duration-500 hover:scale-[1.02] ${plan.popular
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
                <div className={`mb-5 p-4 rounded-xl ${plan.popular
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
                    <span className={`inline-block mt-2 px-2.5 py-1 rounded-full text-xs font-bold ${plan.popular ? 'bg-green-400/20 text-green-300' : 'bg-green-100 text-green-700'
                      }`}>
                      {plan.savings}
                    </span>
                  )}
                </div>

                {/* Features */}
                <ul className={`space-y-2.5 mb-6 text-sm ${plan.popular ? 'text-blue-100' : 'text-neutral-600'}`}>
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2.5">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${plan.popular ? 'bg-green-400/20' : 'bg-green-100'
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
                <div className={`mb-5 p-3.5 rounded-xl text-sm transition-all duration-300 transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 ${plan.popular ? 'bg-white/10 backdrop-blur-sm' : 'bg-blue-50 border border-blue-100'
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
                  <div className={`mb-4 flex items-center justify-center gap-2 text-xs font-medium ${plan.popular ? 'text-blue-200' : 'text-neutral-500'
                    }`}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    {plan.serviceNote}
                  </div>
                )}

                {/* CTA */}
                <a
                  href={`https://api.whatsapp.com/send/?phone=919493063818&text=Hi+Krishna+I%E2%80%99d+like+to+know+more+about+the+${plan.name}+plan+(${showCustomResume ? 'Resume+%2B+Cover+Letter' : 'Cover+Letter+Only'}).&type=phone_number&app_absent=0`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`block w-full py-3.5 rounded-xl font-bold text-sm text-center transition-all duration-300 ${plan.popular
                    ? 'bg-white text-blue-700 hover:bg-blue-50 shadow-lg hover:shadow-xl'
                    : 'bg-gradient-to-r from-neutral-900 to-neutral-800 text-white hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl'
                    }`}
                >
                  Proceed to Plan →
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
          <Logo />
          <div className="hidden md:flex gap-4 items-center">
            <a href="#how-it-works" className="px-4 py-2 text-sm font-medium text-neutral-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
              How it Works
            </a>
            <Link href="/tools" className="px-4 py-2 text-sm font-medium text-neutral-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
              Free Tools
            </Link>
            <a href="#pricing" className="relative px-4 py-2 text-sm font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all border border-blue-200">
              Pricing
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full animate-ping"></span>
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full"></span>
            </a>
            <a
              href="https://cal.id/krishna-chaitanya/connect-with-founder"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg transition-all border border-teal-200"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Book Free Call
            </a>
            <Link href="/login" className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-300/30 hover:shadow-blue-400/40">
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
                  Every resume custom-tailored to match job descriptions, boosting your ATS score with high-impact keywords. <span className="text-neutral-900 font-medium">Plus FREE cover letters with every plan.</span>
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
                <div className="mt-10 flex flex-wrap items-center justify-center lg:justify-start gap-4 text-sm">
                  <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-50 to-emerald-50 rounded-full border border-green-200">
                    <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="text-green-700 font-semibold">Free Cover Letters</span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full border border-blue-100">
                    <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <span className="text-blue-700 font-medium">ATS-Optimized</span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 rounded-full border border-purple-100">
                    <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-purple-700 font-medium">24hr Turnaround</span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-full border border-amber-100">
                    <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-amber-700 font-medium">Zero Commission</span>
                  </div>
                </div>
              </div>

              {/* Hero Visual - ATS Optimization Preview */}
              <div className="flex-1 w-full max-w-lg lg:max-w-none animate-fade-in-up stagger-3">
                <div className="relative">
                  {/* Main Card - Resume Tailoring */}
                  <div className="bg-white border border-neutral-200 rounded-3xl p-6 shadow-2xl shadow-neutral-200/50">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200/50">
                          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-neutral-900">Resume Tailoring</p>
                          <p className="text-xs text-neutral-400">Senior Software Engineer @ Meta</p>
                        </div>
                      </div>
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-green-600 bg-green-50 px-3 py-1.5 rounded-full border border-green-100 animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                        Processing
                      </span>
                    </div>

                    {/* ATS Score Meter */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 mb-5 border border-blue-100">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-semibold text-neutral-700">ATS Match Score</span>
                        <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 hero-score-animate">92%</span>
                      </div>
                      <div className="w-full h-3 bg-white rounded-full overflow-hidden shadow-inner">
                        <div className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-600 rounded-full hero-progress-animate" style={{ width: '92%' }}></div>
                      </div>
                      <p className="text-xs text-blue-600 mt-2 font-medium">+34% improvement from original resume</p>
                    </div>

                    {/* Keywords Matched */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Keywords Matched</span>
                        <span className="text-xs font-semibold text-green-600">12/14 found</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {['React', 'TypeScript', 'Node.js', 'AWS', 'CI/CD', 'Agile'].map((keyword, i) => (
                          <span
                            key={keyword}
                            className="px-3 py-1.5 bg-green-50 text-green-700 text-xs font-semibold rounded-lg border border-green-200 hero-keyword-animate"
                            style={{ animationDelay: `${i * 0.1}s` }}
                          >
                            <span className="inline-flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                              {keyword}
                            </span>
                          </span>
                        ))}
                        <span className="px-3 py-1.5 bg-amber-50 text-amber-700 text-xs font-semibold rounded-lg border border-amber-200 animate-pulse">
                          +6 more
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Floating Card - Cover Letter */}
                  <div className="absolute -bottom-4 -left-4 p-4 bg-white border border-green-200 rounded-2xl shadow-xl hero-float-animate">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-200/50">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-green-600 uppercase tracking-wider">Free Included</p>
                        <p className="text-sm font-bold text-neutral-900">Cover Letter Ready</p>
                      </div>
                    </div>
                  </div>

                  {/* Floating Card - Application Submitted */}
                  <div className="absolute -top-3 -right-3 p-3 bg-white border border-blue-200 rounded-xl shadow-lg hero-float-reverse-animate">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-[10px] text-neutral-400 font-medium">Applied Today</p>
                        <p className="text-xs font-bold text-neutral-900">47 Jobs</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ATS Optimization Section */}
        <section className="py-20 md:py-28 px-6 bg-gradient-to-b from-white to-blue-50/30" aria-labelledby="ats-heading">
          <div className="max-w-7xl mx-auto">
            <header className="text-center mb-16">
              <span className="inline-block px-4 py-2 bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 text-xs font-bold uppercase tracking-wider rounded-full mb-6 border border-green-200">
                ATS-Optimized Applications
              </span>
              <h2 id="ats-heading" className="font-display text-3xl md:text-5xl font-extrabold text-neutral-900 tracking-tight mb-6">
                Beat the ATS. <span className="text-gradient-primary">Land More Interviews.</span>
              </h2>
              <p className="text-lg text-neutral-500 max-w-3xl mx-auto">
                75% of resumes get rejected by ATS systems before a human sees them. We ensure yours gets through by matching your skills with job requirements.
              </p>
            </header>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {/* Feature 1 - Resume Tailoring */}
              <article className="relative bg-white p-8 rounded-2xl border border-neutral-100 shadow-lg hover:shadow-xl transition-all duration-300 group overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100 to-transparent rounded-full blur-2xl opacity-50 -z-10"></div>
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-200/50 group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="font-display text-xl font-bold text-neutral-900 mb-3">Custom-Tailored Resumes</h3>
                <p className="text-neutral-500 leading-relaxed mb-4">
                  Every resume is uniquely crafted to match the specific job description, highlighting your most relevant experience and skills.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm text-neutral-600">
                    <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Job-specific keyword optimization
                  </li>
                  <li className="flex items-center gap-2 text-sm text-neutral-600">
                    <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Skills aligned with requirements
                  </li>
                  <li className="flex items-center gap-2 text-sm text-neutral-600">
                    <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    ATS-friendly formatting
                  </li>
                </ul>
              </article>

              {/* Feature 2 - ATS Score */}
              <article className="relative bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 group overflow-hidden text-white">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-2xl -z-10"></div>
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform border border-white/30">
                  <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="font-display text-xl font-bold mb-3">Maximize ATS Score</h3>
                <p className="text-blue-100 leading-relaxed mb-4">
                  Our AI analyzes job descriptions to extract high-impact keywords and seamlessly integrates them into your resume.
                </p>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-100">Average Match Score</span>
                    <span className="text-2xl font-bold text-white">85%+</span>
                  </div>
                  <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                    <div className="w-[85%] h-full bg-gradient-to-r from-green-400 to-emerald-400 rounded-full"></div>
                  </div>
                </div>
              </article>

              {/* Feature 3 - Free Cover Letters */}
              <article className="relative bg-white p-8 rounded-2xl border-2 border-green-200 shadow-lg hover:shadow-xl transition-all duration-300 group overflow-hidden">
                <div className="absolute -top-2 -right-2">
                  <span className="inline-block px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold rounded-full shadow-lg">
                    FREE
                  </span>
                </div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-100 to-transparent rounded-full blur-2xl opacity-50 -z-10"></div>
                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-green-200/50 group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="font-display text-xl font-bold text-neutral-900 mb-3">Free Custom Cover Letters</h3>
                <p className="text-neutral-500 leading-relaxed mb-4">
                  Every application includes a personalized cover letter tailored to the role — at no extra cost, with all plans.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm text-neutral-600">
                    <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Company-specific messaging
                  </li>
                  <li className="flex items-center gap-2 text-sm text-neutral-600">
                    <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Highlights your best qualifications
                  </li>
                  <li className="flex items-center gap-2 text-sm text-neutral-600">
                    <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Professional tone & formatting
                  </li>
                </ul>
              </article>
            </div>

            {/* Additional Benefits Row */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { icon: "🎯", title: "Keyword Matching", desc: "Extract & match critical job keywords" },
                { icon: "⚡", title: "24hr Turnaround", desc: "Fast delivery without compromising quality" },
                { icon: "👁️", title: "Human Review", desc: "Every application reviewed by experts" },
                { icon: "📊", title: "Track Everything", desc: "Real-time dashboard with proof" },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-4 p-5 bg-white/80 rounded-xl border border-neutral-100 hover:bg-white hover:shadow-md transition-all">
                  <span className="text-2xl" aria-hidden="true">{item.icon}</span>
                  <div>
                    <h4 className="font-bold text-neutral-900 text-sm mb-1">{item.title}</h4>
                    <p className="text-xs text-neutral-500">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="py-20 md:py-32 px-6 bg-gradient-to-b from-neutral-50 to-white" aria-labelledby="how-it-works-heading">
          <div className="max-w-7xl mx-auto">
            <header className="text-center mb-16">
              <span className="inline-block px-4 py-2 bg-blue-50 text-blue-600 text-xs font-bold uppercase tracking-wider rounded-full mb-6">
                Our Process
              </span>
              <h2 id="how-it-works-heading" className="font-display text-3xl md:text-5xl font-extrabold text-neutral-900 tracking-tight mb-6">
                How We Simplify Your Career Journey
              </h2>
              <p className="text-lg text-neutral-500 max-w-2xl mx-auto">
                A proven 4-step process that gets you more interviews while you focus on what matters.
              </p>
            </header>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  step: "01",
                  title: "Strategic Job Scouting",
                  desc: "We identify high-quality US roles matching your background, targeting positions where you'll get responses.",
                  icon: (
                    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  ),
                  color: "blue"
                },
                {
                  step: "02",
                  title: "ATS-Optimized Resume + Free Cover Letter",
                  desc: "We tailor your resume with high-impact keywords from the job description, maximizing ATS scores. Free cover letter included.",
                  icon: (
                    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  ),
                  color: "indigo"
                },
                {
                  step: "03",
                  title: "Real-Time Tracking",
                  desc: "Track every submission through your dashboard with proof of application in real-time.",
                  icon: (
                    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  ),
                  color: "purple"
                },
                {
                  step: "04",
                  title: "You Ace Interviews",
                  desc: "With applications handled, use your saved time to prepare and nail your interviews.",
                  icon: (
                    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ),
                  color: "teal"
                }
              ].map((item, i) => (
                <article key={i} className="relative bg-white p-6 md:p-8 rounded-2xl border border-neutral-100 shadow-sm hover:shadow-xl hover:shadow-neutral-100/50 hover:-translate-y-1 transition-all duration-300 group">
                  {/* Connector line */}
                  {i < 3 && (
                    <div className="hidden lg:block absolute top-12 -right-3 w-6 h-0.5 bg-gradient-to-r from-neutral-200 to-neutral-100 z-10"></div>
                  )}
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-all duration-300 ${item.color === 'blue' ? 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white' :
                    item.color === 'indigo' ? 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white' :
                      item.color === 'purple' ? 'bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white' :
                        'bg-teal-50 text-teal-600 group-hover:bg-teal-600 group-hover:text-white'
                    }`}>
                    {item.icon}
                  </div>
                  <div className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-3 ${item.color === 'blue' ? 'bg-blue-100 text-blue-700' :
                    item.color === 'indigo' ? 'bg-indigo-100 text-indigo-700' :
                      item.color === 'purple' ? 'bg-purple-100 text-purple-700' :
                        'bg-teal-100 text-teal-700'
                    }`}>Step {item.step}</div>
                  <h3 className="font-display text-lg font-bold text-neutral-900 mb-3">{item.title}</h3>
                  <p className="text-sm text-neutral-500 leading-relaxed">{item.desc}</p>
                </article>
              ))}
            </div>

            {/* Bottom highlight */}
            <div className="mt-12 text-center">
              <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-teal-50 to-blue-50 rounded-full border border-teal-100">
                <svg className="w-5 h-5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-semibold text-neutral-700">Save 20+ hours per week on applications</span>
              </div>
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
                Why Choose ResumeToJobs?
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
                    <th className="p-5 text-sm font-bold text-blue-600 text-center bg-blue-50 w-[20%]" scope="col">ResumeToJobs (RTJ)</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: "ATS-Optimized Resume Tailoring", solo: false, ai: false, rtj: true },
                    { label: "FREE Custom Cover Letters", solo: false, ai: true, rtj: true, highlight: true },
                    { label: "Keyword Matching & Optimization", solo: false, ai: false, rtj: true },
                    { label: "Proof of Application", solo: false, ai: false, rtj: true },
                    { label: "Human Job Scouting", solo: false, ai: false, rtj: true },
                    { label: "Real Human Support", solo: false, ai: false, rtj: true },
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
              Ready to Accelerate Your Career?
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

      {/* Floating WhatsApp Button */}
      <a
        href="https://api.whatsapp.com/send/?phone=919493063818&text=Hi+Krishna+I%E2%80%99d+like+to+know+more+information+about+your+services&type=phone_number&app_absent=0"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 bg-[#25D366] text-white font-semibold text-sm rounded-full shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 hover:scale-105 transition-all duration-300 group"
        aria-label="Chat with us on WhatsApp"
      >
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
        <span className="hidden sm:inline">Chat with us</span>
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></span>
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
      </a>
    </div>
  );
}

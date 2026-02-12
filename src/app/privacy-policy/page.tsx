import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'Privacy Policy',
    description: 'ResumeToJobs Privacy Policy — Learn how we collect, use, and protect your personal information. We never sell or share your data with third parties.',
    alternates: {
        canonical: 'https://resumetojobs.com/privacy-policy',
    },
};

export default function PrivacyPolicyPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-white to-neutral-50 text-neutral-800">
            {/* Header */}
            <header className="bg-white border-b border-neutral-100 shadow-sm">
                <div className="max-w-4xl mx-auto px-6 py-6 flex items-center justify-between">
                    <Link
                        href="/"
                        className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to ResumeToJobs
                    </Link>
                    <span className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Legal</span>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-4xl mx-auto px-6 py-16 md:py-24">
                {/* Page Header */}
                <div className="mb-16">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 text-xs font-bold uppercase tracking-wider rounded-full mb-6 border border-blue-100">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        Your Privacy Matters
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-neutral-900 tracking-tight mb-6 leading-tight">
                        Privacy Policy
                    </h1>
                    <p className="text-lg text-neutral-500 leading-relaxed max-w-3xl">
                        At ResumeToJobs, safeguarding your personal information is our highest priority. This Privacy Policy outlines how we collect, use, store, and protect your data when you use our services.
                    </p>
                    <div className="mt-6 flex items-center gap-3 text-sm text-neutral-400">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>Last updated: February 12, 2026</span>
                    </div>
                </div>

                {/* Policy Sections */}
                <div className="space-y-12">
                    {/* Section 1 */}
                    <section className="bg-white rounded-2xl border border-neutral-100 p-8 md:p-10 shadow-sm">
                        <div className="flex items-start gap-4 mb-6">
                            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                                <span className="text-blue-600 font-bold text-sm">1</span>
                            </div>
                            <h2 className="text-2xl font-bold text-neutral-900 pt-1">Information We Collect</h2>
                        </div>
                        <div className="pl-14 space-y-4 text-neutral-600 leading-relaxed">
                            <p>
                                To provide our job application services effectively, we may collect the following personal information directly from you:
                            </p>
                            <ul className="space-y-3">
                                {[
                                    { label: 'Full Name', desc: 'Used to personalize your resumes, cover letters, and job applications.' },
                                    { label: 'Email Address', desc: 'Used for account access, service communications, and application status updates.' },
                                    { label: 'Mobile / Phone Number', desc: 'Used for urgent service-related communications and WhatsApp support.' },
                                    { label: 'Resume / CV Details', desc: 'Including work experience, education, skills, and certifications — used exclusively to tailor applications to job descriptions.' },
                                    { label: 'Job Preferences', desc: 'Such as target roles, preferred locations, salary expectations, and industry preferences — used to match you with relevant job openings.' },
                                    { label: 'LinkedIn Profile / Portfolio URLs', desc: 'Used to enhance your applications and ensure consistency across your professional presence.' },
                                ].map((item, i) => (
                                    <li key={i} className="flex items-start gap-3">
                                        <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
                                        </svg>
                                        <div>
                                            <span className="font-semibold text-neutral-800">{item.label}:</span>{' '}
                                            <span>{item.desc}</span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                            <p className="text-sm text-neutral-500 italic mt-4">
                                We do not collect any information beyond what is voluntarily provided by you for the purpose of our services.
                            </p>
                        </div>
                    </section>

                    {/* Section 2 */}
                    <section className="bg-white rounded-2xl border border-neutral-100 p-8 md:p-10 shadow-sm">
                        <div className="flex items-start gap-4 mb-6">
                            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
                                <span className="text-green-600 font-bold text-sm">2</span>
                            </div>
                            <h2 className="text-2xl font-bold text-neutral-900 pt-1">How We Use Your Information</h2>
                        </div>
                        <div className="pl-14 space-y-4 text-neutral-600 leading-relaxed">
                            <p>
                                Your personal information is used <strong className="text-neutral-800">strictly and exclusively</strong> for the following internal purposes:
                            </p>
                            <ul className="space-y-3">
                                {[
                                    'Customizing and tailoring your resume to match specific job descriptions',
                                    'Generating personalized cover letters for each application',
                                    'Submitting job applications on your behalf to employer portals and job boards',
                                    'Communicating with you regarding application status, updates, and service-related inquiries',
                                    'Managing your account, subscription, and credit balances',
                                    'Improving our internal processes and service quality',
                                ].map((item, i) => (
                                    <li key={i} className="flex items-start gap-3">
                                        <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </section>

                    {/* Section 3 - CRITICAL */}
                    <section className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl border-2 border-red-200 p-8 md:p-10 shadow-sm">
                        <div className="flex items-start gap-4 mb-6">
                            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                <span className="text-red-600 font-bold text-sm">3</span>
                            </div>
                            <h2 className="text-2xl font-bold text-neutral-900 pt-1">What We Will NEVER Do With Your Data</h2>
                        </div>
                        <div className="pl-14 space-y-4 text-neutral-600 leading-relaxed">
                            <p>
                                We take a <strong className="text-neutral-800">zero-tolerance stance</strong> against the misuse of your personal data. Under no circumstances will we:
                            </p>
                            <ul className="space-y-3">
                                {[
                                    { text: 'Sell, rent, lease, or trade your personal information to any third party — ever.', icon: '🚫' },
                                    { text: 'Forward, share, or disclose your data to recruiters, staffing agencies, or any external entities without your explicit written consent.', icon: '🔒' },
                                    { text: 'Use your data for marketing, advertising, or promotional purposes by third parties.', icon: '📵' },
                                    { text: 'Share your contact information (phone number, email) with employers or companies unless explicitly required as part of a job application you approved.', icon: '🛡️' },
                                    { text: 'Retain your data beyond the period necessary to fulfill our services, unless required by applicable law.', icon: '⏱️' },
                                ].map((item, i) => (
                                    <li key={i} className="flex items-start gap-3">
                                        <span className="text-lg flex-shrink-0" aria-hidden="true">{item.icon}</span>
                                        <span>{item.text}</span>
                                    </li>
                                ))}
                            </ul>
                            <div className="mt-6 p-4 bg-white/80 rounded-xl border border-red-100">
                                <p className="text-sm font-semibold text-red-700">
                                    ⚠️ Your data is your property. We act solely as a service provider operating under your instructions to apply for jobs on your behalf. Nothing more.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Section 4 */}
                    <section className="bg-white rounded-2xl border border-neutral-100 p-8 md:p-10 shadow-sm">
                        <div className="flex items-start gap-4 mb-6">
                            <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center flex-shrink-0">
                                <span className="text-purple-600 font-bold text-sm">4</span>
                            </div>
                            <h2 className="text-2xl font-bold text-neutral-900 pt-1">Data Security & Protection</h2>
                        </div>
                        <div className="pl-14 space-y-4 text-neutral-600 leading-relaxed">
                            <p>
                                We employ industry-standard security measures to protect your personal information from unauthorized access, alteration, disclosure, or destruction:
                            </p>
                            <div className="grid sm:grid-cols-2 gap-4 mt-4">
                                {[
                                    { title: 'Encrypted Storage', desc: 'All sensitive data is encrypted at rest and in transit using AES-256 and TLS 1.3 protocols.', icon: '🔐' },
                                    { title: 'Access Control', desc: 'Strict role-based access ensures only authorized team members can view your information.', icon: '👤' },
                                    { title: 'Secure Infrastructure', desc: 'Our systems are hosted on enterprise-grade cloud infrastructure with 24/7 monitoring.', icon: '🏢' },
                                    { title: 'Regular Audits', desc: 'We conduct periodic reviews of our data handling practices to maintain the highest security standards.', icon: '📋' },
                                ].map((item, i) => (
                                    <div key={i} className="p-4 bg-purple-50/50 rounded-xl border border-purple-100">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-lg" aria-hidden="true">{item.icon}</span>
                                            <h4 className="font-bold text-neutral-800 text-sm">{item.title}</h4>
                                        </div>
                                        <p className="text-sm text-neutral-500">{item.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* Section 5 */}
                    <section className="bg-white rounded-2xl border border-neutral-100 p-8 md:p-10 shadow-sm">
                        <div className="flex items-start gap-4 mb-6">
                            <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center flex-shrink-0">
                                <span className="text-teal-600 font-bold text-sm">5</span>
                            </div>
                            <h2 className="text-2xl font-bold text-neutral-900 pt-1">Cookies & Analytics</h2>
                        </div>
                        <div className="pl-14 space-y-4 text-neutral-600 leading-relaxed">
                            <p>
                                Our website may use essential cookies and basic analytics to improve user experience. These are limited to:
                            </p>
                            <ul className="space-y-3">
                                {[
                                    'Session cookies to maintain your login state and account security',
                                    'Analytics data (anonymized) to understand website usage patterns and improve our services',
                                    'Functional cookies necessary for the operation of our dashboard and tools',
                                ].map((item, i) => (
                                    <li key={i} className="flex items-start gap-3">
                                        <svg className="w-5 h-5 text-teal-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                            <p className="text-sm text-neutral-500 mt-2">
                                We do not use tracking cookies for advertising or retargeting purposes. No personal data is shared with third-party advertising platforms.
                            </p>
                        </div>
                    </section>

                    {/* Section 6 */}
                    <section className="bg-white rounded-2xl border border-neutral-100 p-8 md:p-10 shadow-sm">
                        <div className="flex items-start gap-4 mb-6">
                            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
                                <span className="text-amber-600 font-bold text-sm">6</span>
                            </div>
                            <h2 className="text-2xl font-bold text-neutral-900 pt-1">Your Rights</h2>
                        </div>
                        <div className="pl-14 space-y-4 text-neutral-600 leading-relaxed">
                            <p>
                                You have full control over your personal data. At any time, you may exercise the following rights:
                            </p>
                            <ul className="space-y-3">
                                {[
                                    { right: 'Right to Access', desc: 'Request a copy of all personal data we hold about you.' },
                                    { right: 'Right to Rectification', desc: 'Request corrections to any inaccurate or incomplete information.' },
                                    { right: 'Right to Erasure', desc: 'Request the deletion of your personal data from our systems ("right to be forgotten").' },
                                    { right: 'Right to Restrict Processing', desc: 'Request that we limit how we use your data under certain conditions.' },
                                    { right: 'Right to Data Portability', desc: 'Receive your data in a structured, commonly used format for transfer to another service.' },
                                    { right: 'Right to Withdraw Consent', desc: 'Withdraw your consent for data processing at any time without affecting the lawfulness of prior processing.' },
                                ].map((item, i) => (
                                    <li key={i} className="flex items-start gap-3">
                                        <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <div>
                                            <span className="font-semibold text-neutral-800">{item.right}:</span>{' '}
                                            <span>{item.desc}</span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                            <p className="text-sm text-neutral-500 mt-2">
                                To exercise any of these rights, please contact us using the information provided below. We will respond to your request within 30 business days.
                            </p>
                        </div>
                    </section>

                    {/* Section 7 */}
                    <section className="bg-white rounded-2xl border border-neutral-100 p-8 md:p-10 shadow-sm">
                        <div className="flex items-start gap-4 mb-6">
                            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0">
                                <span className="text-indigo-600 font-bold text-sm">7</span>
                            </div>
                            <h2 className="text-2xl font-bold text-neutral-900 pt-1">Third-Party Services</h2>
                        </div>
                        <div className="pl-14 space-y-4 text-neutral-600 leading-relaxed">
                            <p>
                                In the course of providing our services, we may interact with third-party job portals (e.g., LinkedIn, Indeed, Glassdoor, and company career pages) solely to submit applications on your behalf. We only share the information you have explicitly approved for each application.
                            </p>
                            <p>
                                We do not control the privacy practices of these external platforms and recommend reviewing their respective privacy policies. Our responsibility is limited to the data we handle directly.
                            </p>
                        </div>
                    </section>

                    {/* Section 8 */}
                    <section className="bg-white rounded-2xl border border-neutral-100 p-8 md:p-10 shadow-sm">
                        <div className="flex items-start gap-4 mb-6">
                            <div className="w-10 h-10 bg-cyan-50 rounded-xl flex items-center justify-center flex-shrink-0">
                                <span className="text-cyan-600 font-bold text-sm">8</span>
                            </div>
                            <h2 className="text-2xl font-bold text-neutral-900 pt-1">Data Retention</h2>
                        </div>
                        <div className="pl-14 space-y-4 text-neutral-600 leading-relaxed">
                            <p>
                                We retain your personal data only for as long as necessary to fulfill the purposes outlined in this policy or as required by applicable law. Specifically:
                            </p>
                            <ul className="space-y-3">
                                {[
                                    'Active account data is retained for the duration of your subscription and service engagement.',
                                    'After account termination or service completion, we retain data for a maximum of 90 days to handle any follow-up inquiries or disputes.',
                                    'Upon request, we will permanently delete all your personal data within 30 business days, subject to any legal retention obligations.',
                                ].map((item, i) => (
                                    <li key={i} className="flex items-start gap-3">
                                        <svg className="w-5 h-5 text-cyan-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </section>

                    {/* Section 9 */}
                    <section className="bg-white rounded-2xl border border-neutral-100 p-8 md:p-10 shadow-sm">
                        <div className="flex items-start gap-4 mb-6">
                            <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center flex-shrink-0">
                                <span className="text-rose-600 font-bold text-sm">9</span>
                            </div>
                            <h2 className="text-2xl font-bold text-neutral-900 pt-1">Changes to This Policy</h2>
                        </div>
                        <div className="pl-14 space-y-4 text-neutral-600 leading-relaxed">
                            <p>
                                We may update this Privacy Policy from time to time to reflect changes in our practices, technology, or legal requirements. We will notify you of any material changes by:
                            </p>
                            <ul className="space-y-3">
                                {[
                                    'Posting the updated policy on this page with a revised "Last Updated" date',
                                    'Sending you a notification via email or through your dashboard for significant changes',
                                ].map((item, i) => (
                                    <li key={i} className="flex items-start gap-3">
                                        <svg className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                        </svg>
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                            <p className="text-sm text-neutral-500 mt-2">
                                We encourage you to review this page periodically to stay informed about how we protect your information.
                            </p>
                        </div>
                    </section>

                    {/* Section 10 - Contact */}
                    <section className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-8 md:p-10 shadow-xl text-white">
                        <div className="flex items-start gap-4 mb-6">
                            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0 border border-white/30">
                                <span className="text-white font-bold text-sm">10</span>
                            </div>
                            <h2 className="text-2xl font-bold pt-1">Contact Us</h2>
                        </div>
                        <div className="pl-14 space-y-4 text-blue-100 leading-relaxed">
                            <p>
                                If you have any questions, concerns, or requests regarding this Privacy Policy or your personal data, please do not hesitate to reach out:
                            </p>
                            <div className="grid sm:grid-cols-2 gap-4 mt-4">
                                <div className="p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                                    <div className="flex items-center gap-2 mb-2">
                                        <svg className="w-5 h-5 text-blue-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                        <span className="text-sm font-semibold text-white">Email</span>
                                    </div>
                                    <a href="mailto:krishna@resumetojobs.com" className="text-sm text-blue-200 hover:text-white transition-colors">
                                        krishna@resumetojobs.com
                                    </a>
                                </div>
                                <div className="p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                                    <div className="flex items-center gap-2 mb-2">
                                        <svg className="w-5 h-5 text-blue-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                        </svg>
                                        <span className="text-sm font-semibold text-white">WhatsApp</span>
                                    </div>
                                    <a
                                        href="https://api.whatsapp.com/send/?phone=919493063818&text=Hi+I+have+a+question+about+the+privacy+policy&type=phone_number&app_absent=0"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-blue-200 hover:text-white transition-colors"
                                    >
                                        +91 94930 63818
                                    </a>
                                </div>
                            </div>
                            <div className="mt-6 p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                                <p className="text-sm font-semibold text-white mb-1">Business Entity</p>
                                <p className="text-sm text-blue-200">
                                    ResumeToJobs<br />
                                    Website: <a href="https://resumetojobs.com" className="underline hover:text-white transition-colors">resumetojobs.com</a>
                                </p>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Bottom Notice */}
                <div className="mt-16 text-center">
                    <div className="inline-flex items-center gap-3 px-6 py-3 bg-green-50 rounded-full border border-green-200">
                        <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        <span className="text-sm font-semibold text-green-700">Your data is safe with us. Always.</span>
                    </div>
                </div>

                {/* Footer */}
                <footer className="mt-16 pt-8 border-t border-neutral-200 text-center">
                    <p className="text-sm text-neutral-400">
                        © {new Date().getFullYear()} ResumeToJobs. All rights reserved.
                    </p>
                    <div className="mt-4 flex items-center justify-center gap-6">
                        <Link href="/" className="text-sm text-neutral-500 hover:text-blue-600 transition-colors">
                            Home
                        </Link>
                        <Link href="/blog" className="text-sm text-neutral-500 hover:text-blue-600 transition-colors">
                            Blog
                        </Link>
                        <Link href="/tools" className="text-sm text-neutral-500 hover:text-blue-600 transition-colors">
                            Free Tools
                        </Link>
                    </div>
                </footer>
            </main>
        </div>
    );
}

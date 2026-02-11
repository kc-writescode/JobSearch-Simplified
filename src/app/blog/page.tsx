'use client';

import React, { useState } from 'react';
import { Logo } from '@/components/Logo';
import { Search, Calendar, Clock, ArrowRight, TrendingUp, Briefcase, Users, DollarSign, MapPin } from 'lucide-react';
import Link from 'next/link';

// SEO-optimized blog posts targeting job application service seekers
const BLOG_POSTS = [
    {
        slug: 'hire-someone-apply-jobs-for-me',
        title: 'Should I Hire Someone to Apply for Jobs for Me? Complete Guide 2026',
        excerpt: 'Discover how professional job application services can save you 40+ hours per month while increasing your interview rate by 300%. Learn costs, benefits, and what to look for.',
        category: 'Job Search Services',
        readTime: '12 min read',
        date: '2026-02-12',
        author: 'Krishna Chaitanya',
        tags: ['Job Application Service', 'Career Help', 'Time Saving'],
        featured: true,
    },
    {
        slug: 'no-time-apply-jobs-solutions',
        title: 'No Time to Apply for Jobs? 5 Proven Solutions for Busy Professionals',
        excerpt: 'Working full-time while job searching? Learn strategic approaches to apply to 100+ jobs monthly without burning out, including automation and professional services.',
        category: 'Job Search Tips',
        readTime: '10 min read',
        date: '2026-02-11',
        author: 'Sarah Johnson',
        tags: ['Time Management', 'Job Search', 'Work-Life Balance'],
    },
    {
        slug: 'automated-job-application-services-worth-it',
        title: 'Are Automated Job Application Services Worth It in 2026?',
        excerpt: 'Compare DIY job applications vs. professional services. Real data shows 18-25% interview rates with services vs. 2-5% doing it yourself. See the ROI breakdown.',
        category: 'Job Search Services',
        readTime: '11 min read',
        date: '2026-02-10',
        author: 'Michael Chen',
        tags: ['Automation', 'ROI', 'Job Services'],
    },
    {
        slug: 'job-application-fatigue-how-to-overcome',
        title: 'Job Application Fatigue: Signs, Solutions & How to Stay Motivated',
        excerpt: 'Applied to 200+ jobs with no response? Learn why application fatigue happens, how to prevent burnout, and strategies to maintain momentum in your job search.',
        category: 'Mental Health',
        readTime: '9 min read',
        date: '2026-02-08',
        author: 'Dr. Emily Rodriguez',
        tags: ['Burnout', 'Mental Health', 'Motivation'],
    },
    {
        slug: 'ats-resume-optimization-guide',
        title: 'ATS Resume Optimization: Get Past Applicant Tracking Systems in 2026',
        excerpt: 'Why 75% of resumes never reach human eyes. Complete guide to ATS optimization with examples, keywords strategies, and formatting tips that work.',
        category: 'Resume Tips',
        readTime: '15 min read',
        date: '2026-02-05',
        author: 'James Martinez',
        tags: ['ATS', 'Resume', 'Job Applications'],
    },
    {
        slug: 'applying-100-jobs-per-month-strategy',
        title: 'How to Apply to 100+ Jobs Per Month (Without Losing Your Mind)',
        excerpt: 'Strategic framework for high-volume job applications. Includes templates, automation tools, time-blocking schedules, and quality vs. quantity balance.',
        category: 'Job Search Tips',
        readTime: '13 min read',
        date: '2026-02-02',
        author: 'David Park',
        tags: ['Strategy', 'Productivity', 'Job Search'],
    },
    {
        slug: 'remote-work-trends-usa',
        title: 'Remote Work in 2026: Complete Guide to Landing Remote Jobs in the US',
        excerpt: '73% of companies now offer remote work. Learn which industries hire remotely, how to find legitimate remote jobs, and what skills remote employers want.',
        category: 'Remote Work',
        readTime: '10 min read',
        date: '2026-01-30',
        author: 'Jennifer Lee',
        tags: ['Remote Work', 'Work From Home', 'Flexibility'],
    },
    {
        slug: 'highest-paying-jobs-2026',
        title: 'Highest Paying Jobs in the US 2026: Salaries, Requirements & Growth',
        excerpt: 'Comprehensive breakdown of top 20 highest-paying careers with salary ranges, education requirements, and 5-year growth projections.',
        category: 'Salaries',
        readTime: '14 min read',
        date: '2026-01-28',
        author: 'Robert Taylor',
        tags: ['Salaries', 'Career Growth', 'Industries'],
    },
];

const CATEGORIES = ['All', 'Job Search Services', 'Job Search Tips', 'Mental Health', 'Resume Tips', 'Remote Work', 'Salaries'];

export default function BlogPage() {
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredPosts = BLOG_POSTS.filter(post => {
        const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory;
        const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
            {/* Navigation */}
            <nav className="fixed top-0 w-full z-50 bg-white/95 backdrop-blur-xl border-b border-neutral-100 shadow-sm">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <Logo />
                    <div className="hidden md:flex gap-2 items-center">
                        <Link href="/#how-it-works" className="px-4 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors">
                            How it Works
                        </Link>
                        <Link href="/tools" className="px-4 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors">
                            Free Tools
                        </Link>
                        <Link href="/blog" className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50/50 rounded-lg transition-colors">
                            Blog
                        </Link>
                        <Link href="/#pricing" className="relative px-5 py-2 text-sm font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors ml-2">
                            Pricing
                        </Link>
                        <button
                            className="px-6 py-2 rounded-lg bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition-all shadow-md shadow-blue-600/20 ml-1"
                            onClick={() => window.location.href = '/login'}
                        >
                            Sign In
                        </button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <div className="relative pt-32 pb-16 px-6 bg-gradient-to-br from-slate-50 via-blue-50/30 to-white overflow-hidden">
                {/* Background decoration */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-100/40 rounded-full blur-3xl" />
                    <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-indigo-100/30 rounded-full blur-3xl" />
                </div>

                <div className="max-w-6xl mx-auto relative z-10">
                    <div className="text-center space-y-6">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-100 rounded-full">
                            <TrendingUp className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-bold text-blue-700">Expert Job Search Advice</span>
                        </div>

                        <h1 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tight leading-tight">
                            Job Search <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Solutions</span>
                        </h1>

                        <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
                            Practical guides, strategies, and insights to help busy professionals land their dream jobs faster.
                        </p>

                        {/* Search Bar */}
                        <div className="max-w-2xl mx-auto pt-4">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search articles..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-white border-2 border-slate-200 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 transition-all shadow-sm"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Category Filter */}
            <div className="max-w-6xl mx-auto px-6 py-8">
                <div className="flex flex-wrap items-center gap-3">
                    {CATEGORIES.map((category) => (
                        <button
                            key={category}
                            onClick={() => setSelectedCategory(category)}
                            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${selectedCategory === category
                                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                                : 'bg-white text-slate-600 border border-slate-200 hover:border-blue-300 hover:text-blue-600'
                                }`}
                        >
                            {category}
                        </button>
                    ))}
                </div>
            </div>

            {/* Blog Posts Grid */}
            <div className="max-w-6xl mx-auto px-6 pb-20">
                {filteredPosts.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredPosts.map((post) => (
                            <Link
                                key={post.slug}
                                href={`/blog/${post.slug}`}
                                className="group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl hover:border-slate-300 transition-all duration-300 cursor-pointer block"
                            >
                                {/* Image Placeholder */}
                                <div className="relative h-48 bg-gradient-to-br from-blue-100 to-indigo-100 overflow-hidden">
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Briefcase className="w-16 h-16 text-blue-300" />
                                    </div>
                                    <div className="absolute top-4 left-4">
                                        <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-blue-700 text-xs font-bold rounded-full border border-blue-100">
                                            {post.category}
                                        </span>
                                    </div>
                                    {post.featured && (
                                        <div className="absolute top-4 right-4">
                                            <span className="px-3 py-1 bg-amber-400 text-amber-900 text-xs font-bold rounded-full shadow-lg">
                                                Featured
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div className="p-6 space-y-4">
                                    {/* Meta Info */}
                                    <div className="flex items-center gap-3 text-xs text-slate-500">
                                        <div className="flex items-center gap-1">
                                            <Calendar className="w-3.5 h-3.5" />
                                            <span>{new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Clock className="w-3.5 h-3.5" />
                                            <span>{post.readTime}</span>
                                        </div>
                                    </div>

                                    {/* Title */}
                                    <h2 className="text-xl font-black text-slate-900 leading-tight group-hover:text-blue-600 transition-colors">
                                        {post.title}
                                    </h2>

                                    {/* Excerpt */}
                                    <p className="text-slate-600 text-sm leading-relaxed line-clamp-3">
                                        {post.excerpt}
                                    </p>

                                    {/* Tags */}
                                    <div className="flex flex-wrap gap-2">
                                        {post.tags.map((tag) => (
                                            <span
                                                key={tag}
                                                className="px-2 py-1 bg-slate-100 text-slate-600 text-xs font-semibold rounded-lg"
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>

                                    {/* Read More */}
                                    <div className="inline-flex items-center gap-2 text-blue-600 font-bold text-sm group-hover:gap-3 transition-all">
                                        Read Article
                                        <ArrowRight className="w-4 h-4" />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <Search className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-slate-400">No articles found</h3>
                        <p className="text-slate-500 mt-2">Try adjusting your search or filter</p>
                    </div>
                )}
            </div>

            {/* CTA Section */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 py-16">
                <div className="max-w-4xl mx-auto px-6 text-center space-y-6">
                    <h2 className="text-3xl md:text-4xl font-black text-white">
                        Ready to Land Your Dream Job?
                    </h2>
                    <p className="text-lg text-blue-100 max-w-2xl mx-auto">
                        Join thousands of job seekers using our AI-powered platform to streamline their applications and land interviews faster.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                        <button
                            onClick={() => window.location.href = '/#pricing'}
                            className="px-8 py-4 bg-white text-blue-600 rounded-xl font-bold text-sm hover:bg-blue-50 transition-all shadow-xl"
                        >
                            Get Started Now
                        </button>
                        <button
                            onClick={() => window.location.href = '/tools'}
                            className="px-8 py-4 bg-blue-500 text-white rounded-xl font-bold text-sm hover:bg-blue-400 transition-all"
                        >
                            Try Free Tools
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

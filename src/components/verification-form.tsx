'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { ShieldCheck, Loader2 } from 'lucide-react';

interface VerificationFormProps {
    initialData: {
        full_name: string | null;
        linkedin_url: string | null;
        github_url: string | null;
    };
}

export function VerificationForm({ initialData }: VerificationFormProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState(initialData);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (!res.ok) throw new Error('Update failed');

            toast.success('Clearance request submitted. A System Master will review your credentials.');
        } catch (error) {
            toast.error('Failed to submit credentials');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="mt-8 space-y-4 text-left border-t border-slate-100 pt-8">
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">Identity Verification Details</p>

            <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Full Name</label>
                <input
                    type="text"
                    value={formData.full_name || ''}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full mt-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-400 transition-all font-medium"
                    placeholder="Legal Identity"
                    required
                />
            </div>

            <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">LinkedIn Profile (Optional)</label>
                <input
                    type="url"
                    value={formData.linkedin_url || ''}
                    onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                    className="w-full mt-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-400 transition-all font-medium"
                    placeholder="https://linkedin.com/in/..."
                />
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full bg-slate-900 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-xl shadow-slate-200"
            >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                Request Verification
            </button>
        </form>
    );
}

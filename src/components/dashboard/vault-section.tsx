'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { FileText, Plus, X, Upload, Loader2, ClipboardList, ShieldCheck } from 'lucide-react';

interface Certification {
    name: string;
    date: string;
    url: string;
}

interface VaultSectionProps {
    initialCertifications?: Certification[];
    initialNotes?: string;
    onUpdate?: () => void;
}

export function VaultSection({ initialCertifications = [], initialNotes = '', onUpdate }: VaultSectionProps) {
    const [certs, setCerts] = useState<Certification[]>(initialCertifications);
    const [notes, setNotes] = useState(initialNotes);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const supabase = createClient();

    const handleAddCert = () => {
        setCerts([...certs, { name: '', date: '', url: '' }]);
    };

    const handleRemoveCert = (index: number) => {
        setCerts(certs.filter((_, i) => i !== index));
    };

    const handleCertChange = (index: number, field: keyof Certification, value: string) => {
        const newCerts = [...certs];
        newCerts[index] = { ...newCerts[index], [field]: value };
        setCerts(newCerts);
    };

    const handleFileUpload = async (index: number, file: File) => {
        if (!file) return;
        setIsUploading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const fileExt = file.name.split('.').pop();
            const filePath = `${user.id}/certs/${Date.now()}_cert.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('resumes') // Reusing resumes bucket for now, or create new 'vault'
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // Store the storage path — the bucket is private, so use the
            // /api/resume/view endpoint to serve files on demand.
            handleCertChange(index, 'url', filePath);
            toast.success('Certification uploaded!');
        } catch (error: any) {
            toast.error('Upload failed: ' + error.message);
        } finally {
            setIsUploading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            // Update profiles
            const { error: profileError } = await (supabase
                .from('profiles') as any)
                .update({
                    certifications: certs,
                    global_notes: notes,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id);

            if (profileError) throw profileError;

            // Update client_notes in all "Applying" jobs for this user (convenience)
            // Actually, user wants a place to "give notes/inputs". 
            // Maybe we store a "global_notes" in profile personal_details? 
            // Or just a separate field in profiles?
            // For now, let's update a common field.

            toast.success('Vault updated successfully!');
            onUpdate?.();
        } catch (error: any) {
            toast.error('Save failed: ' + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
            {/* Header */}
            <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
                <div className="flex items-center gap-4 mb-2">
                    <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-200">
                        <ShieldCheck className="h-6 w-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Client Vault</h2>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Store your assets and instructions for deployment agents</p>
                    </div>
                </div>
            </div>

            {/* Main Notes */}
            <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-6">
                <div className="flex items-center gap-3 px-2">
                    <ClipboardList className="h-5 w-5 text-blue-500" />
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Global Deployment Notes</h3>
                </div>
                <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Enter any specific instructions for the Virtual Assistants who will be applying on your behalf (e.g. 'Always prioritize remote roles', 'Don't apply to Amazon', etc.)"
                    className="w-full min-h-[150px] p-6 bg-slate-50 border border-slate-200 rounded-[1.5rem] text-[13px] font-semibold focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-400 transition-all placeholder:text-slate-400 leading-relaxed"
                />
            </div>

            {/* Certifications */}
            <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-6">
                <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-blue-500" />
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Certifications & Assets</h3>
                    </div>
                    <button
                        onClick={handleAddCert}
                        className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-100 transition-all flex items-center gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        Add Asset
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {certs.map((cert, index) => (
                        <div key={index} className="p-6 bg-slate-50 border border-slate-100 rounded-[1.5rem] relative group transition-all hover:bg-white hover:border-blue-100 hover:shadow-md">
                            <button
                                onClick={() => handleRemoveCert(index)}
                                className="absolute top-4 right-4 p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Asset Name</label>
                                    <input
                                        type="text"
                                        value={cert.name}
                                        onChange={(e) => handleCertChange(index, 'name', e.target.value)}
                                        placeholder="e.g. AWS Solutions Architect"
                                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-100"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Issue Date</label>
                                    <input
                                        type="text"
                                        value={cert.date}
                                        onChange={(e) => handleCertChange(index, 'date', e.target.value)}
                                        placeholder="e.g. Jan 2024"
                                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-100"
                                    />
                                </div>
                            </div>

                            <div className="mt-6 flex items-center gap-4">
                                <div className="flex-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Asset URL / Link</label>
                                    <input
                                        type="text"
                                        value={cert.url}
                                        onChange={(e) => handleCertChange(index, 'url', e.target.value)}
                                        placeholder="https://..."
                                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-100"
                                    />
                                </div>
                                <div className="pt-6">
                                    <label className="cursor-pointer bg-slate-900 text-white px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-blue-600 transition-all shadow-lg active:scale-95 disabled:opacity-50">
                                        <input
                                            type="file"
                                            className="hidden"
                                            onChange={(e) => e.target.files?.[0] && handleFileUpload(index, e.target.files[0])}
                                            disabled={isUploading}
                                        />
                                        {isUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                                        {cert.url ? 'Replace File' : 'Upload PDF'}
                                    </label>
                                </div>
                            </div>
                        </div>
                    ))}

                    {certs.length === 0 && (
                        <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-[2rem]">
                            <p className="text-sm font-bold text-slate-300 uppercase tracking-widest">No assets added yet.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Floating Save Button */}
            <div className="fixed bottom-8 left-0 right-0 lg:left-64 z-50 flex justify-center pointer-events-none px-6">
                <div className="pointer-events-auto bg-white shadow-2xl border border-slate-200 p-2 rounded-full flex items-center gap-4">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-slate-900 text-white px-10 py-4 rounded-full text-xs font-black uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center gap-3 disabled:opacity-50"
                    >
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4 text-blue-400" />}
                        {isSaving ? 'Updating Vault...' : 'Save Vault & Notes'}
                    </button>
                </div>
            </div>
        </div>
    );
}

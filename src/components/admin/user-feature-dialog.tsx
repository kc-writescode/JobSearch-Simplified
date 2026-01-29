'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  FileText,
  Sparkles,
  CreditCard,
  Plus,
  Minus,
  Shield,
  Loader2,
} from 'lucide-react';

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: 'user' | 'admin' | 'master';
  is_verified: boolean;
  plan: string;
  feature_access?: {
    cover_letter_enabled: boolean;
    resume_tailor_enabled: boolean;
  };
  credits?: number;
}

interface UserFeatureDialogProps {
  user: UserProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (userId: string, updates: Partial<UserProfile>) => void;
}

export function UserFeatureDialog({
  user,
  open,
  onOpenChange,
  onUpdate,
}: UserFeatureDialogProps) {
  const [coverLetterEnabled, setCoverLetterEnabled] = useState(false);
  const [resumeTailorEnabled, setResumeTailorEnabled] = useState(false);
  const [credits, setCredits] = useState(0);
  const [creditsToAdd, setCreditsToAdd] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Sync state when user changes
  useEffect(() => {
    if (user) {
      setCoverLetterEnabled(user.feature_access?.cover_letter_enabled ?? false);
      setResumeTailorEnabled(user.feature_access?.resume_tailor_enabled ?? false);
      setCredits(user.credits ?? 0);
      setCreditsToAdd('');
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);

    try {
      const response = await fetch(`/api/admin/users/${user.id}/features`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feature_access: {
            cover_letter_enabled: coverLetterEnabled,
            resume_tailor_enabled: resumeTailorEnabled,
          },
          credits,
        }),
      });

      if (!response.ok) throw new Error('Failed to update user features');

      const result = await response.json();

      onUpdate(user.id, {
        feature_access: {
          cover_letter_enabled: coverLetterEnabled,
          resume_tailor_enabled: resumeTailorEnabled,
        },
        credits,
      });

      toast.success('User features updated successfully');
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating user features:', error);
      toast.error('Failed to update user features');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddCredits = () => {
    const amount = parseInt(creditsToAdd, 10);
    if (!isNaN(amount) && amount > 0) {
      setCredits(prev => prev + amount);
      setCreditsToAdd('');
    }
  };

  const handleRemoveCredits = () => {
    const amount = parseInt(creditsToAdd, 10);
    if (!isNaN(amount) && amount > 0) {
      setCredits(prev => Math.max(0, prev - amount));
      setCreditsToAdd('');
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-slate-600" />
            Feature Access Control
          </DialogTitle>
          <DialogDescription>
            Manage feature access and credits for{' '}
            <span className="font-semibold text-slate-900">
              {user.full_name || user.email}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Feature Toggles */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Feature Access
            </h4>

            {/* Cover Letter Generator Toggle */}
            <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${coverLetterEnabled ? 'bg-emerald-100' : 'bg-slate-200'}`}>
                  <FileText className={`h-5 w-5 ${coverLetterEnabled ? 'text-emerald-600' : 'text-slate-400'}`} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Cover Letter Generator</p>
                  <p className="text-[10px] text-slate-500">AI-powered cover letter creation</p>
                </div>
              </div>
              <button
                onClick={() => setCoverLetterEnabled(!coverLetterEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  coverLetterEnabled ? 'bg-emerald-500' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                    coverLetterEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Resume Tailor Toggle */}
            <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${resumeTailorEnabled ? 'bg-blue-100' : 'bg-slate-200'}`}>
                  <Sparkles className={`h-5 w-5 ${resumeTailorEnabled ? 'text-blue-600' : 'text-slate-400'}`} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Resume Tailor</p>
                  <p className="text-[10px] text-slate-500">AI-powered resume customization</p>
                </div>
              </div>
              <button
                onClick={() => setResumeTailorEnabled(!resumeTailorEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  resumeTailorEnabled ? 'bg-blue-500' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                    resumeTailorEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Credits Management */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Application Credits
            </h4>

            <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100 rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 rounded-xl">
                    <CreditCard className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Current Balance</p>
                    <p className="text-[10px] text-slate-500">Jobs that can be submitted</p>
                  </div>
                </div>
                <div className="text-3xl font-black text-amber-600">
                  {credits}
                </div>
              </div>

              <div className="flex gap-2">
                <Input
                  type="number"
                  min="1"
                  placeholder="Amount"
                  value={creditsToAdd}
                  onChange={(e) => setCreditsToAdd(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCredits();
                    }
                  }}
                  className="flex-1 text-center font-bold"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddCredits}
                  disabled={!creditsToAdd || isNaN(parseInt(creditsToAdd, 10)) || parseInt(creditsToAdd, 10) <= 0}
                  className="px-3 border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRemoveCredits}
                  disabled={!creditsToAdd || isNaN(parseInt(creditsToAdd, 10)) || parseInt(creditsToAdd, 10) <= 0 || credits === 0}
                  className="px-3 border-red-200 text-red-600 hover:bg-red-50"
                >
                  <Minus className="h-4 w-4" />
                </Button>
              </div>

              {/* Quick add buttons */}
              <div className="flex gap-2 mt-3">
                {[10, 25, 50, 100].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setCredits(prev => prev + amount)}
                    className="flex-1 py-1.5 text-[10px] font-black uppercase tracking-widest bg-white border border-amber-200 rounded-lg text-amber-700 hover:bg-amber-50 transition-colors"
                  >
                    +{amount}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 bg-slate-900 hover:bg-slate-800"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

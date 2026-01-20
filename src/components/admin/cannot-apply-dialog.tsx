'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { VACoreTask } from '@/types/admin.types';
import { Loader2, AlertTriangle } from 'lucide-react';

interface CannotApplyDialogProps {
  task: VACoreTask | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => Promise<void>;
}

const PRESET_REASONS = [
  'Job posting expired',
  'Application requires login/account',
  'Missing required information',
  'Job location mismatch',
  'Duplicate posting',
];

export function CannotApplyDialog({
  task,
  open,
  onOpenChange,
  onConfirm,
}: CannotApplyDialogProps) {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleClose = () => {
    setReason('');
    setError('');
    onOpenChange(false);
  };

  const handleConfirm = async () => {
    if (reason.trim().length < 10) {
      setError('Please provide a reason with at least 10 characters');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await onConfirm(reason.trim());
      handleClose();
    } catch (err) {
      setError('Failed to mark as cannot apply. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePresetClick = (preset: string) => {
    setReason(preset);
    setError('');
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Cannot Apply
          </DialogTitle>
          <DialogDescription>
            {task && (
              <span className="text-slate-600">
                Mark <strong>{task.jobTitle}</strong> at <strong>{task.company}</strong> as cannot apply
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Quick Select
            </label>
            <div className="flex flex-wrap gap-2 mt-2">
              {PRESET_REASONS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handlePresetClick(preset)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                    reason === preset
                      ? 'bg-red-50 border-red-200 text-red-700'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setError('');
              }}
              placeholder="Please provide a reason why this job cannot be applied to..."
              rows={3}
              className="w-full mt-2 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-300 resize-none"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Minimum 10 characters ({reason.length}/10)
            </p>
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting || reason.trim().length < 10}
            className="px-4 py-2 text-sm font-bold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Confirm'
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

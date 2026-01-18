'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface ProfileData {
  full_name: string | null;
  email: string;
  phone?: string | null;
  linkedin_url?: string | null;
  github_url?: string | null;
}

interface ProfileCardProps {
  profile: ProfileData;
  onUpdate?: () => void;
}

export function ProfileCard({ profile, onUpdate }: ProfileCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: profile.full_name || '',
    phone: profile.phone || '',
    linkedin_url: profile.linkedin_url || '',
    github_url: profile.github_url || '',
  });

  const supabase = createClient();

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await (supabase
        .from('profiles') as any)
        .update({
          full_name: formData.full_name || null,
          phone: formData.phone || null,
          linkedin_url: formData.linkedin_url || null,
          github_url: formData.github_url || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;
      setIsEditing(false);
      onUpdate?.();
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const displayName = profile.full_name || 'Add your name';
  const initials = profile.full_name?.[0]?.toUpperCase() || profile.email[0].toUpperCase();

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header - Always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-sm font-semibold text-blue-600">{initials}</span>
          </div>
          <div className="text-left">
            <p className="font-medium text-gray-900">{displayName}</p>
            <p className="text-sm text-gray-500">{profile.email}</p>
          </div>
        </div>
        <ChevronIcon className={`h-5 w-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-100">
          {isEditing ? (
            <div className="space-y-3 pt-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Full Name</label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="(555) 123-4567"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">LinkedIn URL</label>
                <input
                  type="url"
                  value={formData.linkedin_url}
                  onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://linkedin.com/in/johndoe"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">GitHub URL</label>
                <input
                  type="url"
                  value={formData.github_url}
                  onChange={(e) => setFormData({ ...formData, github_url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://github.com/johndoe"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          ) : (
            <div className="pt-4 space-y-2">
              {profile.phone && (
                <p className="text-sm text-gray-600">
                  <span className="text-gray-400">Phone:</span> {profile.phone}
                </p>
              )}
              {profile.linkedin_url && (
                <p className="text-sm text-gray-600">
                  <span className="text-gray-400">LinkedIn:</span>{' '}
                  <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    {profile.linkedin_url.replace('https://linkedin.com/in/', '')}
                  </a>
                </p>
              )}
              {profile.github_url && (
                <p className="text-sm text-gray-600">
                  <span className="text-gray-400">GitHub:</span>{' '}
                  <a href={profile.github_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    {profile.github_url.replace('https://github.com/', '@')}
                  </a>
                </p>
              )}
              <button
                onClick={() => setIsEditing(true)}
                className="mt-3 text-sm text-blue-600 hover:text-blue-700"
              >
                Edit Profile
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6"/>
    </svg>
  );
}

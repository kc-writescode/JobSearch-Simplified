import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your account settings</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Account section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Account</h2>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-500">Email</label>
              <p className="text-gray-900">{user.email}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">User ID</label>
              <p className="text-gray-900 font-mono text-sm">{user.id}</p>
            </div>
          </div>
        </div>

        {/* Danger zone */}
        <div className="bg-white rounded-lg border border-red-200 p-6">
          <h2 className="text-lg font-medium text-red-900 mb-4">Danger Zone</h2>
          <p className="text-sm text-gray-600 mb-4">
            These actions are irreversible. Please proceed with caution.
          </p>
          <button
            className="px-4 py-2 text-sm text-red-600 border border-red-300 rounded-md hover:bg-red-50"
            disabled
          >
            Delete Account (Coming Soon)
          </button>
        </div>
      </div>
    </div>
  );
}

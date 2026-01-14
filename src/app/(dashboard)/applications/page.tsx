import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  submitted: 'bg-blue-100 text-blue-700',
  under_review: 'bg-yellow-100 text-yellow-700',
  interview_scheduled: 'bg-purple-100 text-purple-700',
  interviewed: 'bg-indigo-100 text-indigo-700',
  offer_received: 'bg-green-100 text-green-700',
  accepted: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-700',
  withdrawn: 'bg-gray-100 text-gray-500',
};

export default async function ApplicationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: applications } = await supabase
    .from('applications')
    .select(`
      *,
      job:jobs(title, company)
    `)
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Applications</h1>
        <p className="text-gray-500">Track your job applications</p>
      </div>

      {applications && applications.length > 0 ? (
        <div className="space-y-4">
          {applications.map((app) => (
            <Card key={app.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {(app.job as any)?.title || 'Unknown Job'}
                    </CardTitle>
                    <p className="text-sm text-gray-500">
                      {(app.job as any)?.company || 'Unknown Company'}
                    </p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusColors[app.status] || 'bg-gray-100'}`}>
                    {app.status.replace('_', ' ')}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  {app.applied_at && (
                    <span>Applied: {new Date(app.applied_at).toLocaleDateString()}</span>
                  )}
                  <span>Created: {new Date(app.created_at).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-gray-500">No applications yet</p>
            <p className="mt-2 text-sm text-gray-400">
              Start by adding jobs and creating applications
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

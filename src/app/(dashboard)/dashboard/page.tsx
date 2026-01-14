import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch stats
  const [resumesResult, jobsResult, applicationsResult] = await Promise.all([
    supabase.from('resumes').select('id', { count: 'exact' }).eq('user_id', user!.id),
    supabase.from('jobs').select('id', { count: 'exact' }).eq('user_id', user!.id),
    supabase.from('applications').select('id', { count: 'exact' }).eq('user_id', user!.id),
  ]);

  const stats = [
    { name: 'Resumes', value: resumesResult.count || 0 },
    { name: 'Jobs Saved', value: jobsResult.count || 0 },
    { name: 'Applications', value: applicationsResult.count || 0 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Welcome back! Here&apos;s your job search overview.</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.name}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                {stat.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <a
            href="/resume"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Upload Resume
          </a>
          <a
            href="/jobs"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Add Job
          </a>
        </CardContent>
      </Card>
    </div>
  );
}

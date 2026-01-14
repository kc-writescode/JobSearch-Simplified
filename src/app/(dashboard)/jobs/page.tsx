import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default async function JobsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: jobs } = await supabase
    .from('jobs')
    .select('*')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Jobs</h1>
          <p className="text-gray-500">Track job opportunities</p>
        </div>
        <Link
          href="/jobs/new"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Add Job
        </Link>
      </div>

      {jobs && jobs.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job) => (
            <Card key={job.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{job.title}</CardTitle>
                <p className="text-sm text-gray-500">{job.company}</p>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-700">
                    {job.job_type?.replace('_', ' ')}
                  </span>
                  <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700">
                    {job.work_mode}
                  </span>
                </div>
                {job.location && (
                  <p className="mt-2 text-sm text-gray-500">{job.location}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-gray-500">No jobs saved yet</p>
            <Link
              href="/jobs/new"
              className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Add Your First Job
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

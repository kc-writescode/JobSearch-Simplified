import { redirect } from 'next/navigation';

// Redirect to unified dashboard - applications tracking is now integrated in jobs pipeline
export default function ApplicationsPage() {
  redirect('/dashboard');
}

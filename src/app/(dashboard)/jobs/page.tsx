import { redirect } from 'next/navigation';

// Redirect to unified dashboard - jobs pipeline is now integrated there
export default function JobsPage() {
  redirect('/dashboard');
}

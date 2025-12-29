import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { Header } from '@/components/layout/header';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
	const { userId } = await auth();

	if (!userId) {
		redirect('/sign-in');
	}

	return (
		<div className="min-h-screen bg-background">
			<Header />
			<main className="container mx-auto px-4 py-8">{children}</main>
		</div>
	);
}

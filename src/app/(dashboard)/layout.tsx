import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
	const { userId } = await auth();

	if (!userId) {
		redirect('/sign-in');
	}

	return (
		<div className="flex min-h-screen flex-col bg-background">
			<Header />
			<main className="container mx-auto flex-grow px-4 py-8">{children}</main>
			<Footer />
		</div>
	);
}

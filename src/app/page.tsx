import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';
import { Button } from '@/components/ui/button';
import { Trophy } from 'lucide-react';
import { redirect } from 'next/navigation';

export default async function LandingPage() {
	const { userId } = await auth();

	if (userId) {
		redirect('/standings');
	}

	return (
		<div className="flex min-h-screen flex-col items-center justify-center bg-background">
			<div className="text-center space-y-6">
				<div className="flex items-center justify-center gap-3">
					<Trophy className="h-12 w-12" />
					<h1 className="text-4xl font-bold">FF Data</h1>
				</div>
				<p className="text-xl text-muted-foreground max-w-md">
					Visualize and analyze your ESPN fantasy football league history
				</p>
				<div className="flex gap-4 justify-center">
					<Button asChild size="lg">
						<Link href="/sign-in">Sign In</Link>
					</Button>
					<Button asChild variant="outline" size="lg">
						<Link href="/sign-up">Sign Up</Link>
					</Button>
				</div>
			</div>
		</div>
	);
}

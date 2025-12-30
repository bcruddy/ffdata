import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy } from 'lucide-react';

export default function DashboardPage() {
	return (
		<div className="space-y-8">
			<div>
				<h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
				<p className="text-muted-foreground">View historical fantasy football data and analytics</p>
			</div>

			<div className="grid gap-4">
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Trophy className="h-5 w-5" />
							Standings
						</CardTitle>
						<CardDescription>View historical standings by season</CardDescription>
					</CardHeader>
					<CardContent>
						<Button asChild>
							<Link href="/standings">View Standings</Link>
						</Button>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function OwnersPage() {
	return (
		<div className="space-y-8">
			<div>
				<h1 className="text-3xl font-bold tracking-tight">Owners</h1>
				<p className="text-muted-foreground">Multi-season analytics and leaderboard</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Owner Leaderboard</CardTitle>
					<CardDescription>All-time stats across seasons</CardDescription>
				</CardHeader>
				<CardContent>
					<p className="text-muted-foreground">No data yet. Import data from ESPN to get started.</p>
				</CardContent>
			</Card>
		</div>
	);
}

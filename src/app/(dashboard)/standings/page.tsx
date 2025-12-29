import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function StandingsPage() {
	return (
		<div className="space-y-8">
			<div>
				<h1 className="text-3xl font-bold tracking-tight">Standings</h1>
				<p className="text-muted-foreground">View historical standings by season</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Season Standings</CardTitle>
					<CardDescription>Select a season to view standings</CardDescription>
				</CardHeader>
				<CardContent>
					<p className="text-muted-foreground">No data yet. Import data from ESPN to get started.</p>
				</CardContent>
			</Card>
		</div>
	);
}

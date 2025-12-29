import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StandingsTable } from '@/components/standings/standings-table';
import { getAggregateStandings } from '@/lib/db/queries/standings';

export default async function StandingsPage() {
	const standings = await getAggregateStandings();

	return (
		<div className="space-y-8">
			<div>
				<h1 className="text-3xl font-bold tracking-tight">All-Time Standings</h1>
				<p className="text-muted-foreground">Aggregate stats across all seasons</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Owner Rankings</CardTitle>
					<CardDescription>Click any column header to sort</CardDescription>
				</CardHeader>
				<CardContent>
					<StandingsTable data={standings} />
				</CardContent>
			</Card>
		</div>
	);
}

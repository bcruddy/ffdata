import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StandingsTable } from '@/components/standings/standings-table';
import { StandingsFilters } from '@/components/standings/standings-filters';
import { getAggregateStandings } from '@/lib/db/queries/standings';
import { getSeasonYears } from '@/lib/db/queries/seasons';
import { standingsParamsSchema } from '@/schemas/standings';
import type { OwnerWithStats } from '@/types';

interface PageProps {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

function calculateAverages(standings: OwnerWithStats[]): OwnerWithStats[] {
	return standings.map((owner) => {
		const seasons = owner.seasonsPlayed || 1;
		const avgWins = owner.totalWins / seasons;
		const avgLosses = owner.totalLosses / seasons;
		const avgTies = owner.totalTies / seasons;
		const totalGames = avgWins + avgLosses + avgTies;
		const winPercentage = totalGames > 0 ? (avgWins + avgTies * 0.5) / totalGames : 0;

		return {
			...owner,
			totalWins: avgWins,
			totalLosses: avgLosses,
			totalTies: avgTies,
			totalPointsFor: owner.totalPointsFor / seasons,
			totalPointsAgainst: owner.totalPointsAgainst / seasons,
			championships: owner.championships / seasons,
			winPercentage,
		};
	});
}

function getPageTitle(startYear?: number, endYear?: number): string {
	if (startYear && endYear) {
		return startYear === endYear ? `${startYear} Standings` : `${startYear}-${endYear} Standings`;
	}
	if (startYear) return `${startYear}-Present Standings`;
	if (endYear) return `Through ${endYear} Standings`;
	return 'All-Time Standings';
}

function getPageSubtitle(view: 'aggregate' | 'average'): string {
	return view === 'average' ? 'Per-season averages' : 'Aggregate stats across all seasons';
}

export default async function StandingsPage({ searchParams }: PageProps) {
	const params = await searchParams;
	const parsed = standingsParamsSchema.safeParse(params);
	const filters = parsed.success ? parsed.data : { view: 'aggregate' as const };

	const [standings, years] = await Promise.all([
		getAggregateStandings({
			startYear: filters.startYear,
			endYear: filters.endYear,
		}),
		getSeasonYears(),
	]);

	const displayData = filters.view === 'average' ? calculateAverages(standings) : standings;

	return (
		<div className="space-y-8">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">{getPageTitle(filters.startYear, filters.endYear)}</h1>
					<p className="text-muted-foreground">{getPageSubtitle(filters.view)}</p>
				</div>
				<StandingsFilters
					availableYears={years}
					currentView={filters.view}
					currentStartYear={filters.startYear}
					currentEndYear={filters.endYear}
				/>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Owner Rankings</CardTitle>
					<CardDescription>Click any column header to sort</CardDescription>
				</CardHeader>
				<CardContent>
					<StandingsTable
						data={displayData}
						view={filters.view}
						hasFilters={!!(filters.startYear || filters.endYear)}
					/>
				</CardContent>
			</Card>
		</div>
	);
}

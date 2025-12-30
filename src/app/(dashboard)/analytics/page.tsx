import { Suspense } from 'react';
import { AnalyticsTabs } from '@/components/analytics/analytics-tabs';
import {
	getChampionshipsByYear,
	getSackosByYear,
	getHallOfFameStats,
	getHeadToHeadRecords,
	getBiggestBlowouts,
	getClosestGames,
	getHighestWeeklyScores,
	getLowestWeeklyScores,
	getLuckAnalysis,
	getLongestStreaks,
	getAllOwners,
	getRivalryStats,
} from '@/lib/db/queries/analytics';
import { sql } from '@/lib/db/client';

async function checkMatchupData(): Promise<boolean> {
	try {
		const result = (await sql`SELECT EXISTS(SELECT 1 FROM matchups LIMIT 1) as has_data`) as { has_data: boolean }[];
		return result[0]?.has_data || false;
	} catch {
		// Table might not exist yet
		return false;
	}
}

export default async function AnalyticsPage() {
	const hasMatchupData = await checkMatchupData();

	// Fetch hall of fame data (always available)
	const [championships, sackos, ownerStats] = await Promise.all([
		getChampionshipsByYear(),
		getSackosByYear(),
		getHallOfFameStats(),
	]);

	// Fetch matchup-dependent data only if we have matchups
	const [h2hRecords, blowouts, closeGames, highScores, lowScores, luckRecords, streakRecords, owners] = hasMatchupData
		? await Promise.all([
				getHeadToHeadRecords(),
				getBiggestBlowouts(25),
				getClosestGames(25),
				getHighestWeeklyScores(25),
				getLowestWeeklyScores(25),
				getLuckAnalysis(),
				getLongestStreaks(20),
				getAllOwners(),
			])
		: [[], [], [], [], [], [], [], []];

	// Get initial rivalry stats for first two owners
	const initialRivalryStats =
		hasMatchupData && owners.length >= 2 ? await getRivalryStats(owners[0].id, owners[1].id) : null;

	// Server action for fetching rivalry stats
	async function fetchRivalry(owner1Id: string, owner2Id: string) {
		'use server';
		return getRivalryStats(owner1Id, owner2Id);
	}

	return (
		<div className="space-y-8">
			<div>
				<h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
				<p className="text-muted-foreground">Deep dive into league history and stats</p>
			</div>

			<Suspense fallback={<div className="text-muted-foreground py-8 text-center">Loading analytics...</div>}>
				<AnalyticsTabs
					championships={championships}
					sackos={sackos}
					ownerStats={ownerStats}
					hasMatchupData={hasMatchupData}
					h2hRecords={h2hRecords}
					blowouts={blowouts}
					closeGames={closeGames}
					highScores={highScores}
					lowScores={lowScores}
					luckRecords={luckRecords}
					streakRecords={streakRecords}
					owners={owners}
					initialRivalryStats={initialRivalryStats}
					fetchRivalry={fetchRivalry}
				/>
			</Suspense>
		</div>
	);
}

import { Suspense } from 'react';
import { AnalyticsTabs } from '@/components/analytics/analytics-tabs';
import { getChampionshipsByYear, getSackosByYear, getHallOfFameStats } from '@/lib/db/queries/analytics';
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
	const [championships, sackos, ownerStats, hasMatchupData] = await Promise.all([
		getChampionshipsByYear(),
		getSackosByYear(),
		getHallOfFameStats(),
		checkMatchupData(),
	]);

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
				/>
			</Suspense>
		</div>
	);
}

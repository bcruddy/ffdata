'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HallOfFame } from './hall-of-fame';
import { H2HMatrix } from './h2h-matrix';
import { MatchupRecords } from './matchup-records';
import { WeeklyRecords } from './weekly-records';
import { LuckStreaks } from './luck-streaks';
import { RivalryView } from './rivalry-view';
import type {
	ChampionshipRecord,
	SackoRecord,
	OwnerHallOfFameStats,
	H2HRecord,
	MatchupRecord,
	WeeklyScoreRecord,
	LuckRecord,
	StreakRecord,
	RivalryStats,
} from '@/lib/db/queries/analytics';

interface AnalyticsTabsProps {
	championships: ChampionshipRecord[];
	sackos: SackoRecord[];
	ownerStats: OwnerHallOfFameStats[];
	hasMatchupData: boolean;
	h2hRecords: H2HRecord[];
	blowouts: MatchupRecord[];
	closeGames: MatchupRecord[];
	highScores: WeeklyScoreRecord[];
	lowScores: WeeklyScoreRecord[];
	luckRecords: LuckRecord[];
	streakRecords: StreakRecord[];
	owners: { id: string; name: string }[];
	initialRivalryStats: RivalryStats | null;
	fetchRivalry: (owner1Id: string, owner2Id: string) => Promise<RivalryStats | null>;
}

const TABS = [
	{ value: 'hall-of-fame', label: 'Hall of Fame', requiresMatchups: false },
	{ value: 'head-to-head', label: 'Head-to-Head', requiresMatchups: true },
	{ value: 'records', label: 'Records', requiresMatchups: true },
	{ value: 'weekly-scores', label: 'Weekly Scores', requiresMatchups: true },
	{ value: 'luck-streaks', label: 'Luck & Streaks', requiresMatchups: true },
	{ value: 'rivalry', label: 'Rivalry', requiresMatchups: true },
] as const;

type TabValue = (typeof TABS)[number]['value'];

export function AnalyticsTabs({
	championships,
	sackos,
	ownerStats,
	hasMatchupData,
	h2hRecords,
	blowouts,
	closeGames,
	highScores,
	lowScores,
	luckRecords,
	streakRecords,
	owners,
	initialRivalryStats,
	fetchRivalry,
}: AnalyticsTabsProps) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const currentTab = (searchParams.get('tab') as TabValue) || 'hall-of-fame';

	const handleTabChange = (value: string) => {
		const params = new URLSearchParams(searchParams.toString());
		params.set('tab', value);
		router.push(`/analytics?${params.toString()}`);
	};

	return (
		<Tabs value={currentTab} onValueChange={handleTabChange}>
			<TabsList className="flex-wrap">
				{TABS.map((tab) => (
					<TabsTrigger key={tab.value} value={tab.value} disabled={tab.requiresMatchups && !hasMatchupData}>
						{tab.label}
						{tab.requiresMatchups && !hasMatchupData && <span className="ml-1 text-xs opacity-50">*</span>}
					</TabsTrigger>
				))}
			</TabsList>

			<TabsContent value="hall-of-fame" className="mt-6">
				<HallOfFame championships={championships} sackos={sackos} ownerStats={ownerStats} />
			</TabsContent>

			<TabsContent value="head-to-head" className="mt-6">
				<H2HMatrix records={h2hRecords} />
			</TabsContent>

			<TabsContent value="records" className="mt-6">
				<MatchupRecords blowouts={blowouts} closeGames={closeGames} />
			</TabsContent>

			<TabsContent value="weekly-scores" className="mt-6">
				<WeeklyRecords highScores={highScores} lowScores={lowScores} />
			</TabsContent>

			<TabsContent value="luck-streaks" className="mt-6">
				<LuckStreaks luckRecords={luckRecords} streakRecords={streakRecords} />
			</TabsContent>

			<TabsContent value="rivalry" className="mt-6">
				<RivalryView owners={owners} initialStats={initialRivalryStats} fetchRivalry={fetchRivalry} />
			</TabsContent>
		</Tabs>
	);
}

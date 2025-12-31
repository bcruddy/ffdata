'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HallOfFame } from './hall-of-fame';
import { H2HMatrix } from './h2h-matrix';
import { MatchupRecords } from './matchup-records';
import { WeeklyRecords } from './weekly-records';
import { RivalryView } from './rivalry-view';
import { Playoffs } from './playoffs';
import { useHallOfFame, useMatchups, usePlayoffs } from '@/lib/hooks/use-analytics';
import {
	HallOfFameSkeleton,
	H2HMatrixSkeleton,
	MatchupRecordsSkeleton,
	WeeklyRecordsSkeleton,
	RivalrySkeleton,
	PlayoffsSkeleton,
} from './analytics-skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const TABS = [
	{ value: 'hall-of-fame', label: 'Hall of Fame', requiresMatchups: false },
	{ value: 'playoffs', label: 'Playoffs', requiresMatchups: true },
	{ value: 'head-to-head', label: 'Head-to-Head', requiresMatchups: true },
	{ value: 'records', label: 'Records', requiresMatchups: true },
	{ value: 'weekly-scores', label: 'Weekly Scores', requiresMatchups: true },
	// { value: 'luck-streaks', label: 'Luck & Streaks', requiresMatchups: true }, // Hidden - see GitHub issue #6
	{ value: 'rivalry', label: 'Rivalry', requiresMatchups: true },
] as const;

type TabValue = (typeof TABS)[number]['value'];

function ErrorCard({ title, message }: { title: string; message: string }) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>{title}</CardTitle>
			</CardHeader>
			<CardContent>
				<p className="text-muted-foreground py-8 text-center">{message}</p>
			</CardContent>
		</Card>
	);
}

function HallOfFameTab() {
	const { data, isLoading, error } = useHallOfFame();

	if (isLoading) return <HallOfFameSkeleton />;
	if (error) return <ErrorCard title="Hall of Fame" message="Failed to load Hall of Fame data. Please try again." />;
	if (!data) return null;

	return <HallOfFame championships={data.championships} sackos={data.sackos} ownerStats={data.ownerStats} />;
}

function HeadToHeadTab() {
	const { data, isLoading, error } = useMatchups();

	if (isLoading) return <H2HMatrixSkeleton />;
	if (error) return <ErrorCard title="Head-to-Head" message="Failed to load matchup data. Please try again." />;
	if (!data) return null;

	return <H2HMatrix records={data.h2hRecords} />;
}

function RecordsTab() {
	const { data, isLoading, error } = useMatchups();

	if (isLoading) return <MatchupRecordsSkeleton />;
	if (error) return <ErrorCard title="Records" message="Failed to load matchup data. Please try again." />;
	if (!data) return null;

	return <MatchupRecords blowouts={data.blowouts} closeGames={data.closeGames} />;
}

function WeeklyScoresTab() {
	const { data, isLoading, error } = useMatchups();

	if (isLoading) return <WeeklyRecordsSkeleton />;
	if (error) return <ErrorCard title="Weekly Scores" message="Failed to load matchup data. Please try again." />;
	if (!data) return null;

	return <WeeklyRecords highScores={data.highScores} lowScores={data.lowScores} />;
}

function RivalryTab() {
	const { data, isLoading, error } = useMatchups();

	if (isLoading) return <RivalrySkeleton />;
	if (error) return <ErrorCard title="Rivalry" message="Failed to load matchup data. Please try again." />;
	if (!data) return null;

	return <RivalryView owners={data.owners} />;
}

function PlayoffsTab() {
	const { data, isLoading, error } = usePlayoffs();

	if (isLoading) return <PlayoffsSkeleton />;
	if (error) return <ErrorCard title="Playoffs" message="Failed to load playoff data. Please try again." />;
	if (!data) return null;

	return <Playoffs data={data} />;
}

export function AnalyticsTabs() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const currentTab = (searchParams.get('tab') as TabValue) || 'hall-of-fame';

	const { data: matchupsData, isLoading: matchupsLoading } = useMatchups();
	const hasMatchupData = matchupsData?.hasMatchupData ?? false;

	const handleTabChange = (value: string) => {
		const params = new URLSearchParams(searchParams.toString());
		params.set('tab', value);
		router.replace(`/analytics?${params.toString()}`, { scroll: false });
	};

	return (
		<Tabs value={currentTab} onValueChange={handleTabChange}>
			<TabsList className="h-auto flex-wrap gap-1 p-1">
				{TABS.map((tab) => (
					<TabsTrigger
						key={tab.value}
						value={tab.value}
						disabled={tab.requiresMatchups && !hasMatchupData && !matchupsLoading}
					>
						{tab.label}
						{tab.requiresMatchups && !hasMatchupData && !matchupsLoading && (
							<span className="ml-1 text-xs opacity-50">*</span>
						)}
					</TabsTrigger>
				))}
			</TabsList>

			<TabsContent value="hall-of-fame" className="mt-6 animate-in fade-in-50 duration-200">
				<HallOfFameTab />
			</TabsContent>

			<TabsContent value="playoffs" className="mt-6 animate-in fade-in-50 duration-200">
				<PlayoffsTab />
			</TabsContent>

			<TabsContent value="head-to-head" className="mt-6 animate-in fade-in-50 duration-200">
				<HeadToHeadTab />
			</TabsContent>

			<TabsContent value="records" className="mt-6 animate-in fade-in-50 duration-200">
				<RecordsTab />
			</TabsContent>

			<TabsContent value="weekly-scores" className="mt-6 animate-in fade-in-50 duration-200">
				<WeeklyScoresTab />
			</TabsContent>

			{/* Hidden - see GitHub issue #6 */}

			<TabsContent value="rivalry" className="mt-6 animate-in fade-in-50 duration-200">
				<RivalryTab />
			</TabsContent>
		</Tabs>
	);
}

'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SortableHeader } from '@/components/ui/sortable-header';
import { useTableSort } from '@/lib/hooks/use-table-sort';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { PlayoffsData } from '@/lib/hooks/use-analytics';
import type { PlayoffLeaderboardRecord, ClutchRatingRecord } from '@/lib/db/queries/analytics';

type ViewMode = 'leaderboard' | 'records' | 'insights';
type RecordsSubView = 'blowouts' | 'close' | 'high' | 'low' | 'championships';
type InsightsSubView = 'clutch' | 'dynasties' | 'droughts' | 'heartbreakers' | 'cinderellas';

interface PlayoffsProps {
	data: PlayoffsData;
}

export function Playoffs({ data }: PlayoffsProps) {
	const [viewMode, setViewMode] = useState<ViewMode>('leaderboard');
	const [recordsSubView, setRecordsSubView] = useState<RecordsSubView>('championships');
	const [insightsSubView, setInsightsSubView] = useState<InsightsSubView>('clutch');

	if (!data.hasPlayoffData) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Playoff Analytics</CardTitle>
					<CardDescription>Playoff performance and records</CardDescription>
				</CardHeader>
				<CardContent>
					<p className="text-muted-foreground py-8 text-center">
						No playoff data available. Run the ESPN import script to fetch matchup history.
					</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex flex-wrap items-center gap-2">
				<Button
					variant={viewMode === 'leaderboard' ? 'default' : 'outline'}
					size="sm"
					onClick={() => setViewMode('leaderboard')}
				>
					Leaderboard
				</Button>
				<Button
					variant={viewMode === 'records' ? 'default' : 'outline'}
					size="sm"
					onClick={() => setViewMode('records')}
				>
					Records
				</Button>
				<Button
					variant={viewMode === 'insights' ? 'default' : 'outline'}
					size="sm"
					onClick={() => setViewMode('insights')}
				>
					Insights
				</Button>
			</div>

			{viewMode === 'leaderboard' && <PlayoffLeaderboard data={data} />}
			{viewMode === 'records' && <PlayoffRecords data={data} subView={recordsSubView} setSubView={setRecordsSubView} />}
			{viewMode === 'insights' && (
				<PlayoffInsights data={data} subView={insightsSubView} setSubView={setInsightsSubView} />
			)}
		</div>
	);
}

type LeaderboardSortField =
	| 'ownerName'
	| 'playoffAppearances'
	| 'playoffWins'
	| 'playoffWinPct'
	| 'championships'
	| 'championshipAppearances'
	| 'firstRoundExits'
	| 'avgPlayoffScore';

function PlayoffLeaderboard({ data }: { data: PlayoffsData }) {
	const compareFn = useCallback(
		(a: PlayoffLeaderboardRecord, b: PlayoffLeaderboardRecord, field: LeaderboardSortField) => {
			switch (field) {
				case 'ownerName':
					return a.ownerName.toLowerCase().localeCompare(b.ownerName.toLowerCase());
				case 'playoffAppearances':
					return a.playoffAppearances - b.playoffAppearances;
				case 'playoffWins':
					return a.playoffWins - b.playoffWins;
				case 'playoffWinPct':
					return a.playoffWinPct - b.playoffWinPct;
				case 'championships':
					return a.championships - b.championships;
				case 'championshipAppearances':
					return a.championshipAppearances - b.championshipAppearances;
				case 'firstRoundExits':
					return a.firstRoundExits - b.firstRoundExits;
				case 'avgPlayoffScore':
					return a.avgPlayoffScore - b.avgPlayoffScore;
				default:
					return 0;
			}
		},
		[],
	);

	const { sortField, sortDirection, handleSort, sortedData } = useTableSort(data.leaderboard, compareFn, {
		defaultField: 'playoffWins' as LeaderboardSortField,
		textFields: ['ownerName' as LeaderboardSortField],
	});

	return (
		<Card>
			<CardHeader>
				<CardTitle>Playoff Leaderboard</CardTitle>
				<CardDescription>Career playoff statistics by owner</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="hidden sm:block overflow-x-auto">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className="w-12 text-center">#</TableHead>
								<SortableHeader
									field="ownerName"
									currentField={sortField}
									direction={sortDirection}
									onSort={handleSort}
								>
									Owner
								</SortableHeader>
								<SortableHeader
									field="playoffAppearances"
									currentField={sortField}
									direction={sortDirection}
									onSort={handleSort}
									className="text-center"
								>
									Apps
								</SortableHeader>
								<SortableHeader
									field="playoffWins"
									currentField={sortField}
									direction={sortDirection}
									onSort={handleSort}
									className="text-center"
								>
									Record
								</SortableHeader>
								<SortableHeader
									field="playoffWinPct"
									currentField={sortField}
									direction={sortDirection}
									onSort={handleSort}
									className="text-center"
								>
									Win %
								</SortableHeader>
								<SortableHeader
									field="championships"
									currentField={sortField}
									direction={sortDirection}
									onSort={handleSort}
									className="text-center"
								>
									Titles
								</SortableHeader>
								<SortableHeader
									field="championshipAppearances"
									currentField={sortField}
									direction={sortDirection}
									onSort={handleSort}
									className="hidden text-center md:table-cell"
								>
									Finals
								</SortableHeader>
								<SortableHeader
									field="firstRoundExits"
									currentField={sortField}
									direction={sortDirection}
									onSort={handleSort}
									className="hidden text-center lg:table-cell"
								>
									1st Rd Exits
								</SortableHeader>
								<SortableHeader
									field="avgPlayoffScore"
									currentField={sortField}
									direction={sortDirection}
									onSort={handleSort}
									className="hidden text-center lg:table-cell"
								>
									Avg Score
								</SortableHeader>
							</TableRow>
						</TableHeader>
						<TableBody>
							{sortedData.map((owner, index) => (
								<TableRow key={owner.ownerId}>
									<TableCell className="text-muted-foreground text-center font-medium">{index + 1}</TableCell>
									<TableCell className="font-medium">{owner.ownerName}</TableCell>
									<TableCell className="text-center font-mono">{owner.playoffAppearances}</TableCell>
									<TableCell className="text-center font-mono">
										<span className="text-green-500">{owner.playoffWins}</span>
										<span className="text-muted-foreground">-</span>
										<span className="text-red-500">{owner.playoffLosses}</span>
									</TableCell>
									<TableCell className="text-center font-mono">{(owner.playoffWinPct * 100).toFixed(0)}%</TableCell>
									<TableCell className="text-center">
										{owner.championships > 0 ? (
											<span className="font-bold text-yellow-500">{owner.championships} 🏆</span>
										) : (
											<span className="text-muted-foreground">0</span>
										)}
									</TableCell>
									<TableCell className="hidden text-center md:table-cell font-mono">
										{owner.championshipAppearances}
									</TableCell>
									<TableCell className="hidden text-center lg:table-cell font-mono text-red-500">
										{owner.firstRoundExits > 0 ? owner.firstRoundExits : '-'}
									</TableCell>
									<TableCell className="hidden text-center lg:table-cell font-mono">
										{owner.avgPlayoffScore.toFixed(1)}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>

				<div className="sm:hidden space-y-3">
					{sortedData.map((owner, index) => (
						<div key={owner.ownerId} className="bg-muted/50 rounded-lg p-3 space-y-2">
							<div className="flex justify-between items-center">
								<span className="font-medium">
									#{index + 1} {owner.ownerName}
								</span>
								{owner.championships > 0 && <span className="font-bold text-yellow-500">{owner.championships} 🏆</span>}
							</div>
							<div className="flex justify-between text-sm">
								<span className="text-muted-foreground">{owner.playoffAppearances} appearances</span>
								<span className="font-mono">
									<span className="text-green-500">{owner.playoffWins}</span>
									<span className="text-muted-foreground">-</span>
									<span className="text-red-500">{owner.playoffLosses}</span>
									<span className="text-muted-foreground ml-2">({(owner.playoffWinPct * 100).toFixed(0)}%)</span>
								</span>
							</div>
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	);
}

function PlayoffRecords({
	data,
	subView,
	setSubView,
}: {
	data: PlayoffsData;
	subView: RecordsSubView;
	setSubView: (v: RecordsSubView) => void;
}) {
	return (
		<Card>
			<CardHeader>
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<CardTitle>Playoff Records</CardTitle>
						<CardDescription>Notable playoff moments and achievements</CardDescription>
					</div>
					<div className="flex flex-wrap items-center gap-2">
						<Button
							variant={subView === 'championships' ? 'default' : 'outline'}
							size="sm"
							onClick={() => setSubView('championships')}
						>
							Championships
						</Button>
						<Button
							variant={subView === 'blowouts' ? 'default' : 'outline'}
							size="sm"
							onClick={() => setSubView('blowouts')}
						>
							Blowouts
						</Button>
						<Button variant={subView === 'close' ? 'default' : 'outline'} size="sm" onClick={() => setSubView('close')}>
							Close Games
						</Button>
						<Button variant={subView === 'high' ? 'default' : 'outline'} size="sm" onClick={() => setSubView('high')}>
							High Scores
						</Button>
						<Button variant={subView === 'low' ? 'default' : 'outline'} size="sm" onClick={() => setSubView('low')}>
							Low Scores
						</Button>
					</div>
				</div>
			</CardHeader>
			<CardContent>
				{subView === 'championships' && <ChampionshipHistory games={data.championshipGames} />}
				{subView === 'blowouts' && <MatchupList records={data.blowouts} type="blowout" />}
				{subView === 'close' && <MatchupList records={data.closeGames} type="close" />}
				{subView === 'high' && <ScoreList records={data.highScores} type="high" />}
				{subView === 'low' && <ScoreList records={data.lowScores} type="low" />}
			</CardContent>
		</Card>
	);
}

function ChampionshipHistory({ games }: { games: PlayoffsData['championshipGames'] }) {
	if (games.length === 0) {
		return <p className="text-muted-foreground py-4 text-center">No championship data available.</p>;
	}

	return (
		<>
			<div className="hidden sm:block">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead className="text-center">Year</TableHead>
							<TableHead>Champion</TableHead>
							<TableHead>Runner-Up</TableHead>
							<TableHead className="text-center">Score</TableHead>
							<TableHead className="text-center">Margin</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{games.map((game) => (
							<TableRow key={game.year}>
								<TableCell className="text-center font-mono">{game.year}</TableCell>
								<TableCell className="font-medium">
									<span className="text-yellow-500">{game.championName} 🏆</span>
								</TableCell>
								<TableCell>{game.runnerUpName}</TableCell>
								<TableCell className="text-center font-mono">
									{game.championScore.toFixed(1)}-{game.runnerUpScore.toFixed(1)}
								</TableCell>
								<TableCell className="text-center font-mono font-bold text-green-500">
									+{game.margin.toFixed(1)}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>

			<div className="sm:hidden space-y-3">
				{games.map((game) => (
					<div key={game.year} className="bg-muted/50 rounded-lg p-3 space-y-2">
						<div className="flex justify-between items-center">
							<span className="font-mono text-muted-foreground">{game.year}</span>
							<span className="font-bold text-yellow-500">{game.championName} 🏆</span>
						</div>
						<div className="flex justify-between items-center text-sm">
							<span className="text-muted-foreground">vs {game.runnerUpName}</span>
							<span className="font-mono">
								{game.championScore.toFixed(1)}-{game.runnerUpScore.toFixed(1)}
							</span>
						</div>
					</div>
				))}
			</div>
		</>
	);
}

function MatchupList({ records, type }: { records: PlayoffsData['blowouts']; type: 'blowout' | 'close' }) {
	if (records.length === 0) {
		return <p className="text-muted-foreground py-4 text-center">No records available.</p>;
	}

	return (
		<>
			<p className="text-sm text-muted-foreground mb-4">
				{type === 'blowout' ? 'Largest playoff margins of victory' : 'Closest playoff games'} (2019+)
			</p>
			<div className="hidden sm:block">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead className="w-12 text-center">#</TableHead>
							<TableHead>Winner</TableHead>
							<TableHead>Loser</TableHead>
							<TableHead className="text-center">Score</TableHead>
							<TableHead className="text-center">Margin</TableHead>
							<TableHead className="hidden text-center md:table-cell">Week</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{records.map((matchup, index) => (
							<TableRow key={matchup.matchupId}>
								<TableCell className="text-muted-foreground text-center font-medium">
									{index + 1}
									{index < 3 && (
										<span className="ml-1">
											{index === 0 && '🥇'}
											{index === 1 && '🥈'}
											{index === 2 && '🥉'}
										</span>
									)}
								</TableCell>
								<TableCell className="font-medium">{matchup.winnerOwnerName}</TableCell>
								<TableCell>{matchup.loserOwnerName}</TableCell>
								<TableCell className="text-center font-mono">
									{matchup.winnerScore.toFixed(1)}-{matchup.loserScore.toFixed(1)}
								</TableCell>
								<TableCell
									className={cn(
										'text-center font-mono font-bold',
										type === 'blowout' ? 'text-red-500' : 'text-yellow-500',
									)}
								>
									{matchup.margin.toFixed(1)}
								</TableCell>
								<TableCell className="hidden text-center md:table-cell">
									<span className="text-muted-foreground font-mono text-xs">
										{matchup.year} W{matchup.week}
									</span>
									{matchup.isChampionship && (
										<span className="ml-1 text-xs" title="Championship game">
											🏆
										</span>
									)}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>

			<div className="sm:hidden space-y-3">
				{records.map((matchup, index) => (
					<div key={matchup.matchupId} className="bg-muted/50 rounded-lg p-3 space-y-2">
						<div className="flex justify-between items-center">
							<span className="text-muted-foreground text-sm">
								#{index + 1}
								{index < 3 && (
									<span className="ml-1">
										{index === 0 && '🥇'}
										{index === 1 && '🥈'}
										{index === 2 && '🥉'}
									</span>
								)}
							</span>
							<span className="text-muted-foreground text-xs">
								{matchup.year} W{matchup.week}
								{matchup.isChampionship && ' 🏆'}
							</span>
						</div>
						<div className="flex justify-between items-center">
							<span className="font-medium text-green-500">{matchup.winnerOwnerName}</span>
							<span className="font-mono text-green-500">{matchup.winnerScore.toFixed(1)}</span>
						</div>
						<div className="flex justify-between items-center text-muted-foreground">
							<span>{matchup.loserOwnerName}</span>
							<span className="font-mono">{matchup.loserScore.toFixed(1)}</span>
						</div>
					</div>
				))}
			</div>
		</>
	);
}

function ScoreList({ records, type }: { records: PlayoffsData['highScores']; type: 'high' | 'low' }) {
	if (records.length === 0) {
		return <p className="text-muted-foreground py-4 text-center">No records available.</p>;
	}

	return (
		<>
			<p className="text-sm text-muted-foreground mb-4">
				{type === 'high' ? 'Highest playoff game scores' : 'Lowest playoff game scores'} (2019+)
			</p>
			<div className="hidden sm:block">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead className="w-12 text-center">#</TableHead>
							<TableHead>Owner</TableHead>
							<TableHead className="text-center">Score</TableHead>
							<TableHead className="text-center">Result</TableHead>
							<TableHead className="hidden md:table-cell">Opponent</TableHead>
							<TableHead className="hidden text-center md:table-cell">Week</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{records.map((record, index) => (
							<TableRow key={`${record.ownerId}-${record.year}-${record.week}`}>
								<TableCell className="text-muted-foreground text-center font-medium">
									{index + 1}
									{index < 3 && (
										<span className="ml-1">
											{index === 0 && '🥇'}
											{index === 1 && '🥈'}
											{index === 2 && '🥉'}
										</span>
									)}
								</TableCell>
								<TableCell className="font-medium">{record.ownerName}</TableCell>
								<TableCell
									className={cn(
										'text-center font-mono font-bold',
										type === 'high' ? 'text-yellow-500' : 'text-red-500',
									)}
								>
									{record.score.toFixed(1)}
								</TableCell>
								<TableCell className={cn('text-center', record.isWin ? 'text-green-500' : 'text-red-500')}>
									{record.isWin ? 'W' : 'L'}
								</TableCell>
								<TableCell className="hidden md:table-cell">
									{record.opponentName} ({record.opponentScore.toFixed(1)})
								</TableCell>
								<TableCell className="hidden text-center md:table-cell">
									<span className="text-muted-foreground font-mono text-xs">
										{record.year} W{record.week}
									</span>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>

			<div className="sm:hidden space-y-3">
				{records.map((record, index) => (
					<div key={`${record.ownerId}-${record.year}-${record.week}`} className="bg-muted/50 rounded-lg p-3 space-y-2">
						<div className="flex justify-between items-center">
							<span className="text-muted-foreground text-sm">
								#{index + 1}
								{index < 3 && (
									<span className="ml-1">
										{index === 0 && '🥇'}
										{index === 1 && '🥈'}
										{index === 2 && '🥉'}
									</span>
								)}
							</span>
							<span className="text-muted-foreground text-xs">
								{record.year} W{record.week}
							</span>
						</div>
						<div className="flex justify-between items-center">
							<span className="font-medium">{record.ownerName}</span>
							<span className={cn('font-mono font-bold', type === 'high' ? 'text-yellow-500' : 'text-red-500')}>
								{record.score.toFixed(1)}
							</span>
						</div>
						<div className="flex justify-between items-center text-sm text-muted-foreground">
							<span>vs {record.opponentName}</span>
							<span className={record.isWin ? 'text-green-500' : 'text-red-500'}>{record.isWin ? 'W' : 'L'}</span>
						</div>
					</div>
				))}
			</div>
		</>
	);
}

function PlayoffInsights({
	data,
	subView,
	setSubView,
}: {
	data: PlayoffsData;
	subView: InsightsSubView;
	setSubView: (v: InsightsSubView) => void;
}) {
	return (
		<Card>
			<CardHeader>
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<CardTitle>Playoff Insights</CardTitle>
						<CardDescription>Advanced analytics and patterns</CardDescription>
					</div>
					<div className="flex flex-wrap items-center gap-2">
						<Button
							variant={subView === 'clutch' ? 'default' : 'outline'}
							size="sm"
							onClick={() => setSubView('clutch')}
						>
							Clutch
						</Button>
						<Button
							variant={subView === 'dynasties' ? 'default' : 'outline'}
							size="sm"
							onClick={() => setSubView('dynasties')}
						>
							Dynasties
						</Button>
						<Button
							variant={subView === 'droughts' ? 'default' : 'outline'}
							size="sm"
							onClick={() => setSubView('droughts')}
						>
							Droughts
						</Button>
						<Button
							variant={subView === 'heartbreakers' ? 'default' : 'outline'}
							size="sm"
							onClick={() => setSubView('heartbreakers')}
						>
							Heartbreakers
						</Button>
						<Button
							variant={subView === 'cinderellas' ? 'default' : 'outline'}
							size="sm"
							onClick={() => setSubView('cinderellas')}
						>
							Cinderellas
						</Button>
					</div>
				</div>
			</CardHeader>
			<CardContent>
				{subView === 'clutch' && <ClutchView ratings={data.clutchRatings} />}
				{subView === 'dynasties' && <DynastiesView dynasties={data.dynasties} />}
				{subView === 'droughts' && <DroughtsView droughts={data.droughts} />}
				{subView === 'heartbreakers' && <HeartbreakersView heartbreakers={data.heartbreakers} />}
				{subView === 'cinderellas' && <CinderellasView cinderellas={data.cinderellas} />}
			</CardContent>
		</Card>
	);
}

type ClutchSortField = 'ownerName' | 'eliminationWins' | 'clutchWinPct';

function ClutchView({ ratings }: { ratings: PlayoffsData['clutchRatings'] }) {
	const compareFn = useCallback((a: ClutchRatingRecord, b: ClutchRatingRecord, field: ClutchSortField) => {
		switch (field) {
			case 'ownerName':
				return a.ownerName.toLowerCase().localeCompare(b.ownerName.toLowerCase());
			case 'eliminationWins':
				return a.eliminationWins - b.eliminationWins;
			case 'clutchWinPct':
				return a.clutchWinPct - b.clutchWinPct;
			default:
				return 0;
		}
	}, []);

	const { sortField, sortDirection, handleSort, sortedData } = useTableSort(ratings, compareFn, {
		defaultField: 'clutchWinPct' as ClutchSortField,
		textFields: ['ownerName' as ClutchSortField],
	});

	if (ratings.length === 0) {
		return <p className="text-muted-foreground py-4 text-center">No clutch rating data available.</p>;
	}

	return (
		<>
			<p className="text-sm text-muted-foreground mb-4">
				Playoff win percentage - every playoff game is an elimination game
			</p>
			<div className="hidden sm:block">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead className="w-12 text-center">#</TableHead>
							<SortableHeader field="ownerName" currentField={sortField} direction={sortDirection} onSort={handleSort}>
								Owner
							</SortableHeader>
							<SortableHeader
								field="eliminationWins"
								currentField={sortField}
								direction={sortDirection}
								onSort={handleSort}
								className="text-center"
							>
								Playoff Record
							</SortableHeader>
							<SortableHeader
								field="clutchWinPct"
								currentField={sortField}
								direction={sortDirection}
								onSort={handleSort}
								className="text-center"
							>
								Win %
							</SortableHeader>
						</TableRow>
					</TableHeader>
					<TableBody>
						{sortedData.map((rating, index) => (
							<TableRow key={rating.ownerId}>
								<TableCell className="text-muted-foreground text-center font-medium">{index + 1}</TableCell>
								<TableCell className="font-medium">{rating.ownerName}</TableCell>
								<TableCell className="text-center font-mono">
									<span className="text-green-500">{rating.eliminationWins}</span>
									<span className="text-muted-foreground">-</span>
									<span className="text-red-500">{rating.eliminationGames - rating.eliminationWins}</span>
								</TableCell>
								<TableCell className="text-center font-mono font-bold">
									{(rating.clutchWinPct * 100).toFixed(0)}%
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>

			<div className="sm:hidden space-y-3">
				{sortedData.map((rating, index) => (
					<div key={rating.ownerId} className="bg-muted/50 rounded-lg p-3 space-y-2">
						<div className="flex justify-between items-center">
							<span className="font-medium">
								#{index + 1} {rating.ownerName}
							</span>
							<span className="font-mono font-bold">{(rating.clutchWinPct * 100).toFixed(0)}%</span>
						</div>
						<div className="text-sm text-muted-foreground">
							Record: <span className="text-green-500">{rating.eliminationWins}</span>-
							<span className="text-red-500">{rating.eliminationGames - rating.eliminationWins}</span>
						</div>
					</div>
				))}
			</div>
		</>
	);
}

function DynastiesView({ dynasties }: { dynasties: PlayoffsData['dynasties'] }) {
	if (dynasties.length === 0) {
		return (
			<div className="py-4 text-center">
				<p className="text-muted-foreground">No dynasties yet.</p>
				<p className="text-sm text-muted-foreground mt-1">
					Back-to-back championships required to establish a dynasty.
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<p className="text-sm text-muted-foreground">Back-to-back or consecutive championship runs</p>
			{dynasties.map((dynasty, index) => (
				<div key={`${dynasty.ownerId}-${dynasty.consecutiveYears[0]}`} className="bg-muted/50 rounded-lg p-4">
					<div className="flex justify-between items-center mb-2">
						<span className="font-bold text-lg">
							{index === 0 && '👑 '}
							{dynasty.ownerName}
						</span>
						<span className="text-yellow-500 font-bold">{dynasty.dynastyLength} Titles</span>
					</div>
					<div className="flex flex-wrap gap-2">
						{dynasty.consecutiveYears.map((year) => (
							<span key={year} className="bg-yellow-500/20 text-yellow-500 px-2 py-1 rounded text-sm font-mono">
								{year} 🏆
							</span>
						))}
					</div>
				</div>
			))}
		</div>
	);
}

function DroughtsView({ droughts }: { droughts: PlayoffsData['droughts'] }) {
	const activeDroughts = droughts
		.filter((d) => d.currentDrought > 0)
		.sort((a, b) => b.currentDrought - a.currentDrought);
	const historicalDroughts = droughts
		.filter((d) => d.longestDrought > 0)
		.sort((a, b) => b.longestDrought - a.longestDrought);

	if (activeDroughts.length === 0 && historicalDroughts.length === 0) {
		return <p className="text-muted-foreground py-4 text-center">No significant drought data available.</p>;
	}

	return (
		<div className="space-y-6">
			{activeDroughts.length > 0 && (
				<div>
					<h4 className="font-medium mb-3">Current Playoff Droughts</h4>
					<div className="space-y-2">
						{activeDroughts.slice(0, 5).map((d) => (
							<div key={d.ownerId} className="flex justify-between items-center bg-muted/50 rounded-lg px-3 py-2">
								<span className="font-medium">{d.ownerName}</span>
								<div className="flex items-center gap-4 text-sm">
									<span className="text-muted-foreground">Last playoffs: {d.lastPlayoffYear || 'Never'}</span>
									<span className="font-bold text-red-500">{d.currentDrought} seasons</span>
								</div>
							</div>
						))}
					</div>
				</div>
			)}

			{historicalDroughts.length > 0 && (
				<div>
					<h4 className="font-medium mb-3">Longest Historical Droughts</h4>
					<div className="space-y-2">
						{historicalDroughts.slice(0, 5).map((d) => (
							<div key={d.ownerId} className="flex justify-between items-center bg-muted/50 rounded-lg px-3 py-2">
								<span className="font-medium">{d.ownerName}</span>
								<span className="font-mono">{d.longestDrought} seasons</span>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
}

function HeartbreakersView({ heartbreakers }: { heartbreakers: PlayoffsData['heartbreakers'] }) {
	if (heartbreakers.length === 0) {
		return <p className="text-muted-foreground py-4 text-center">No playoff game data available.</p>;
	}

	// Helper to determine if a game is the championship (1 vs 2 final standings)
	const isChampionshipGame = (game: PlayoffsData['heartbreakers'][0]) =>
		(game.winnerFinalStanding === 1 && game.loserFinalStanding === 2) ||
		(game.winnerFinalStanding === 2 && game.loserFinalStanding === 1);

	// Helper to format the matchup title
	const getMatchupTitle = (game: PlayoffsData['heartbreakers'][0]) => {
		if (isChampionshipGame(game)) {
			return `${game.year} Championship`;
		}
		return `${game.year} #${game.loserSeed} vs #${game.winnerSeed}`;
	};

	return (
		<div className="space-y-4">
			<p className="text-sm text-muted-foreground">Closest playoff losses - so close yet so far (2019+)</p>
			{heartbreakers.map((game) => (
				<div key={game.matchupId} className="bg-muted/50 rounded-lg p-4">
					<div className="flex justify-between items-center mb-2">
						<span className="font-mono text-muted-foreground">{getMatchupTitle(game)}</span>
						<span className="text-red-500 font-mono font-bold">Lost by {game.margin.toFixed(1)}</span>
					</div>
					<div className="flex justify-between items-center">
						<div>
							<span className="font-medium">{game.loserOwnerName}</span>
							<span className="text-muted-foreground ml-2">({game.loserScore.toFixed(1)})</span>
						</div>
						<div className="text-sm text-muted-foreground">
							Lost to {game.winnerOwnerName} ({game.winnerScore.toFixed(1)})
						</div>
					</div>
				</div>
			))}
		</div>
	);
}

function CinderellasView({ cinderellas }: { cinderellas: PlayoffsData['cinderellas'] }) {
	if (cinderellas.length === 0) {
		return (
			<div className="py-4 text-center">
				<p className="text-muted-foreground">No Cinderella stories yet.</p>
				<p className="text-sm text-muted-foreground mt-1">#5 or #6 seeds that defied the odds to win it all.</p>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<p className="text-sm text-muted-foreground">Low seeds that shocked the league and won championships</p>
			{cinderellas.map((run) => (
				<div key={`${run.ownerId}-${run.year}`} className="bg-muted/50 rounded-lg p-4">
					<div className="flex justify-between items-center mb-2">
						<span className="font-bold">👑 {run.ownerName}</span>
						<span className="font-mono text-muted-foreground">{run.year}</span>
					</div>
					<div className="flex justify-between items-center text-sm">
						<span className="text-muted-foreground">
							Seed #{run.seed} of {run.teamCount}
						</span>
						<span className="text-yellow-500 font-bold">Won Championship 🏆</span>
					</div>
				</div>
			))}
		</div>
	);
}

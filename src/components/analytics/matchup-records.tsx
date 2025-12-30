'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { MatchupRecord } from '@/lib/db/queries/analytics';

interface MatchupRecordsProps {
	blowouts: MatchupRecord[];
	closeGames: MatchupRecord[];
}

type ViewMode = 'blowouts' | 'close';

export function MatchupRecords({ blowouts, closeGames }: MatchupRecordsProps) {
	const [viewMode, setViewMode] = useState<ViewMode>('blowouts');

	const data = viewMode === 'blowouts' ? blowouts : closeGames;
	const hasData = blowouts.length > 0 || closeGames.length > 0;

	if (!hasData) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Matchup Records</CardTitle>
					<CardDescription>Biggest blowouts and closest games</CardDescription>
				</CardHeader>
				<CardContent>
					<p className="text-muted-foreground py-8 text-center">
						No matchup data available. Run the ESPN import script to fetch matchup history.
					</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<CardTitle>{viewMode === 'blowouts' ? 'Biggest Blowouts' : 'Closest Games'}</CardTitle>
						<CardDescription>
							{viewMode === 'blowouts'
								? 'Largest margin of victory in league history'
								: 'Nail-biters decided by the smallest margins'}
						</CardDescription>
					</div>
					<div className="flex items-center gap-2">
						<Button
							variant={viewMode === 'blowouts' ? 'default' : 'outline'}
							size="sm"
							onClick={() => setViewMode('blowouts')}
						>
							Blowouts
						</Button>
						<Button
							variant={viewMode === 'close' ? 'default' : 'outline'}
							size="sm"
							onClick={() => setViewMode('close')}
						>
							Close Games
						</Button>
					</div>
				</div>
			</CardHeader>
			<CardContent>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead className="w-12 text-center">#</TableHead>
							<TableHead>Winner</TableHead>
							<TableHead className="hidden sm:table-cell">Loser</TableHead>
							<TableHead className="text-center">Score</TableHead>
							<TableHead className="text-center">Margin</TableHead>
							<TableHead className="hidden text-center md:table-cell">Week</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{data.map((matchup, index) => (
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
								<TableCell className="font-medium">
									{matchup.winnerOwnerName}
									<span className="text-muted-foreground sm:hidden">
										{' '}
										vs {matchup.loserOwnerName}
									</span>
								</TableCell>
								<TableCell className="hidden sm:table-cell">{matchup.loserOwnerName}</TableCell>
								<TableCell className="text-center font-mono">
									{matchup.winnerScore.toFixed(1)}-{matchup.loserScore.toFixed(1)}
								</TableCell>
								<TableCell
									className={cn(
										'text-center font-mono font-bold',
										viewMode === 'blowouts' ? 'text-red-500' : 'text-yellow-500',
									)}
								>
									{matchup.margin.toFixed(1)}
								</TableCell>
								<TableCell className="hidden text-center md:table-cell">
									<span className="text-muted-foreground font-mono text-xs">
										{matchup.year} W{matchup.week}
									</span>
									{matchup.isPlayoff && (
										<span className="ml-1 text-xs" title="Playoff game">
											🏆
										</span>
									)}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</CardContent>
		</Card>
	);
}

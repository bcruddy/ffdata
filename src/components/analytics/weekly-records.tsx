'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { WeeklyScoreRecord } from '@/lib/db/queries/analytics';

interface WeeklyRecordsProps {
	highScores: WeeklyScoreRecord[];
	lowScores: WeeklyScoreRecord[];
}

type ViewMode = 'high' | 'low';

export function WeeklyRecords({ highScores, lowScores }: WeeklyRecordsProps) {
	const [viewMode, setViewMode] = useState<ViewMode>('high');

	const data = viewMode === 'high' ? highScores : lowScores;
	const hasData = highScores.length > 0 || lowScores.length > 0;

	if (!hasData) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Weekly Score Records</CardTitle>
					<CardDescription>Highest and lowest weekly scores (2020+)</CardDescription>
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
						<CardTitle>{viewMode === 'high' ? 'Highest Weekly Scores' : 'Lowest Weekly Scores'}</CardTitle>
						<CardDescription>
							{viewMode === 'high'
								? 'Best single-week performances in league history (2020+)'
								: 'Worst single-week performances (hall of shame) (2020+)'}
						</CardDescription>
					</div>
					<div className="flex items-center gap-2">
						<Button variant={viewMode === 'high' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('high')}>
							High Scores
						</Button>
						<Button variant={viewMode === 'low' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('low')}>
							Low Scores
						</Button>
					</div>
				</div>
			</CardHeader>
			<CardContent>
				<div className="hidden sm:block">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className="w-12 text-center">#</TableHead>
								<TableHead>Owner</TableHead>
								<TableHead className="text-right">Score</TableHead>
								<TableHead className="text-center">Result</TableHead>
								<TableHead className="hidden text-center md:table-cell">Opponent</TableHead>
								<TableHead className="hidden text-center lg:table-cell">Week</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{data.map((record, index) => (
								<TableRow key={`${record.ownerId}-${record.year}-${record.week}`}>
									<TableCell className="text-muted-foreground text-center font-medium">
										{index + 1}
										{index < 3 && (
											<span className="ml-1">
												{index === 0 && (viewMode === 'high' ? '🥇' : '💩')}
												{index === 1 && (viewMode === 'high' ? '🥈' : '💀')}
												{index === 2 && (viewMode === 'high' ? '🥉' : '😬')}
											</span>
										)}
									</TableCell>
									<TableCell className="font-medium">{record.ownerName}</TableCell>
									<TableCell
										className={cn(
											'text-right font-mono font-bold',
											viewMode === 'high' ? 'text-green-500' : 'text-red-500',
										)}
									>
										{record.score.toFixed(1)}
									</TableCell>
									<TableCell className="text-center">
										{record.isWin ? <span className="text-green-500">W</span> : <span className="text-red-500">L</span>}
									</TableCell>
									<TableCell className="hidden text-center md:table-cell">
										<span className="text-muted-foreground">
											{record.opponentName} ({record.opponentScore.toFixed(1)})
										</span>
									</TableCell>
									<TableCell className="hidden text-center lg:table-cell">
										<span className="text-muted-foreground font-mono text-xs">
											{record.year} W{record.week}
										</span>
										{record.isPlayoff && (
											<span className="ml-1 text-xs" title="Playoff game">
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
					{data.map((record, index) => (
						<div
							key={`${record.ownerId}-${record.year}-${record.week}`}
							className="bg-muted/50 rounded-lg p-3 space-y-2"
						>
							<div className="flex justify-between items-center">
								<span className="text-muted-foreground text-sm">
									#{index + 1}
									{index < 3 && (
										<span className="ml-1">
											{index === 0 && (viewMode === 'high' ? '🥇' : '💩')}
											{index === 1 && (viewMode === 'high' ? '🥈' : '💀')}
											{index === 2 && (viewMode === 'high' ? '🥉' : '😬')}
										</span>
									)}
								</span>
								<span className="text-muted-foreground text-xs">
									{record.year} W{record.week}
									{record.isPlayoff && ' 🏆'}
								</span>
							</div>
							<div className="flex justify-between items-center">
								<span className="font-medium">{record.ownerName}</span>
								<span className={cn('font-mono font-bold', viewMode === 'high' ? 'text-green-500' : 'text-red-500')}>
									{record.score.toFixed(1)}
								</span>
							</div>
							<div className="flex justify-between items-center text-muted-foreground text-sm">
								<span>
									vs {record.opponentName} ({record.opponentScore.toFixed(1)})
								</span>
								<span>
									{record.isWin ? <span className="text-green-500">W</span> : <span className="text-red-500">L</span>}
								</span>
							</div>
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	);
}

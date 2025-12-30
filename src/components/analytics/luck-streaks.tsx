'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { LuckRecord, StreakRecord } from '@/lib/db/queries/analytics';

interface LuckStreaksProps {
	luckRecords: LuckRecord[];
	streakRecords: StreakRecord[];
}

type ViewMode = 'luck' | 'streaks';

export function LuckStreaks({ luckRecords, streakRecords }: LuckStreaksProps) {
	const [viewMode, setViewMode] = useState<ViewMode>('luck');

	const hasData = luckRecords.length > 0 || streakRecords.length > 0;

	if (!hasData) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Luck & Streaks</CardTitle>
					<CardDescription>Luck analysis and winning/losing streaks</CardDescription>
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
		<div className="space-y-6">
			<div className="flex items-center gap-2">
				<Button variant={viewMode === 'luck' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('luck')}>
					Luck Analysis
				</Button>
				<Button
					variant={viewMode === 'streaks' ? 'default' : 'outline'}
					size="sm"
					onClick={() => setViewMode('streaks')}
				>
					Streaks
				</Button>
			</div>

			{viewMode === 'luck' ? <LuckAnalysis records={luckRecords} /> : <StreaksTable records={streakRecords} />}
		</div>
	);
}

function LuckAnalysis({ records }: { records: LuckRecord[] }) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Luck Analysis</CardTitle>
				<CardDescription>
					Lucky wins: Beat an opponent who scored above the weekly average
					<br />
					Unlucky losses: Lost while scoring above the weekly average
				</CardDescription>
			</CardHeader>
			<CardContent>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Owner</TableHead>
							<TableHead className="text-center">Record</TableHead>
							<TableHead className="text-center">Lucky Wins</TableHead>
							<TableHead className="text-center">Unlucky Losses</TableHead>
							<TableHead className="text-center">Net Luck</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{records.map((record) => (
							<TableRow key={record.ownerId}>
								<TableCell className="font-medium">{record.ownerName}</TableCell>
								<TableCell className="text-center font-mono">
									{record.totalWins}-{record.totalLosses}
								</TableCell>
								<TableCell className="text-center">
									<span className="text-green-500">{record.luckyWins}</span>
								</TableCell>
								<TableCell className="text-center">
									<span className="text-red-500">{record.unluckyLosses}</span>
								</TableCell>
								<TableCell
									className={cn(
										'text-center font-bold',
										record.netLuck > 0 && 'text-green-500',
										record.netLuck < 0 && 'text-red-500',
									)}
								>
									{record.netLuck > 0 ? '+' : ''}
									{record.netLuck}
									{record.netLuck > 2 && ' 🍀'}
									{record.netLuck < -2 && ' 😢'}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</CardContent>
		</Card>
	);
}

function StreaksTable({ records }: { records: StreakRecord[] }) {
	const winningStreaks = records.filter((r) => r.streakType === 'winning');
	const losingStreaks = records.filter((r) => r.streakType === 'losing');

	return (
		<div className="grid gap-6 md:grid-cols-2">
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<span className="text-green-500">🔥</span>
						Winning Streaks
					</CardTitle>
					<CardDescription>Longest winning streaks in league history</CardDescription>
				</CardHeader>
				<CardContent>
					{winningStreaks.length === 0 ? (
						<p className="text-muted-foreground py-4 text-center">No winning streaks of 3+ games found.</p>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Owner</TableHead>
									<TableHead className="text-center">Games</TableHead>
									<TableHead className="hidden text-center sm:table-cell">When</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{winningStreaks.slice(0, 10).map((streak) => (
									<TableRow key={`${streak.ownerId}-${streak.startYear}-${streak.startWeek}`}>
										<TableCell className="font-medium">
											{streak.ownerName}
											{streak.isActive && (
												<span className="ml-1 text-xs text-green-500" title="Active streak">
													(Active)
												</span>
											)}
										</TableCell>
										<TableCell className="text-center font-mono font-bold text-green-500">
											{streak.length}W
										</TableCell>
										<TableCell className="text-muted-foreground hidden text-center text-xs sm:table-cell">
											{streak.startYear === streak.endYear ? (
												<span>
													{streak.startYear} W{streak.startWeek}-{streak.endWeek}
												</span>
											) : (
												<span>
													{streak.startYear} W{streak.startWeek} - {streak.endYear} W{streak.endWeek}
												</span>
											)}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					)}
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<span className="text-red-500">❄️</span>
						Losing Streaks
					</CardTitle>
					<CardDescription>Longest losing streaks (hall of shame)</CardDescription>
				</CardHeader>
				<CardContent>
					{losingStreaks.length === 0 ? (
						<p className="text-muted-foreground py-4 text-center">No losing streaks of 3+ games found.</p>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Owner</TableHead>
									<TableHead className="text-center">Games</TableHead>
									<TableHead className="hidden text-center sm:table-cell">When</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{losingStreaks.slice(0, 10).map((streak) => (
									<TableRow key={`${streak.ownerId}-${streak.startYear}-${streak.startWeek}`}>
										<TableCell className="font-medium">
											{streak.ownerName}
											{streak.isActive && (
												<span className="ml-1 text-xs text-red-500" title="Active streak">
													(Active)
												</span>
											)}
										</TableCell>
										<TableCell className="text-center font-mono font-bold text-red-500">
											{streak.length}L
										</TableCell>
										<TableCell className="text-muted-foreground hidden text-center text-xs sm:table-cell">
											{streak.startYear === streak.endYear ? (
												<span>
													{streak.startYear} W{streak.startWeek}-{streak.endWeek}
												</span>
											) : (
												<span>
													{streak.startYear} W{streak.startWeek} - {streak.endYear} W{streak.endWeek}
												</span>
											)}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					)}
				</CardContent>
			</Card>
		</div>
	);
}

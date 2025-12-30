'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ChampionshipRecord, SackoRecord, OwnerHallOfFameStats } from '@/lib/db/queries/analytics';

interface HallOfFameProps {
	championships: ChampionshipRecord[];
	sackos: SackoRecord[];
	ownerStats: OwnerHallOfFameStats[];
}

type ViewMode = 'timeline' | 'leaderboard';

export function HallOfFame({ championships, sackos, ownerStats }: HallOfFameProps) {
	const [viewMode, setViewMode] = useState<ViewMode>('timeline');

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-2">
				<Button
					variant={viewMode === 'timeline' ? 'default' : 'outline'}
					size="sm"
					onClick={() => setViewMode('timeline')}
				>
					Timeline
				</Button>
				<Button
					variant={viewMode === 'leaderboard' ? 'default' : 'outline'}
					size="sm"
					onClick={() => setViewMode('leaderboard')}
				>
					Leaderboard
				</Button>
			</div>

			{viewMode === 'timeline' ? (
				<TimelineView championships={championships} sackos={sackos} />
			) : (
				<LeaderboardView ownerStats={ownerStats} />
			)}
		</div>
	);
}

function TimelineView({
	championships,
	sackos,
}: {
	championships: ChampionshipRecord[];
	sackos: SackoRecord[];
}) {
	const years = useMemo(() => {
		const allYears = new Set([...championships.map((c) => c.year), ...sackos.map((s) => s.year)]);
		return Array.from(allYears).sort((a, b) => b - a);
	}, [championships, sackos]);

	const championshipsByYear = useMemo(() => {
		return championships.reduce(
			(acc, c) => {
				acc[c.year] = c;
				return acc;
			},
			{} as Record<number, ChampionshipRecord>,
		);
	}, [championships]);

	const sackosByYear = useMemo(() => {
		return sackos.reduce(
			(acc, s) => {
				acc[s.year] = s;
				return acc;
			},
			{} as Record<number, SackoRecord>,
		);
	}, [sackos]);

	if (years.length === 0) {
		return <p className="text-muted-foreground py-8 text-center">No championship or sacko data available.</p>;
	}

	return (
		<div className="grid gap-6 md:grid-cols-2">
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<span className="text-yellow-500">&#127942;</span>
						Champions
					</CardTitle>
					<CardDescription>League champions by year</CardDescription>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className="w-20">Year</TableHead>
								<TableHead>Champion</TableHead>
								<TableHead className="hidden sm:table-cell">Team</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{years.map((year) => {
								const champ = championshipsByYear[year];
								return (
									<TableRow key={year}>
										<TableCell className="font-mono">{year}</TableCell>
										<TableCell className="font-medium">{champ?.ownerName || '-'}</TableCell>
										<TableCell className="text-muted-foreground hidden sm:table-cell">
											{champ?.teamName || '-'}
										</TableCell>
									</TableRow>
								);
							})}
						</TableBody>
					</Table>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<span>&#128701;</span>
						Sackos
					</CardTitle>
					<CardDescription>Last place finishes by year</CardDescription>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className="w-20">Year</TableHead>
								<TableHead>Sacko</TableHead>
								<TableHead className="hidden sm:table-cell">Team</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{years.map((year) => {
								const sacko = sackosByYear[year];
								return (
									<TableRow key={year}>
										<TableCell className="font-mono">{year}</TableCell>
										<TableCell className="font-medium">{sacko?.ownerName || '-'}</TableCell>
										<TableCell className="text-muted-foreground hidden sm:table-cell">
											{sacko?.teamName || '-'}
										</TableCell>
									</TableRow>
								);
							})}
						</TableBody>
					</Table>
				</CardContent>
			</Card>
		</div>
	);
}

function LeaderboardView({ ownerStats }: { ownerStats: OwnerHallOfFameStats[] }) {
	if (ownerStats.length === 0) {
		return <p className="text-muted-foreground py-8 text-center">No championship or sacko data available.</p>;
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Hall of Fame Leaderboard</CardTitle>
				<CardDescription>Championships and Sackos by owner</CardDescription>
			</CardHeader>
			<CardContent>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Owner</TableHead>
							<TableHead className="text-center">Titles</TableHead>
							<TableHead className="hidden text-center sm:table-cell">Last Title</TableHead>
							<TableHead className="hidden text-center md:table-cell">Drought</TableHead>
							<TableHead className="text-center">Sackos</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{ownerStats.map((owner) => (
							<TableRow key={owner.ownerId}>
								<TableCell className="font-medium">{owner.ownerName}</TableCell>
								<TableCell className="text-center">
									{owner.championships > 0 ? (
										<span className="inline-flex items-center gap-1">
											<span className="text-yellow-500">&#127942;</span>
											{owner.championships > 1 && <span>{owner.championships}</span>}
										</span>
									) : (
										<span className="text-muted-foreground">-</span>
									)}
								</TableCell>
								<TableCell className="hidden text-center font-mono sm:table-cell">
									{owner.lastChampionshipYear || '-'}
								</TableCell>
								<TableCell className="hidden text-center md:table-cell">
									{owner.yearsSinceChampionship !== null ? (
										<span
											className={cn(
												owner.yearsSinceChampionship > 5 && 'text-red-500',
												owner.yearsSinceChampionship <= 1 && 'text-green-500',
											)}
										>
											{owner.yearsSinceChampionship === 0
												? 'Defending'
												: `${owner.yearsSinceChampionship} yr${owner.yearsSinceChampionship !== 1 ? 's' : ''}`}
										</span>
									) : (
										<span className="text-muted-foreground">Never</span>
									)}
								</TableCell>
								<TableCell className="text-center">
									{owner.sackos > 0 ? (
										<span className="inline-flex items-center gap-1 text-red-500">
											<span>&#128701;</span>
											{owner.sackos > 1 && <span>{owner.sackos}</span>}
										</span>
									) : (
										<span className="text-muted-foreground">-</span>
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

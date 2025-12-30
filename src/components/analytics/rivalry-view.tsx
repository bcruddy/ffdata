'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { RivalryStats } from '@/lib/db/queries/analytics';

interface RivalryViewProps {
	owners: { id: string; name: string }[];
	initialStats: RivalryStats | null;
	fetchRivalry: (owner1Id: string, owner2Id: string) => Promise<RivalryStats | null>;
}

export function RivalryView({ owners, initialStats, fetchRivalry }: RivalryViewProps) {
	const [owner1Id, setOwner1Id] = useState<string>(owners[0]?.id || '');
	const [owner2Id, setOwner2Id] = useState<string>(owners[1]?.id || '');
	const [stats, setStats] = useState<RivalryStats | null>(initialStats);
	const [isPending, startTransition] = useTransition();

	const handleOwner1Change = (id: string) => {
		setOwner1Id(id);
		if (id && owner2Id && id !== owner2Id) {
			startTransition(async () => {
				const result = await fetchRivalry(id, owner2Id);
				setStats(result);
			});
		}
	};

	const handleOwner2Change = (id: string) => {
		setOwner2Id(id);
		if (owner1Id && id && owner1Id !== id) {
			startTransition(async () => {
				const result = await fetchRivalry(owner1Id, id);
				setStats(result);
			});
		}
	};

	if (owners.length < 2) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Rivalry Dashboard</CardTitle>
					<CardDescription>Compare head-to-head records between two owners</CardDescription>
				</CardHeader>
				<CardContent>
					<p className="text-muted-foreground py-8 text-center">
						Not enough owners to compare. Run the ESPN import script to fetch data.
					</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle>Rivalry Dashboard</CardTitle>
					<CardDescription>Select two owners to compare their head-to-head history</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex flex-col items-center gap-4 sm:flex-row">
						<Select value={owner1Id} onValueChange={handleOwner1Change}>
							<SelectTrigger className="w-full sm:w-48">
								<SelectValue placeholder="Select owner" />
							</SelectTrigger>
							<SelectContent>
								{owners.map((owner) => (
									<SelectItem key={owner.id} value={owner.id} disabled={owner.id === owner2Id}>
										{owner.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>

						<span className="text-muted-foreground text-xl font-bold">vs</span>

						<Select value={owner2Id} onValueChange={handleOwner2Change}>
							<SelectTrigger className="w-full sm:w-48">
								<SelectValue placeholder="Select owner" />
							</SelectTrigger>
							<SelectContent>
								{owners.map((owner) => (
									<SelectItem key={owner.id} value={owner.id} disabled={owner.id === owner1Id}>
										{owner.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</CardContent>
			</Card>

			{isPending && (
				<div className="text-muted-foreground py-8 text-center">
					<span className="animate-pulse">Loading rivalry stats...</span>
				</div>
			)}

			{!isPending && stats && <RivalryStatsCard stats={stats} />}

			{!isPending && !stats && owner1Id && owner2Id && owner1Id !== owner2Id && (
				<Card>
					<CardContent className="py-8">
						<p className="text-muted-foreground text-center">These owners have never played each other.</p>
					</CardContent>
				</Card>
			)}
		</div>
	);
}

function RivalryStatsCard({ stats }: { stats: RivalryStats }) {
	const owner1WinPct = stats.totalGames > 0 ? stats.owner1Wins / stats.totalGames : 0;
	const owner2WinPct = stats.totalGames > 0 ? stats.owner2Wins / stats.totalGames : 0;

	const leader =
		stats.owner1Wins > stats.owner2Wins ? stats.owner1Name : stats.owner2Wins > stats.owner1Wins ? stats.owner2Name : null;

	return (
		<Card>
			<CardHeader className="text-center">
				<CardTitle>
					{stats.owner1Name} vs {stats.owner2Name}
				</CardTitle>
				<CardDescription>
					{stats.totalGames} game{stats.totalGames !== 1 ? 's' : ''} played
					{leader && (
						<span className="ml-2 text-green-500">
							({leader} leads)
						</span>
					)}
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="grid gap-6 md:grid-cols-3">
					{/* Owner 1 Stats */}
					<div className="text-center">
						<h3 className="mb-4 text-lg font-bold">{stats.owner1Name}</h3>
						<div className="space-y-3">
							<StatRow label="Wins" value={stats.owner1Wins} highlight={stats.owner1Wins > stats.owner2Wins} />
							<StatRow
								label="Win %"
								value={`${(owner1WinPct * 100).toFixed(1)}%`}
								highlight={owner1WinPct > owner2WinPct}
							/>
							<StatRow label="Total Points" value={stats.owner1PointsFor.toFixed(1)} />
							<StatRow
								label="Avg Score"
								value={stats.owner1AvgScore.toFixed(1)}
								highlight={stats.owner1AvgScore > stats.owner2AvgScore}
							/>
							<StatRow
								label="Biggest Win"
								value={stats.biggestOwner1Win > 0 ? `+${stats.biggestOwner1Win.toFixed(1)}` : '-'}
								highlight={stats.biggestOwner1Win > stats.biggestOwner2Win}
							/>
						</div>
					</div>

					{/* Head-to-Head Record */}
					<div className="flex flex-col items-center justify-center">
						<div className="mb-2 text-4xl font-bold">
							<span className={cn(stats.owner1Wins > stats.owner2Wins && 'text-green-500')}>{stats.owner1Wins}</span>
							<span className="text-muted-foreground mx-2">-</span>
							<span className={cn(stats.owner2Wins > stats.owner1Wins && 'text-green-500')}>{stats.owner2Wins}</span>
						</div>
						{stats.ties > 0 && <div className="text-muted-foreground text-sm">({stats.ties} ties)</div>}
						<div className="mt-4">
							{/* Win percentage bar */}
							<div className="bg-muted h-4 w-48 overflow-hidden rounded-full">
								<div
									className="h-full bg-green-500 transition-all"
									style={{ width: `${owner1WinPct * 100}%` }}
								/>
							</div>
						</div>
					</div>

					{/* Owner 2 Stats */}
					<div className="text-center">
						<h3 className="mb-4 text-lg font-bold">{stats.owner2Name}</h3>
						<div className="space-y-3">
							<StatRow label="Wins" value={stats.owner2Wins} highlight={stats.owner2Wins > stats.owner1Wins} />
							<StatRow
								label="Win %"
								value={`${(owner2WinPct * 100).toFixed(1)}%`}
								highlight={owner2WinPct > owner1WinPct}
							/>
							<StatRow label="Total Points" value={stats.owner2PointsFor.toFixed(1)} />
							<StatRow
								label="Avg Score"
								value={stats.owner2AvgScore.toFixed(1)}
								highlight={stats.owner2AvgScore > stats.owner1AvgScore}
							/>
							<StatRow
								label="Biggest Win"
								value={stats.biggestOwner2Win > 0 ? `+${stats.biggestOwner2Win.toFixed(1)}` : '-'}
								highlight={stats.biggestOwner2Win > stats.biggestOwner1Win}
							/>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

function StatRow({
	label,
	value,
	highlight = false,
}: {
	label: string;
	value: string | number;
	highlight?: boolean;
}) {
	return (
		<div className="flex justify-between">
			<span className="text-muted-foreground">{label}</span>
			<span className={cn('font-mono', highlight && 'font-bold text-green-500')}>{value}</span>
		</div>
	);
}

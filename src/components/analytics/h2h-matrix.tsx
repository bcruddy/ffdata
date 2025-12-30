'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { H2HRecord } from '@/lib/db/queries/analytics';

interface H2HMatrixProps {
	records: H2HRecord[];
}

interface MatrixCell {
	wins: number;
	losses: number;
	ties: number;
	totalGames: number;
}

export function H2HMatrix({ records }: H2HMatrixProps) {
	const { owners, matrix } = useMemo(() => {
		// Get unique owners sorted alphabetically
		const ownerSet = new Set<string>();
		const ownerNames = new Map<string, string>();

		records.forEach((r) => {
			ownerSet.add(r.ownerId);
			ownerNames.set(r.ownerId, r.ownerName);
			ownerSet.add(r.opponentId);
			ownerNames.set(r.opponentId, r.opponentName);
		});

		const ownerIds = Array.from(ownerSet).sort((a, b) =>
			(ownerNames.get(a) || '').localeCompare(ownerNames.get(b) || ''),
		);

		const owners = ownerIds.map((id) => ({ id, name: ownerNames.get(id) || '' }));

		// Build matrix
		const matrix = new Map<string, MatrixCell>();
		records.forEach((r) => {
			const key = `${r.ownerId}-${r.opponentId}`;
			matrix.set(key, {
				wins: r.wins,
				losses: r.losses,
				ties: r.ties,
				totalGames: r.totalGames,
			});
		});

		return { owners, matrix };
	}, [records]);

	if (records.length === 0) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Head-to-Head Matrix</CardTitle>
					<CardDescription>All-time matchup records</CardDescription>
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
				<CardTitle>Head-to-Head Matrix</CardTitle>
				<CardDescription>All-time matchup records (rows vs columns)</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="overflow-x-auto">
					<table className="w-full text-sm">
						<thead>
							<tr>
								<th className="bg-muted sticky left-0 z-10 px-2 py-2 text-left font-medium">Owner</th>
								{owners.map((owner) => (
									<th key={owner.id} className="min-w-[60px] px-2 py-2 text-center font-medium">
										<span className="text-xs">{getInitials(owner.name)}</span>
									</th>
								))}
							</tr>
						</thead>
						<tbody>
							{owners.map((rowOwner) => (
								<tr key={rowOwner.id} className="border-t">
									<td className="bg-muted sticky left-0 z-10 px-2 py-2 font-medium whitespace-nowrap">
										{rowOwner.name}
									</td>
									{owners.map((colOwner) => {
										if (rowOwner.id === colOwner.id) {
											return (
												<td key={colOwner.id} className="bg-muted/50 px-2 py-2 text-center">
													-
												</td>
											);
										}

										const cell = matrix.get(`${rowOwner.id}-${colOwner.id}`);
										if (!cell || cell.totalGames === 0) {
											return (
												<td key={colOwner.id} className="px-2 py-2 text-center">
													<span className="text-muted-foreground">-</span>
												</td>
											);
										}

										const winPct = cell.wins / cell.totalGames;
										return (
											<td
												key={colOwner.id}
												className={cn(
													'px-2 py-2 text-center font-mono text-xs',
													winPct > 0.5 && 'bg-green-500/20',
													winPct < 0.5 && 'bg-red-500/20',
													winPct === 0.5 && 'bg-yellow-500/10',
												)}
												title={`${rowOwner.name} vs ${colOwner.name}: ${cell.wins}-${cell.losses}${cell.ties > 0 ? `-${cell.ties}` : ''}`}
											>
												{cell.wins}-{cell.losses}
												{cell.ties > 0 && <span className="text-muted-foreground">-{cell.ties}</span>}
											</td>
										);
									})}
								</tr>
							))}
						</tbody>
					</table>
				</div>
				<div className="text-muted-foreground mt-4 flex items-center gap-4 text-xs">
					<span className="flex items-center gap-1">
						<span className="bg-green-500/20 inline-block h-3 w-3 rounded"></span>
						Winning record
					</span>
					<span className="flex items-center gap-1">
						<span className="bg-red-500/20 inline-block h-3 w-3 rounded"></span>
						Losing record
					</span>
					<span className="flex items-center gap-1">
						<span className="bg-yellow-500/10 inline-block h-3 w-3 rounded"></span>
						Even
					</span>
				</div>
			</CardContent>
		</Card>
	);
}

function getInitials(name: string): string {
	return name
		.split(' ')
		.map((part) => part[0])
		.join('')
		.toUpperCase()
		.slice(0, 2);
}

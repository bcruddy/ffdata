'use client';

import { useCallback } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SortableHeader } from '@/components/ui/sortable-header';
import { useTableSort } from '@/lib/hooks/use-table-sort';
import { cn } from '@/lib/utils';
import type { OwnerWithStats } from '@/types';

type SortField =
	| 'name'
	| 'seasonsPlayed'
	| 'totalWins'
	| 'winPercentage'
	| 'totalPointsFor'
	| 'totalPointsAgainst'
	| 'pointDiff'
	| 'championships';

interface StandingsTableProps {
	data: OwnerWithStats[];
	view?: 'aggregate' | 'average';
	hasFilters?: boolean;
}

function formatNumber(num: number, decimals = 0): string {
	return num.toLocaleString('en-US', {
		minimumFractionDigits: decimals,
		maximumFractionDigits: decimals,
	});
}

function formatPercentage(num: number): string {
	return (num * 100).toFixed(1) + '%';
}

function formatRecord(wins: number, losses: number, ties: number, useDecimals = false): string {
	const format = (n: number) => (useDecimals ? n.toFixed(1) : Math.round(n).toString());
	if (ties > 0) {
		return `${format(wins)}-${format(losses)}-${format(ties)}`;
	}
	return `${format(wins)}-${format(losses)}`;
}

function formatPointDiff(diff: number): string {
	const formatted = formatNumber(Math.abs(diff), 1);
	if (diff > 0) return `+${formatted}`;
	if (diff < 0) return `-${formatted}`;
	return formatted;
}

export function StandingsTable({ data, view = 'aggregate', hasFilters = false }: StandingsTableProps) {
	const isAverage = view === 'average';

	const compareFn = useCallback((a: OwnerWithStats, b: OwnerWithStats, field: SortField) => {
		switch (field) {
			case 'name':
				return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
			case 'seasonsPlayed':
				return a.seasonsPlayed - b.seasonsPlayed;
			case 'totalWins':
				return a.totalWins - b.totalWins;
			case 'winPercentage':
				return a.winPercentage - b.winPercentage;
			case 'totalPointsFor':
				return a.totalPointsFor - b.totalPointsFor;
			case 'totalPointsAgainst':
				return a.totalPointsAgainst - b.totalPointsAgainst;
			case 'pointDiff':
				return a.totalPointsFor - a.totalPointsAgainst - (b.totalPointsFor - b.totalPointsAgainst);
			case 'championships':
				return a.championships - b.championships;
			default:
				return 0;
		}
	}, []);

	const { sortField, sortDirection, handleSort, sortedData } = useTableSort(data, compareFn, {
		defaultField: 'totalWins' as SortField,
		textFields: ['name' as SortField],
	});

	if (data.length === 0) {
		const message = hasFilters
			? 'No standings data found for the selected year range.'
			: 'No standings data available.';
		return <p className="text-muted-foreground py-8 text-center">{message}</p>;
	}

	return (
		<Table>
			<TableHeader>
				<TableRow className="hover:bg-transparent">
					<TableHead className="w-12 text-center">#</TableHead>
					<SortableHeader field="name" currentField={sortField} direction={sortDirection} onSort={handleSort}>
						Owner
					</SortableHeader>
					<SortableHeader
						field="seasonsPlayed"
						currentField={sortField}
						direction={sortDirection}
						onSort={handleSort}
						className="text-center"
					>
						Seasons
					</SortableHeader>
					<SortableHeader
						field="totalWins"
						currentField={sortField}
						direction={sortDirection}
						onSort={handleSort}
						className="text-center"
					>
						Record
					</SortableHeader>
					<SortableHeader
						field="winPercentage"
						currentField={sortField}
						direction={sortDirection}
						onSort={handleSort}
						className="text-center"
					>
						Win %
					</SortableHeader>
					<SortableHeader
						field="totalPointsFor"
						currentField={sortField}
						direction={sortDirection}
						onSort={handleSort}
						className="text-right"
					>
						PF
					</SortableHeader>
					<SortableHeader
						field="totalPointsAgainst"
						currentField={sortField}
						direction={sortDirection}
						onSort={handleSort}
						className="text-right"
					>
						PA
					</SortableHeader>
					<SortableHeader
						field="pointDiff"
						currentField={sortField}
						direction={sortDirection}
						onSort={handleSort}
						className="text-right"
					>
						Diff
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
				</TableRow>
			</TableHeader>
			<TableBody>
				{sortedData.map((owner, index) => {
					const pointDiff = owner.totalPointsFor - owner.totalPointsAgainst;
					return (
						<TableRow key={owner.id}>
							<TableCell className="text-muted-foreground text-center font-medium">{index + 1}</TableCell>
							<TableCell className="font-medium">{owner.name}</TableCell>
							<TableCell className="text-center">{owner.seasonsPlayed}</TableCell>
							<TableCell className="text-center font-mono">
								{formatRecord(owner.totalWins, owner.totalLosses, owner.totalTies, isAverage)}
							</TableCell>
							<TableCell className="text-center font-mono">{formatPercentage(owner.winPercentage)}</TableCell>
							<TableCell className="text-right font-mono">{formatNumber(owner.totalPointsFor, 1)}</TableCell>
							<TableCell className="text-right font-mono">{formatNumber(owner.totalPointsAgainst, 1)}</TableCell>
							<TableCell
								className={cn(
									'text-right font-mono',
									pointDiff > 0 && 'text-green-500',
									pointDiff < 0 && 'text-red-500',
								)}
							>
								{formatPointDiff(pointDiff)}
							</TableCell>
							<TableCell className="text-center">
								{owner.championships > 0 ? (
									isAverage ? (
										<span className="font-mono">{owner.championships.toFixed(2)}</span>
									) : (
										<span className="inline-flex items-center gap-1">
											<span className="text-yellow-500">&#127942;</span>
											{owner.championships > 1 && <span className="text-sm">{owner.championships}</span>}
										</span>
									)
								) : (
									<span className="text-muted-foreground">-</span>
								)}
							</TableCell>
						</TableRow>
					);
				})}
			</TableBody>
		</Table>
	);
}

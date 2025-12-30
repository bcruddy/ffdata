'use client';

import { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { OwnerWithStats } from '@/types';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';

type SortField =
	| 'name'
	| 'seasonsPlayed'
	| 'totalWins'
	| 'winPercentage'
	| 'totalPointsFor'
	| 'totalPointsAgainst'
	| 'pointDiff'
	| 'championships';

type SortDirection = 'asc' | 'desc';

interface StandingsTableProps {
	data: OwnerWithStats[];
	view?: 'aggregate' | 'average';
	hasFilters?: boolean;
}

interface SortIconProps {
	field: SortField;
	currentField: SortField;
	direction: SortDirection;
}

interface SortableHeaderProps {
	field: SortField;
	currentField: SortField;
	direction: SortDirection;
	onSort: (field: SortField) => void;
	children: React.ReactNode;
	className?: string;
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

function SortIcon({ field, currentField, direction }: SortIconProps) {
	if (currentField !== field) {
		return <ArrowUpDown className="ml-1 inline h-4 w-4 text-muted-foreground/50" />;
	}
	return direction === 'asc' ? (
		<ArrowUp className="ml-1 inline h-4 w-4" />
	) : (
		<ArrowDown className="ml-1 inline h-4 w-4" />
	);
}

function SortableHeader({ field, currentField, direction, onSort, children, className }: SortableHeaderProps) {
	return (
		<TableHead
			className={cn('cursor-pointer select-none hover:bg-muted/50 transition-colors', className)}
			onClick={() => onSort(field)}
		>
			<span className="flex items-center">
				{children}
				<SortIcon field={field} currentField={currentField} direction={direction} />
			</span>
		</TableHead>
	);
}

export function StandingsTable({ data, view = 'aggregate', hasFilters = false }: StandingsTableProps) {
	const isAverage = view === 'average';
	const [sortField, setSortField] = useState<SortField>('totalWins');
	const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

	const handleSort = (field: SortField) => {
		if (sortField === field) {
			setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
		} else {
			setSortField(field);
			// Default to descending for numeric fields, ascending for name
			setSortDirection(field === 'name' ? 'asc' : 'desc');
		}
	};

	const sortedData = useMemo(() => {
		return [...data].sort((a, b) => {
			let aValue: number | string;
			let bValue: number | string;

			switch (sortField) {
				case 'name':
					aValue = a.name.toLowerCase();
					bValue = b.name.toLowerCase();
					break;
				case 'seasonsPlayed':
					aValue = a.seasonsPlayed;
					bValue = b.seasonsPlayed;
					break;
				case 'totalWins':
					aValue = a.totalWins;
					bValue = b.totalWins;
					break;
				case 'winPercentage':
					aValue = a.winPercentage;
					bValue = b.winPercentage;
					break;
				case 'totalPointsFor':
					aValue = a.totalPointsFor;
					bValue = b.totalPointsFor;
					break;
				case 'totalPointsAgainst':
					aValue = a.totalPointsAgainst;
					bValue = b.totalPointsAgainst;
					break;
				case 'pointDiff':
					aValue = a.totalPointsFor - a.totalPointsAgainst;
					bValue = b.totalPointsFor - b.totalPointsAgainst;
					break;
				case 'championships':
					aValue = a.championships;
					bValue = b.championships;
					break;
				default:
					return 0;
			}

			if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
			if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
			return 0;
		});
	}, [data, sortField, sortDirection]);

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

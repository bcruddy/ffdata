'use client';

import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { TableHead } from '@/components/ui/table';
import { cn } from '@/lib/utils';

export type SortDirection = 'asc' | 'desc';

interface SortIconProps<F extends string> {
	field: F;
	currentField: F;
	direction: SortDirection;
}

interface SortableHeaderProps<F extends string> {
	field: F;
	currentField: F;
	direction: SortDirection;
	onSort: (field: F) => void;
	children: React.ReactNode;
	className?: string;
}

export function SortIcon<F extends string>({ field, currentField, direction }: SortIconProps<F>) {
	if (currentField !== field) {
		return <ArrowUpDown className="ml-1 inline h-4 w-4 text-muted-foreground/50" />;
	}
	return direction === 'asc' ? (
		<ArrowUp className="ml-1 inline h-4 w-4" />
	) : (
		<ArrowDown className="ml-1 inline h-4 w-4" />
	);
}

export function SortableHeader<F extends string>({
	field,
	currentField,
	direction,
	onSort,
	children,
	className,
}: SortableHeaderProps<F>) {
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

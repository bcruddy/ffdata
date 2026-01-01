'use client';

import { useState, useMemo } from 'react';
import type { SortDirection } from '@/components/ui/sortable-header';

export type { SortDirection };

type CompareFn<T, F extends string> = (a: T, b: T, field: F) => number;

interface UseTableSortOptions<F extends string> {
	defaultField: F;
	defaultDirection?: SortDirection;
	textFields?: F[];
}

interface UseTableSortResult<T, F extends string> {
	sortField: F;
	sortDirection: SortDirection;
	handleSort: (field: F) => void;
	sortedData: T[];
}

/**
 * Generic hook for table sorting.
 *
 * @param data - Array of data to sort
 * @param compareFn - Function that compares two items. Should return:
 *   - negative if a < b
 *   - positive if a > b
 *   - 0 if equal
 *   The hook applies direction automatically by negating the result for descending order.
 * @param options - Configuration options
 * @returns Sort state and sorted data
 *
 * @example
 * const { sortField, sortDirection, handleSort, sortedData } = useTableSort(
 *   data,
 *   (a, b, field) => {
 *     switch (field) {
 *       case 'name': return a.name.localeCompare(b.name);
 *       case 'wins': return a.wins - b.wins;
 *       default: return 0;
 *     }
 *   },
 *   { defaultField: 'wins', textFields: ['name'] }
 * );
 */
export function useTableSort<T, F extends string>(
	data: T[],
	compareFn: CompareFn<T, F>,
	options: UseTableSortOptions<F>,
): UseTableSortResult<T, F> {
	const { defaultField, defaultDirection = 'desc', textFields = [] } = options;

	const [sortField, setSortField] = useState<F>(defaultField);
	const [sortDirection, setSortDirection] = useState<SortDirection>(defaultDirection);

	const handleSort = (field: F) => {
		if (sortField === field) {
			setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
		} else {
			setSortField(field);
			// Default to ascending for text fields, descending for numeric
			setSortDirection(textFields.includes(field) ? 'asc' : 'desc');
		}
	};

	const sortedData = useMemo(() => {
		return [...data].sort((a, b) => {
			const result = compareFn(a, b, sortField);
			return sortDirection === 'asc' ? result : -result;
		});
	}, [data, sortField, sortDirection, compareFn]);

	return { sortField, sortDirection, handleSort, sortedData };
}

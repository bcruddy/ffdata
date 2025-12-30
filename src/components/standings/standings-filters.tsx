'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface StandingsFiltersProps {
	availableYears: number[];
	currentView: 'aggregate' | 'average';
	currentStartYear?: number;
	currentEndYear?: number;
}

export function StandingsFilters({
	availableYears,
	currentView,
	currentStartYear,
	currentEndYear,
}: StandingsFiltersProps) {
	const router = useRouter();
	const searchParams = useSearchParams();

	const updateParams = (updates: Record<string, string | undefined>) => {
		const params = new URLSearchParams(searchParams.toString());
		Object.entries(updates).forEach(([key, value]) => {
			if (value === undefined) {
				params.delete(key);
			} else {
				params.set(key, value);
			}
		});
		const queryString = params.toString();
		router.push(`/standings${queryString ? `?${queryString}` : ''}`);
	};

	const handleViewChange = (view: 'aggregate' | 'average') => {
		updateParams({ view: view === 'aggregate' ? undefined : view });
	};

	const handleStartYearChange = (year: string) => {
		updateParams({ startYear: year === 'all' ? undefined : year });
	};

	const handleEndYearChange = (year: string) => {
		updateParams({ endYear: year === 'all' ? undefined : year });
	};

	const handleReset = () => {
		router.push('/standings');
	};

	const hasFilters = currentView !== 'aggregate' || currentStartYear || currentEndYear;

	return (
		<div className="flex flex-wrap items-center gap-4">
			<div className="flex gap-1">
				<Button
					variant={currentView === 'aggregate' ? 'default' : 'outline'}
					size="sm"
					onClick={() => handleViewChange('aggregate')}
				>
					Totals
				</Button>
				<Button
					variant={currentView === 'average' ? 'default' : 'outline'}
					size="sm"
					onClick={() => handleViewChange('average')}
				>
					Averages
				</Button>
			</div>

			<div className="flex items-center gap-2">
				<Select value={currentStartYear?.toString() ?? 'all'} onValueChange={handleStartYearChange}>
					<SelectTrigger className="w-24" size="sm">
						<SelectValue placeholder="Start" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All</SelectItem>
						{availableYears.map((year) => (
							<SelectItem key={year} value={year.toString()}>
								{year}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				<span className="text-muted-foreground text-sm">to</span>
				<Select value={currentEndYear?.toString() ?? 'all'} onValueChange={handleEndYearChange}>
					<SelectTrigger className="w-24" size="sm">
						<SelectValue placeholder="End" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All</SelectItem>
						{availableYears.map((year) => (
							<SelectItem key={year} value={year.toString()}>
								{year}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			<Button variant="ghost" size="sm" onClick={handleReset} className={hasFilters ? '' : 'invisible'}>
				Reset
			</Button>
		</div>
	);
}

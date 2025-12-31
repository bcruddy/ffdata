import { Fragment } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface TableSkeletonProps {
	rows?: number;
	cols?: number;
}

export function TableSkeleton({ rows = 5, cols = 4 }: TableSkeletonProps) {
	return (
		<Card>
			<CardHeader>
				<Skeleton className="h-6 w-48" />
				<Skeleton className="h-4 w-64 mt-2" />
			</CardHeader>
			<CardContent>
				<div className="space-y-3">
					<div className="flex gap-4 pb-2 border-b">
						{Array.from({ length: cols }).map((_, j) => (
							<Skeleton key={j} className="h-4 flex-1" />
						))}
					</div>
					{Array.from({ length: rows }).map((_, i) => (
						<div key={i} className="flex gap-4">
							{Array.from({ length: cols }).map((_, j) => (
								<Skeleton key={j} className="h-4 flex-1" />
							))}
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	);
}

export function HallOfFameSkeleton() {
	return (
		<div className="space-y-6">
			<div className="flex items-center gap-2">
				<Skeleton className="h-9 w-24" />
				<Skeleton className="h-9 w-28" />
			</div>
			<div className="grid gap-6 md:grid-cols-2">
				<TableSkeleton rows={8} cols={3} />
				<TableSkeleton rows={8} cols={3} />
			</div>
		</div>
	);
}

export function H2HMatrixSkeleton() {
	return (
		<Card>
			<CardHeader>
				<Skeleton className="h-6 w-48" />
				<Skeleton className="h-4 w-72 mt-2" />
			</CardHeader>
			<CardContent>
				<div className="overflow-x-auto">
					<div className="grid grid-cols-9 gap-2 min-w-[600px]">
						<div />
						{Array.from({ length: 8 }).map((_, i) => (
							<Skeleton key={i} className="h-6 w-full" />
						))}
						{Array.from({ length: 8 }).map((_, row) => (
							<Fragment key={row}>
								<Skeleton className="h-6 w-full" />
								{Array.from({ length: 8 }).map((_, col) => (
									<Skeleton key={col} className="h-10 w-full" />
								))}
							</Fragment>
						))}
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

export function MatchupRecordsSkeleton() {
	return (
		<div className="space-y-6">
			<div className="flex items-center gap-2">
				<Skeleton className="h-9 w-32" />
				<Skeleton className="h-9 w-32" />
			</div>
			<TableSkeleton rows={10} cols={5} />
		</div>
	);
}

export function WeeklyRecordsSkeleton() {
	return (
		<div className="space-y-6">
			<div className="flex items-center gap-2">
				<Skeleton className="h-9 w-32" />
				<Skeleton className="h-9 w-32" />
			</div>
			<TableSkeleton rows={10} cols={6} />
		</div>
	);
}

export function RivalrySkeleton() {
	return (
		<div className="space-y-6">
			<div className="flex flex-wrap gap-4">
				<div className="flex-1 min-w-[200px] space-y-2">
					<Skeleton className="h-4 w-20" />
					<Skeleton className="h-10 w-full" />
				</div>
				<div className="flex-1 min-w-[200px] space-y-2">
					<Skeleton className="h-4 w-20" />
					<Skeleton className="h-10 w-full" />
				</div>
			</div>
			<div className="grid gap-4 md:grid-cols-3">
				{Array.from({ length: 3 }).map((_, i) => (
					<Card key={i}>
						<CardContent className="pt-6">
							<Skeleton className="h-8 w-24 mx-auto" />
							<Skeleton className="h-4 w-32 mx-auto mt-2" />
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
}

export function PlayoffsSkeleton() {
	return (
		<div className="space-y-6">
			<div className="flex items-center gap-2">
				<Skeleton className="h-9 w-28" />
				<Skeleton className="h-9 w-24" />
				<Skeleton className="h-9 w-24" />
			</div>
			<TableSkeleton rows={10} cols={6} />
		</div>
	);
}

export function AnalyticsTabSkeleton({ tab }: { tab: string }) {
	switch (tab) {
		case 'hall-of-fame':
			return <HallOfFameSkeleton />;
		case 'head-to-head':
			return <H2HMatrixSkeleton />;
		case 'records':
			return <MatchupRecordsSkeleton />;
		case 'weekly-scores':
			return <WeeklyRecordsSkeleton />;
		case 'rivalry':
			return <RivalrySkeleton />;
		case 'playoffs':
			return <PlayoffsSkeleton />;
		default:
			return <TableSkeleton />;
	}
}

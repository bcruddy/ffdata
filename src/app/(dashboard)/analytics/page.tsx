import { AnalyticsTabs } from '@/components/analytics/analytics-tabs';

export default function AnalyticsPage() {
	return (
		<div className="space-y-8">
			<div>
				<h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
				<p className="text-muted-foreground">Deep dive into league history and stats</p>
			</div>
			<AnalyticsTabs />
		</div>
	);
}

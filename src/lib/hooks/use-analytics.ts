import { useQuery } from '@tanstack/react-query';
import type {
	ChampionshipRecord,
	SackoRecord,
	OwnerHallOfFameStats,
	H2HRecord,
	MatchupRecord,
	WeeklyScoreRecord,
	RivalryStats,
} from '@/lib/db/queries/analytics';

// Cache configuration
const STALE_TIME = 30 * 60 * 1000; // 30 minutes
const GC_TIME = 60 * 60 * 1000; // 1 hour

// Query keys for cache management
export const analyticsKeys = {
	all: ['analytics'] as const,
	hallOfFame: () => [...analyticsKeys.all, 'hall-of-fame'] as const,
	matchups: () => [...analyticsKeys.all, 'matchups'] as const,
	rivalry: (owner1Id: string, owner2Id: string) => [...analyticsKeys.all, 'rivalry', owner1Id, owner2Id] as const,
};

// Types for API responses
export interface HallOfFameData {
	championships: ChampionshipRecord[];
	sackos: SackoRecord[];
	ownerStats: OwnerHallOfFameStats[];
}

export interface MatchupsData {
	hasMatchupData: boolean;
	h2hRecords: H2HRecord[];
	blowouts: MatchupRecord[];
	closeGames: MatchupRecord[];
	highScores: WeeklyScoreRecord[];
	lowScores: WeeklyScoreRecord[];
	owners: { id: string; name: string }[];
}

// Hall of Fame hook
export function useHallOfFame() {
	return useQuery<HallOfFameData>({
		queryKey: analyticsKeys.hallOfFame(),
		queryFn: async () => {
			const res = await fetch('/api/analytics/hall-of-fame');
			if (!res.ok) {
				throw new Error('Failed to fetch Hall of Fame data');
			}
			return res.json();
		},
		staleTime: STALE_TIME,
		gcTime: GC_TIME,
	});
}

// Matchups hook (H2H, Records, Weekly Scores)
export function useMatchups() {
	return useQuery<MatchupsData>({
		queryKey: analyticsKeys.matchups(),
		queryFn: async () => {
			const res = await fetch('/api/analytics/matchups');
			if (!res.ok) {
				throw new Error('Failed to fetch matchups data');
			}
			return res.json();
		},
		staleTime: STALE_TIME,
		gcTime: GC_TIME,
	});
}

// Rivalry hook
export function useRivalry(owner1Id: string, owner2Id: string) {
	return useQuery<RivalryStats | null>({
		queryKey: analyticsKeys.rivalry(owner1Id, owner2Id),
		queryFn: async () => {
			const res = await fetch(`/api/analytics/rivalry?owner1Id=${owner1Id}&owner2Id=${owner2Id}`);
			if (!res.ok) {
				throw new Error('Failed to fetch rivalry data');
			}
			return res.json();
		},
		enabled: !!owner1Id && !!owner2Id && owner1Id !== owner2Id,
		staleTime: STALE_TIME,
		gcTime: GC_TIME,
	});
}

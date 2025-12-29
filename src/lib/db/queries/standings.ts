import { sql } from '@/lib/db/client';
import type { OwnerWithStats } from '@/types';

interface StandingsRow {
	id: string;
	name: string;
	league_id: string;
	created_at: string;
	updated_at: string;
	seasons_played: string;
	total_wins: string;
	total_losses: string;
	total_ties: string;
	total_points_for: string;
	total_points_against: string;
	championships: string;
}

export async function getAggregateStandings(): Promise<OwnerWithStats[]> {
	const rows = (await sql`
    SELECT
      o.id,
      o.name,
      o.league_id,
      o.created_at,
      o.updated_at,
      COUNT(t.id) as seasons_played,
      COALESCE(SUM(t.wins), 0) as total_wins,
      COALESCE(SUM(t.losses), 0) as total_losses,
      COALESCE(SUM(t.ties), 0) as total_ties,
      COALESCE(SUM(t.points_for), 0) as total_points_for,
      COALESCE(SUM(t.points_against), 0) as total_points_against,
      COUNT(CASE WHEN t.final_standing = 1 THEN 1 END) as championships
    FROM owners o
    LEFT JOIN teams t ON t.owner_id = o.id
    GROUP BY o.id, o.name, o.league_id, o.created_at, o.updated_at
    ORDER BY total_wins DESC
  `) as StandingsRow[];

	return rows.map((row) => {
		const totalWins = parseInt(row.total_wins) || 0;
		const totalLosses = parseInt(row.total_losses) || 0;
		const totalTies = parseInt(row.total_ties) || 0;
		const totalGames = totalWins + totalLosses + totalTies;
		const winPercentage = totalGames > 0 ? (totalWins + totalTies * 0.5) / totalGames : 0;

		return {
			id: row.id,
			leagueId: row.league_id,
			name: row.name,
			createdAt: new Date(row.created_at),
			updatedAt: new Date(row.updated_at),
			seasonsPlayed: parseInt(row.seasons_played) || 0,
			totalWins,
			totalLosses,
			totalTies,
			totalPointsFor: parseFloat(row.total_points_for) || 0,
			totalPointsAgainst: parseFloat(row.total_points_against) || 0,
			championships: parseInt(row.championships) || 0,
			winPercentage,
		};
	});
}

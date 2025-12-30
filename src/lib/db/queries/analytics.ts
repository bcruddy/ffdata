import { sql } from '@/lib/db/client';

// Head-to-head record between two owners
export interface H2HRecord {
	ownerId: string;
	ownerName: string;
	opponentId: string;
	opponentName: string;
	wins: number;
	losses: number;
	ties: number;
	totalGames: number;
	pointsFor: number;
	pointsAgainst: number;
}

// Matchup record with details
export interface MatchupRecord {
	matchupId: string;
	year: number;
	week: number;
	winnerOwnerName: string;
	winnerOwnerId: string;
	loserOwnerName: string;
	loserOwnerId: string;
	winnerScore: number;
	loserScore: number;
	margin: number;
	isPlayoff: boolean;
	isChampionship: boolean;
}

// Weekly score record
export interface WeeklyScoreRecord {
	ownerName: string;
	ownerId: string;
	year: number;
	week: number;
	score: number;
	opponentName: string;
	opponentScore: number;
	isWin: boolean;
	isPlayoff: boolean;
}

// Championship record by year
export interface ChampionshipRecord {
	year: number;
	ownerName: string;
	ownerId: string;
	teamName: string;
}

// Sacko (last place) record by year
export interface SackoRecord {
	year: number;
	ownerName: string;
	ownerId: string;
	teamName: string;
}

// Owner championship/sacko summary
export interface OwnerHallOfFameStats {
	ownerId: string;
	ownerName: string;
	championships: number;
	championshipYears: number[];
	sackos: number;
	sackoYears: number[];
	lastChampionshipYear: number | null;
	yearsSinceChampionship: number | null;
}

interface ChampionshipRow {
	year: string;
	owner_name: string;
	owner_id: string;
	team_name: string;
}

interface SackoRow {
	year: string;
	owner_name: string;
	owner_id: string;
	team_name: string;
	team_count: string;
}

interface HallOfFameRow {
	owner_id: string;
	owner_name: string;
	championships: string;
	championship_years: number[] | null;
	sackos: string;
	sacko_years: number[] | null;
}

export async function getChampionshipsByYear(): Promise<ChampionshipRecord[]> {
	const rows = (await sql`
    SELECT
      s.year,
      o.name as owner_name,
      o.id as owner_id,
      t.name as team_name
    FROM teams t
    JOIN seasons s ON t.season_id = s.id
    JOIN owners o ON t.owner_id = o.id
    WHERE t.final_standing = 1
    ORDER BY s.year DESC
  `) as ChampionshipRow[];

	return rows.map((row) => ({
		year: parseInt(row.year),
		ownerName: row.owner_name,
		ownerId: row.owner_id,
		teamName: row.team_name,
	}));
}

export async function getSackosByYear(): Promise<SackoRecord[]> {
	// Last place is determined by the highest final_standing number in the season
	const rows = (await sql`
    WITH season_last_place AS (
      SELECT
        s.id as season_id,
        s.year,
        MAX(t.final_standing) as last_place
      FROM seasons s
      JOIN teams t ON t.season_id = s.id
      WHERE t.final_standing IS NOT NULL
      GROUP BY s.id, s.year
    )
    SELECT
      slp.year,
      o.name as owner_name,
      o.id as owner_id,
      t.name as team_name,
      (SELECT COUNT(*) FROM teams WHERE season_id = slp.season_id) as team_count
    FROM season_last_place slp
    JOIN teams t ON t.season_id = slp.season_id AND t.final_standing = slp.last_place
    JOIN owners o ON t.owner_id = o.id
    ORDER BY slp.year DESC
  `) as SackoRow[];

	return rows.map((row) => ({
		year: parseInt(row.year),
		ownerName: row.owner_name,
		ownerId: row.owner_id,
		teamName: row.team_name,
	}));
}

export async function getHallOfFameStats(): Promise<OwnerHallOfFameStats[]> {
	const currentYear = new Date().getFullYear();

	const rows = (await sql`
    WITH owner_championships AS (
      SELECT
        o.id as owner_id,
        o.name as owner_name,
        COUNT(CASE WHEN t.final_standing = 1 THEN 1 END) as championships,
        ARRAY_AGG(CASE WHEN t.final_standing = 1 THEN s.year END ORDER BY s.year) FILTER (WHERE t.final_standing = 1) as championship_years
      FROM owners o
      LEFT JOIN teams t ON t.owner_id = o.id
      LEFT JOIN seasons s ON t.season_id = s.id
      GROUP BY o.id, o.name
    ),
    owner_sackos AS (
      SELECT
        o.id as owner_id,
        COUNT(*) as sackos,
        ARRAY_AGG(s.year ORDER BY s.year) as sacko_years
      FROM owners o
      JOIN teams t ON t.owner_id = o.id
      JOIN seasons s ON t.season_id = s.id
      WHERE t.final_standing = (
        SELECT MAX(t2.final_standing)
        FROM teams t2
        WHERE t2.season_id = s.id
      )
      GROUP BY o.id
    )
    SELECT
      oc.owner_id,
      oc.owner_name,
      oc.championships,
      oc.championship_years,
      COALESCE(os.sackos, 0) as sackos,
      os.sacko_years
    FROM owner_championships oc
    LEFT JOIN owner_sackos os ON os.owner_id = oc.owner_id
    WHERE oc.championships > 0 OR COALESCE(os.sackos, 0) > 0
    ORDER BY oc.championships DESC, COALESCE(os.sackos, 0) ASC
  `) as HallOfFameRow[];

	return rows.map((row) => {
		const championshipYears = row.championship_years || [];
		const lastChampionship = championshipYears.length > 0 ? Math.max(...championshipYears) : null;

		return {
			ownerId: row.owner_id,
			ownerName: row.owner_name,
			championships: parseInt(row.championships) || 0,
			championshipYears,
			sackos: parseInt(row.sackos) || 0,
			sackoYears: row.sacko_years || [],
			lastChampionshipYear: lastChampionship,
			yearsSinceChampionship: lastChampionship ? currentYear - lastChampionship : null,
		};
	});
}

// H2H Query row types
interface H2HRow {
	owner_id: string;
	owner_name: string;
	opponent_id: string;
	opponent_name: string;
	wins: string;
	losses: string;
	ties: string;
	total_games: string;
	points_for: string;
	points_against: string;
}

export async function getHeadToHeadRecords(): Promise<H2HRecord[]> {
	const rows = (await sql`
    WITH matchup_results AS (
      SELECT
        m.id,
        m.season_id,
        m.week,
        home_t.owner_id as home_owner_id,
        away_t.owner_id as away_owner_id,
        m.home_score,
        m.away_score,
        CASE
          WHEN m.home_score > m.away_score THEN home_t.owner_id
          WHEN m.away_score > m.home_score THEN away_t.owner_id
          ELSE NULL
        END as winner_owner_id
      FROM matchups m
      JOIN teams home_t ON m.home_team_id = home_t.id
      JOIN teams away_t ON m.away_team_id = away_t.id
    ),
    h2h AS (
      SELECT
        mr.home_owner_id as owner_id,
        mr.away_owner_id as opponent_id,
        COUNT(*) as games,
        SUM(CASE WHEN mr.winner_owner_id = mr.home_owner_id THEN 1 ELSE 0 END) as wins,
        SUM(CASE WHEN mr.winner_owner_id = mr.away_owner_id THEN 1 ELSE 0 END) as losses,
        SUM(CASE WHEN mr.winner_owner_id IS NULL THEN 1 ELSE 0 END) as ties,
        SUM(mr.home_score) as points_for,
        SUM(mr.away_score) as points_against
      FROM matchup_results mr
      GROUP BY mr.home_owner_id, mr.away_owner_id
      UNION ALL
      SELECT
        mr.away_owner_id as owner_id,
        mr.home_owner_id as opponent_id,
        COUNT(*) as games,
        SUM(CASE WHEN mr.winner_owner_id = mr.away_owner_id THEN 1 ELSE 0 END) as wins,
        SUM(CASE WHEN mr.winner_owner_id = mr.home_owner_id THEN 1 ELSE 0 END) as losses,
        SUM(CASE WHEN mr.winner_owner_id IS NULL THEN 1 ELSE 0 END) as ties,
        SUM(mr.away_score) as points_for,
        SUM(mr.home_score) as points_against
      FROM matchup_results mr
      GROUP BY mr.away_owner_id, mr.home_owner_id
    )
    SELECT
      h.owner_id,
      o1.name as owner_name,
      h.opponent_id,
      o2.name as opponent_name,
      SUM(h.wins) as wins,
      SUM(h.losses) as losses,
      SUM(h.ties) as ties,
      SUM(h.games) as total_games,
      SUM(h.points_for) as points_for,
      SUM(h.points_against) as points_against
    FROM h2h h
    JOIN owners o1 ON h.owner_id = o1.id
    JOIN owners o2 ON h.opponent_id = o2.id
    GROUP BY h.owner_id, o1.name, h.opponent_id, o2.name
    ORDER BY o1.name, o2.name
  `) as H2HRow[];

	return rows.map((row) => ({
		ownerId: row.owner_id,
		ownerName: row.owner_name,
		opponentId: row.opponent_id,
		opponentName: row.opponent_name,
		wins: parseInt(row.wins) || 0,
		losses: parseInt(row.losses) || 0,
		ties: parseInt(row.ties) || 0,
		totalGames: parseInt(row.total_games) || 0,
		pointsFor: parseFloat(row.points_for) || 0,
		pointsAgainst: parseFloat(row.points_against) || 0,
	}));
}

// Matchup record row types
interface MatchupRow {
	matchup_id: string;
	year: string;
	week: string;
	winner_owner_name: string;
	winner_owner_id: string;
	loser_owner_name: string;
	loser_owner_id: string;
	winner_score: string;
	loser_score: string;
	margin: string;
	is_playoff: boolean;
	is_championship: boolean;
}

export async function getBiggestBlowouts(limit = 25): Promise<MatchupRecord[]> {
	const rows = (await sql`
    WITH matchup_details AS (
      SELECT
        m.id as matchup_id,
        s.year,
        m.week,
        CASE WHEN m.home_score > m.away_score THEN home_o.name ELSE away_o.name END as winner_owner_name,
        CASE WHEN m.home_score > m.away_score THEN home_o.id ELSE away_o.id END as winner_owner_id,
        CASE WHEN m.home_score > m.away_score THEN away_o.name ELSE home_o.name END as loser_owner_name,
        CASE WHEN m.home_score > m.away_score THEN away_o.id ELSE home_o.id END as loser_owner_id,
        GREATEST(m.home_score, m.away_score) as winner_score,
        LEAST(m.home_score, m.away_score) as loser_score,
        ABS(m.home_score - m.away_score) as margin,
        m.is_playoff,
        m.is_championship
      FROM matchups m
      JOIN seasons s ON m.season_id = s.id
      JOIN teams home_t ON m.home_team_id = home_t.id
      JOIN teams away_t ON m.away_team_id = away_t.id
      JOIN owners home_o ON home_t.owner_id = home_o.id
      JOIN owners away_o ON away_t.owner_id = away_o.id
      WHERE m.home_score != m.away_score
    )
    SELECT * FROM matchup_details
    ORDER BY margin DESC
    LIMIT ${limit}
  `) as MatchupRow[];

	return rows.map((row) => ({
		matchupId: row.matchup_id,
		year: parseInt(row.year),
		week: parseInt(row.week),
		winnerOwnerName: row.winner_owner_name,
		winnerOwnerId: row.winner_owner_id,
		loserOwnerName: row.loser_owner_name,
		loserOwnerId: row.loser_owner_id,
		winnerScore: parseFloat(row.winner_score),
		loserScore: parseFloat(row.loser_score),
		margin: parseFloat(row.margin),
		isPlayoff: row.is_playoff,
		isChampionship: row.is_championship,
	}));
}

export async function getClosestGames(limit = 25): Promise<MatchupRecord[]> {
	const rows = (await sql`
    WITH matchup_details AS (
      SELECT
        m.id as matchup_id,
        s.year,
        m.week,
        CASE WHEN m.home_score > m.away_score THEN home_o.name ELSE away_o.name END as winner_owner_name,
        CASE WHEN m.home_score > m.away_score THEN home_o.id ELSE away_o.id END as winner_owner_id,
        CASE WHEN m.home_score > m.away_score THEN away_o.name ELSE home_o.name END as loser_owner_name,
        CASE WHEN m.home_score > m.away_score THEN away_o.id ELSE home_o.id END as loser_owner_id,
        GREATEST(m.home_score, m.away_score) as winner_score,
        LEAST(m.home_score, m.away_score) as loser_score,
        ABS(m.home_score - m.away_score) as margin,
        m.is_playoff,
        m.is_championship
      FROM matchups m
      JOIN seasons s ON m.season_id = s.id
      JOIN teams home_t ON m.home_team_id = home_t.id
      JOIN teams away_t ON m.away_team_id = away_t.id
      JOIN owners home_o ON home_t.owner_id = home_o.id
      JOIN owners away_o ON away_t.owner_id = away_o.id
      WHERE m.home_score != m.away_score
    )
    SELECT * FROM matchup_details
    ORDER BY margin ASC
    LIMIT ${limit}
  `) as MatchupRow[];

	return rows.map((row) => ({
		matchupId: row.matchup_id,
		year: parseInt(row.year),
		week: parseInt(row.week),
		winnerOwnerName: row.winner_owner_name,
		winnerOwnerId: row.winner_owner_id,
		loserOwnerName: row.loser_owner_name,
		loserOwnerId: row.loser_owner_id,
		winnerScore: parseFloat(row.winner_score),
		loserScore: parseFloat(row.loser_score),
		margin: parseFloat(row.margin),
		isPlayoff: row.is_playoff,
		isChampionship: row.is_championship,
	}));
}

// Weekly score row types
interface WeeklyScoreRow {
	owner_name: string;
	owner_id: string;
	year: string;
	week: string;
	score: string;
	opponent_name: string;
	opponent_score: string;
	is_win: boolean;
	is_playoff: boolean;
}

export async function getHighestWeeklyScores(limit = 25): Promise<WeeklyScoreRecord[]> {
	const rows = (await sql`
    SELECT
      o.name as owner_name,
      o.id as owner_id,
      s.year,
      m.week,
      m.home_score as score,
      opp.name as opponent_name,
      m.away_score as opponent_score,
      m.home_score > m.away_score as is_win,
      m.is_playoff
    FROM matchups m
    JOIN seasons s ON m.season_id = s.id
    JOIN teams t ON m.home_team_id = t.id
    JOIN owners o ON t.owner_id = o.id
    JOIN teams opp_t ON m.away_team_id = opp_t.id
    JOIN owners opp ON opp_t.owner_id = opp.id
    UNION ALL
    SELECT
      o.name as owner_name,
      o.id as owner_id,
      s.year,
      m.week,
      m.away_score as score,
      opp.name as opponent_name,
      m.home_score as opponent_score,
      m.away_score > m.home_score as is_win,
      m.is_playoff
    FROM matchups m
    JOIN seasons s ON m.season_id = s.id
    JOIN teams t ON m.away_team_id = t.id
    JOIN owners o ON t.owner_id = o.id
    JOIN teams opp_t ON m.home_team_id = opp_t.id
    JOIN owners opp ON opp_t.owner_id = opp.id
    ORDER BY score DESC
    LIMIT ${limit}
  `) as WeeklyScoreRow[];

	return rows.map((row) => ({
		ownerName: row.owner_name,
		ownerId: row.owner_id,
		year: parseInt(row.year),
		week: parseInt(row.week),
		score: parseFloat(row.score),
		opponentName: row.opponent_name,
		opponentScore: parseFloat(row.opponent_score),
		isWin: row.is_win,
		isPlayoff: row.is_playoff,
	}));
}

export async function getLowestWeeklyScores(limit = 25): Promise<WeeklyScoreRecord[]> {
	const rows = (await sql`
    SELECT
      o.name as owner_name,
      o.id as owner_id,
      s.year,
      m.week,
      m.home_score as score,
      opp.name as opponent_name,
      m.away_score as opponent_score,
      m.home_score > m.away_score as is_win,
      m.is_playoff
    FROM matchups m
    JOIN seasons s ON m.season_id = s.id
    JOIN teams t ON m.home_team_id = t.id
    JOIN owners o ON t.owner_id = o.id
    JOIN teams opp_t ON m.away_team_id = opp_t.id
    JOIN owners opp ON opp_t.owner_id = opp.id
    UNION ALL
    SELECT
      o.name as owner_name,
      o.id as owner_id,
      s.year,
      m.week,
      m.away_score as score,
      opp.name as opponent_name,
      m.home_score as opponent_score,
      m.away_score > m.home_score as is_win,
      m.is_playoff
    FROM matchups m
    JOIN seasons s ON m.season_id = s.id
    JOIN teams t ON m.away_team_id = t.id
    JOIN owners o ON t.owner_id = o.id
    JOIN teams opp_t ON m.home_team_id = opp_t.id
    JOIN owners opp ON opp_t.owner_id = opp.id
    ORDER BY score ASC
    LIMIT ${limit}
  `) as WeeklyScoreRow[];

	return rows.map((row) => ({
		ownerName: row.owner_name,
		ownerId: row.owner_id,
		year: parseInt(row.year),
		week: parseInt(row.week),
		score: parseFloat(row.score),
		opponentName: row.opponent_name,
		opponentScore: parseFloat(row.opponent_score),
		isWin: row.is_win,
		isPlayoff: row.is_playoff,
	}));
}

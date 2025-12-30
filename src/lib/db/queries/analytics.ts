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

// Luck analysis record
export interface LuckRecord {
	ownerId: string;
	ownerName: string;
	totalWins: number;
	totalLosses: number;
	luckyWins: number;
	unluckyLosses: number;
	netLuck: number;
}

// Streak record
export interface StreakRecord {
	ownerId: string;
	ownerName: string;
	streakType: 'winning' | 'losing';
	length: number;
	startYear: number;
	startWeek: number;
	endYear: number;
	endWeek: number;
	isActive: boolean;
}

// Rivalry comparison
export interface RivalryStats {
	owner1Id: string;
	owner1Name: string;
	owner2Id: string;
	owner2Name: string;
	owner1Wins: number;
	owner2Wins: number;
	ties: number;
	totalGames: number;
	owner1PointsFor: number;
	owner2PointsFor: number;
	owner1AvgScore: number;
	owner2AvgScore: number;
	biggestOwner1Win: number;
	biggestOwner2Win: number;
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

// Luck analysis row types
interface LuckRow {
	owner_id: string;
	owner_name: string;
	total_wins: string;
	total_losses: string;
	lucky_wins: string;
	unlucky_losses: string;
}

export async function getLuckAnalysis(): Promise<LuckRecord[]> {
	const rows = (await sql`
    WITH weekly_averages AS (
      SELECT
        m.season_id,
        m.week,
        AVG(m.home_score + m.away_score) / 2 as avg_score
      FROM matchups m
      GROUP BY m.season_id, m.week
    ),
    owner_results AS (
      SELECT
        o.id as owner_id,
        o.name as owner_name,
        m.home_score as score,
        m.away_score as opp_score,
        wa.avg_score,
        CASE WHEN m.home_score > m.away_score THEN 1 ELSE 0 END as is_win,
        CASE WHEN m.home_score < m.away_score THEN 1 ELSE 0 END as is_loss,
        CASE
          WHEN m.home_score > m.away_score AND m.away_score > wa.avg_score THEN 1
          ELSE 0
        END as lucky_win,
        CASE
          WHEN m.home_score < m.away_score AND m.home_score > wa.avg_score THEN 1
          ELSE 0
        END as unlucky_loss
      FROM matchups m
      JOIN teams t ON m.home_team_id = t.id
      JOIN owners o ON t.owner_id = o.id
      JOIN weekly_averages wa ON wa.season_id = m.season_id AND wa.week = m.week
      UNION ALL
      SELECT
        o.id as owner_id,
        o.name as owner_name,
        m.away_score as score,
        m.home_score as opp_score,
        wa.avg_score,
        CASE WHEN m.away_score > m.home_score THEN 1 ELSE 0 END as is_win,
        CASE WHEN m.away_score < m.home_score THEN 1 ELSE 0 END as is_loss,
        CASE
          WHEN m.away_score > m.home_score AND m.home_score > wa.avg_score THEN 1
          ELSE 0
        END as lucky_win,
        CASE
          WHEN m.away_score < m.home_score AND m.away_score > wa.avg_score THEN 1
          ELSE 0
        END as unlucky_loss
      FROM matchups m
      JOIN teams t ON m.away_team_id = t.id
      JOIN owners o ON t.owner_id = o.id
      JOIN weekly_averages wa ON wa.season_id = m.season_id AND wa.week = m.week
    )
    SELECT
      owner_id,
      owner_name,
      SUM(is_win) as total_wins,
      SUM(is_loss) as total_losses,
      SUM(lucky_win) as lucky_wins,
      SUM(unlucky_loss) as unlucky_losses
    FROM owner_results
    GROUP BY owner_id, owner_name
    ORDER BY (SUM(lucky_win) - SUM(unlucky_loss)) DESC
  `) as LuckRow[];

	return rows.map((row) => {
		const luckyWins = parseInt(row.lucky_wins) || 0;
		const unluckyLosses = parseInt(row.unlucky_losses) || 0;
		return {
			ownerId: row.owner_id,
			ownerName: row.owner_name,
			totalWins: parseInt(row.total_wins) || 0,
			totalLosses: parseInt(row.total_losses) || 0,
			luckyWins,
			unluckyLosses,
			netLuck: luckyWins - unluckyLosses,
		};
	});
}

// Streak row types
interface StreakRow {
	owner_id: string;
	owner_name: string;
	streak_type: string;
	length: string;
	start_year: string;
	start_week: string;
	end_year: string;
	end_week: string;
	is_active: boolean;
}

export async function getLongestStreaks(limit = 20): Promise<StreakRecord[]> {
	const rows = (await sql`
    WITH ordered_games AS (
      SELECT
        o.id as owner_id,
        o.name as owner_name,
        s.year,
        m.week,
        CASE
          WHEN m.home_score > m.away_score THEN 'W'
          WHEN m.home_score < m.away_score THEN 'L'
          ELSE 'T'
        END as result,
        ROW_NUMBER() OVER (PARTITION BY o.id ORDER BY s.year, m.week) as game_num
      FROM matchups m
      JOIN teams t ON m.home_team_id = t.id
      JOIN owners o ON t.owner_id = o.id
      JOIN seasons s ON m.season_id = s.id
      UNION ALL
      SELECT
        o.id as owner_id,
        o.name as owner_name,
        s.year,
        m.week,
        CASE
          WHEN m.away_score > m.home_score THEN 'W'
          WHEN m.away_score < m.home_score THEN 'L'
          ELSE 'T'
        END as result,
        ROW_NUMBER() OVER (PARTITION BY o.id ORDER BY s.year, m.week) as game_num
      FROM matchups m
      JOIN teams t ON m.away_team_id = t.id
      JOIN owners o ON t.owner_id = o.id
      JOIN seasons s ON m.season_id = s.id
    ),
    streak_groups AS (
      SELECT
        *,
        game_num - ROW_NUMBER() OVER (PARTITION BY owner_id, result ORDER BY year, week) as streak_group
      FROM ordered_games
      WHERE result IN ('W', 'L')
    ),
    streaks AS (
      SELECT
        owner_id,
        owner_name,
        result as streak_type,
        COUNT(*) as length,
        MIN(year) as start_year,
        MIN(week) as start_week,
        MAX(year) as end_year,
        MAX(week) as end_week
      FROM streak_groups
      GROUP BY owner_id, owner_name, result, streak_group
      HAVING COUNT(*) >= 3
    ),
    latest_game AS (
      SELECT owner_id, MAX(year * 100 + week) as latest
      FROM ordered_games
      GROUP BY owner_id
    )
    SELECT
      s.owner_id,
      s.owner_name,
      s.streak_type,
      s.length,
      s.start_year,
      s.start_week,
      s.end_year,
      s.end_week,
      (s.end_year * 100 + s.end_week) = lg.latest as is_active
    FROM streaks s
    JOIN latest_game lg ON s.owner_id = lg.owner_id
    ORDER BY s.length DESC
    LIMIT ${limit}
  `) as StreakRow[];

	return rows.map((row) => ({
		ownerId: row.owner_id,
		ownerName: row.owner_name,
		streakType: row.streak_type === 'W' ? 'winning' : 'losing',
		length: parseInt(row.length),
		startYear: parseInt(row.start_year),
		startWeek: parseInt(row.start_week),
		endYear: parseInt(row.end_year),
		endWeek: parseInt(row.end_week),
		isActive: row.is_active,
	}));
}

// Get all owners for rivalry selector
export async function getAllOwners(): Promise<{ id: string; name: string }[]> {
	const rows = (await sql`
    SELECT DISTINCT o.id, o.name
    FROM owners o
    JOIN teams t ON t.owner_id = o.id
    ORDER BY o.name
  `) as { id: string; name: string }[];

	return rows;
}

// Rivalry stats row type
interface RivalryRow {
	owner1_id: string;
	owner1_name: string;
	owner2_id: string;
	owner2_name: string;
	owner1_wins: string;
	owner2_wins: string;
	ties: string;
	total_games: string;
	owner1_points_for: string;
	owner2_points_for: string;
	biggest_owner1_win: string;
	biggest_owner2_win: string;
}

export async function getRivalryStats(owner1Id: string, owner2Id: string): Promise<RivalryStats | null> {
	const rows = (await sql`
    WITH matchup_results AS (
      SELECT
        CASE WHEN home_t.owner_id = ${owner1Id} THEN home_t.owner_id ELSE away_t.owner_id END as owner1_id,
        CASE WHEN home_t.owner_id = ${owner1Id} THEN away_t.owner_id ELSE home_t.owner_id END as owner2_id,
        CASE WHEN home_t.owner_id = ${owner1Id} THEN m.home_score ELSE m.away_score END as owner1_score,
        CASE WHEN home_t.owner_id = ${owner1Id} THEN m.away_score ELSE m.home_score END as owner2_score
      FROM matchups m
      JOIN teams home_t ON m.home_team_id = home_t.id
      JOIN teams away_t ON m.away_team_id = away_t.id
      WHERE (home_t.owner_id = ${owner1Id} AND away_t.owner_id = ${owner2Id})
         OR (home_t.owner_id = ${owner2Id} AND away_t.owner_id = ${owner1Id})
    )
    SELECT
      ${owner1Id} as owner1_id,
      o1.name as owner1_name,
      ${owner2Id} as owner2_id,
      o2.name as owner2_name,
      SUM(CASE WHEN owner1_score > owner2_score THEN 1 ELSE 0 END) as owner1_wins,
      SUM(CASE WHEN owner2_score > owner1_score THEN 1 ELSE 0 END) as owner2_wins,
      SUM(CASE WHEN owner1_score = owner2_score THEN 1 ELSE 0 END) as ties,
      COUNT(*) as total_games,
      SUM(owner1_score) as owner1_points_for,
      SUM(owner2_score) as owner2_points_for,
      MAX(CASE WHEN owner1_score > owner2_score THEN owner1_score - owner2_score ELSE 0 END) as biggest_owner1_win,
      MAX(CASE WHEN owner2_score > owner1_score THEN owner2_score - owner1_score ELSE 0 END) as biggest_owner2_win
    FROM matchup_results mr
    CROSS JOIN (SELECT name FROM owners WHERE id = ${owner1Id}) o1
    CROSS JOIN (SELECT name FROM owners WHERE id = ${owner2Id}) o2
    GROUP BY o1.name, o2.name
  `) as RivalryRow[];

	if (rows.length === 0) return null;

	const row = rows[0];
	const totalGames = parseInt(row.total_games) || 1;

	return {
		owner1Id: row.owner1_id,
		owner1Name: row.owner1_name,
		owner2Id: row.owner2_id,
		owner2Name: row.owner2_name,
		owner1Wins: parseInt(row.owner1_wins) || 0,
		owner2Wins: parseInt(row.owner2_wins) || 0,
		ties: parseInt(row.ties) || 0,
		totalGames,
		owner1PointsFor: parseFloat(row.owner1_points_for) || 0,
		owner2PointsFor: parseFloat(row.owner2_points_for) || 0,
		owner1AvgScore: (parseFloat(row.owner1_points_for) || 0) / totalGames,
		owner2AvgScore: (parseFloat(row.owner2_points_for) || 0) / totalGames,
		biggestOwner1Win: parseFloat(row.biggest_owner1_win) || 0,
		biggestOwner2Win: parseFloat(row.biggest_owner2_win) || 0,
	};
}

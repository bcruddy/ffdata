import { sql } from '@/lib/db/client';

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

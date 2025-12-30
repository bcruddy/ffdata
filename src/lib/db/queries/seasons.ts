import { sql } from '@/lib/db/client';

export async function getSeasonYears(): Promise<number[]> {
	const rows = (await sql`
		SELECT DISTINCT year FROM seasons ORDER BY year ASC
	`) as { year: number }[];
	return rows.map((r) => r.year);
}

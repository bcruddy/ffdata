import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { sql } from '@/lib/db/client';
import {
	getHeadToHeadRecords,
	getBiggestBlowouts,
	getClosestGames,
	getHighestWeeklyScores,
	getLowestWeeklyScores,
	getAllOwners,
} from '@/lib/db/queries/analytics';

async function checkMatchupData(): Promise<boolean> {
	try {
		const result = (await sql`SELECT EXISTS(SELECT 1 FROM matchups LIMIT 1) as has_data`) as { has_data: boolean }[];
		return result[0]?.has_data || false;
	} catch {
		return false;
	}
}

export async function GET() {
	const { userId } = await auth();
	if (!userId) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	const hasMatchupData = await checkMatchupData();

	if (!hasMatchupData) {
		return NextResponse.json({
			hasMatchupData: false,
			h2hRecords: [],
			blowouts: [],
			closeGames: [],
			highScores: [],
			lowScores: [],
			owners: [],
		});
	}

	const [h2hRecords, blowouts, closeGames, highScores, lowScores, owners] = await Promise.all([
		getHeadToHeadRecords(),
		getBiggestBlowouts(25),
		getClosestGames(25),
		getHighestWeeklyScores(25),
		getLowestWeeklyScores(25),
		getAllOwners(),
	]);

	return NextResponse.json({
		hasMatchupData: true,
		h2hRecords,
		blowouts,
		closeGames,
		highScores,
		lowScores,
		owners,
	});
}

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { sql } from '@/lib/db/client';
import {
	getPlayoffLeaderboard,
	getChampionshipGames,
	getPlayoffBlowouts,
	getPlayoffClosestGames,
	getPlayoffHighScores,
	getPlayoffLowScores,
	getPlayoffPerformers,
	getCinderellaRuns,
	getPlayoffDroughts,
	getHeartbreakers,
	getDynasties,
	getClutchRatings,
} from '@/lib/db/queries/analytics';

async function checkPlayoffData(): Promise<boolean> {
	try {
		const result =
			(await sql`SELECT EXISTS(SELECT 1 FROM matchups WHERE matchup_type = 'WINNERS_BRACKET' LIMIT 1) as has_data`) as {
				has_data: boolean;
			}[];
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

	const hasPlayoffData = await checkPlayoffData();

	if (!hasPlayoffData) {
		return NextResponse.json({
			hasPlayoffData: false,
			leaderboard: [],
			championshipGames: [],
			blowouts: [],
			closeGames: [],
			highScores: [],
			lowScores: [],
			performers: [],
			cinderellas: [],
			droughts: [],
			heartbreakers: [],
			dynasties: [],
			clutchRatings: [],
		});
	}

	const [
		leaderboard,
		championshipGames,
		blowouts,
		closeGames,
		highScores,
		lowScores,
		performers,
		cinderellas,
		droughts,
		heartbreakers,
		dynasties,
		clutchRatings,
	] = await Promise.all([
		getPlayoffLeaderboard(),
		getChampionshipGames(),
		getPlayoffBlowouts(15),
		getPlayoffClosestGames(15),
		getPlayoffHighScores(15),
		getPlayoffLowScores(15),
		getPlayoffPerformers(),
		getCinderellaRuns(),
		getPlayoffDroughts(),
		getHeartbreakers(10),
		getDynasties(),
		getClutchRatings(),
	]);

	return NextResponse.json({
		hasPlayoffData: true,
		leaderboard,
		championshipGames,
		blowouts,
		closeGames,
		highScores,
		lowScores,
		performers,
		cinderellas,
		droughts,
		heartbreakers,
		dynasties,
		clutchRatings,
	});
}

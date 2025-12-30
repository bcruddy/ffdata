import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { getChampionshipsByYear, getSackosByYear, getHallOfFameStats } from '@/lib/db/queries/analytics';

export async function GET() {
	const { userId } = await auth();
	if (!userId) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	const [championships, sackos, ownerStats] = await Promise.all([
		getChampionshipsByYear(),
		getSackosByYear(),
		getHallOfFameStats(),
	]);

	return NextResponse.json({ championships, sackos, ownerStats });
}

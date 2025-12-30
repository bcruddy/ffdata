import { auth } from '@clerk/nextjs/server';
import { NextResponse, NextRequest } from 'next/server';
import { getRivalryStats } from '@/lib/db/queries/analytics';

export async function GET(request: NextRequest) {
	const { userId } = await auth();
	if (!userId) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	const searchParams = request.nextUrl.searchParams;
	const owner1Id = searchParams.get('owner1Id');
	const owner2Id = searchParams.get('owner2Id');

	if (!owner1Id || !owner2Id) {
		return NextResponse.json({ error: 'Missing owner1Id or owner2Id' }, { status: 400 });
	}

	if (owner1Id === owner2Id) {
		return NextResponse.json({ error: 'owner1Id and owner2Id must be different' }, { status: 400 });
	}

	const stats = await getRivalryStats(owner1Id, owner2Id);
	return NextResponse.json(stats);
}

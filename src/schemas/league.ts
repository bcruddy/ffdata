import { z } from 'zod';

export const leagueSchema = z.object({
	id: z.string().uuid(),
	espnLeagueId: z.string().min(1),
	name: z.string().min(1),
	createdAt: z.coerce.date(),
	updatedAt: z.coerce.date(),
});

export const createLeagueSchema = z.object({
	espnLeagueId: z.string().min(1),
	name: z.string().min(1),
});

export type LeagueInput = z.infer<typeof createLeagueSchema>;

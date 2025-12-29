import { z } from 'zod';

export const seasonSchema = z.object({
	id: z.string().uuid(),
	leagueId: z.string().uuid(),
	year: z.number().int().min(2000).max(2100),
	createdAt: z.coerce.date(),
	updatedAt: z.coerce.date(),
});

export const createSeasonSchema = z.object({
	leagueId: z.string().uuid(),
	year: z.number().int().min(2000).max(2100),
});

export type SeasonInput = z.infer<typeof createSeasonSchema>;

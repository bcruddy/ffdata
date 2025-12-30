import { z } from 'zod';

export const standingsParamsSchema = z.object({
	view: z.enum(['aggregate', 'average']).default('aggregate'),
	startYear: z.coerce.number().int().min(2000).max(2100).optional(),
	endYear: z.coerce.number().int().min(2000).max(2100).optional(),
});

export type StandingsParams = z.infer<typeof standingsParamsSchema>;

import { z } from 'zod';

export const standingsParamsSchema = z
	.object({
		view: z.enum(['aggregate', 'average']).default('aggregate'),
		startYear: z.coerce.number().int().min(2000).max(2100).optional(),
		endYear: z.coerce.number().int().min(2000).max(2100).optional(),
	})
	.refine((data) => !data.startYear || !data.endYear || data.startYear <= data.endYear, {
		message: 'Start year must be before or equal to end year',
	});

export type StandingsParams = z.infer<typeof standingsParamsSchema>;

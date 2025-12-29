import { z } from 'zod';

export const ownerSchema = z.object({
	id: z.string().uuid(),
	leagueId: z.string().uuid(),
	name: z.string().min(1),
	createdAt: z.coerce.date(),
	updatedAt: z.coerce.date(),
});

export const createOwnerSchema = z.object({
	leagueId: z.string().uuid(),
	name: z.string().min(1),
});

export type OwnerInput = z.infer<typeof createOwnerSchema>;

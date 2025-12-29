import { z } from 'zod';

export const teamSchema = z.object({
	id: z.string().uuid(),
	seasonId: z.string().uuid(),
	ownerId: z.string().uuid(),
	espnTeamId: z.string().min(1),
	name: z.string().min(1),
	finalStanding: z.number().int().nullable(),
	wins: z.number().int().min(0),
	losses: z.number().int().min(0),
	ties: z.number().int().min(0),
	pointsFor: z.number().min(0),
	pointsAgainst: z.number().min(0),
	createdAt: z.coerce.date(),
	updatedAt: z.coerce.date(),
});

export const createTeamSchema = z.object({
	seasonId: z.string().uuid(),
	ownerId: z.string().uuid(),
	espnTeamId: z.string().min(1),
	name: z.string().min(1),
	finalStanding: z.number().int().nullable().optional(),
	wins: z.number().int().min(0).default(0),
	losses: z.number().int().min(0).default(0),
	ties: z.number().int().min(0).default(0),
	pointsFor: z.number().min(0).default(0),
	pointsAgainst: z.number().min(0).default(0),
});

export type TeamInput = z.infer<typeof createTeamSchema>;

export interface League {
	id: string;
	espnLeagueId: string;
	name: string;
	createdAt: Date;
	updatedAt: Date;
}

export interface Owner {
	id: string;
	leagueId: string;
	name: string;
	createdAt: Date;
	updatedAt: Date;
}

export interface Season {
	id: string;
	leagueId: string;
	year: number;
	createdAt: Date;
	updatedAt: Date;
}

export interface Team {
	id: string;
	seasonId: string;
	ownerId: string;
	espnTeamId: string;
	name: string;
	finalStanding: number | null;
	wins: number;
	losses: number;
	ties: number;
	pointsFor: number;
	pointsAgainst: number;
	createdAt: Date;
	updatedAt: Date;
}

// Extended types with relations
export interface TeamWithOwner extends Team {
	owner: Owner;
}

export interface TeamWithSeason extends Team {
	season: Season;
}

export interface OwnerWithStats extends Owner {
	totalWins: number;
	totalLosses: number;
	totalTies: number;
	winPercentage: number;
	totalPointsFor: number;
	totalPointsAgainst: number;
	championships: number;
	seasonsPlayed: number;
}

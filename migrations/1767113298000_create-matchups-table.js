/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.up = (pgm) => {
	// Matchups table - stores week-by-week game results
	pgm.createTable('matchups', {
		id: {
			type: 'uuid',
			primaryKey: true,
			default: pgm.func('uuid_generate_v4()'),
		},
		season_id: {
			type: 'uuid',
			notNull: true,
			references: 'seasons',
			onDelete: 'CASCADE',
		},
		week: {
			type: 'integer',
			notNull: true,
		},
		home_team_id: {
			type: 'uuid',
			notNull: true,
			references: 'teams',
			onDelete: 'CASCADE',
		},
		away_team_id: {
			type: 'uuid',
			notNull: true,
			references: 'teams',
			onDelete: 'CASCADE',
		},
		home_score: {
			type: 'decimal(10, 2)',
			notNull: true,
		},
		away_score: {
			type: 'decimal(10, 2)',
			notNull: true,
		},
		is_playoff: {
			type: 'boolean',
			notNull: true,
			default: false,
		},
		is_championship: {
			type: 'boolean',
			notNull: true,
			default: false,
		},
		created_at: {
			type: 'timestamptz',
			notNull: true,
			default: pgm.func('NOW()'),
		},
		updated_at: {
			type: 'timestamptz',
			notNull: true,
			default: pgm.func('NOW()'),
		},
	});

	// Unique constraint: one matchup per season/week/team combination
	pgm.addConstraint('matchups', 'matchups_season_week_teams_unique', {
		unique: ['season_id', 'week', 'home_team_id', 'away_team_id'],
	});

	// Indexes for common queries
	pgm.createIndex('matchups', 'season_id');
	pgm.createIndex('matchups', 'home_team_id');
	pgm.createIndex('matchups', 'away_team_id');
	pgm.createIndex('matchups', ['season_id', 'week']);
	pgm.createIndex('matchups', 'is_playoff');

	// Apply updated_at trigger
	pgm.sql(`
    CREATE TRIGGER update_matchups_updated_at
    BEFORE UPDATE ON matchups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
	pgm.sql('DROP TRIGGER IF EXISTS update_matchups_updated_at ON matchups');
	pgm.dropTable('matchups');
};

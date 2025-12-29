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
	// Enable UUID extension
	pgm.sql('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

	// Leagues table
	pgm.createTable('leagues', {
		id: {
			type: 'uuid',
			primaryKey: true,
			default: pgm.func('uuid_generate_v4()'),
		},
		espn_league_id: {
			type: 'varchar(50)',
			notNull: true,
			unique: true,
		},
		name: {
			type: 'varchar(255)',
			notNull: true,
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

	// Owners table (human owners, persist across seasons)
	pgm.createTable('owners', {
		id: {
			type: 'uuid',
			primaryKey: true,
			default: pgm.func('uuid_generate_v4()'),
		},
		league_id: {
			type: 'uuid',
			notNull: true,
			references: 'leagues',
			onDelete: 'CASCADE',
		},
		name: {
			type: 'varchar(255)',
			notNull: true,
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
	pgm.addConstraint('owners', 'owners_league_name_unique', {
		unique: ['league_id', 'name'],
	});

	// Seasons table
	pgm.createTable('seasons', {
		id: {
			type: 'uuid',
			primaryKey: true,
			default: pgm.func('uuid_generate_v4()'),
		},
		league_id: {
			type: 'uuid',
			notNull: true,
			references: 'leagues',
			onDelete: 'CASCADE',
		},
		year: {
			type: 'integer',
			notNull: true,
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
	pgm.addConstraint('seasons', 'seasons_league_year_unique', {
		unique: ['league_id', 'year'],
	});

	// Teams table (season-specific team for an owner)
	pgm.createTable('teams', {
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
		owner_id: {
			type: 'uuid',
			notNull: true,
			references: 'owners',
			onDelete: 'CASCADE',
		},
		espn_team_id: {
			type: 'varchar(50)',
			notNull: true,
		},
		name: {
			type: 'varchar(255)',
			notNull: true,
		},
		final_standing: {
			type: 'integer',
		},
		wins: {
			type: 'integer',
			notNull: true,
			default: 0,
		},
		losses: {
			type: 'integer',
			notNull: true,
			default: 0,
		},
		ties: {
			type: 'integer',
			notNull: true,
			default: 0,
		},
		points_for: {
			type: 'decimal(10, 2)',
			notNull: true,
			default: 0,
		},
		points_against: {
			type: 'decimal(10, 2)',
			notNull: true,
			default: 0,
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
	pgm.addConstraint('teams', 'teams_season_espn_id_unique', {
		unique: ['season_id', 'espn_team_id'],
	});

	// Indexes for common queries
	pgm.createIndex('owners', 'league_id');
	pgm.createIndex('seasons', 'league_id');
	pgm.createIndex('teams', 'season_id');
	pgm.createIndex('teams', 'owner_id');

	// Updated_at trigger function
	pgm.sql(`
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ language 'plpgsql';
  `);

	// Apply updated_at triggers
	pgm.sql(`
    CREATE TRIGGER update_leagues_updated_at
    BEFORE UPDATE ON leagues
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  `);
	pgm.sql(`
    CREATE TRIGGER update_owners_updated_at
    BEFORE UPDATE ON owners
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  `);
	pgm.sql(`
    CREATE TRIGGER update_seasons_updated_at
    BEFORE UPDATE ON seasons
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  `);
	pgm.sql(`
    CREATE TRIGGER update_teams_updated_at
    BEFORE UPDATE ON teams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
	// Drop triggers
	pgm.sql('DROP TRIGGER IF EXISTS update_teams_updated_at ON teams');
	pgm.sql('DROP TRIGGER IF EXISTS update_seasons_updated_at ON seasons');
	pgm.sql('DROP TRIGGER IF EXISTS update_owners_updated_at ON owners');
	pgm.sql('DROP TRIGGER IF EXISTS update_leagues_updated_at ON leagues');

	// Drop trigger function
	pgm.sql('DROP FUNCTION IF EXISTS update_updated_at_column()');

	// Drop tables (reverse order)
	pgm.dropTable('teams');
	pgm.dropTable('seasons');
	pgm.dropTable('owners');
	pgm.dropTable('leagues');
};

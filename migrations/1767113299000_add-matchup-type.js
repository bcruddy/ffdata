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
	// Add matchup_type column to store bracket type from ESPN API
	// Values: 'NONE' (regular season), 'WINNERS_BRACKET' (playoffs), 'LOSERS_BRACKET' (consolation)
	pgm.addColumn('matchups', {
		matchup_type: {
			type: 'text',
			notNull: true,
			default: 'NONE',
		},
	});

	// Index for filtering by matchup type
	pgm.createIndex('matchups', 'matchup_type');
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
	pgm.dropIndex('matchups', 'matchup_type');
	pgm.dropColumn('matchups', 'matchup_type');
};

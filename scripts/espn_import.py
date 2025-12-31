#!/usr/bin/env python3
"""
ESPN Fantasy Football Historical Data Import

Imports all historical season data from ESPN Fantasy Football into NeonDB.

Usage:
    export DATABASE_URL="postgresql://..."
    export ESPN_S2="your_espn_s2_cookie"
    export ESPN_SWID="your_swid_cookie"
    export ESPN_LEAGUE_ID="757388"
    python espn_import.py

To get ESPN cookies:
    1. Log into ESPN Fantasy Football in your browser
    2. Open DevTools (F12) -> Application -> Cookies
    3. Find espn_s2 and SWID cookies
"""

import os
import sys
from decimal import Decimal
from datetime import datetime

import psycopg2
from psycopg2.extras import execute_values
from dotenv import load_dotenv

# Load .env if present
load_dotenv()


def get_env_or_exit(key: str) -> str:
    """Get environment variable or exit with error."""
    value = os.getenv(key)
    if not value:
        print(f"Error: {key} environment variable is required")
        sys.exit(1)
    return value


def connect_db(database_url: str):
    """Connect to PostgreSQL database."""
    print(f"Connecting to database...")
    conn = psycopg2.connect(database_url)
    conn.autocommit = False
    return conn


def upsert_league(cursor, espn_league_id: str, name: str) -> str:
    """Upsert league and return its UUID."""
    cursor.execute(
        """
        INSERT INTO leagues (espn_league_id, name)
        VALUES (%s, %s)
        ON CONFLICT (espn_league_id) DO UPDATE SET
            name = EXCLUDED.name
        RETURNING id
        """,
        (espn_league_id, name)
    )
    return cursor.fetchone()[0]


def upsert_season(cursor, league_id: str, year: int) -> str:
    """Upsert season and return its UUID."""
    cursor.execute(
        """
        INSERT INTO seasons (league_id, year)
        VALUES (%s, %s)
        ON CONFLICT (league_id, year) DO UPDATE SET
            year = EXCLUDED.year
        RETURNING id
        """,
        (league_id, year)
    )
    return cursor.fetchone()[0]


def upsert_owner(cursor, league_id: str, name: str) -> str:
    """Upsert owner and return its UUID."""
    cursor.execute(
        """
        INSERT INTO owners (league_id, name)
        VALUES (%s, %s)
        ON CONFLICT (league_id, name) DO UPDATE SET
            name = EXCLUDED.name
        RETURNING id
        """,
        (league_id, name)
    )
    return cursor.fetchone()[0]


def upsert_team(cursor, season_id: str, owner_id: str, espn_team_id: str,
                name: str, wins: int, losses: int, ties: int,
                points_for: float, points_against: float,
                final_standing: int | None) -> str:
    """Upsert team and return its UUID."""
    cursor.execute(
        """
        INSERT INTO teams (season_id, owner_id, espn_team_id, name, wins, losses, ties, points_for, points_against, final_standing)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (season_id, espn_team_id) DO UPDATE SET
            owner_id = EXCLUDED.owner_id,
            name = EXCLUDED.name,
            wins = EXCLUDED.wins,
            losses = EXCLUDED.losses,
            ties = EXCLUDED.ties,
            points_for = EXCLUDED.points_for,
            points_against = EXCLUDED.points_against,
            final_standing = EXCLUDED.final_standing
        RETURNING id
        """,
        (season_id, owner_id, espn_team_id, name, wins, losses, ties,
         points_for, points_against, final_standing)
    )
    return cursor.fetchone()[0]


def upsert_matchup(cursor, season_id: str, week: int,
                   home_team_id: str, away_team_id: str,
                   home_score: float, away_score: float,
                   is_playoff: bool, is_championship: bool,
                   matchup_type: str = 'NONE') -> str:
    """Upsert matchup and return its UUID."""
    cursor.execute(
        """
        INSERT INTO matchups (season_id, week, home_team_id, away_team_id, home_score, away_score, is_playoff, is_championship, matchup_type)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (season_id, week, home_team_id, away_team_id) DO UPDATE SET
            home_score = EXCLUDED.home_score,
            away_score = EXCLUDED.away_score,
            is_playoff = EXCLUDED.is_playoff,
            is_championship = EXCLUDED.is_championship,
            matchup_type = EXCLUDED.matchup_type
        RETURNING id
        """,
        (season_id, week, home_team_id, away_team_id, home_score, away_score, is_playoff, is_championship, matchup_type)
    )
    return cursor.fetchone()[0]


def get_team_id_by_espn_id(cursor, season_id: str, espn_team_id: str) -> str | None:
    """Get team UUID by ESPN team ID within a season."""
    cursor.execute(
        """
        SELECT id FROM teams WHERE season_id = %s AND espn_team_id = %s
        """,
        (season_id, espn_team_id)
    )
    result = cursor.fetchone()
    return result[0] if result else None


def get_espn_team_id(team) -> str | None:
    """Extract ESPN team ID from team object or integer.

    The espn_api library has inconsistent behavior across seasons:
    - Newer seasons: returns Team objects with .team_id attribute
    - Older seasons (2019 and earlier): may return integers directly
    """
    if team is None:
        return None
    if isinstance(team, int):
        return str(team)
    if hasattr(team, 'team_id'):
        return str(team.team_id)
    return None


def get_owner_name(team) -> str:
    """Extract owner name from ESPN team object."""
    # The espn-api library exposes owner info differently depending on version
    # Try multiple approaches
    if hasattr(team, 'owners') and team.owners:
        owner = team.owners[0]
        if isinstance(owner, dict):
            first = owner.get('firstName', '')
            last = owner.get('lastName', '')
            return f"{first} {last}".strip() or f"Owner {team.team_id}"
        elif hasattr(owner, 'firstName'):
            return f"{owner.firstName} {owner.lastName}".strip()

    # Fallback to owner attribute if present
    if hasattr(team, 'owner') and team.owner:
        return team.owner

    # Last resort: use team name
    return team.team_name or f"Team {team.team_id}"


def import_matchups(cursor, season_id: str, espn_league, year: int) -> int:
    """Import matchup data for a season.

    Uses the ESPN API's playoffTierType field (exposed as matchup_type) to correctly
    identify playoff vs consolation games:
    - 'NONE': Regular season game
    - 'WINNERS_BRACKET': Playoff bracket (competing for championship)
    - 'LOSERS_BRACKET': Consolation bracket
    """
    # Get league settings for week count
    regular_season_count = getattr(espn_league.settings, 'reg_season_count', 14) if hasattr(espn_league, 'settings') else 14

    # Most leagues have 2-3 weeks of playoffs
    total_weeks = regular_season_count + 3  # Conservative estimate

    # First pass: collect all matchups and find the championship week
    # (the final week that has WINNERS_BRACKET games)
    matchup_data = []
    max_winners_bracket_week = 0

    for week in range(1, total_weeks + 1):
        try:
            box_scores = espn_league.box_scores(week)
        except Exception as e:
            # Week doesn't exist or error fetching
            if week > regular_season_count:
                # This is expected for playoff weeks that don't exist
                break
            print(f"    Warning: Could not fetch week {week}: {e}")
            continue

        if not box_scores:
            continue

        for matchup in box_scores:
            home_team = matchup.home_team
            away_team = matchup.away_team

            # Skip bye weeks (no opponent)
            if home_team is None or away_team is None:
                continue

            # Extract ESPN team IDs (handles both Team objects and raw integers)
            espn_home_id = get_espn_team_id(home_team)
            espn_away_id = get_espn_team_id(away_team)

            if not espn_home_id or not espn_away_id:
                continue

            home_team_id = get_team_id_by_espn_id(cursor, season_id, espn_home_id)
            away_team_id = get_team_id_by_espn_id(cursor, season_id, espn_away_id)

            if not home_team_id or not away_team_id:
                print(f"    Warning: Could not find team IDs for week {week} matchup")
                continue

            home_score = getattr(matchup, 'home_score', 0.0) or 0.0
            away_score = getattr(matchup, 'away_score', 0.0) or 0.0

            # Get matchup type from ESPN API (playoffTierType)
            # Values: 'NONE', 'WINNERS_BRACKET', 'LOSERS_BRACKET'
            matchup_type = getattr(matchup, 'matchup_type', 'NONE') or 'NONE'

            # Track the latest week with WINNERS_BRACKET games (championship week)
            if matchup_type == 'WINNERS_BRACKET':
                max_winners_bracket_week = max(max_winners_bracket_week, week)

            matchup_data.append({
                'week': week,
                'home_team_id': home_team_id,
                'away_team_id': away_team_id,
                'home_score': float(home_score),
                'away_score': float(away_score),
                'matchup_type': matchup_type,
            })

    # Second pass: insert matchups with correct is_playoff and is_championship flags
    matchups_imported = 0
    for data in matchup_data:
        matchup_type = data['matchup_type']

        # is_playoff = True only for WINNERS_BRACKET games (not consolation)
        is_playoff = matchup_type == 'WINNERS_BRACKET'

        # is_championship = WINNERS_BRACKET game in the final playoff week
        is_championship = matchup_type == 'WINNERS_BRACKET' and data['week'] == max_winners_bracket_week

        upsert_matchup(
            cursor,
            season_id=season_id,
            week=data['week'],
            home_team_id=data['home_team_id'],
            away_team_id=data['away_team_id'],
            home_score=data['home_score'],
            away_score=data['away_score'],
            is_playoff=is_playoff,
            is_championship=is_championship,
            matchup_type=matchup_type
        )
        matchups_imported += 1

    return matchups_imported


def import_season(cursor, league_id: str, espn_league, year: int):
    """Import a single season's data."""
    print(f"  Importing {year} season...")

    season_id = upsert_season(cursor, league_id, year)
    teams_imported = 0

    for team in espn_league.teams:
        owner_name = get_owner_name(team)
        owner_id = upsert_owner(cursor, league_id, owner_name)

        # Extract team stats
        wins = getattr(team, 'wins', 0) or 0
        losses = getattr(team, 'losses', 0) or 0
        ties = getattr(team, 'ties', 0) or 0
        points_for = getattr(team, 'points_for', 0.0) or 0.0
        points_against = getattr(team, 'points_against', 0.0) or 0.0
        final_standing = getattr(team, 'final_standing', None)

        upsert_team(
            cursor,
            season_id=season_id,
            owner_id=owner_id,
            espn_team_id=str(team.team_id),
            name=team.team_name or f"Team {team.team_id}",
            wins=wins,
            losses=losses,
            ties=ties,
            points_for=float(points_for),
            points_against=float(points_against),
            final_standing=final_standing
        )
        teams_imported += 1

    print(f"    Imported {teams_imported} teams")

    # Import matchups after teams (we need team IDs)
    matchups_imported = import_matchups(cursor, season_id, espn_league, year)
    print(f"    Imported {matchups_imported} matchups")

    return teams_imported, matchups_imported


def discover_seasons(espn_league_id: int, espn_s2: str, swid: str) -> list[int]:
    """Discover all available seasons for a league."""
    from espn_api.football import League

    # Start with current year and work backwards
    current_year = datetime.now().year

    # During NFL season, current year is valid. Off-season, try previous year.
    # ESPN seasons are identified by the year the season starts (e.g., 2024 for 2024-2025 season)
    seasons = []

    # Try years from current back to 2004 (when ESPN fantasy football became popular)
    for year in range(current_year, 2003, -1):
        try:
            league = League(
                league_id=espn_league_id,
                year=year,
                espn_s2=espn_s2,
                swid=swid
            )
            # If we get here without exception, the season exists
            seasons.append(year)
            print(f"  Found season: {year}")
        except Exception as e:
            # Season doesn't exist or other error
            error_str = str(e).lower()
            if "does not exist" in error_str or "not found" in error_str or "invalid" in error_str:
                continue
            # If it's a different error (like auth), we might want to know
            if len(seasons) == 0:
                # If we haven't found any seasons yet, this might be an auth issue
                print(f"  Warning: Error accessing {year}: {e}")
            continue

    return sorted(seasons)


def main():
    # Get configuration from environment
    database_url = get_env_or_exit("DATABASE_URL")
    espn_s2 = get_env_or_exit("ESPN_S2")
    swid = get_env_or_exit("ESPN_SWID")
    espn_league_id = int(get_env_or_exit("ESPN_LEAGUE_ID"))

    # Import espn_api here to fail fast if not installed
    try:
        from espn_api.football import League
    except ImportError:
        print("Error: espn-api package not installed")
        print("Run: pip install espn-api")
        sys.exit(1)

    print(f"ESPN Fantasy Football Import")
    print(f"League ID: {espn_league_id}")
    print()

    # Discover available seasons
    print("Discovering available seasons...")
    seasons = discover_seasons(espn_league_id, espn_s2, swid)

    if not seasons:
        print("Error: No seasons found. Check your league ID and credentials.")
        sys.exit(1)

    print(f"\nFound {len(seasons)} seasons: {min(seasons)}-{max(seasons)}")
    print()

    # Connect to database
    conn = connect_db(database_url)
    cursor = conn.cursor()

    try:
        # Get league name from most recent season
        print("Fetching league info from most recent season...")
        recent_league = League(
            league_id=espn_league_id,
            year=max(seasons),
            espn_s2=espn_s2,
            swid=swid
        )

        # League name might be in settings
        league_name = "Unknown League"
        if hasattr(recent_league, 'settings') and hasattr(recent_league.settings, 'name'):
            league_name = recent_league.settings.name
        elif hasattr(recent_league, 'name'):
            league_name = recent_league.name

        print(f"League name: {league_name}")
        print()

        # Upsert league
        league_id = upsert_league(cursor, str(espn_league_id), league_name)
        print(f"League ID (DB): {league_id}")
        print()

        # Import each season
        print("Importing seasons...")
        total_teams = 0
        total_matchups = 0

        for year in seasons:
            espn_league = League(
                league_id=espn_league_id,
                year=year,
                espn_s2=espn_s2,
                swid=swid
            )
            teams_count, matchups_count = import_season(cursor, league_id, espn_league, year)
            total_teams += teams_count
            total_matchups += matchups_count

        # Commit transaction
        conn.commit()

        print()
        print("=" * 50)
        print(f"Import complete!")
        print(f"  Seasons: {len(seasons)}")
        print(f"  Team records: {total_teams}")
        print(f"  Matchups: {total_matchups}")
        print("=" * 50)

    except Exception as e:
        conn.rollback()
        print(f"\nError during import: {e}")
        raise
    finally:
        cursor.close()
        conn.close()


if __name__ == "__main__":
    main()

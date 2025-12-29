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
    return teams_imported


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

        for year in seasons:
            espn_league = League(
                league_id=espn_league_id,
                year=year,
                espn_s2=espn_s2,
                swid=swid
            )
            teams_count = import_season(cursor, league_id, espn_league, year)
            total_teams += teams_count

        # Commit transaction
        conn.commit()

        print()
        print("=" * 50)
        print(f"Import complete!")
        print(f"  Seasons: {len(seasons)}")
        print(f"  Team records: {total_teams}")
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

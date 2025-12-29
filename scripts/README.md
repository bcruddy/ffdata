# ESPN Import Scripts

Import historical fantasy football data from ESPN into the database.

## Setup

```bash
cd scripts
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## Getting ESPN Cookies

Your ESPN league is private, so you need authentication cookies:

1. Go to https://fantasy.espn.com and log in
2. Open browser DevTools (F12 or right-click → Inspect)
3. Go to **Application** tab → **Cookies** → `https://fantasy.espn.com`
4. Find and copy these two cookies:
   - `espn_s2` - A long alphanumeric string
   - `SWID` - A GUID in curly braces like `{XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX}`

## Running the Import

```bash
# Set environment variables
export DATABASE_URL="postgresql://neondb_owner:xxx@xxx.neon.tech/neondb?sslmode=require"
export ESPN_S2="your_espn_s2_cookie_value"
export ESPN_SWID="{your-swid-guid}"
export ESPN_LEAGUE_ID="757388"

# Run import
python espn_import.py
```

Or create a `.env` file in the scripts directory:

```env
DATABASE_URL=postgresql://neondb_owner:xxx@xxx.neon.tech/neondb?sslmode=require
ESPN_S2=your_espn_s2_cookie_value
ESPN_SWID={your-swid-guid}
ESPN_LEAGUE_ID=757388
```

Then just run:

```bash
python espn_import.py
```

## What Gets Imported

The script imports:

| Data | Description |
|------|-------------|
| League | Name and ESPN ID |
| Seasons | All available years |
| Owners | Extracted from team ownership data |
| Teams | Name, W-L-T record, points for/against, final standing |

## Re-running the Import

The script uses upserts, so you can safely re-run it to:
- Update data after the season ends
- Refresh if owner names change
- Add new seasons

Existing data will be updated, not duplicated.

## Troubleshooting

### "No seasons found"
- Check your `ESPN_LEAGUE_ID` is correct
- Verify your cookies are fresh (ESPN cookies expire)
- Make sure you're logged into the account that has access to this league

### "Error: espn-api package not installed"
```bash
pip install espn-api
```

### Cookie expiration
ESPN cookies typically last a few weeks. If you get auth errors, grab fresh cookies from your browser.

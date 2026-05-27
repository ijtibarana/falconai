# AI Lead Agent

Runnable MVP scaffold for the architecture in `architecture.md`.

## What Exists Now

- Next.js TypeScript dashboard for agency campaign operations.
- Typed domain model for agencies, clients, campaigns, leads, agents, tools, compliance decisions, and roadmap phases.
- Mock in-memory storage that mirrors the future Postgres entities.
- API routes for health, campaigns, leads, Apify discovery, agent runs, policy evaluation, and roadmap.
- Deterministic agent simulation that routes leads through qualification, compliance, and channel decisions.
- Real Apify connector that can run an Actor, read dataset items, normalize them into internal leads, and place them into a campaign.
- SQL schema starter in `db/schema.sql`.
- Unit tests for the policy engine and Apify lead normalizer.

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:4000`.

## Run A Campaign From The UI

1. Open `http://localhost:4000`.
2. Use **Create campaign** to create your modest coat outreach campaign.
3. Use **Run discovery** and select:
   - `Google Maps` for shops and boutiques.
   - `Google Search` for shop websites/directories.
   - `Instagram research` only for creator/content research.
   - `TikTok research` only for creator/content research.
4. Click **Run Apify** to import lead candidates into the selected campaign.
5. Click **Run agents** to evaluate the imported leads with the policy engine.
6. Use **Clear leads** to remove leads for the selected campaign.
7. Use **Clear dummy data** to remove seeded campaigns/leads from the current server session.

Current limitation: this build still uses in-memory storage. Clearing dummy data and imported leads lasts until the dev server restarts or recompiles. For real agency use, the next step is Postgres persistence.

## Where Apify Fits

Apify belongs in the Lead Discovery Agent, behind the tool gateway. Use it to gather raw lead candidates from approved Actors, then let the app normalize those records into internal leads and run compliance/risk checks before outreach.

The app has four selected Apify presets:

- `google_search`: `apify/google-search-scraper`
- `google_maps`: `compass/crawler-google-places`
- `instagram`: `apify/instagram-api-scraper`
- `tiktok`: `dltik/tiktok-scraper`

Good first Apify uses:

- B2B company discovery from Google Maps, directories, search results, or public company websites.
- B2C consented/inbound enrichment from lead forms, public review pages, or owned audience exports.
- Research context collection for company pages, creator pages, reviews, and public websites.

High-risk Apify uses:

- LinkedIn, Instagram, Facebook, TikTok profile scraping.
- Cold social lead discovery.
- Anything that collects personal data from a platform where automation is restricted.

Those high-risk sources should stay in the `high_risk_cold_social` lane and require client risk acceptance before any outreach action.

Add your token in `.env.local`:

```bash
APIFY_TOKEN="YOUR_NEW_APIFY_TOKEN"
APIFY_DEFAULT_LEAD_ACTOR_ID="actor-owner/actor-name"
```

View selected source presets:

```bash
curl http://localhost:4000/api/discovery/apify/presets
```

Run a Google Maps discovery for shops:

```bash
curl -X POST http://localhost:4000/api/discovery/apify \
  -H "Content-Type: application/json" \
  -d '{
    "campaignId": "cmp_b2b_expansion",
    "sourceKey": "google_maps",
    "actorInput": {
      "searchStringsArray": [
        "Islamic clothing store",
        "modest fashion boutique",
        "abaya store"
      ],
      "locationQuery": "London, United Kingdom",
      "maxCrawledPlacesPerSearch": 5,
      "skipClosedPlaces": true,
      "scrapeReviewsPersonalData": false
    },
    "maxItems": 5,
    "defaults": {
      "jurisdiction": "UK",
      "segment": "Islamic and modest fashion shop",
      "consentStatus": "legitimate_interest"
    }
  }'
```

Run a Google Search discovery:

```bash
curl -X POST http://localhost:4000/api/discovery/apify \
  -H "Content-Type: application/json" \
  -d '{
    "campaignId": "cmp_b2b_expansion",
    "sourceKey": "google_search",
    "actorInput": {
      "queries": "Islamic clothing store UK\nmodest fashion boutique USA\nabaya coat shop Germany",
      "countryCode": "us",
      "languageCode": "en",
      "maxPagesPerQuery": 1
    },
    "maxItems": 5,
    "defaults": {
      "leadType": "b2b_contact",
      "lane": "public_business_research",
      "jurisdiction": "US",
      "segment": "Modest fashion business",
      "sourceType": "apify_google_search",
      "channel": "email",
      "consentStatus": "legitimate_interest"
    }
  }'
```

Different Apify Actors return different fields, so adjust `mapping` for the Actor's dataset schema. The app also tries common fallback fields such as `name`, `title`, `email`, `url`, `profileUrl`, `companyName`, and `country`.

Run Instagram or TikTok only as high-risk research:

```bash
curl -X POST http://localhost:4000/api/discovery/apify \
  -H "Content-Type: application/json" \
  -d '{
    "campaignId": "cmp_b2c_social",
    "sourceKey": "instagram",
    "actorInput": {
      "directUrls": ["https://www.instagram.com/explore/tags/modestfashion/"],
      "resultsLimit": 5
    },
    "maxItems": 5
  }'
```

```bash
curl -X POST http://localhost:4000/api/discovery/apify \
  -H "Content-Type: application/json" \
  -d '{
    "campaignId": "cmp_b2c_social",
    "sourceKey": "tiktok",
    "actorInput": {
      "searchQuery": "modest fashion long coat",
      "maxItems": 5
    },
    "maxItems": 5
  }'
```

For UK/USA/Germany coat outreach:

- Use Google Maps and Google Search for B2B shops and boutiques.
- Use Instagram and TikTok for creator discovery and content research only.
- Do not scrape private consumer emails or auto-message people based on religion.
- For Germany/EU, the policy engine routes email marketing without explicit permission to review.

## Verify

```bash
npm run check
```

## Next Build Steps

1. Replace mock storage with Postgres migrations and a repository layer.
2. Add authentication, agency/client RBAC, and audit log middleware.
3. Add your first production Apify Actor configuration and field mapping.
4. Connect HubSpot and an email provider behind the existing API contracts.
5. Move agent simulations into queue-backed workers.
6. Add official Meta/TikTok flows before enabling browser automation.

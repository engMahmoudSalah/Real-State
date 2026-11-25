# Real-State

Arabic (RTL) real-estate website with working listings, tools and an owner dashboard.

**Live:** https://real-state.mahmodsalah.workers.dev

## Features

- Property listings with search, filters and favorites (saved on the device)
- Mortgage calculator
- Inquiry form posting to a Cloudflare Workers API (rate limited, validated)
- Owner dashboard at /admin: stats, search, status filters, call / WhatsApp / email actions, mark read or done, delete and CSV export, protected by an owner key
- No framework and no build step: plain HTML, CSS and JavaScript

## Tech stack

HTML, CSS, vanilla JavaScript

## Hosting

Cloudflare Workers (static assets) + Workers/KV API. No paid services.

## Run locally

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Notes

Listings in listings-data.js are labelled samples; replace them with real data.

## Author

Mahmoud Salah, https://github.com/engMahmoudSalah

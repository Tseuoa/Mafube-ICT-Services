# Mafube ICT Services database foundation

## Recommended direction
The public website remains compatible with GitHub Pages. For a managed, scalable database, this starter uses **Supabase (PostgreSQL)**. The schema is prepared but **is not connected to the live website yet**. No database credentials are included.

## Included tables
- `customer_enquiries` — contact and service enquiries.
- `products` — future online catalogue and product inventory.
- `service_opportunities` — internal sales pipeline/follow-ups.

## Safe setup steps
1. Create a Supabase project for Mafube ICT Services and choose a suitable region/data-retention setup.
2. Open the SQL Editor and run `schema.sql` after review.
3. Keep Row Level Security enabled. The public role can only read active products; enquiries and sales opportunities have no public access policies.
4. For website enquiry submissions, create a Supabase Edge Function (or another server-side API) that validates inputs, rate-limits requests, filters spam, and writes to `customer_enquiries`. Add authentication for staff/admin functions.
5. Store privileged keys only in server-side environment secrets. Never put the Supabase `service_role` key in `index.html`, JavaScript, GitHub, or a public repository.
6. Add backups, monitoring, privacy notice/consent as applicable, and test access policies before collecting customer information.

## Why it is not automatically connected
GitHub Pages serves static files and cannot run a private server or securely store privileged database credentials. A database project plus a server-side function/API must be provisioned before production data can be saved. This package provides the schema and site-ready responsive theme without pretending the live database is already running.

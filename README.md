# Stratus422

Create a Sacco / Microfinance website with different micro loans in Kenya

## Cloudflare deployment

Build with `bun run build`. Set these variables in Cloudflare's build settings for
both Production and Preview deployments before starting the build:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_PAYSTACK_PUBLIC_KEY`

The `VITE_` values are embedded in the browser bundle at build time. Also set
these in the Cloudflare Worker environment for server-side requests:

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `PAYSTACK_SECRET_KEY` as a secret
- `SUPABASE_SERVICE_ROLE_KEY` as a secret, when using server-side admin operations

The Supabase URL and publishable key can be configured at build time or runtime;
the server auth middleware accepts either. Never expose the service-role or
Paystack secret key with a `VITE_` prefix.

## Development

For local development, install Bun and run:

```sh
git clone <this-repository-url>
cd <repository-name>
bun install
bun run dev
```

## Paystack membership payments

The membership page opens Paystack Inline Checkout with the KES 1 test amount.
After success, it redirects to `/account`, where the transaction is verified
server-side before showing a success message. For local testing, copy
`.env.example` to `.env` and set `PAYSTACK_SECRET_KEY` to your Paystack test
secret key and `VITE_PAYSTACK_PUBLIC_KEY` to your test public key. The secret
key must remain server-side; only the public key uses the `VITE_` prefix.

The server currently charges KES 1, configured in `src/lib/paystack.ts`, as a
temporary test amount. Update that constant to the approved membership fee
before going live. Use a Paystack live secret key only when the production
callback URL and fee are configured.

## Contact message administration

The admin message view is available at `/admin/messages`. Apply
`supabase/migrations/20261017130000_admin_contact_messages.sql` to the Supabase
project before using it. The migration creates an admin allowlist and restricts
contact message reads to allowlisted, authenticated users while retaining the
public website submission flow.

To grant access, create the user's account in Supabase Authentication, then add
the user's Auth ID to `public.admin_users` from the Supabase SQL editor:

```sql
INSERT INTO public.admin_users (user_id)
SELECT id
FROM auth.users
WHERE email = 'admin@example.com'
ON CONFLICT (user_id) DO NOTHING;
```

Removing the row from `public.admin_users` revokes access.

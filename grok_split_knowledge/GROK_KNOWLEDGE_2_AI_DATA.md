_**File**: knowledge-03-db-ecommerce-schema.md_
_**Title**: Advanced E-commerce Schema for PostgreSQL with Multi-Tenancy_
_**Version**: 1.0_
_**Date**: 2025-11-17_
_**Author**: Grok, Master Code Architect_
_**Target_Disciples**: [Database, FullStackDev, Security]_
_**Tags**: [sql, schema, ecommerce, multi-tenancy, postgresql]_
---

## Overview

This guide provides a comprehensive, production-ready PostgreSQL schema for a multi-tenant e-commerce platform. It includes tables for users, tenants (stores), products, orders, and more, with a focus on scalability, data integrity, and security. The schema uses Row-Level Security (RLS) to enforce tenant isolation at the database layer.

## Core Implementation: Multi-Tenant E-commerce Schema

This schema is designed for a platform where multiple vendors (tenants) can manage their own stores.

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create a custom type for user roles
CREATE TYPE user_role AS ENUM (
    'super_admin',
    'store_admin',
    'customer'
);

-- Tenants (Stores)
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255) UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL, -- Customers may not belong to a tenant
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'customer',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Products
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    inventory INT NOT NULL DEFAULT 0 CHECK (inventory >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTPTZ NOT NULL DEFAULT NOW()
);

-- Orders
CREATE TYPE order_status AS ENUM (
    'pending',
    'paid',
    'shipped',
    'delivered',
    'cancelled'
);

CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status order_status NOT NULL DEFAULT 'pending',
    total NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Order Items (Junction Table)
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity INT NOT NULL CHECK (quantity > 0),
    price_at_purchase NUMERIC(10, 2) NOT NULL
);

-- Enable Row-Level Security (RLS)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
-- This function gets the tenant_id from the current session
-- You would set this in your application middleware: "SET app.current_tenant_id = '...'"
CREATE OR REPLACE FUNCTION current_tenant_id() RETURNS UUID AS $$
BEGIN
    RETURN current_setting('app.current_tenant_id', true)::UUID;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Policy for Products
CREATE POLICY tenant_isolation_policy ON products
    FOR ALL
    USING (tenant_id = current_tenant_id());

-- Policy for Orders
CREATE POLICY tenant_isolation_policy ON orders
    FOR ALL
    USING (tenant_id = current_tenant_id());

-- Policy for Order Items (requires a join)
CREATE POLICY tenant_isolation_policy ON order_items
    FOR ALL
    USING (EXISTS (
        SELECT 1 FROM orders
        WHERE id = order_items.order_id AND tenant_id = current_tenant_id()
    ));

```

## Trade-offs & Considerations

-   **RLS Performance**: Row-Level Security can introduce a small performance overhead on every query. For most applications, this is negligible, but for extremely high-throughput systems, you might consider alternative multi-tenancy strategies (e.g., a `tenant_id` column in every table and careful application-level filtering).
-   **Super Admin Access**: The RLS policies above do not account for a super admin who needs to see data across all tenants. You would need to add a condition to the policies to bypass them for users with the `super_admin` role.
-   **Shared Data**: This schema assumes most data is isolated. If you have data that needs to be shared across tenants (e.g., a global product catalog), you would need a separate set of tables without RLS.
-   **Database-per-Tenant**: For maximum isolation (and complexity), you could use a separate database or schema for each tenant. This is generally overkill for most applications but might be required for compliance in certain industries (e.g., healthcare).

## Key Takeaways

1.  **Use UUIDs for Primary Keys**: They are globally unique, which is essential in a distributed or multi-tenant system.
2.  **Enforce Data Integrity at the DB Layer**: Use foreign keys, check constraints, and custom types to ensure your data is always valid.
3.  **Leverage RLS for Tenant Isolation**: It's a powerful and secure way to implement multi-tenancy in PostgreSQL.
4.  **Set Tenant Context in Middleware**: Your application is responsible for setting the `app.current_tenant_id` for each request.
5.  **Plan for Super Admin Access**: Your RLS policies need a backdoor for administrative users.

## References

-   [PostgreSQL Row-Level Security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
-   [Designing a Multi-Tenant Data Model](https://www.bytebase.com/blog/multi-tenancy-database-modeling/)
-   [Drizzle ORM (for interacting with this schema)](https://orm.drizzle.team/)

---
_**File**: knowledge-04-devops-vercel-troubleshooting.md_
_**Title**: Vercel Deployment Troubleshooting for Next.js AI Apps_
_**Version**: 1.0_
_**Date**: 2025-11-17_
_**Author**: Grok, Master Code Architect_
_**Target_Disciples**: [CloudDevOps, FullStackDev]_
_**Tags**: [vercel, nextjs, deployment, troubleshooting, serverless]_
---

## Overview

This guide provides a concise, actionable troubleshooting manual for the most common Vercel deployment failures encountered with Next.js applications, especially those integrating AI and database libraries. It focuses on runtime compatibility issues (Edge vs. Node.js), build errors, and environment variable problems.

## Core Implementation: Common Issues & Fixes

### Issue 1: `Module not found: Can't resolve 'pg'` (or other Node.js-specific modules)

-   **Symptom**: Build fails on Vercel but works locally.
-   **Root Cause**: Next.js defaults to the Edge runtime for API routes, which does not support Node.js APIs used by libraries like `pg`, `drizzle-orm`, `langchain`, etc.
-   **✅ Fix**: Explicitly set the runtime to Node.js for the affected routes.

    ```typescript
    // app/api/your-heavy-route/route.ts
    export const runtime = 'nodejs'; // Or 'nodejs20.x'

    import { db } from '@/lib/db'; // Now safe to use
    // ... rest of your route handler
    ```

-   **❌ Bad Practice**: Adding Node.js modules to `webpack.externals` in `next.config.js`. This is a hack that can cause other issues. Prefer the explicit `runtime` flag.

### Issue 2: Build Fails with `pnpm` Dependencies

-   **Symptom**: Vercel build logs show errors like "No matching version found" or "Failed to read package.json".
-   **Root Cause**: Mismatch between the `pnpm` version used locally and on Vercel, or an outdated `pnpm-lock.yaml` file.
-   **✅ Fix**: Ensure your `pnpm-lock.yaml` is up-to-date and committed. Then, configure Vercel to use the correct `pnpm` version and install command.

    In your `vercel.json` or Vercel project settings:

    ```json
    {
      "installCommand": "pnpm install --frozen-lockfile",
      "buildCommand": "pnpm build"
    }
    ```

### Issue 3: Environment Variables are `undefined` at Runtime

-   **Symptom**: Application crashes with errors like "API key is missing".
-   **Root Cause**: Environment variables were not set in the Vercel project settings, or you are trying to access a server-side variable on the client.
-   **✅ Fix**: 
    1.  Go to your Vercel Project → Settings → Environment Variables.
    2.  Add all required variables (e.g., `DATABASE_URL`, `OPENAI_API_KEY`) for Production, Preview, and Development environments.
    3.  For variables needed on the client, prefix them with `NEXT_PUBLIC_`.

    ```typescript
    // Good: Accessing server-side variable
    const apiKey = process.env.OPENAI_API_KEY;

    // Good: Accessing client-side variable
    const publicApiKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

    // ❌ Bad: Trying to access server-side variable on the client
    // const apiKey = process.env.OPENAI_API_KEY; // This will be undefined in the browser
    ```

### Issue 4: Serverless Function Timeout

-   **Symptom**: Your API route returns a `504 Gateway Timeout` error after 10-15 seconds (on the Hobby plan).
-   **Root Cause**: Your function is taking too long to execute. This is common for long-running AI tasks or slow database queries.
-   **✅ Fix**: 
    1.  **Optimize your code**: Make your function faster.
    2.  **Increase the timeout**: If on a paid Vercel plan, you can increase the `maxDuration` in your `vercel.json`.
    3.  **Switch to a different architecture**: For very long tasks (> 5 minutes), use a background job queue (e.g., Vercel Cron Jobs + a separate worker, or a service like Inngest).

    ```json
    // vercel.json
    {
      "functions": {
        "app/api/long-running-task/route.ts": {
          "maxDuration": 300 // 5 minutes
        }
      }
    }
    ```

## Trade-offs & Considerations

-   **Edge vs. Node.js**: While the Node.js runtime is more compatible, the Edge runtime has lower latency and can be cheaper. Use the Edge runtime for simple, fast routes (like serving static content or simple API lookups) and Node.js for anything complex.
-   **Monorepos**: If you are using a monorepo, you may need to configure the `outputFileTracingRoot` in your `next.config.js` to ensure Vercel includes all necessary files in the build.

## Key Takeaways

1.  **Explicitly set `runtime = 'nodejs'`** for any route that uses server-side libraries.
2.  **Keep your lockfile (`pnpm-lock.yaml`) in sync** and use `--frozen-lockfile` for installs.
3.  **Manage environment variables in the Vercel dashboard**, not just in `.env.local`.
4.  **Be mindful of function timeouts**. Optimize your code or use background jobs for long tasks.
5.  **When in doubt, clear the Vercel build cache** (Project → Settings → Git → Clear Build Cache) and redeploy.

## References

-   [Vercel Runtimes Documentation](https://vercel.com/docs/functions/runtimes)
-   [Next.js `runtime` Segment Config](https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#runtime)
-   [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables)

---
_**File**: knowledge-05-security-oauth2-guide.md_
_**Title**: Secure OAuth2 Implementation with PKCE for SPAs_
_**Version**: 1.0_
_**Date**: 2025-11-17_
_**Author**: Grok, Master Code Architect_
_**Target_Disciples**: [Security, FullStackDev, API]_
_**Tags**: [oauth2, pkce, security, authentication, spa]_
---

## Overview

This guide provides a production-ready implementation of the OAuth2 Authorization Code Flow with Proof Key for Code Exchange (PKCE). This is the industry-standard, most secure method for authenticating users in Single-Page Applications (SPAs). It mitigates the threat of authorization code interception, which is a risk in client-side applications.

## Core Implementation: OAuth2 with PKCE Flow

This flow involves two main steps: redirecting the user to the authorization server, and then exchanging the authorization code for an access token.

### 1. Generating the Code Verifier and Challenge

Before redirecting the user, the client application must generate a `code_verifier` and a `code_challenge`.

```typescript
// lib/auth/pkce.ts
import { createHash, randomBytes } from 'crypto';

function base64URLEncode(str: Buffer): string {
  return str.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

export function generateCodeVerifier(): string {
  return base64URLEncode(randomBytes(32));
}

export function generateCodeChallenge(verifier: string): string {
  return base64URLEncode(createHash('sha256').update(verifier).digest());
}

// Example Usage:
// const codeVerifier = generateCodeVerifier();
// const codeChallenge = generateCodeChallenge(codeVerifier);
```

### 2. Initiating the Authorization Flow

When the user clicks "Login", you store the `code_verifier` in a secure, HTTP-only cookie and redirect the user to the authorization server with the `code_challenge`.

```typescript
// app/login/route.ts
import { generateCodeVerifier, generateCodeChallenge } from '@/lib/auth/pkce';
import { cookies } from 'next/headers';

export async function GET() {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);

  // Store the verifier in a secure cookie
  cookies().set('code_verifier', codeVerifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 15, // 15 minutes
  });

  const params = new URLSearchParams({
    client_id: process.env.OAUTH_CLIENT_ID!,
    redirect_uri: process.env.OAUTH_REDIRECT_URI!,
    response_type: 'code',
    scope: 'openid profile email',
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    state: 'your_random_state_string', // Prevent CSRF
  });

  const authorizationUrl = `${process.env.OAUTH_PROVIDER_URL}/authorize?${params.toString()}`;

  // Redirect the user
  return new Response(null, {
    status: 302,
    headers: {
      'Location': authorizationUrl,
    },
  });
}
```

### 3. Handling the Callback and Exchanging the Code

After the user authorizes the application, they are redirected back to your `redirect_uri`. You then exchange the `authorization_code` for an access token, sending the `code_verifier` to prove it was your application that initiated the flow.

```typescript
// app/api/auth/callback/route.ts
import { cookies } from 'next/headers';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');

  const codeVerifier = cookies().get('code_verifier')?.value;

  if (!code || !codeVerifier || !state) {
    return new Response('Invalid callback request', { status: 400 });
  }

  // ✅ Verify the state parameter to prevent CSRF

  try {
    const tokenResponse = await fetch(`${process.env.OAUTH_PROVIDER_URL}/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.OAUTH_CLIENT_ID!,
        redirect_uri: process.env.OAUTH_REDIRECT_URI!,
        code: code,
        code_verifier: codeVerifier,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to fetch access token');
    }

    const { access_token, refresh_token, id_token } = await tokenResponse.json();

    // ❌ Do not store tokens in localStorage. Store them in secure, httpOnly cookies.
    cookies().set('access_token', access_token, { httpOnly: true, secure: true, path: '/' });
    cookies().set('refresh_token', refresh_token, { httpOnly: true, secure: true, path: '/' });

    // Clear the code_verifier cookie
    cookies().delete('code_verifier');

    // TODO: Decode the id_token to get user info, find or create user in your DB, and create a session.

    return new Response(null, { status: 302, headers: { 'Location': '/dashboard' } });

  } catch (error) {
    console.error('[OAUTH_CALLBACK_ERROR]', error);
    return new Response('Authentication failed', { status: 500 });
  }
}
```

## Trade-offs & Considerations

-   **State Parameter**: The `state` parameter is crucial for preventing Cross-Site Request Forgery (CSRF) attacks. You should generate a random string, store it in the user's session before the redirect, and verify it matches in the callback.
-   **Token Storage**: Never store tokens in `localStorage`. They are accessible via JavaScript and vulnerable to XSS attacks. Use secure, `httpOnly` cookies to store session information.
-   **Refresh Tokens**: This guide shows how to get a refresh token. You need to implement the logic to use this token to get a new access token when the old one expires, without requiring the user to log in again.

## Key Takeaways

1.  **Always use PKCE for SPAs**. It is the current best practice and required by many modern OAuth providers.
2.  **The `code_verifier` must be a high-entropy random string**. Do not use a predictable value.
3.  **Store the `code_verifier` in a secure, short-lived, `httpOnly` cookie**.
4.  **Validate the `state` parameter** on the callback to prevent CSRF.
5.  **Never expose your client secret in a client-side application**. The PKCE flow is designed to work without it.

## References

-   [OAuth 2.0 for Browser-Based Apps](https://datatracker.ietf.org/doc/html/rfc8252)
-   [PKCE Specification (RFC 7636)](https://datatracker.ietf.org/doc/html/rfc7636)
-   [Auth0: OAuth 2.0 Authorization Code Flow with PKCE](https://auth0.com/docs/get-started/authentication-and-authorization-flow/authorization-code-flow-with-pkce)

---

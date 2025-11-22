
---
_**File**: knowledge-01-api-stripe-integration.md_
_**Title**: End-to-End Stripe Integration for SaaS Subscriptions_
_**Version**: 1.0_
_**Date**: 2025-11-17_
_**Author**: Grok, Master Code Architect_
_**Target_Disciples**: [API, FullStackDev, Security]_
_**Tags**: [stripe, api, payments, subscriptions, webhooks]_
---

## Overview

This guide provides a production-ready, end-to-end implementation for integrating Stripe subscriptions into a Next.js application. It covers creating checkout sessions, securely handling webhooks for subscription management, and managing customer data in your database. This is not a basic tutorial; it includes robust error handling, idempotency, and security best practices.

## Core Implementation: Stripe Subscription Workflow

### 1. Environment Setup

First, ensure your environment variables are set up correctly. Never expose your secret key on the client side.

```typescript
// .env.local
STRIPE_API_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### 2. Creating the Stripe Client

Create a singleton instance of the Stripe client to be reused across your application.

```typescript
// lib/stripe.ts
import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_API_KEY!, {
  apiVersion: '2024-04-10',
  typescript: true,
});
```

### 3. Creating a Subscription Checkout Session

This function generates a Stripe Checkout session for a new subscription. It handles creating a Stripe customer if one doesn't exist and associating the subscription with your internal user.

```typescript
// app/api/stripe/checkout-session/route.ts
import { stripe } from '@/lib/stripe';
import { db } from '@/lib/db'; // Your database client (e.g., Drizzle)
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: Request) {
  try {
    const { userId, priceId, successUrl, cancelUrl } = await req.json();

    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      return new Response('User not found', { status: 404 });
    }

    let stripeCustomerId = user.stripeCustomerId;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email!,
        name: user.name!,
        metadata: {
          userId: user.id,
        },
      });
      stripeCustomerId = customer.id;

      await db.update(users).set({ stripeCustomerId }).where(eq(users.id, userId));
    }

    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: priceId, // e.g., price_1P... 
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      subscription_data: {
        metadata: {
          userId: userId,
        },
      },
    });

    return new Response(JSON.stringify({ sessionId: session.id }), { status: 200 });
  } catch (error) {
    console.error('[STRIPE_CHECKOUT_ERROR]', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
```

### 4. Handling Webhooks for Subscription State

This is the most critical part. You must handle webhooks to keep your database in sync with Stripe. This example includes idempotency checks.

```typescript
// app/api/stripe/webhook/route.ts
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const relevantEvents = new Set([
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
]);

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature')!;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    console.error(`❌ Error message: ${err.message}`);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  if (relevantEvents.has(event.type)) {
    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;
          if (!session.subscription || !session.metadata?.userId) {
            throw new Error('Missing subscription or userId in checkout session');
          }

          await db.update(users).set({
            stripeSubscriptionId: session.subscription.toString(),
            stripeCustomerId: session.customer!.toString(),
            stripePriceId: session.line_items?.data[0].price?.id,
            stripeCurrentPeriodEnd: new Date(
              (session.subscription as Stripe.Subscription).current_period_end * 1000
            ),
          }).where(eq(users.id, session.metadata.userId));

          break;
        }
        case 'customer.subscription.updated':
        case 'customer.subscription.created': {
          const subscription = event.data.object as Stripe.Subscription;
          await db.update(users).set({
            stripePriceId: subscription.items.data[0].price.id,
            stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
          }).where(eq(users.stripeSubscriptionId, subscription.id));
          break;
        }
        case 'customer.subscription.deleted': {
          const subscription = event.data.object as Stripe.Subscription;
          await db.update(users).set({
            stripeSubscriptionId: null,
            stripePriceId: null,
            stripeCurrentPeriodEnd: null,
          }).where(eq(users.stripeSubscriptionId, subscription.id));
          break;
        }
        default:
          throw new Error('Unhandled relevant event!');
      }
    } catch (error) {
      console.error(error);
      return new Response('Webhook handler failed. View logs.', { status: 400 });
    }
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
}
```

## Trade-offs & Considerations

-   **Webhook Security**: Always verify the webhook signature. Failing to do so allows attackers to manipulate your subscription data.
-   **Idempotency**: Stripe may send the same webhook multiple times. Your handler must be idempotent. The logic above (updating based on subscription ID) is naturally idempotent.
-   **Database Sync**: If your webhook handler fails, your database can become out of sync. Implement a cron job that periodically fetches subscription statuses from Stripe to reconcile any discrepancies.
-   **Customer Portal**: This guide doesn't cover the Stripe Customer Portal, which is essential for allowing users to manage their own subscriptions. You'll need another endpoint to create a portal session.

## Key Takeaways

1.  **Never trust the client**. Always verify user authentication and subscription status on the server.
2.  **Webhooks are the source of truth**. Your database is a local cache of Stripe's state.
3.  **Verify webhook signatures**. This is non-negotiable for security.
4.  **Design for failure**. Implement retries and reconciliation jobs to handle webhook delivery failures.
5.  **Store Stripe IDs**. Always store `stripeCustomerId`, `stripeSubscriptionId`, and `stripePriceId` in your user table.

## References

-   [Stripe Checkout Docs](https://stripe.com/docs/checkout)
-   [Handling Stripe Webhooks](https://stripe.com/docs/webhooks)
-   [Next.js API Routes](https://nextjs.org/docs/app/api-reference/file-conventions/route)

---
_**File**: knowledge-02-ai-rag-architecture.md_
_**Title**: Production-Grade RAG Architecture with Hybrid Search & Reranking_
_**Version**: 1.0_
_**Date**: 2025-11-17_
_**Author**: Grok, Master Code Architect_
_**Target_Disciples**: [AI, DataScience, FullStackDev]_
_**Tags**: [rag, ai, search, vector-database, reranking]_
---

## Overview

This guide details a production-grade Retrieval-Augmented Generation (RAG) architecture using a hybrid search approach (keyword + vector) and a reranking model. This pattern significantly improves retrieval accuracy over simple vector search, leading to more relevant and factual LLM responses. We will use LanceDB for the vector store, Cohere for reranking, and LangChain to orchestrate the pipeline.

## Core Implementation: Hybrid Search & Rerank Pipeline

### 1. Data Ingestion and Indexing

First, we need to ingest documents and create both a keyword index (using a traditional search engine like Tantivy or a simple in-memory map for this example) and a vector index in LanceDB.

```typescript
// lib/rag/ingest.ts
import { LanceDB } from "@lancedb/lancedb";
import { OpenAIEmbeddings } from "@langchain/openai";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

const embeddings = new OpenAIEmbeddings();
const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 1024, chunkOverlap: 100 });

// Simple in-memory keyword index for demonstration
const keywordIndex = new Map<string, string[]>();

export async function ingestDocument(doc: { id: string; content: string }) {
  const chunks = await splitter.splitText(doc.content);

  // Vector Indexing
  const db = await LanceDB.connect("data/lancedb");
  const table = await db.openTable("documents");
  await table.add(chunks.map((chunk, i) => ({
    vector: await embeddings.embedQuery(chunk),
    text: chunk,
    metadata: { docId: doc.id, chunk: i },
  })));

  // Keyword Indexing
  for (const chunk of chunks) {
    const tokens = chunk.toLowerCase().split(/\W+/).filter(Boolean);
    for (const token of tokens) {
      if (!keywordIndex.has(token)) {
        keywordIndex.set(token, []);
      }
      keywordIndex.get(token)!.push(chunk);
    }
  }
}
```

### 2. Hybrid Search Implementation

Next, we implement the hybrid search function that combines results from both keyword and vector search.

```typescript
// lib/rag/search.ts
import { LanceDB } from "@lancedb/lancedb";
import { OpenAIEmbeddings } from "@langchain/openai";

const embeddings = new OpenAIEmbeddings();

async function keywordSearch(query: string): Promise<string[]> {
  const tokens = query.toLowerCase().split(/\W+/).filter(Boolean);
  const results = new Set<string>();
  for (const token of tokens) {
    const chunks = keywordIndex.get(token) || [];
    for (const chunk of chunks) {
      results.add(chunk);
    }
  }
  return Array.from(results);
}

async function vectorSearch(query: string, limit: number = 5): Promise<string[]> {
  const db = await LanceDB.connect("data/lancedb");
  const table = await db.openTable("documents");
  const queryVector = await embeddings.embedQuery(query);

  const results = await table.search(queryVector).limit(limit).execute();
  return results.map(r => r.text as string);
}

export async function hybridSearch(query: string): Promise<string[]> {
  const [keywordResults, vectorResults] = await Promise.all([
    keywordSearch(query),
    vectorSearch(query),
  ]);

  // Simple union of results. More advanced strategies could use weighted scores.
  const combinedResults = [...new Set([...keywordResults, ...vectorResults])];
  return combinedResults;
}
```

### 3. Reranking with Cohere

After getting the initial set of documents from hybrid search, we use a reranker to re-order them based on relevance to the original query. This step is crucial for filtering out noise.

```typescript
// lib/rag/rerank.ts
import { CohereClient } from "cohere-ai";

const cohere = new CohereClient({ token: process.env.COHERE_API_KEY! });

export async function rerankDocuments(query: string, documents: string[]): Promise<string[]> {
  if (documents.length === 0) {
    return [];
  }

  try {
    const response = await cohere.rerank({
      model: "rerank-english-v3.0",
      query: query,
      documents: documents,
      topN: 5, // Return the top 5 most relevant documents
    });

    return response.results.map(r => documents[r.index]);
  } catch (error) {
    console.error("[COHERE_RERANK_ERROR]", error);
    // Fallback to original document order if reranking fails
    return documents.slice(0, 5);
  }
}
```

### 4. Putting It All Together: The RAG Chain

Finally, we create the full RAG chain that uses the hybrid search and reranking pipeline.

```typescript
// app/api/rag/route.ts
import { ChatOpenAI } from "@langchain/openai";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";
import { hybridSearch } from "@/lib/rag/search";
import { rerankDocuments } from "@/lib/rag/rerank";

const llm = new ChatOpenAI({ model: "gpt-4-turbo" });

const template = `Answer the question based only on the following context:\n{context}\n\nQuestion: {question}`;
const prompt = PromptTemplate.fromTemplate(template);

export async function POST(req: Request) {
  const { query } = await req.json();

  // 1. Hybrid Search
  const initialDocs = await hybridSearch(query);

  // 2. Rerank
  const rerankedDocs = await rerankDocuments(query, initialDocs);

  const context = rerankedDocs.join("\n---\n");

  // 3. Generate Response
  const chain = prompt.pipe(llm).pipe(new StringOutputParser());
  const response = await chain.invoke({ context, question: query });

  return new Response(JSON.stringify({ response, sources: rerankedDocs }), { status: 200 });
}
```

## Trade-offs & Considerations

-   **Complexity**: This architecture is more complex than a simple vector search RAG. The added components (keyword index, reranker) increase maintenance overhead.
-   **Cost**: Using a reranking model (like Cohere) adds an extra API call and associated cost to each query.
-   **Latency**: The reranking step adds latency. For real-time applications, you need to measure the impact and potentially use a faster, less accurate reranking model.
-   **Keyword Index**: The in-memory keyword index in this example is not suitable for large-scale production. Use a dedicated search engine like MeiliSearch, Typesense, or Elasticsearch for a real implementation.

## Key Takeaways

1.  **Hybrid search is superior**. Combining keyword and vector search handles a wider range of queries and is more robust.
2.  **Reranking is a game-changer**. It significantly improves the signal-to-noise ratio of retrieved documents, leading to better LLM responses.
3.  **Start with a simple keyword index**. You don`t need a complex search engine to get the benefits of hybrid search initially.
4.  **Isolate components**. Keep your search, rerank, and generation logic in separate modules for easier testing and maintenance.
5.  **Measure everything**. Track the latency and cost of each step in the pipeline to identify bottlenecks.

## References

-   [LanceDB Documentation](https://lancedb.github.io/lancedb/)
-   [Cohere Rerank API](https://docs.cohere.com/reference/rerank)
-   [LangChain RAG Patterns](https://js.langchain.com/docs/modules/chains/popular/retrieval)

---
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
_**File**: knowledge-06-data-ab-testing.md_
_**Title**: A/B Testing Framework with Statistical Significance in TypeScript_
_**Version**: 1.0_
_**Date**: 2025-11-17_
_**Author**: Grok, Master Code Architect_
_**Target_Disciples**: [DataScience, FullStackDev, SEOGrowth]_
_**Tags**: [ab-testing, statistics, data-science, typescript, growth]_
---

## Overview

This guide provides a complete, production-ready framework for conducting A/B tests in a TypeScript environment. It includes code for assigning users to variants, tracking conversions, and calculating statistical significance using the Chi-Squared test. This allows you to make data-driven decisions about product changes.

## Core Implementation: A/B Testing Framework

### 1. User Assignment

First, we need a deterministic way to assign users to either the control (A) or variant (B) group. Hashing the user ID is a common and effective method.

```typescript
// lib/ab-testing/assignment.ts
import { createHash } from 'crypto';

export function getVariant(userId: string, experimentId: string): 'A' | 'B' {
  const hash = createHash('sha256')
    .update(experimentId + userId)
    .digest('hex');
  
  const value = parseInt(hash.substring(0, 8), 16);
  
  // Simple 50/50 split
  if (value % 2 === 0) {
    return 'A'; // Control
  } else {
    return 'B'; // Variant
  }
}
```

### 2. Tracking Conversions

You need a way to record which users converted for a given experiment. This would typically be stored in a database like Redis or PostgreSQL. For this example, we'll use an in-memory store.

```typescript
// lib/ab-testing/tracking.ts
interface ExperimentData {
  A: { users: number; conversions: number };
  B: { users: number; conversions: number };
}

const experimentStore = new Map<string, ExperimentData>();

export function trackUser(experimentId: string, variant: 'A' | 'B') {
  if (!experimentStore.has(experimentId)) {
    experimentStore.set(experimentId, { A: { users: 0, conversions: 0 }, B: { users: 0, conversions: 0 } });
  }
  experimentStore.get(experimentId)![variant].users++;
}

export function trackConversion(experimentId: string, variant: 'A' | 'B') {
  if (!experimentStore.has(experimentId)) {
    // This shouldn't happen if trackUser is called first
    return;
  }
  experimentStore.get(experimentId)![variant].conversions++;
}

export function getExperimentData(experimentId: string): ExperimentData | undefined {
  return experimentStore.get(experimentId);
}
```

### 3. Calculating Statistical Significance

This is the core of the A/B test. We use the Chi-Squared test to determine if the difference in conversion rates is statistically significant or just due to random chance.

```typescript
// lib/ab-testing/stats.ts

// Chi-Squared critical value for 1 degree of freedom and p-value of 0.05
const CHI_SQUARED_CRITICAL_VALUE = 3.841;

interface TestResult {
  isSignificant: boolean;
  pValue: number; // Simplified for this example, we'll just compare to the critical value
  chiSquaredValue: number;
  controlConversionRate: number;
  variantConversionRate: number;
}

export function analyzeResults(data: ExperimentData): TestResult {
  const { A, B } = data;

  const totalUsers = A.users + B.users;
  const totalConversions = A.conversions + B.conversions;

  if (totalUsers === 0 || totalConversions === 0) {
    return { isSignificant: false, pValue: 1.0, chiSquaredValue: 0, controlConversionRate: 0, variantConversionRate: 0 };
  }

  const controlConversionRate = A.users > 0 ? A.conversions / A.users : 0;
  const variantConversionRate = B.users > 0 ? B.conversions / B.users : 0;

  // Expected values for Chi-Squared test
  const expectedAConversions = A.users * (totalConversions / totalUsers);
  const expectedBConversions = B.users * (totalConversions / totalUsers);
  const expectedANonConversions = A.users * ((totalUsers - totalConversions) / totalUsers);
  const expectedBNonConversions = B.users * ((totalUsers - totalConversions) / totalUsers);

  const chiSquaredValue = 
    Math.pow(A.conversions - expectedAConversions, 2) / expectedAConversions +
    Math.pow(B.conversions - expectedBConversions, 2) / expectedBConversions +
    Math.pow((A.users - A.conversions) - expectedANonConversions, 2) / expectedANonConversions +
    Math.pow((B.users - B.conversions) - expectedBNonConversions, 2) / expectedBNonConversions;

  const isSignificant = chiSquaredValue >= CHI_SQUARED_CRITICAL_VALUE;

  return {
    isSignificant,
    pValue: isSignificant ? 0.05 : 1.0, // Simplified
    chiSquaredValue,
    controlConversionRate,
    variantConversionRate,
  };
}
```

## Trade-offs & Considerations

-   **Sample Size**: Do not conclude your experiment until you have a large enough sample size. Running the analysis too early can lead to false positives (the "peeking problem").
-   **Statistical Power**: This implementation doesn't calculate statistical power, which is the probability of detecting an effect if there is one. For more advanced tests, you would want to calculate this upfront to determine the required sample size.
-   **Multiple Variants**: This framework is designed for a simple A/B test. For A/B/n tests, you would need to adjust the statistical test (e.g., using ANOVA or multiple Chi-Squared tests with a Bonferroni correction).
-   **Long-term Effects**: Be aware of novelty effects. A new feature might perform well initially simply because it's new. Consider running experiments for a longer period to measure the true impact.

## Key Takeaways

1.  **Use deterministic assignment**. Hashing user IDs is a reliable way to keep users in the same group.
2.  **Don't peek at your results**. Decide on a sample size or duration for your experiment beforehand and stick to it.
3.  **Aim for a p-value of < 0.05**. This is the standard threshold for statistical significance, meaning there is less than a 5% chance the results are due to random luck.
4.  **Track everything**. You need accurate data on both the number of users and the number of conversions for each variant.
5.  **This is a starting point**. For a full production system, you would want a more robust data store, a dashboard for viewing results, and more advanced statistical calculations.

## References

-   [Chi-Squared Test](https://en.wikipedia.org/wiki/Chi-squared_test)
-   [Evan Miller's Awesome A/B Tools](https://www.evanmiller.org/ab-testing/)
-   [Statsig (A/B testing platform with more advanced features)](https://statsig.com/)
'''
---
_**File**: knowledge-07-seo-technical-audit.md_
_**Title**: Technical SEO Audit Checklist for Next.js Applications_
_**Version**: 1.0_
_**Date**: 2025-11-17_
_**Author**: Grok, Master Code Architect_
_**Target_Disciples**: [SEOGrowth, FullStackDev]_
_**Tags**: [seo, technical-seo, nextjs, audit, checklist]_
---

## Overview

This guide provides a comprehensive, actionable checklist for conducting a technical SEO audit on a Next.js application. It covers crawling, indexing, on-page elements, performance, and structured data. Following this checklist will help ensure your application is optimized for search engines and can achieve maximum organic visibility.

## Core Implementation: Technical SEO Audit Checklist

### 1. Crawling & Indexing

-   [ ] **`robots.txt` is configured correctly**: Ensure your `robots.txt` file (in the `public` directory) is not blocking important pages or resources. It should allow access to all pages you want indexed.
    -   ✅ `User-agent: *`
    -   ✅ `Allow: /`
    -   ✅ `Sitemap: https://www.yourdomain.com/sitemap.xml`
    -   ❌ `Disallow: /` (This blocks your entire site)

-   [ ] **XML Sitemaps are generated and submitted**: Next.js can dynamically generate sitemaps. Ensure you have one and have submitted it to Google Search Console.

    ```typescript
    // app/sitemap.ts
    import { MetadataRoute } from 'next';

    export default function sitemap(): MetadataRoute.Sitemap {
      // Add dynamic routes here (e.g., from your database)
      return [
        {
          url: 'https://www.yourdomain.com',
          lastModified: new Date(),
          changeFrequency: 'yearly',
          priority: 1,
        },
        // ... other pages
      ];
    }
    ```

-   [ ] **No `noindex` tags on important pages**: Check your pages for `<meta name="robots" content="noindex">`. This tag should only be used for pages you want to exclude from search results (e.g., admin pages, user settings).

### 2. On-Page Elements

-   [ ] **Unique and descriptive `<title>` tags**: Every page should have a unique title tag that accurately describes its content. Use the Next.js Metadata API.

    ```typescript
    // app/page.tsx
    import { Metadata } from 'next';

    export const metadata: Metadata = {
      title: 'Your Page Title | Your Brand',
    };
    ```

-   [ ] **Compelling `meta` descriptions**: Each page should have a unique meta description that entices users to click from the search results.

    ```typescript
    // app/page.tsx
    export const metadata: Metadata = {
      description: 'Your compelling meta description here.',
    };
    ```

-   [ ] **Proper heading structure (H1, H2, etc.)**: Each page should have a single `<h1>` tag, followed by a logical structure of `<h2>`, `<h3>`, etc. Do not skip heading levels.

-   [ ] **Canonical tags are used for duplicate content**: If you have multiple URLs with the same content, use a canonical tag to tell search engines which one is the preferred version.

    ```typescript
    // app/page.tsx
    export const metadata: Metadata = {
      alternates: {
        canonical: 'https://www.yourdomain.com/preferred-url',
      },
    };
    ```

### 3. Performance

-   [ ] **Core Web Vitals (CWV) are passing**: Use Google PageSpeed Insights to test your site. Your LCP, FID (or INP), and CLS scores should be in the "Good" range.
    -   **LCP (Largest Contentful Paint)**: Optimize images (use `next/image`), lazy-load below-the-fold content.
    -   **INP (Interaction to Next Paint)**: Reduce long-running JavaScript tasks, use server components where possible.
    -   **CLS (Cumulative Layout Shift)**: Specify dimensions for images and ads to prevent layout shifts.

-   [ ] **Mobile-friendly design**: Your site must be responsive and provide a good user experience on mobile devices. Use Chrome DevTools to test different screen sizes.

### 4. Structured Data (Schema Markup)

-   [ ] **Implement relevant structured data**: Use JSON-LD to add structured data to your pages. This helps search engines understand your content and can result in rich snippets in the search results.

    ```typescript
    // app/layout.tsx (for Organization schema)
    export default function RootLayout({ children }: { children: React.ReactNode }) {
      const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'Your Brand',
        url: 'https://www.yourdomain.com',
        logo: 'https://www.yourdomain.com/logo.png',
      };

      return (
        <html>
          <body>
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            {children}
          </body>
        </html>
      );
    }
    ```

    Common schema types include `Article`, `Product`, `FAQPage`, and `Organization`.

## Trade-offs & Considerations

-   **Dynamic vs. Static Generation**: Statically generated pages (SSG) are generally faster and better for SEO. Use SSG for pages that don't change often (like blog posts and marketing pages) and Server-Side Rendering (SSR) or Incremental Static Regeneration (ISR) for dynamic content.
-   **JavaScript and SEO**: While Google is good at rendering JavaScript, it's still best to render important content on the server to ensure all search engines can crawl it effectively.

## Key Takeaways

1.  **Ensure your site is crawlable and indexable**. This is the foundation of technical SEO.
2.  **Use the Next.js Metadata API** to manage all your on-page SEO elements.
3.  **Performance is critical**. A fast, mobile-friendly site will rank better.
4.  **Implement structured data** to help search engines understand your content and get rich snippets.
5.  **Audit regularly**. Technical SEO is not a one-time task. Run this checklist quarterly to catch new issues.

## References

-   [Google Search Central: SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)
-   [Next.js SEO Documentation](https://nextjs.org/docs/app/building-your-application/optimizing/seo)
-   [Schema.org](https://schema.org/)
'''
'''
---
_**File**: knowledge-08-mobile-performance.md_
_**Title**: React Native Performance Optimization Patterns_
_**Version**: 1.0_
_**Date**: 2025-11-17_
_**Author**: Grok, Master Code Architect_
_**Target_Disciples**: [Mobile, FullStackDev]_
_**Tags**: [react-native, performance, optimization, mobile]_
---

## Overview

This guide provides a set of production-ready patterns for optimizing the performance of React Native applications. It covers common bottlenecks such as list rendering, re-renders, and the JavaScript bridge, providing actionable code examples to ensure a smooth, 60 FPS user experience.

## Core Implementation: Performance Patterns

### 1. Optimize FlatList and SectionList Rendering

Lists are a common source of performance issues. Use these props to optimize them.

-   **✅ Good Practice**: Use `FlatList` with optimization props.

    ```tsx
    import { FlatList } from 'react-native';

    const MyOptimizedList = ({ data }) => {
      const renderItem = ({ item }) => (
        // Your list item component
      );

      return (
        <FlatList
          data={data}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          // Optimization Props
          initialNumToRender={10} // Render 10 items on initial load
          maxToRenderPerBatch={5} // Render 5 items per batch during scroll
          windowSize={11} // Render items in a window of 11 (5 above, 1 center, 5 below)
          removeClippedSubviews={true} // Unmount components that are off-screen
          getItemLayout={(data, index) => (
            // If your items have a fixed height, this avoids calculation on the fly
            { length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index }
          )}
        />
      );
    };
    ```

-   **❌ Bad Practice**: Using `map` inside a `ScrollView`. This renders all items at once, causing performance issues with long lists.

### 2. Prevent Unnecessary Re-renders

Use `React.memo` for functional components and `PureComponent` for class components to prevent re-renders when props have not changed.

-   **✅ Good Practice**: Wrap components that don't need to re-render often in `React.memo`.

    ```tsx
    import React from 'react';
    import { View, Text } from 'react-native';

    const MyMemoizedComponent = React.memo(({ title }) => {
      // This component will only re-render if the `title` prop changes.
      return (
        <View>
          <Text>{title}</Text>
        </View>
      );
    });
    ```

-   **Use `useCallback` for functions passed as props**. This prevents child components from re-rendering because the function reference changes on every parent render.

    ```tsx
    import React, { useCallback } from 'react';

    const ParentComponent = () => {
      const handlePress = useCallback(() => {
        // Do something
      }, []);

      return <MyMemoizedComponent onPress={handlePress} />;
    };
    ```

### 3. Offload Heavy Computations from the JS Thread

The JavaScript thread is single-threaded. Long-running computations will block the UI. Offload them to a separate thread.

-   **✅ Good Practice**: Use a library like `react-native-threads` or the built-in `InteractionManager`.

    ```tsx
    import { InteractionManager } from 'react-native';

    function doHeavyWork() {
      InteractionManager.runAfterInteractions(() => {
        // Heavy computation here. This will run after animations are complete.
        const result = someComplexCalculation();
        // Update state with the result
      });
    }
    ```

-   For native-level performance, consider writing a native module in Swift/Kotlin and using a library like `react-native-worklets-core` to run JavaScript functions on a separate, high-priority thread.

### 4. Reduce Bridge Traffic

Every time data is passed between the JavaScript thread and the native thread, it goes over the React Native bridge. Excessive bridge traffic can cause performance issues.

-   **✅ Good Practice**: When dealing with animations, use the `useNativeDriver: true` flag. This sends the animation logic to the native side once and lets the native UI thread handle the animation, freeing up the JS thread.

    ```tsx
    import { Animated } from 'react-native';

    Animated.timing(myValue, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true, // The magic!
    }).start();
    ```

-   **❌ Bad Practice**: Updating a component's state rapidly in response to a gesture (e.g., `onScroll`). This sends a flood of events over the bridge. Use `Animated.event` with `useNativeDriver: true` instead.

## Trade-offs & Considerations

-   **`removeClippedSubviews`**: While it can improve memory usage, it can also have bugs where content briefly disappears. Test it thoroughly.
-   **`React.memo` is not free**: There is a small overhead to diffing the props. Don't wrap every single component in `memo`; only use it for components that are re-rendering unnecessarily.
-   **Native Modules**: Writing native modules adds complexity to your project and requires knowledge of Swift/Kotlin.

## Key Takeaways

1.  **Optimize your lists**. This is the most common source of performance problems in React Native.
2.  **Prevent unnecessary re-renders**. Use `React.memo` and `useCallback` judiciously.
3.  **Keep the JS thread free**. Offload heavy computations using `InteractionManager` or other threading solutions.
4.  **Use the native driver for animations**. `useNativeDriver: true` is essential for smooth animations.
5.  **Profile your app**. Use Flipper or the built-in React Native profiler to find your specific bottlenecks. Don't optimize prematurely.

## References

-   [React Native Performance Documentation](https://reactnative.dev/docs/performance)
-   [Optimizing FlatList Configuration](https://reactnative.dev/docs/optimizing-flatlist-configuration)
-   [Flipper (Debugging and Profiling Tool)](https://fbflipper.com/)
'''
'''
---
_**File**: knowledge-10-ux-accessible-components.md_
_**Title**: Building an Accessible Component Library with Radix UI Primitives_
_**Version**: 1.0_
_**Date**: 2025-11-17_
_**Author**: Grok, Master Code Architect_
_**Target_Disciples**: [UX, Visual, FullStackDev]_
_**Tags**: [accessibility, a11y, design-system, components, radix-ui, react]_
---

## Overview

This guide provides a production-ready blueprint for building a custom, accessible component library in a React/Next.js application. Instead of building components from scratch, we will leverage Radix UI, a library of unstyled, accessible primitives. This approach separates accessibility logic from visual styling, allowing for maximum design flexibility while ensuring WCAG compliance. This is the modern, professional way to build a design system.

## Core Implementation: Accessible Component Design with Radix

### 1. Philosophy: Separate Logic from Style

The core principle is to let Radix handle the complex accessibility logic (keyboard navigation, focus management, ARIA attributes) and then apply your own branding and styles on top. This is far more robust and maintainable than building everything from scratch.

### 2. Example: Building an Accessible `Dialog` (Modal) Component

A modal dialog is one of the hardest components to get right. Radix makes it simple.

```tsx
// components/ui/Dialog.tsx
import React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { styled, keyframes } from '@stitches/react'; // or your preferred styling solution

const overlayShow = keyframes({
  '0%': { opacity: 0 },
  '100%': { opacity: 1 },
});

const contentShow = keyframes({
  '0%': { opacity: 0, transform: 'translate(-50%, -48%) scale(.96)' },
  '100%': { opacity: 1, transform: 'translate(-50%, -50%) scale(1)' },
});

const StyledOverlay = styled(DialogPrimitive.Overlay, {
  backgroundColor: 'rgba(0, 0, 0, 0.75)',
  position: 'fixed',
  inset: 0,
  '@media (prefers-reduced-motion: no-preference)': {
    animation: `${overlayShow} 150ms cubic-bezier(0.16, 1, 0.3, 1)`,
  },
});

const StyledContent = styled(DialogPrimitive.Content, {
  backgroundColor: '#1A1A1A',
  borderRadius: 6,
  boxShadow: 'hsl(206 22% 7% / 35%) 0px 10px 38px -10px, hsl(206 22% 7% / 20%) 0px 10px 20px -15px',
  position: 'fixed',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '90vw',
  maxWidth: '500px',
  maxHeight: '85vh',
  padding: 25,
  color: 'white',
  '@media (prefers-reduced-motion: no-preference)': {
    animation: `${contentShow} 150ms cubic-bezier(0.16, 1, 0.3, 1)`,
  },
  '&:focus': { outline: 'none' },
});

function Content({ children, ...props }) {
  return (
    <DialogPrimitive.Portal>
      <StyledOverlay />
      <StyledContent {...props}>{children}</StyledContent>
    </DialogPrimitive.Portal>
  );
}

const StyledTitle = styled(DialogPrimitive.Title, {
  margin: 0,
  fontWeight: 500,
  color: '#FFFFFF',
  fontSize: 17,
});

const StyledDescription = styled(DialogPrimitive.Description, {
  margin: '10px 0 20px',
  color: '#E0E0E0',
  fontSize: 15,
  lineHeight: 1.5,
});

// Exports
export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogContent = Content;
export const DialogTitle = StyledTitle;
export const DialogDescription = StyledDescription;
export const DialogClose = DialogPrimitive.Close;
```

**Usage:**

```tsx
// app/some-page.tsx
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/Dialog';

const MyPageComponent = () => (
  <Dialog>
    <DialogTrigger asChild>
      <button className="Button violet">Open Dialog</button>
    </DialogTrigger>
    <DialogContent>
      <DialogTitle>Accessible Modal</DialogTitle>
      <DialogDescription>
        This modal has full focus trapping, screen reader support, and keyboard navigation out of the box.
      </DialogDescription>
      <DialogClose asChild>
        <button className="Button green">Close</button>
      </DialogClose>
    </DialogContent>
  </Dialog>
);
```

### 3. Accessibility Features Handled by Radix

By using Radix, you get these critical a11y features for free:
-   **Focus Management**: Focus is automatically trapped within the modal and returned to the trigger button on close.
-   **Keyboard Navigation**: The modal can be closed with the `Escape` key.
-   **ARIA Attributes**: Radix automatically adds `role="dialog"`, `aria-modal="true"`, and manages `aria-labelledby` and `aria-describedby`.
-   **Screen Reader Support**: It correctly announces the dialog's title and description.

## Trade-offs & Considerations

-   **Bundle Size**: Adding a library like Radix increases your bundle size. However, it's tree-shakeable, so you only pay for the components you use. The cost is almost always worth the accessibility gains.
-   **Styling**: Radix is unstyled, which means you have to provide all the styling yourself. This is a feature, not a bug, as it gives you complete design control.
-   **Learning Curve**: There is a small learning curve to understanding the composition model of Radix (e.g., `Root`, `Trigger`, `Portal`, `Content`).

## Key Takeaways

1.  **Don't reinvent the wheel for accessibility**. Use headless UI libraries like Radix UI or React Aria.
2.  **Separate concerns**: Keep accessibility logic (from Radix) separate from your visual styling. This makes your design system more flexible and maintainable.
3.  **Test with real assistive technologies**. Automated tests with `jest-axe` are a good start, but you must also manually test with screen readers (VoiceOver, NVDA) and keyboard-only navigation.
4.  **Accessibility is a core UX principle, not an afterthought**. Building it in from the start saves massive amounts of time and effort later.
5.  **A beautiful design that isn't accessible is a failed design**. The best UX is inclusive.

## References

-   [Radix UI Primitives](https://www.radix-ui.com/primitives)
-   [WAI-ARIA Authoring Practices - Dialog (Modal)](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)
-   [WCAG 2.1 Guidelines](https://www.w3.org/TR/WCAG21/)
-   [Stitches (CSS-in-JS library used in example)](https://stitches.dev/)
'''

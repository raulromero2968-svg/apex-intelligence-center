
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

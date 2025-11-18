import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";

type RagSuccess = {
  answer: string;
  sources: never[];
  citationCount: number;
  synthesisCount: number;
  isValid: true;
  validationErrors: [];
  cached: false;
};

type RagFail = {
  error: string;
  requestId: string;
};

const requestId = () => crypto.randomUUID().slice(0, 8);

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function buildSuccess(query: string): RagSuccess {
  return {
    answer: `RAG queue placeholder: ${query}`,
    sources: [],
    citationCount: 0,
    synthesisCount: 0,
    isValid: true,
    validationErrors: [],
    cached: false,
  };
}

function buildFailure(error: string, id: string): RagFail {
  return { error, requestId: id };
}

export async function POST(req: NextRequest) {
  const rid = requestId();

  try {
    const { query } = await req.json();

    if (typeof query !== "string" || !query.trim()) {
      return NextResponse.json<RagFail>(buildFailure("Bad Request: missing query", rid), { status: 400 });
    }

    return NextResponse.json<RagSuccess>(buildSuccess(query.trim()));
  } catch (error) {
    Sentry.captureException(error, { tags: { route: "api/rag" }, extra: { rid } });
    return NextResponse.json<RagFail>(buildFailure("Internal server error", rid), { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const rid = requestId();
  const query = request.nextUrl.searchParams.get("query");

  if (!query) {
    return NextResponse.json<RagFail>(buildFailure("Missing required parameter: query", rid), { status: 400 });
  }

  return NextResponse.json<RagSuccess>(buildSuccess(query.trim()));
}

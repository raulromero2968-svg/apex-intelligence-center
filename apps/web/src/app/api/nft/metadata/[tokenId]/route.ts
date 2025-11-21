import { NextRequest, NextResponse } from "next/server";

/**
 * NFT Metadata API Endpoint
 *
 * Returns ERC-721 compatible metadata for Apex Founding Member Soulbound NFTs
 * Compliant with OpenSea metadata standards
 *
 * Route: /api/nft/metadata/[tokenId]
 */

export async function GET(
  request: NextRequest,
  { params }: { params: { tokenId: string } }
) {
  try {
    const tokenId = params.tokenId;

    // Validate tokenId
    const tokenIdNum = parseInt(tokenId, 10);
    if (isNaN(tokenIdNum) || tokenIdNum < 1 || tokenIdNum > 1000) {
      return NextResponse.json(
        { error: "Invalid token ID. Must be between 1 and 1000." },
        { status: 400 }
      );
    }

    // Generate metadata with Soulbound attributes for OpenSea
    const metadata = {
      name: `Apex Founding Member #${tokenId}`,
      description:
        "Soulbound Founding Member NFT granting lifetime Pro subscription access to Apex Intelligence Center. This non-transferable token represents your status as one of the first 1,000 members and includes permanent trust score boost and exclusive benefits.",
      image: `${process.env.NEXT_PUBLIC_BASE_URL}/images/nft/founding-member.png`,
      external_url: `${process.env.NEXT_PUBLIC_BASE_URL}/hall-of-fame`,
      attributes: [
        {
          trait_type: "Transferability",
          value: "Soulbound - non-transferable",
        },
        {
          trait_type: "Membership Type",
          value: "Founding Member",
        },
        {
          trait_type: "Subscription Tier",
          value: "Pro (Lifetime)",
        },
        {
          trait_type: "Trust Score Boost",
          value: "+10%",
        },
        {
          trait_type: "Max Supply",
          value: "1,000",
        },
        {
          trait_type: "Token Standard",
          value: "ERC-721",
        },
        {
          display_type: "number",
          trait_type: "Member Number",
          value: tokenIdNum,
        },
      ],
      // OpenSea-specific fields for soulbound/non-transferable indication
      background_color: "1a1a2e",
      animation_url: undefined,
      properties: {
        transferable: false,
        soulbound: true,
        network: "Base",
        contract_type: "Soulbound NFT",
      },
    };

    // Return metadata with proper CORS headers for OpenSea
    return NextResponse.json(metadata, {
      headers: {
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  } catch (error) {
    console.error("Error generating NFT metadata:", error);
    return NextResponse.json(
      { error: "Failed to generate metadata" },
      { status: 500 }
    );
  }
}

// Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

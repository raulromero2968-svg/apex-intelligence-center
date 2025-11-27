import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { eq } from 'drizzle-orm';
import { PolygonClient } from './polygonClient';
import { PSAClient } from './psaClient';
import { digitalTwinTokens } from '@apex/db/src/schema/digitalTwinTokens';
import { cardForensics } from '@apex/db/src/schema/cardForensics';
import type { CardForensics, DigitalTwinToken } from '@apex/db/src/schema';
import { DigitalTwinMetadataSchema, type DigitalTwinMetadata } from '@apex/shared/src/contracts/digitalTwin';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

/**
 * Service for minting digital twin NFTs from card forensics records
 */
export class MintService {
  private db;
  private polygonClient: PolygonClient;
  private psaClient: PSAClient;

  constructor() {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL!,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    this.db = drizzle(pool);
    this.polygonClient = new PolygonClient();
    this.psaClient = new PSAClient();
  }

  /**
   * Prepare metadata for digital twin NFT
   * For v1, generates a data URI. In production, this could upload to IPFS or centralized storage.
   */
  async prepareMetadata(cardForensics: CardForensics): Promise<string> {
    // Fetch PSA certification if available
    const certification = await this.psaClient.getCertification(cardForensics);

    // Build metadata fields
    const metadataFields = this.psaClient.buildMetadataFields(cardForensics, certification);

    // Construct full metadata object
    const metadata: DigitalTwinMetadata = {
      name: `Digital Twin: ${cardForensics.cardId || 'Unknown Card'}`,
      description: `Blockchain digital twin NFT representing a physical trading card. Linked to VARC forensics job ${cardForensics.jobId}.`,
      image: cardForensics.imageUrl || undefined,
      external_url: `https://apexintelligence.io/forensics/${cardForensics.jobId}`,
      attributes: metadataFields.attributes as Array<{ trait_type: string; value: string | number }>,
      fingerprintHash: metadataFields.fingerprintHash as string | undefined,
      hashVersion: metadataFields.hashVersion as string | undefined,
      grade: metadataFields.grade as number | undefined,
      cardId: metadataFields.cardId as string | undefined,
      createdAt: metadataFields.createdAt as string,
    };

    // Validate metadata
    DigitalTwinMetadataSchema.parse(metadata);

    // For v1, use data URI. In production, upload to IPFS or centralized storage.
    const metadataJson = JSON.stringify(metadata, null, 2);
    const dataUri = `data:application/json;base64,${Buffer.from(metadataJson).toString('base64')}`;

    return dataUri;
  }

  /**
   * Mint a digital twin NFT from a card forensics record
   * Idempotent: if a twin already exists for this cardForensicsId, returns existing record
   */
  async mintFromCardForensics(cardForensics: CardForensics): Promise<DigitalTwinToken> {
    // Check if digital twin already exists
    const existing = await this.db
      .select()
      .from(digitalTwinTokens)
      .where(eq(digitalTwinTokens.cardForensicsId, cardForensics.id))
      .limit(1);

    if (existing.length > 0) {
      console.log(`[mint-service] Digital twin already exists for cardForensicsId ${cardForensics.id}`);
      return existing[0]!;
    }

    try {
      // Prepare metadata
      const metadataUri = await this.prepareMetadata(cardForensics);

      // Mint NFT on Polygon
      const mintResult = await this.polygonClient.mintDigitalTwin(metadataUri);

      // Insert record in database
      const [inserted] = await this.db
        .insert(digitalTwinTokens)
        .values({
          cardForensicsId: cardForensics.id,
          userId: cardForensics.userId || null,
          cardId: cardForensics.cardId || null,
          polygonTokenId: mintResult.tokenId,
          polygonTxHash: mintResult.txHash,
          metadataUri,
          status: 'minted',
        })
        .returning();

      if (!inserted) {
        throw new Error('Failed to insert digital twin token record');
      }

      console.log(
        `[mint-service] Successfully minted digital twin for cardForensicsId ${cardForensics.id}, tokenId ${mintResult.tokenId}`
      );

      return inserted;
    } catch (error) {
      // Insert failed record for tracking
      try {
        await this.db.insert(digitalTwinTokens).values({
          cardForensicsId: cardForensics.id,
          userId: cardForensics.userId || null,
          cardId: cardForensics.cardId || null,
          polygonTokenId: 'failed',
          polygonTxHash: 'failed',
          metadataUri: '',
          status: 'failed',
        });
      } catch (insertError) {
        // Ignore insert error - we're already in error state
        console.error('[mint-service] Failed to insert failed record:', insertError);
      }

      throw error;
    }
  }

  /**
   * Get digital twin for a card forensics ID
   */
  async getDigitalTwinByCardForensicsId(cardForensicsId: string): Promise<DigitalTwinToken | null> {
    const result = await this.db
      .select()
      .from(digitalTwinTokens)
      .where(eq(digitalTwinTokens.cardForensicsId, cardForensicsId))
      .limit(1);

    return result.length > 0 ? result[0]! : null;
  }
}


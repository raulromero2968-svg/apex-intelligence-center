import type { PSACertification } from './types';
import type { CardForensics } from '@apex/db/src/schema/cardForensics';

if (!process.env.PSA_API_BASE_URL) {
  throw new Error('PSA_API_BASE_URL environment variable is required');
}

if (!process.env.PSA_API_KEY) {
  throw new Error('PSA_API_KEY environment variable is required');
}

/**
 * PSA (Professional Sports Authenticator) client for fetching certification data
 */
export class PSAClient {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = process.env.PSA_API_BASE_URL!.replace(/\/$/, ''); // Remove trailing slash
    this.apiKey = process.env.PSA_API_KEY!;
  }

  /**
   * Fetch PSA certification data for a card forensics record
   * This is a placeholder implementation - actual PSA API integration would go here
   */
  async getCertification(cardForensics: CardForensics): Promise<PSACertification | null> {
    try {
      // Extract card information from forensics
      const cardId = cardForensics.cardId;
      const grade = cardForensics.grade;

      if (!cardId || !grade) {
        return null;
      }

      // For v1, we'll build a mock certification based on forensics data
      // In production, this would call the actual PSA API
      const response = await fetch(`${this.baseUrl}/api/v1/certifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          cardId,
          grade,
          jobId: cardForensics.jobId,
        }),
      });

      if (!response.ok) {
        // If API call fails, return null (card may not be PSA certified)
        console.warn(`[psa-client] Failed to fetch certification for card ${cardId}: ${response.status}`);
        return null;
      }

      const data = await response.json();

      return {
        certificationNumber: data.certificationNumber || `APEX-${cardForensics.jobId.slice(0, 8)}`,
        grade: data.grade || grade,
        gradeScale: data.gradeScale || 'PSA',
        cardName: data.cardName || cardId,
        cardSet: data.cardSet || 'Unknown',
        cardNumber: data.cardNumber || '',
        certifiedAt: data.certifiedAt || new Date().toISOString(),
        imageUrl: data.imageUrl || cardForensics.imageUrl || undefined,
      };
    } catch (error) {
      // Log error but don't fail - card may not be PSA certified
      console.warn(`[psa-client] Error fetching certification:`, error);
      return null;
    }
  }

  /**
   * Build metadata fields for digital twin based on PSA certification and forensics
   */
  buildMetadataFields(
    cardForensics: CardForensics,
    certification: PSACertification | null
  ): Record<string, unknown> {
    const attributes: Array<{ trait_type: string; value: string | number }> = [];

    // Add grade attribute
    if (cardForensics.grade) {
      attributes.push({
        trait_type: 'Grade',
        value: cardForensics.grade,
      });
    }

    // Add grade confidence if available
    if (cardForensics.gradeConfidence) {
      attributes.push({
        trait_type: 'Grade Confidence',
        value: Math.round(cardForensics.gradeConfidence * 100),
      });
    }

    // Add counterfeit score if available
    if (cardForensics.counterfeitScore !== null && cardForensics.counterfeitScore !== undefined) {
      attributes.push({
        trait_type: 'Authenticity Score',
        value: Math.round((1 - cardForensics.counterfeitScore) * 100),
      });
    }

    // Add PSA certification data if available
    if (certification) {
      attributes.push({
        trait_type: 'PSA Certification',
        value: certification.certificationNumber,
      });
      attributes.push({
        trait_type: 'PSA Grade',
        value: certification.grade,
      });
    }

    // Add card ID
    if (cardForensics.cardId) {
      attributes.push({
        trait_type: 'Card ID',
        value: cardForensics.cardId,
      });
    }

    // Extract fingerprint hash from reasoning trace if available
    const reasoningTrace = cardForensics.reasoningTrace as Record<string, unknown> | null;
    const fingerprintHash = reasoningTrace?.fingerprintHash as string | undefined;
    const hashVersion = reasoningTrace?.hashVersion as string | undefined;

    return {
      attributes,
      fingerprintHash,
      hashVersion,
      grade: cardForensics.grade || undefined,
      cardId: cardForensics.cardId || undefined,
      createdAt: new Date().toISOString(),
    };
  }
}


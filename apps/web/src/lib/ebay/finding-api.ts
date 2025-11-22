/**
 * eBay Finding API Integration - Data Sovereignty Core
 *
 * This module implements the primary data source for Apex Intelligence,
 * replacing TCGplayer dependency with verified eBay historical sales data.
 *
 * CRITICAL: Uses findCompletedItems (not Browse API) for historical data.
 *
 * Architecture: 13_LAUNCH_01
 */

import { recordIngestBatch } from '@/lib/ingest-metrics';

export interface EbaySalePoint {
  itemId: string;
  title: string;
  price: number;
  currency: string;
  saleDate: Date;
  condition: string;
  grade?: string;
  gradingCompany?: string;
  imageUrl?: string;
  sellerUsername?: string;
  categoryId: string;
}

export interface EbayFindingParams {
  keywords: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  condition?: string;
  sortOrder?: 'EndTimeSoonest' | 'PricePlusShippingLowest' | 'PricePlusShippingHighest';
  entriesPerPage?: number;
  pageNumber?: number;
}

export interface EbayFindingResponse {
  sales: EbaySalePoint[];
  totalEntries: number;
  pageNumber: number;
  totalPages: number;
}

/**
 * eBay Finding API Client
 * Rate Limit: 5,000 calls/day (Standard tier)
 * Cache Strategy: 24hr TTL in Redis
 */
export class EbayFindingClient {
  private appId: string;
  private endpoint = 'https://svcs.ebay.com/services/search/FindingService/v1';
  private categoryId = '183454'; // CCG Individual Cards

  constructor(appId?: string) {
    this.appId = appId || process.env.EBAY_APP_ID || '';

    if (!this.appId) {
      throw new Error('EBAY_APP_ID is required for eBay Finding API');
    }
  }

  /**
   * Fetch completed (sold) items from eBay
   *
   * @param params - Search parameters
   * @returns Normalized sale points
   */
  async findCompletedItems(params: EbayFindingParams): Promise<EbayFindingResponse> {
    const url = new URL(this.endpoint);

    // Build XML-style query parameters (eBay's legacy API format)
    const queryParams = new URLSearchParams({
      'OPERATION-NAME': 'findCompletedItems',
      'SERVICE-VERSION': '1.0.0',
      'SECURITY-APPNAME': this.appId,
      'RESPONSE-DATA-FORMAT': 'JSON',
      'REST-PAYLOAD': '',
      'keywords': params.keywords,
      'categoryId': params.categoryId || this.categoryId,
      'paginationInput.entriesPerPage': String(params.entriesPerPage || 100),
      'paginationInput.pageNumber': String(params.pageNumber || 1),
      'sortOrder': params.sortOrder || 'EndTimeSoonest',
      // CRITICAL: Only fetch sold items
      'itemFilter(0).name': 'SoldItemsOnly',
      'itemFilter(0).value': 'true',
    });

    // Add condition filter if specified
    if (params.condition) {
      queryParams.append('itemFilter(1).name', 'Condition');
      queryParams.append('itemFilter(1).value', params.condition);
    }

    // Add price range filters
    if (params.minPrice) {
      const filterIndex = params.condition ? 2 : 1;
      queryParams.append(`itemFilter(${filterIndex}).name`, 'MinPrice');
      queryParams.append(`itemFilter(${filterIndex}).value`, String(params.minPrice));
    }

    if (params.maxPrice) {
      const filterIndex = params.condition ? (params.minPrice ? 3 : 2) : (params.minPrice ? 2 : 1);
      queryParams.append(`itemFilter(${filterIndex}).name`, 'MaxPrice');
      queryParams.append(`itemFilter(${filterIndex}).value`, String(params.maxPrice));
    }

    try {
      const response = await fetch(`${url}?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'X-EBAY-SOA-OPERATION-NAME': 'findCompletedItems',
          'X-EBAY-SOA-SECURITY-APPNAME': this.appId,
          'X-EBAY-SOA-RESPONSE-DATA-FORMAT': 'JSON',
        },
      });

      if (!response.ok) {
        throw new Error(`eBay API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // Handle eBay API errors
      if (data.errorMessage) {
        throw new Error(`eBay API error: ${data.errorMessage[0].error[0].message[0]}`);
      }

      const searchResult = data.findCompletedItemsResponse?.[0]?.searchResult?.[0];

      if (!searchResult || !searchResult.item) {
        return {
          sales: [],
          totalEntries: 0,
          pageNumber: params.pageNumber || 1,
          totalPages: 0,
        };
      }

      const items = searchResult.item || [];
      const totalEntries = parseInt(searchResult['@count'] || '0', 10);
      const paginationOutput = data.findCompletedItemsResponse?.[0]?.paginationOutput?.[0];
      const totalPages = parseInt(paginationOutput?.totalPages?.[0] || '1', 10);

      // Normalize eBay response to our SalePoint format
      const sales: EbaySalePoint[] = items.map((item: any) => {
        const sellingStatus = item.sellingStatus?.[0];
        const listingInfo = item.listingInfo?.[0];

        return {
          itemId: item.itemId?.[0] || '',
          title: item.title?.[0] || '',
          price: parseFloat(sellingStatus?.currentPrice?.[0]?.__value__ || '0'),
          currency: sellingStatus?.currentPrice?.[0]?.['@currencyId'] || 'USD',
          saleDate: new Date(listingInfo?.endTime?.[0] || new Date()),
          condition: item.condition?.[0]?.conditionDisplayName?.[0] || 'Unknown',
          imageUrl: item.galleryURL?.[0] || item.pictureURLLarge?.[0],
          sellerUsername: item.sellerInfo?.[0]?.sellerUserName?.[0],
          categoryId: item.primaryCategory?.[0]?.categoryId?.[0] || this.categoryId,
        };
      });

      return {
        sales,
        totalEntries,
        pageNumber: params.pageNumber || 1,
        totalPages,
      };
    } catch (error) {
      console.error('[EbayFindingClient] Error fetching completed items:', error);
      throw error;
    }
  }

  /**
   * Search for completed sales of a specific TCG card
   * Automatically handles grade extraction from title
   *
   * @param cardName - Card name (e.g., "Charizard")
   * @param setName - Set name (e.g., "Base Set")
   * @param cardNumber - Card number (e.g., "4/102")
   * @returns Normalized sale points with grade extraction
   */
  async getCardSalesHistory(
    cardName: string,
    setName: string,
    cardNumber?: string
  ): Promise<EbaySalePoint[]> {
    // Build precise search query
    const keywords = cardNumber
      ? `${cardName} ${setName} ${cardNumber}`
      : `${cardName} ${setName}`;

    const response = await this.findCompletedItems({
      keywords,
      categoryId: this.categoryId,
      entriesPerPage: 100,
      sortOrder: 'EndTimeSoonest',
    });

    // Extract grades from titles using regex
    return response.sales.map(sale => {
      const gradeInfo = this.extractGradeFromTitle(sale.title);
      return {
        ...sale,
        grade: gradeInfo.grade,
        gradingCompany: gradeInfo.company,
      };
    });
  }

  /**
   * Extract grading information from eBay listing titles
   * Regex patterns for PSA, BGS, CGC, SGC
   *
   * @param title - eBay listing title
   * @returns Extracted grade and company
   */
  private extractGradeFromTitle(title: string): { grade?: string; company?: string } {
    const titleUpper = title.toUpperCase();

    // PSA pattern: "PSA 10", "PSA10", "PSA-10"
    const psaMatch = titleUpper.match(/PSA[\s-]?(\d+(?:\.\d+)?)/);
    if (psaMatch) {
      return { grade: psaMatch[1], company: 'PSA' };
    }

    // BGS pattern: "BGS 9.5", "BGS9.5", "BGS-9.5"
    const bgsMatch = titleUpper.match(/BGS[\s-]?(\d+(?:\.\d+)?)/);
    if (bgsMatch) {
      return { grade: bgsMatch[1], company: 'BGS' };
    }

    // CGC pattern: "CGC 10", "CGC10"
    const cgcMatch = titleUpper.match(/CGC[\s-]?(\d+(?:\.\d+)?)/);
    if (cgcMatch) {
      return { grade: cgcMatch[1], company: 'CGC' };
    }

    // SGC pattern: "SGC 10", "SGC10"
    const sgcMatch = titleUpper.match(/SGC[\s-]?(\d+(?:\.\d+)?)/);
    if (sgcMatch) {
      return { grade: sgcMatch[1], company: 'SGC' };
    }

    // No grade detected - classify as "Raw"
    return { grade: undefined, company: undefined };
  }

  /**
   * Normalize eBay title by removing junk keywords
   * VARC text-normalization pipeline
   *
   * @param title - Raw eBay title
   * @returns Cleaned title
   */
  normalizeTitle(title: string): string {
    let normalized = title;

    // Remove junk patterns
    const junkPatterns = [
      /L@@K/gi,
      /HOT/gi,
      /\bREAD\b/gi,
      /🔥/g,
      /💎/g,
      /⭐/g,
      /MUST SEE/gi,
      /WOW/gi,
      /RARE/gi,
      /HTF/gi,
      /INVEST/gi,
      /\[.*?\]/g, // Remove brackets
      /\(.*?\)/g, // Remove parentheses
    ];

    junkPatterns.forEach(pattern => {
      normalized = normalized.replace(pattern, '');
    });

    // Collapse multiple spaces
    normalized = normalized.replace(/\s+/g, ' ').trim();

    return normalized;
  }
}

/**
 * Singleton instance for global use
 */
export const ebayFindingClient = new EbayFindingClient();

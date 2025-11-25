/**
 * Schema Builder Service
 *
 * Implements knowledge-07-seo-performance structured data generation.
 * Creates JSON-LD schema markup for rich search results.
 *
 * Features:
 * - Schema type templates (Product, Article, FAQ, etc.)
 * - Validation against schema.org
 * - Rich results eligibility checking
 * - Dynamic schema generation
 *
 * @see knowledge-07-seo-performance for architecture details
 */

import { db } from '@/lib/db';
import { eq, desc, and } from 'drizzle-orm';
import {
  schemaMarkups,
  type SchemaMarkup,
  type NewSchemaMarkup,
} from '@/db/schema/seo-performance';

// ============================================================================
// TYPES
// ============================================================================

export type SchemaType =
  | 'Product'
  | 'Article'
  | 'FAQPage'
  | 'BreadcrumbList'
  | 'Organization'
  | 'WebSite'
  | 'WebPage'
  | 'ItemList'
  | 'HowTo'
  | 'Review';

export interface SchemaTemplate {
  type: SchemaType;
  name: string;
  description: string;
  requiredFields: string[];
  optionalFields: string[];
  example: Record<string, unknown>;
  richResultsType?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Array<{
    property: string;
    message: string;
    severity: 'error' | 'warning';
  }>;
  richResultsEligible: boolean;
  richResultsType?: string;
}

// ============================================================================
// SCHEMA TEMPLATES
// ============================================================================

export const SCHEMA_TEMPLATES: Record<SchemaType, SchemaTemplate> = {
  Product: {
    type: 'Product',
    name: 'Product',
    description: 'Schema for products with pricing and availability',
    requiredFields: ['name', 'image', 'offers'],
    optionalFields: ['description', 'brand', 'sku', 'gtin', 'review', 'aggregateRating'],
    example: {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: 'TCG Card Name',
      image: 'https://example.com/card.jpg',
      description: 'Rare holographic card from Set X',
      brand: { '@type': 'Brand', name: 'Pokemon' },
      sku: 'TCG-001',
      offers: {
        '@type': 'Offer',
        price: '29.99',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
        seller: { '@type': 'Organization', name: 'TCG Store' },
      },
    },
    richResultsType: 'Product snippet',
  },
  Article: {
    type: 'Article',
    name: 'Article',
    description: 'Schema for news and blog articles',
    requiredFields: ['headline', 'image', 'author', 'datePublished'],
    optionalFields: ['description', 'dateModified', 'publisher', 'mainEntityOfPage'],
    example: {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: 'Top 10 TCG Cards of 2024',
      image: 'https://example.com/article-hero.jpg',
      author: { '@type': 'Person', name: 'John Doe' },
      datePublished: '2024-01-15',
      dateModified: '2024-01-16',
      publisher: {
        '@type': 'Organization',
        name: 'TCG News',
        logo: { '@type': 'ImageObject', url: 'https://example.com/logo.png' },
      },
    },
    richResultsType: 'Article',
  },
  FAQPage: {
    type: 'FAQPage',
    name: 'FAQ Page',
    description: 'Schema for frequently asked questions',
    requiredFields: ['mainEntity'],
    optionalFields: [],
    example: {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'How do I grade my TCG cards?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Submit cards to PSA, BGS, or CGC for professional grading.',
          },
        },
      ],
    },
    richResultsType: 'FAQ',
  },
  BreadcrumbList: {
    type: 'BreadcrumbList',
    name: 'Breadcrumb',
    description: 'Schema for navigation breadcrumbs',
    requiredFields: ['itemListElement'],
    optionalFields: [],
    example: {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://example.com' },
        { '@type': 'ListItem', position: 2, name: 'Cards', item: 'https://example.com/cards' },
        { '@type': 'ListItem', position: 3, name: 'Rare Cards' },
      ],
    },
    richResultsType: 'Breadcrumb',
  },
  Organization: {
    type: 'Organization',
    name: 'Organization',
    description: 'Schema for company/organization information',
    requiredFields: ['name', 'url'],
    optionalFields: ['logo', 'sameAs', 'contactPoint', 'address'],
    example: {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Apex TCG',
      url: 'https://apex-tcg.com',
      logo: 'https://apex-tcg.com/logo.png',
      sameAs: ['https://twitter.com/apextcg', 'https://facebook.com/apextcg'],
    },
    richResultsType: 'Knowledge panel',
  },
  WebSite: {
    type: 'WebSite',
    name: 'Website',
    description: 'Schema for website with search action',
    requiredFields: ['name', 'url'],
    optionalFields: ['potentialAction'],
    example: {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Apex TCG',
      url: 'https://apex-tcg.com',
      potentialAction: {
        '@type': 'SearchAction',
        target: 'https://apex-tcg.com/search?q={search_term_string}',
        'query-input': 'required name=search_term_string',
      },
    },
    richResultsType: 'Sitelinks searchbox',
  },
  WebPage: {
    type: 'WebPage',
    name: 'Web Page',
    description: 'Schema for generic web pages',
    requiredFields: ['name'],
    optionalFields: ['description', 'url', 'datePublished', 'dateModified'],
    example: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Card Collection',
      description: 'Browse our collection of rare TCG cards',
      url: 'https://apex-tcg.com/collection',
    },
  },
  ItemList: {
    type: 'ItemList',
    name: 'Item List',
    description: 'Schema for lists of items (e.g., top 10)',
    requiredFields: ['itemListElement'],
    optionalFields: ['name', 'description', 'numberOfItems'],
    example: {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'Top 10 Most Valuable Cards',
      numberOfItems: 10,
      itemListElement: [
        { '@type': 'ListItem', position: 1, url: 'https://example.com/card/1' },
      ],
    },
    richResultsType: 'Carousel',
  },
  HowTo: {
    type: 'HowTo',
    name: 'How-To',
    description: 'Schema for step-by-step guides',
    requiredFields: ['name', 'step'],
    optionalFields: ['description', 'image', 'totalTime', 'supply', 'tool'],
    example: {
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      name: 'How to Sleeve Your Cards',
      description: 'Protect your valuable TCG cards with proper sleeving',
      step: [
        {
          '@type': 'HowToStep',
          name: 'Choose sleeves',
          text: 'Select penny sleeves for casual or top-loaders for valuable cards',
        },
      ],
    },
    richResultsType: 'How-to',
  },
  Review: {
    type: 'Review',
    name: 'Review',
    description: 'Schema for product/item reviews',
    requiredFields: ['itemReviewed', 'author', 'reviewRating'],
    optionalFields: ['reviewBody', 'datePublished'],
    example: {
      '@context': 'https://schema.org',
      '@type': 'Review',
      itemReviewed: { '@type': 'Product', name: 'Booster Box' },
      author: { '@type': 'Person', name: 'Reviewer' },
      reviewRating: { '@type': 'Rating', ratingValue: '5', bestRating: '5' },
      reviewBody: 'Excellent pull rates!',
    },
    richResultsType: 'Review snippet',
  },
};

// ============================================================================
// SCHEMA MANAGEMENT
// ============================================================================

/**
 * Create a schema markup
 */
export async function createSchemaMarkup(
  data: Omit<NewSchemaMarkup, 'id' | 'createdAt' | 'updatedAt'>
): Promise<SchemaMarkup> {
  // Validate before saving
  const validation = validateSchema(data.schemaType as SchemaType, data.schemaData as Record<string, unknown>);

  const [schema] = await db
    .insert(schemaMarkups)
    .values({
      ...data,
      isValid: validation.isValid,
      validationErrors: validation.errors.length > 0 ? validation.errors : null,
      richResultsEligible: validation.richResultsEligible,
      richResultsType: validation.richResultsType,
    })
    .returning();

  return schema;
}

/**
 * Get schema by ID
 */
export async function getSchemaMarkup(schemaId: string): Promise<SchemaMarkup | null> {
  const [schema] = await db
    .select()
    .from(schemaMarkups)
    .where(eq(schemaMarkups.id, schemaId))
    .execute();

  return schema ?? null;
}

/**
 * Get schemas for a project
 */
export async function getProjectSchemas(
  projectId: string,
  options: { activeOnly?: boolean; limit?: number } = {}
): Promise<SchemaMarkup[]> {
  const { activeOnly = false, limit = 50 } = options;

  const conditions = [eq(schemaMarkups.projectId, projectId)];
  if (activeOnly) {
    conditions.push(eq(schemaMarkups.isActive, true));
  }

  return db
    .select()
    .from(schemaMarkups)
    .where(and(...conditions))
    .orderBy(desc(schemaMarkups.updatedAt))
    .limit(limit)
    .execute();
}

/**
 * Update a schema markup
 */
export async function updateSchemaMarkup(
  schemaId: string,
  updates: Partial<NewSchemaMarkup>
): Promise<SchemaMarkup | null> {
  // Re-validate if schema data changed
  let validationUpdates = {};
  if (updates.schemaData || updates.schemaType) {
    const schema = await getSchemaMarkup(schemaId);
    if (schema) {
      const validation = validateSchema(
        (updates.schemaType ?? schema.schemaType) as SchemaType,
        (updates.schemaData ?? schema.schemaData) as Record<string, unknown>
      );
      validationUpdates = {
        isValid: validation.isValid,
        validationErrors: validation.errors.length > 0 ? validation.errors : null,
        richResultsEligible: validation.richResultsEligible,
        richResultsType: validation.richResultsType,
      };
    }
  }

  const [updated] = await db
    .update(schemaMarkups)
    .set({
      ...updates,
      ...validationUpdates,
      updatedAt: new Date(),
    })
    .where(eq(schemaMarkups.id, schemaId))
    .returning();

  return updated ?? null;
}

/**
 * Delete a schema markup
 */
export async function deleteSchemaMarkup(schemaId: string): Promise<boolean> {
  const result = await db
    .delete(schemaMarkups)
    .where(eq(schemaMarkups.id, schemaId))
    .returning({ id: schemaMarkups.id });

  return result.length > 0;
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate schema data against template
 */
export function validateSchema(
  type: SchemaType,
  data: Record<string, unknown>
): ValidationResult {
  const template = SCHEMA_TEMPLATES[type];
  const errors: ValidationResult['errors'] = [];

  // Check required fields
  for (const field of template.requiredFields) {
    if (!(field in data) || data[field] === undefined || data[field] === null) {
      errors.push({
        property: field,
        message: `Required field "${field}" is missing`,
        severity: 'error',
      });
    }
  }

  // Check @context
  if (!data['@context']) {
    errors.push({
      property: '@context',
      message: '@context is missing (should be "https://schema.org")',
      severity: 'error',
    });
  }

  // Check @type
  if (!data['@type']) {
    errors.push({
      property: '@type',
      message: '@type is missing',
      severity: 'error',
    });
  } else if (data['@type'] !== type) {
    errors.push({
      property: '@type',
      message: `@type should be "${type}"`,
      severity: 'warning',
    });
  }

  // Type-specific validations
  if (type === 'Product' && data.offers) {
    const offers = data.offers as Record<string, unknown>;
    if (!offers.price) {
      errors.push({
        property: 'offers.price',
        message: 'Product price is required for rich results',
        severity: 'warning',
      });
    }
    if (!offers.availability) {
      errors.push({
        property: 'offers.availability',
        message: 'Product availability is recommended',
        severity: 'warning',
      });
    }
  }

  if (type === 'Article') {
    if (!data.image) {
      errors.push({
        property: 'image',
        message: 'Article image is required for rich results',
        severity: 'warning',
      });
    }
  }

  const isValid = errors.filter((e) => e.severity === 'error').length === 0;
  const richResultsEligible = isValid && template.richResultsType !== undefined;

  return {
    isValid,
    errors,
    richResultsEligible,
    richResultsType: richResultsEligible ? template.richResultsType : undefined,
  };
}

// ============================================================================
// CODE GENERATION
// ============================================================================

/**
 * Generate JSON-LD script tag
 */
export function generateJsonLdScript(data: Record<string, unknown>): string {
  const json = JSON.stringify(data, null, 2);
  return `<script type="application/ld+json">
${json}
</script>`;
}

/**
 * Generate Next.js metadata component
 */
export function generateNextJsComponent(type: SchemaType, variableName: string = 'data'): string {
  const template = SCHEMA_TEMPLATES[type];

  return `// ${type} Schema Component
import Script from 'next/script';

interface ${type}SchemaProps {
  ${variableName}: {
    ${template.requiredFields.map((f) => `${f}: unknown;`).join('\n    ')}
    ${template.optionalFields.map((f) => `${f}?: unknown;`).join('\n    ')}
  };
}

export function ${type}Schema({ ${variableName} }: ${type}SchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': '${type}',
    ...${variableName},
  };

  return (
    <Script
      id="${type.toLowerCase()}-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}`;
}

/**
 * Generate schema from data
 */
export function generateSchema(
  type: SchemaType,
  data: Record<string, unknown>
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': type,
    ...data,
  };
}

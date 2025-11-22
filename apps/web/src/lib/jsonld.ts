/**
 * JSON-LD Schema Generation Utilities
 *
 * Generates Schema.org structured data from the central facts registry.
 * Prevents drift by using a single source of truth for all organizational claims.
 */

import facts from '@/../../data/facts.json';
import type { WithContext, Organization, WebSite, SoftwareApplication } from 'schema-dts';

/**
 * Generate Organization schema (Schema.org)
 * Used for the main organization entity across the site
 */
export function generateOrganizationSchema(): WithContext<Organization> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: facts.organization.name,
    legalName: facts.organization.legalName,
    description: facts.organization.description,
    foundingDate: `${facts.organization.foundedYear}-01-01`,
    url: facts.links.website,
    logo: `${facts.links.website}/wolf-logo.png`,
    address: {
      '@type': 'PostalAddress',
      addressCountry: facts.organization.headquarters.addressCountry,
    },
    contactPoint: {
      '@type': 'ContactPoint',
      email: facts.contact.businessEmail,
      contactType: 'customer service',
    },
    sameAs: [
      `https://twitter.com/${facts.social.twitter.replace('@', '')}`,
      `https://linkedin.com/company/${facts.social.linkedin}`,
      facts.links.github,
    ],
  };
}

/**
 * Generate WebSite schema (Schema.org)
 * Used for the main website entity
 */
export function generateWebSiteSchema(): WithContext<WebSite> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: facts.product.fullName,
    url: facts.links.website,
    description: facts.product.description,
    publisher: {
      '@type': 'Organization',
      name: facts.organization.name,
      logo: {
        '@type': 'ImageObject',
        url: `${facts.links.website}/wolf-logo.png`,
      },
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${facts.links.website}/search?q={search_term_string}`,
      },
      // @ts-expect-error - query-input is a valid Schema.org property but not in schema-dts types
      'query-input': 'required name=search_term_string',
    },
  };
}

/**
 * Generate SoftwareApplication schema (Schema.org)
 * Used for the product/platform itself
 */
export function generateSoftwareApplicationSchema(): WithContext<SoftwareApplication> {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: facts.product.name,
    applicationCategory: 'FinanceApplication',
    description: facts.product.description,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      description: facts.pricing.summary,
    },
    operatingSystem: 'Web Browser',
    author: {
      '@type': 'Organization',
      name: facts.organization.name,
    },
    url: facts.links.website,
  };
}

/**
 * Generate all JSON-LD schemas for the site
 * Returns an array of all schemas to be embedded in the page
 */
export function generateAllSchemas() {
  return [
    generateOrganizationSchema(),
    generateWebSiteSchema(),
    generateSoftwareApplicationSchema(),
  ];
}

/**
 * Convert JSON-LD object to script tag content
 * Use this in Next.js metadata or in script tags
 */
export function toScriptTag(schema: WithContext<Organization | WebSite | SoftwareApplication>) {
  return JSON.stringify(schema, null, 2);
}

/**
 * Get facts for use in components and pages
 * Provides type-safe access to the facts registry
 */
export function getFacts() {
  return facts;
}


/**
 * @fileoverview Ban FOMO (Fear of Missing Out) language from codebase
 * @author Apex Intelligence Center
 */

'use strict';

const FOMO_PHRASES = [
  'limited time',
  'ending soon',
  'last chance',
  'act now',
  'don\'t miss',
  'only X left',
  'only 1 left',
  'only 2 left',
  'only 3 left',
  'only 4 left',
  'only 5 left',
  'only 6 left',
  'only 7 left',
  'only 8 left',
  'only 9 left',
  'few remaining',
  'few left',
  'flash sale',
  'urgent'
];

/**
 * Checks if text contains any FOMO phrases (case-insensitive)
 * @param {string} text - The text to check
 * @returns {string|null} The matched FOMO phrase or null
 */
function containsFomoLanguage(text) {
  if (!text || typeof text !== 'string') {
    return null;
  }

  const lowerText = text.toLowerCase();

  for (const phrase of FOMO_PHRASES) {
    if (lowerText.includes(phrase)) {
      return phrase;
    }
  }

  return null;
}

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Ban FOMO (Fear of Missing Out) language from codebase',
      category: 'Best Practices',
      recommended: true,
    },
    messages: {
      fomoDetected: 'FOMO language detected: "{{phrase}}". This language is banned. Remove all urgency-creating phrases.',
    },
    schema: [],
  },

  create(context) {
    /**
     * Reports a FOMO violation
     * @param {object} node - The AST node
     * @param {string} phrase - The detected FOMO phrase
     */
    function reportFomo(node, phrase) {
      context.report({
        node,
        messageId: 'fomoDetected',
        data: { phrase },
      });
    }

    return {
      // Check regular string literals
      Literal(node) {
        if (typeof node.value === 'string') {
          const fomoPhrase = containsFomoLanguage(node.value);
          if (fomoPhrase) {
            reportFomo(node, fomoPhrase);
          }
        }
      },

      // Check template literals
      TemplateLiteral(node) {
        for (const quasi of node.quasis) {
          const fomoPhrase = containsFomoLanguage(quasi.value.raw);
          if (fomoPhrase) {
            reportFomo(node, fomoPhrase);
          }
        }
      },

      // Check JSX text
      JSXText(node) {
        const fomoPhrase = containsFomoLanguage(node.value);
        if (fomoPhrase) {
          reportFomo(node, fomoPhrase);
        }
      },

      // Check JSX attribute values
      JSXAttribute(node) {
        if (node.value && node.value.type === 'Literal') {
          const fomoPhrase = containsFomoLanguage(node.value.value);
          if (fomoPhrase) {
            reportFomo(node, fomoPhrase);
          }
        }
      },
    };
  },
};

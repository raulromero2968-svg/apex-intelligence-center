/**
 * Dissertation Chapter Constants
 *
 * Pre-defined chapters for the Apex Psycho-Neural PhD Framework
 */

export interface DissertationChapter {
  number: string;
  title: string;
  description: string;
}

export const DISSERTATION_CHAPTERS = {
  ABSTRACT: {
    number: '00',
    title: 'Abstract',
    description: 'Summary of thesis, methodology, and structure'
  },
  INTRODUCTION: {
    number: '01',
    title: 'Introduction',
    description: 'Core concepts, problem space, and proposed solution'
  },
  LITERATURE_REVIEW: {
    number: '02',
    title: 'Literature Review',
    description: 'Theoretical foundations and scholarly engagement'
  },
  METHODOLOGY: {
    number: '03',
    title: 'Methodology',
    description: 'Platform as methodology - open-source demonstration'
  },
  RESULTS: {
    number: '04',
    title: 'Results & Analysis',
    description: 'Real-time data and community-driven insights'
  },
  DISCUSSION: {
    number: '05',
    title: 'Discussion',
    description: 'Reflection and broader implications'
  },
  CONCLUSION: {
    number: '06',
    title: 'Conclusion',
    description: 'Synthesis and future directions'
  }
} as const;

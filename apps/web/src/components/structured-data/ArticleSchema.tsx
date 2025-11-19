import { Article } from 'schema-dts';
import { JsonLd } from 'react-schemaorg';

type Props = {
  headline: string;
  image: string;
  datePublished: string;
  dateModified?: string;
  authorName: string;
  description: string;
};

export default function ArticleSchema({
  headline,
  image,
  datePublished,
  dateModified,
  authorName,
  description,
}: Props) {
  return (
    <JsonLd<Article>
      item={{
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline,
        image,
        datePublished,
        dateModified: dateModified || datePublished,
        author: {
          '@type': 'Person',
          name: authorName,
        },
        description,
        publisher: {
          '@type': 'Organization',
          name: 'Apex Intelligence',
          logo: {
            '@type': 'ImageObject',
            url: 'https://apex-intelligence.com/logo.png',
          },
        },
      }}
    />
  );
}

import { ToolCarousel } from '@/components/carousel/ToolCarousel';

export default function ToolsPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8 text-center">Intelligence Tools</h1>
      <p className="text-gray-400 text-center mb-12">Professional-grade tools for serious collectors</p>
      <div data-tour="tools-carousel">
        <ToolCarousel />
      </div>
    </div>
  );
}


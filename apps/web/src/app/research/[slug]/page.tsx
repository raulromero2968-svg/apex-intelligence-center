// TEMPORARY STUB to unblock deployment
export default function BlogPost() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 text-cyan-400">
      <h1 className="text-2xl font-mono">Research Article - Under Maintenance</h1>
    </div>
  );
}

export function generateStaticParams() {
  return []; // Return empty array to stop static generation of blog posts
}

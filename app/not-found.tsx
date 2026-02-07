import Link from 'next/link';
import { ArrowRight, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 mx-auto mb-6 bg-brand-50 rounded-2xl flex items-center justify-center">
          <Search className="w-8 h-8 text-brand-500" />
        </div>

        <h1 className="text-6xl font-display font-bold text-midnight-800 mb-2">
          404
        </h1>
        <p className="text-lg font-display font-semibold text-midnight-700 mb-1">
          Page not found
        </p>
        <p className="text-sm text-gray-500 mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        <Link
          href="/pipeline"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-500 text-white rounded-xl text-sm font-semibold hover:bg-brand-600 transition-colors"
        >
          Go to Pipeline
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

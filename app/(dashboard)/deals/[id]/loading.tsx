export default function DealDetailLoading() {
  return (
    <div className="max-w-4xl mx-auto animate-pulse">
      {/* Back link */}
      <div className="h-4 w-32 bg-gray-100 rounded mb-6" />

      {/* Deal header */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-card mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="h-7 w-64 bg-gray-200 rounded-lg mb-2" />
            <div className="flex items-center gap-3">
              <div className="h-5 w-20 bg-gray-100 rounded-full" />
              <div className="h-4 w-32 bg-gray-100 rounded" />
            </div>
          </div>
          <div className="h-9 w-24 bg-gray-100 rounded-lg" />
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-4 pt-4 border-t border-gray-100">
          {[1, 2, 3, 4].map(i => (
            <div key={i}>
              <div className="h-3 w-16 bg-gray-100 rounded mb-2" />
              <div className="h-5 w-24 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Tabs skeleton */}
      <div className="flex gap-1 mb-4 border-b border-gray-100 pb-px">
        {['Deliverables', 'Files', 'Invoices', 'Notes'].map(tab => (
          <div key={tab} className="h-9 w-24 bg-gray-100 rounded-lg" />
        ))}
      </div>

      {/* Tab content skeleton */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-card">
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-4 py-3 border-b border-gray-50 last:border-0">
              <div className="h-5 w-5 bg-gray-100 rounded" />
              <div className="flex-1">
                <div className="h-4 w-48 bg-gray-200 rounded mb-1" />
                <div className="h-3 w-32 bg-gray-100 rounded" />
              </div>
              <div className="h-6 w-16 bg-gray-100 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

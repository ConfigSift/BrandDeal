export default function PipelineLoading() {
  return (
    <div className="h-full flex flex-col">
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-6">
        <div className="animate-pulse">
          <div className="h-7 w-28 bg-gray-200 rounded-lg" />
          <div className="h-4 w-48 bg-gray-100 rounded-lg mt-2" />
        </div>
      </div>

      {/* Kanban columns skeleton */}
      <div className="flex-1 flex gap-4 overflow-x-auto pb-4">
        {['Lead', 'Negotiating', 'Signed', 'Delivered', 'Paid'].map(stage => (
          <div key={stage} className="flex-shrink-0 w-72">
            <div className="animate-pulse">
              {/* Column header */}
              <div className="flex items-center gap-2 mb-3 px-1">
                <div className="h-5 w-24 bg-gray-200 rounded" />
                <div className="h-5 w-6 bg-gray-100 rounded-full" />
              </div>

              {/* Card skeletons */}
              <div className="space-y-2">
                {[1, 2, 3].slice(0, Math.floor(Math.random() * 3) + 1).map(i => (
                  <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 shadow-card">
                    <div className="h-4 w-3/4 bg-gray-200 rounded mb-3" />
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-3 w-3 bg-gray-100 rounded" />
                      <div className="h-3 w-20 bg-gray-100 rounded" />
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 bg-gray-100 rounded" />
                      <div className="h-3 w-16 bg-gray-100 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

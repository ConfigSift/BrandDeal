export default function DashboardLoading() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Page header skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-7 w-40 bg-gray-200 rounded-lg" />
          <div className="h-4 w-56 bg-gray-100 rounded-lg mt-2" />
        </div>
        <div className="h-10 w-28 bg-gray-200 rounded-xl" />
      </div>

      {/* Content skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 p-6 shadow-card">
            <div className="h-4 w-20 bg-gray-100 rounded mb-3" />
            <div className="h-8 w-32 bg-gray-200 rounded-lg" />
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-card">
        <div className="h-5 w-36 bg-gray-200 rounded mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex items-center gap-4">
              <div className="h-4 w-full bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

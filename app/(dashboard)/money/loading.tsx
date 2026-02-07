export default function MoneyLoading() {
  return (
    <div className="animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="h-7 w-44 bg-gray-200 rounded-lg" />
          <div className="h-4 w-32 bg-gray-100 rounded-lg mt-2" />
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 shadow-card">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-gray-100 rounded-lg" />
              <div className="h-3 w-20 bg-gray-100 rounded" />
            </div>
            <div className="h-7 w-28 bg-gray-200 rounded-lg" />
          </div>
        ))}
      </div>

      {/* Chart area */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-card mb-6">
        <div className="h-5 w-32 bg-gray-200 rounded mb-4" />
        <div className="h-64 bg-gray-50 rounded-xl flex items-end justify-between px-4 pb-4 gap-2">
          {[40, 65, 55, 80, 45, 70, 90, 60, 75, 85, 50, 95].map((h, i) => (
            <div key={i} className="flex-1 bg-gray-200 rounded-t" style={{ height: `${h}%` }} />
          ))}
        </div>
      </div>

      {/* Recent payments */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-card">
        <div className="h-5 w-36 bg-gray-200 rounded mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-100 rounded-lg" />
                <div>
                  <div className="h-4 w-36 bg-gray-200 rounded mb-1" />
                  <div className="h-3 w-24 bg-gray-100 rounded" />
                </div>
              </div>
              <div className="h-5 w-20 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

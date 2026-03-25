export default function StatCard({ icon: Icon, label, value, sub, color = 'blue', trend }) {
  const colorMap = {
    blue: 'bg-primary-50 text-primary-600',
    green: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
  }

  return (
    <div className="card p-5 flex items-start gap-4">
      <div className={`p-3 rounded-xl ${colorMap[color]}`}>
        {Icon && <Icon size={22} />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-500 font-medium">{label}</p>
        <p className="text-2xl font-bold text-slate-900 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
        {trend !== undefined && (
          <p className={`text-xs mt-1 font-medium ${trend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            {trend >= 0 ? '+' : ''}{trend}% from last month
          </p>
        )}
      </div>
    </div>
  )
}

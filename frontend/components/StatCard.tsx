interface Props {
  label: string
  value: string
  valueClass?: string
}

export default function StatCard({ label, value, valueClass = 'text-[#e4e6f0]' }: Props) {
  return (
    <div className="bg-[#1a1d27] border border-white/[0.07] rounded-xl p-4 px-5">
      <div className="text-[11px] text-[#6b7280] uppercase tracking-widest mb-1.5">{label}</div>
      <div className={`text-xl font-semibold tracking-tight ${valueClass}`}>{value}</div>
    </div>
  )
}

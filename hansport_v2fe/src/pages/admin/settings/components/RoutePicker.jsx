import { ROUTE_OPTIONS } from "../settingsUtils";

export default function RoutePicker({ label, value, onChange }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-text-secondary mb-1.5">{label}</label>
      <div className="grid grid-cols-1 sm:grid-cols-[150px_1fr] gap-2">
        <select
          value={ROUTE_OPTIONS.some((option) => option.value === value) ? value : ""}
          onChange={(event) => onChange(event.target.value)}
          className="input-field text-sm py-2"
          aria-label={`${label} gợi ý`}
        >
          <option value="">Tùy chỉnh</option>
          {ROUTE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
        <input value={value} onChange={(event) => onChange(event.target.value)} className="input-field text-sm py-2" placeholder="/shop" />
      </div>
    </div>
  );
}

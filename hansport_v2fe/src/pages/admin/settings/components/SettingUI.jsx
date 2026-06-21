import Toggle from "./Toggle";
import { COLOR_OPTIONS } from "../settingsUtils";

export function Section({ title, description, actions, children }) {
  return (
    <section>
      <div className="mb-5 flex flex-col md:flex-row md:items-start md:justify-between gap-3">
        <div>
          <h3 className="text-title font-bold text-text-primary">{title}</h3>
          <p className="text-sm text-text-muted mt-1 max-w-2xl">{description}</p>
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}

export function ItemHeader({ title, active, onActiveChange, onMoveUp, onMoveDown, onRemove, disableUp, disableDown, removeLabel }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
      <div className="flex items-center gap-2">
        <p className="text-xs font-bold text-text-muted uppercase tracking-wider">{title}</p>
        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${active ? "bg-brand-green-light text-brand-green" : "bg-surface-muted text-text-muted"}`}>
          {active ? "Đang hiển thị" : "Đang ẩn"}
        </span>
      </div>
      <div className="flex items-center gap-1">
        <Toggle checked={active} onChange={onActiveChange} label={active ? "Tắt hiển thị" : "Bật hiển thị"} />
        <IconAction icon="keyboard_arrow_up" label="Di chuyển lên" disabled={disableUp} onClick={onMoveUp} />
        <IconAction icon="keyboard_arrow_down" label="Di chuyển xuống" disabled={disableDown} onClick={onMoveDown} />
        <IconAction icon="delete" label={removeLabel} tone="danger" onClick={onRemove} />
      </div>
    </div>
  );
}

export function IconAction({ icon, label, onClick, disabled = false, tone = "default" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors disabled:opacity-35 ${
        tone === "danger" ? "text-text-muted hover:bg-red-50 hover:text-danger" : "text-text-muted hover:bg-white hover:text-brand-blue"
      }`}
    >
      <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{icon}</span>
    </button>
  );
}

export function Input({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-text-secondary mb-1.5">{label}</label>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="input-field text-sm py-2" placeholder={placeholder} />
    </div>
  );
}

export function Select({ label, value, onChange, options }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-text-secondary mb-1.5">{label}</label>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="input-field text-sm py-2">
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </div>
  );
}

export function ColorPicker({ value, onChange }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-text-secondary mb-1.5">Màu hiển thị</label>
      <div className="grid grid-cols-3 gap-2">
        {COLOR_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`h-10 rounded-lg border flex items-center justify-center gap-1 text-xs font-bold ${value === option.value ? "border-brand-blue ring-2 ring-brand-blue/15" : "border-surface-border"}`}
            aria-label={`Chọn màu ${option.label}`}
          >
            <span className={`w-3 h-3 rounded-full ${option.preview}`} />
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

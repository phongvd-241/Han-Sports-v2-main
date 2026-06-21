import { useState } from "react";

export default function ChipEditor({ label, values, onChange, placeholder }) {
  const [draft, setDraft] = useState("");

  const addDraft = () => {
    const value = draft.trim();
    if (!value || values.some((item) => item.toLowerCase() === value.toLowerCase())) {
      setDraft("");
      return;
    }
    onChange([...values, value]);
    setDraft("");
  };

  return (
    <div className="rounded-xl border border-surface-border bg-surface-soft p-4">
      <label className="block text-sm font-bold text-text-primary mb-3">{label}</label>
      <div className="flex flex-wrap gap-2 mb-3">
        {values.map((value) => (
          <span key={value} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-white border border-surface-border text-sm font-semibold text-text-primary">
            {value}
            <button type="button" onClick={() => onChange(values.filter((item) => item !== value))} className="text-text-muted hover:text-danger" aria-label={`Xóa ${value}`}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addDraft();
            }
          }}
          className="input-field text-sm py-2"
          placeholder={placeholder}
        />
        <button type="button" onClick={addDraft} className="btn-outline px-3 py-2" aria-label={`Thêm ${label}`}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
        </button>
      </div>
    </div>
  );
}

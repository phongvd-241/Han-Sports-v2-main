import { Section, ItemHeader, Input } from "./components/SettingUI";
import PreviewPanel from "./components/PreviewPanel";
import { SYSTEM_NAV_ITEMS } from "./settingsUtils";

// ── Loại liên kết bổ sung ─────────────────────────────────────────────────────
const NAV_LINK_TYPES = [
  { value: "category", label: "Danh mục sản phẩm" },
  { value: "brand", label: "Thương hiệu" },
  { value: "custom", label: "Tùy chỉnh" },
];

// ── Picker path dựa theo loại ─────────────────────────────────────────────────
function NavLinkEditor({ item, index, catalogGroups, onChange }) {
  const type = item._type || "custom";

  // Lấy danh sách category/brand từ catalogGroups
  const categoryNames = catalogGroups.map((g) => g.name);
  const brandNames = [
    ...new Set(
      catalogGroups.flatMap((g) => (g.brands || []).map((b) => b.name ?? b)).filter(Boolean)
    ),
  ];

  const handleTypeChange = (newType) => {
    onChange(index, "_type", newType);
    // Reset path khi đổi loại
    if (newType === "category" && categoryNames.length > 0) {
      const first = categoryNames[0];
      onChange(index, "label", first);
      onChange(index, "path", `/shop?category=${encodeURIComponent(first)}`);
    } else if (newType === "brand" && brandNames.length > 0) {
      const first = brandNames[0];
      onChange(index, "label", first);
      onChange(index, "path", `/shop?brand=${encodeURIComponent(first)}`);
    } else if (newType === "custom") {
      // giữ nguyên hoặc reset
    }
  };

  const handleCategorySelect = (name) => {
    onChange(index, "label", name);
    onChange(index, "path", `/shop?category=${encodeURIComponent(name)}`);
  };

  const handleBrandSelect = (name) => {
    onChange(index, "label", name);
    onChange(index, "path", `/shop?brand=${encodeURIComponent(name)}`);
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Chọn loại liên kết */}
      <div>
        <label className="block text-xs font-semibold text-text-secondary mb-1.5">Loại liên kết</label>
        <div className="flex gap-2 flex-wrap">
          {NAV_LINK_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => handleTypeChange(t.value)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                type === t.value
                  ? "bg-brand-blue text-white border-brand-blue"
                  : "bg-white border-surface-border text-text-secondary hover:border-brand-blue/40 hover:text-brand-blue"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Category picker */}
      {type === "category" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">Chọn danh mục</label>
            {categoryNames.length > 0 ? (
              <select
                value={categoryNames.includes(item.label) ? item.label : ""}
                onChange={(e) => handleCategorySelect(e.target.value)}
                className="input-field text-sm py-2"
              >
                <option value="">-- Chọn danh mục --</option>
                {categoryNames.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            ) : (
              <p className="text-xs text-text-muted italic">Chưa có danh mục trong database.</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">Tên hiển thị</label>
            <input
              value={item.label || ""}
              onChange={(e) => onChange(index, "label", e.target.value)}
              className="input-field text-sm py-2"
              placeholder="Tên menu..."
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-text-secondary mb-1">Đường dẫn (tự sinh)</label>
            <p className="font-mono text-xs bg-surface-muted rounded-lg px-3 py-2 text-brand-blue border border-surface-border">
              {item.path || "/shop?category=..."}
            </p>
          </div>
        </div>
      )}

      {/* Brand picker */}
      {type === "brand" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">Chọn thương hiệu</label>
            {brandNames.length > 0 ? (
              <select
                value={brandNames.includes(item.label) ? item.label : ""}
                onChange={(e) => handleBrandSelect(e.target.value)}
                className="input-field text-sm py-2"
              >
                <option value="">-- Chọn thương hiệu --</option>
                {brandNames.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            ) : (
              <p className="text-xs text-text-muted italic">Chưa có thương hiệu trong database.</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">Tên hiển thị</label>
            <input
              value={item.label || ""}
              onChange={(e) => onChange(index, "label", e.target.value)}
              className="input-field text-sm py-2"
              placeholder="Tên menu..."
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-text-secondary mb-1">Đường dẫn (tự sinh)</label>
            <p className="font-mono text-xs bg-surface-muted rounded-lg px-3 py-2 text-brand-blue border border-surface-border">
              {item.path || "/shop?brand=..."}
            </p>
          </div>
        </div>
      )}

      {/* Custom path */}
      {type === "custom" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Tên hiển thị"
            value={item.label || ""}
            onChange={(value) => onChange(index, "label", value)}
            placeholder="VD: Cửa hàng"
          />
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">Đường dẫn</label>
            <input
              value={item.path || ""}
              onChange={(e) => onChange(index, "path", e.target.value)}
              className="input-field text-sm py-2"
              placeholder="/shop, /shop?sale=true, ..."
            />
            <p className="text-[11px] text-text-muted mt-1 px-1">Phải bắt đầu bằng dấu /</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function NavigationSettings({ items, catalogGroups, onAdd, onRemove, onMove, onChange }) {
  return (
    <Section
      title="Thanh menu"
      description="Ba mục chính của header do hệ thống quản lý. Admin chỉ thêm các liên kết phụ khi thật sự cần."
      actions={(
        <button type="button" onClick={onAdd} className="btn-outline text-sm py-2 px-3">
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
          Thêm liên kết
        </button>
      )}
    >
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-5">
        <div className="flex flex-col gap-3">
          {/* ── Menu hệ thống cố định ── */}
          <div className="rounded-xl border border-brand-blue/20 bg-brand-blue-light/40 p-4">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div>
                <p className="text-sm font-bold text-text-primary">Menu hệ thống</p>
                <p className="text-xs text-text-muted mt-1">
                  Luôn đồng bộ với giao diện client, không cần nhập thủ công.
                </p>
              </div>
              <span className="badge-blue">{SYSTEM_NAV_ITEMS.length} mục cố định</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {SYSTEM_NAV_ITEMS.map((item) => (
                <div key={item.label} className="rounded-lg border border-surface-border bg-white p-3">
                  <div className="flex items-center gap-2 text-brand-blue">
                    <span className="material-symbols-outlined" style={{ fontSize: 19, fontVariationSettings: "'FILL' 1" }}>
                      {item.icon}
                    </span>
                    <p className="text-sm font-bold text-text-primary">{item.label}</p>
                    <span className="ml-auto text-[10px] bg-brand-blue-light text-brand-blue px-1.5 py-0.5 rounded-full font-bold">
                      Cố định
                    </span>
                  </div>
                  <p className="text-xs text-text-muted mt-2 leading-relaxed">
                    {item.label === "Sản phẩm"
                      ? `${catalogGroups.length} danh mục từ database`
                      : item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Liên kết bổ sung ── */}
          {items.length > 0 && (
            <p className="text-xs font-bold text-text-muted uppercase tracking-wider mt-2 px-1">
              Liên kết bổ sung ({items.length})
            </p>
          )}
          {items.map((item, index) => (
            <div
              key={index}
              className={`p-4 border rounded-xl bg-surface-soft ${
                item.active === false ? "opacity-70 border-surface-border" : "border-brand-blue/20"
              }`}
            >
              <ItemHeader
                title={`Liên kết ${index + 1}${item.label ? `: ${item.label}` : ""}`}
                active={item.active !== false}
                onActiveChange={(value) => onChange(index, "active", value)}
                onMoveUp={() => onMove(index, -1)}
                onMoveDown={() => onMove(index, 1)}
                onRemove={() => onRemove(index)}
                disableUp={index === 0}
                disableDown={index === items.length - 1}
                removeLabel="Xóa liên kết"
              />
              <NavLinkEditor
                item={item}
                index={index}
                catalogGroups={catalogGroups}
                onChange={onChange}
              />
            </div>
          ))}

          {items.length === 0 && (
            <div className="rounded-lg border border-dashed border-surface-border px-4 py-6 text-center">
              <span className="material-symbols-outlined text-text-muted mb-2" style={{ fontSize: 28 }}>link_off</span>
              <p className="text-sm text-text-muted">
                Chưa có liên kết bổ sung. Header vẫn hiển thị đầy đủ ba mục hệ thống ở trên.
              </p>
            </div>
          )}
        </div>

        {/* ── Preview ── */}
        <div className="xl:sticky xl:top-24 self-start">
          <PreviewPanel title="Preview header menu">
            <nav className="flex flex-col gap-1.5">
              {SYSTEM_NAV_ITEMS.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-brand-blue-light/30 border border-brand-blue/15"
                >
                  <span
                    className="material-symbols-outlined text-brand-blue"
                    style={{ fontSize: 16, fontVariationSettings: "'FILL' 1" }}
                  >
                    {item.icon}
                  </span>
                  <span className="text-sm font-semibold text-text-primary">{item.label}</span>
                  <span className="ml-auto text-[10px] text-text-muted">cố định</span>
                </div>
              ))}
              {items
                .filter((i) => i.active !== false)
                .map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-white border border-surface-border"
                  >
                    <span className="material-symbols-outlined text-text-muted" style={{ fontSize: 16 }}>
                      {item._type === "category"
                        ? "category"
                        : item._type === "brand"
                          ? "label"
                          : "link"}
                    </span>
                    <span className="text-sm font-semibold text-text-primary">
                      {item.label || "Chưa đặt tên"}
                    </span>
                    <span className="ml-auto text-[10px] text-text-muted truncate max-w-[80px]">
                      {item.path || ""}
                    </span>
                  </div>
                ))}
            </nav>
          </PreviewPanel>
        </div>
      </div>
    </Section>
  );
}

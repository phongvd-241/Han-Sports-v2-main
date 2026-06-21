import { Section, ItemHeader, ColorPicker } from "./components/SettingUI";
import PreviewPanel from "./components/PreviewPanel";
import ChipEditor from "./components/ChipEditor";
import EmptyState from "../../../components/admin/EmptyState";
import { ICON_OPTIONS } from "./settingsUtils";

// ── Icon picker với visual preview ───────────────────────────────────────────
function IconPicker({ value, onChange }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-text-secondary mb-1.5">Icon</label>
      <div className="flex flex-wrap gap-1.5">
        {ICON_OPTIONS.map((icon) => (
          <button
            key={icon}
            type="button"
            title={icon}
            onClick={() => onChange(icon)}
            className={`w-9 h-9 rounded-lg flex items-center justify-center border transition-all ${
              value === icon
                ? "bg-brand-blue text-white border-brand-blue shadow-sm"
                : "bg-white border-surface-border text-text-muted hover:border-brand-blue/40 hover:text-brand-blue hover:bg-brand-blue-light/30"
            }`}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 20, fontVariationSettings: value === icon ? "'FILL' 1" : "'FILL' 0" }}
            >
              {icon}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── CategorySourcePicker: chọn từ catalog thực hoặc custom ───────────────────
function CategorySourcePicker({ value, path, catalogGroups, onNameChange, onPathChange }) {
  const dbNames = catalogGroups.map((g) => g.name);
  const isFromDb = dbNames.includes(value);
  const selectedValue = isFromDb ? value : "__custom__";

  const handleSourceSelect = (e) => {
    const selected = e.target.value;
    if (selected === "__custom__") {
      onNameChange("");
      onPathChange("/shop");
    } else {
      const encodedCategory = encodeURIComponent(selected);
      onNameChange(selected);
      onPathChange(`/shop?category=${encodedCategory}`);
    }
  };

  return (
    <div>
      <label className="block text-xs font-semibold text-text-secondary mb-1.5">Tên hiển thị</label>
      <div className="flex flex-col gap-1.5">
        <select
          value={selectedValue}
          onChange={handleSourceSelect}
          className="input-field text-sm py-2"
          aria-label="Chọn nguồn danh mục"
        >
          <option value="__custom__">✏️ Nhập tùy chỉnh</option>
          {dbNames.length > 0 && (
            <optgroup label="Danh mục từ database">
              {dbNames.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </optgroup>
          )}
        </select>
        {selectedValue === "__custom__" && (
          <input
            value={value}
            onChange={(e) => {
              onNameChange(e.target.value);
            }}
            className="input-field text-sm py-2"
            placeholder="VD: Vợt cầu lông"
          />
        )}
        {selectedValue !== "__custom__" && (
          <p className="text-[11px] text-text-muted px-1">
            Đường dẫn tự sinh: <span className="font-mono text-brand-blue">{path}</span>
          </p>
        )}
      </div>
    </div>
  );
}

// ── PathInput: chỉ hiện khi custom ───────────────────────────────────────────
function PathInput({ value, onChange, show }) {
  if (!show) return null;
  return (
    <div>
      <label className="block text-xs font-semibold text-text-secondary mb-1.5">Đường dẫn</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input-field text-sm py-2"
        placeholder="/shop?category=..."
      />
    </div>
  );
}

export default function CatalogSettings({
  brands,
  targets,
  categories,
  catalogGroups,
  onField,
  onSyncCatalog,
  onAddCategory,
  onRemoveCategory,
  onMoveCategory,
  onCategoryChange,
}) {
  const dbNames = catalogGroups.map((g) => g.name);

  return (
    <Section
      title="Catalog sản phẩm"
      description="Danh mục menu sản phẩm lấy tự động từ database. Phần dưới cho phép tùy chỉnh cách hiển thị shortcut trên trang chủ."
      actions={(
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={onSyncCatalog} className="btn-primary text-sm py-2 px-3">
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>sync</span>
            Đồng bộ từ sản phẩm
          </button>
          <button type="button" onClick={onAddCategory} className="btn-outline text-sm py-2 px-3">
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
            Thêm shortcut
          </button>
        </div>
      )}
    >
      {/* ── Catalog thực tế từ DB ── */}
      <div className="rounded-xl border border-brand-green/20 bg-brand-green-light/40 p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
          <div>
            <p className="text-sm font-bold text-text-primary">Catalog đang có trong database</p>
            <p className="text-xs text-text-muted mt-1">
              Dữ liệu này được dùng cho mega dropdown ngoài website. Nhấn
              {" "}<strong>Đồng bộ</strong> để tạo shortcut từ danh mục thực tế.
            </p>
          </div>
          <span className="badge-green">{catalogGroups.length} danh mục</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {catalogGroups.map((group) => (
            <div key={group.name} className="rounded-lg border border-surface-border bg-white p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-bold text-text-primary">{group.name}</p>
                <span className="text-xs font-semibold text-text-muted">{group.productCount ?? (group.brands?.length ?? 0)} sp</span>
              </div>
              <p className="text-xs text-text-muted mt-1.5 leading-relaxed">
                {(group.brands || []).map((brand) => brand.name ?? brand).join(", ") || "Chưa có thương hiệu"}
              </p>
            </div>
          ))}
          {catalogGroups.length === 0 && (
            <p className="text-sm text-text-muted col-span-full">Chưa có sản phẩm hoạt động để tạo catalog.</p>
          )}
        </div>
      </div>

      {/* ── Thương hiệu & Đối tượng ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <ChipEditor
          label="Thương hiệu"
          values={brands}
          onChange={(values) => onField("brands", values)}
          placeholder="Nhập thương hiệu rồi Enter"
        />
        <ChipEditor
          label="Nhóm đối tượng"
          values={targets}
          onChange={(values) => onField("targets", values)}
          placeholder="Nam, Nữ, Unisex..."
        />
      </div>

      {/* ── Shortcut trang chủ ── */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-5">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {categories.map((cat, index) => {
            const isDbCategory = dbNames.includes(cat.name);
            return (
              <div
                key={index}
                className={`p-4 border border-surface-border rounded-xl bg-surface-soft ${cat.active === false ? "opacity-70" : ""}`}
              >
                <ItemHeader
                  title={`Shortcut ${index + 1}${cat.name ? `: ${cat.name}` : ""}`}
                  active={cat.active !== false}
                  onActiveChange={(value) => onCategoryChange(index, "active", value)}
                  onMoveUp={() => onMoveCategory(index, -1)}
                  onMoveDown={() => onMoveCategory(index, 1)}
                  onRemove={() => onRemoveCategory(index)}
                  disableUp={index === 0}
                  disableDown={index === categories.length - 1}
                  removeLabel="Xóa shortcut"
                />
                <div className="flex flex-col gap-3">
                  <CategorySourcePicker
                    value={cat.name || ""}
                    path={cat.path || "/shop"}
                    catalogGroups={catalogGroups}
                    onNameChange={(val) => onCategoryChange(index, "name", val)}
                    onPathChange={(val) => onCategoryChange(index, "path", val)}
                  />
                  <PathInput
                    value={cat.path || ""}
                    onChange={(val) => onCategoryChange(index, "path", val)}
                    show={!isDbCategory}
                  />
                  <IconPicker
                    value={cat.icon || "category"}
                    onChange={(val) => onCategoryChange(index, "icon", val)}
                  />
                  <ColorPicker
                    value={cat.color}
                    onChange={(val) => onCategoryChange(index, "color", val)}
                  />
                </div>
              </div>
            );
          })}
          {categories.length === 0 && (
            <EmptyState
              icon="category"
              title="Chưa có shortcut nào"
              description='Nhấn "Thêm shortcut" hoặc "Đồng bộ từ sản phẩm" để bắt đầu.'
              className="py-10 bg-surface-muted rounded-xl border border-dashed border-surface-border lg:col-span-2"
            />
          )}
        </div>

        {/* ── Preview ── */}
        <div className="xl:sticky xl:top-24 self-start">
          <PreviewPanel title="Preview shortcut trang chủ">
            <div className="grid grid-cols-2 gap-3">
              {categories
                .filter((cat) => cat.active !== false)
                .map((cat, index) => (
                  <div
                    key={`${cat.name}-${index}`}
                    className={`rounded-xl p-3 border border-surface-border flex flex-col items-start gap-1 ${cat.color || "bg-white text-text-primary"}`}
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: 24, fontVariationSettings: "'FILL' 1" }}
                    >
                      {cat.icon || "category"}
                    </span>
                    <p className="text-sm font-bold leading-tight mt-1">{cat.name || "Danh mục"}</p>
                    <p className="text-[10px] opacity-70 truncate w-full">{cat.path || ""}</p>
                  </div>
                ))}
              {categories.filter((cat) => cat.active !== false).length === 0 && (
                <p className="text-xs text-text-muted col-span-2 text-center py-4">Không có shortcut nào đang hiển thị</p>
              )}
            </div>
          </PreviewPanel>
        </div>
      </div>
    </Section>
  );
}

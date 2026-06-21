import AdminMetricCard from "../../components/admin/AdminMetricCard";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import { useAdminSettings } from "./settings/useAdminSettings";
import { TABS, formatVnd } from "./settings/settingsUtils";
import SettingsSaveBar from "./settings/components/SettingsSaveBar";
import BannerSettings from "./settings/BannerSettings";
import NavigationSettings from "./settings/NavigationSettings";
import CatalogSettings from "./settings/CatalogSettings";
import ShippingSettings from "./settings/ShippingSettings";
import ContactSettings from "./settings/ContactSettings";

export default function SettingsPage() {
  const {
    activeTab,
    setActiveTab,
    form,
    catalogGroups,
    saving,
    uploadingBannerIndex,
    isDirty,
    activeTabDirty,
    isTabDirty,
    updateField,
    updateListItem,
    addListItem,
    removeListItem,
    moveListItem,
    handleBannerUpload,
    saveAll,
    saveCurrentTab,
    handleRevert,
    handleSyncCatalog,
  } = useAdminSettings();

  if (!form) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-brand-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const activeSlides = form.slides.filter((slide) => slide.active !== false).length;
  const activeNavItems = 3 + form.headerNav.filter((item) => item.active !== false).length; // 3 là SYSTEM_NAV_ITEMS.length
  const totalNavItems = 3 + form.headerNav.length;

  return (
    <div className="max-w-6xl flex flex-col gap-6">
      <AdminPageHeader
        title="Cấu hình hệ thống"
        description="Quản lý nội dung public của website bằng form có preview, trạng thái hiển thị và validation rõ ràng."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <AdminMetricCard icon="image" label="Banner đang bật" value={`${activeSlides}/${form.slides.length}`} tone="blue" />
        <AdminMetricCard icon="menu" label="Menu đang bật" value={`${activeNavItems}/${totalNavItems}`} tone="teal" />
        <AdminMetricCard icon="category" label="Danh mục có sản phẩm" value={catalogGroups.length} tone="green" />
        <AdminMetricCard icon="local_shipping" label="Miễn phí ship" value={formatVnd(form.freeShipLimit)} tone="amber" />
      </div>

      <form onSubmit={saveAll} className="card overflow-hidden">
        <div className="border-b border-surface-border bg-surface-soft">
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3 p-3">
            <div className="overflow-x-auto hide-scrollbar">
              <div className="flex min-w-max gap-1">
                {TABS.map((tab) => {
                  const dirty = isTabDirty(tab.key);
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setActiveTab(tab.key)}
                      className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
                        activeTab === tab.key ? "bg-white text-brand-blue shadow-sm" : "text-text-secondary hover:text-brand-blue hover:bg-white/70"
                      }`}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{tab.icon}</span>
                      {tab.label}
                      {dirty && <span className="w-2 h-2 rounded-full bg-amber-500" aria-label="Có thay đổi chưa lưu" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <SettingsSaveBar
              isDirty={isDirty}
              activeTabDirty={activeTabDirty}
              saving={saving}
              onRevert={handleRevert}
              onSaveCurrentTab={saveCurrentTab}
            />
          </div>
        </div>

        <div className="p-5 md:p-6">
          {activeTab === "banner" && (
            <BannerSettings
              slides={form.slides}
              onAdd={() => addListItem("slides", {
                title: "",
                subtitle: "",
                cta: "",
                ctaLink: "/shop",
                image: "",
                imageFolder: "banner",
                altText: "",
                active: true,
              })}
              onRemove={(index) => removeListItem("slides", index)}
              onMove={(index, direction) => moveListItem("slides", index, direction)}
              onChange={(index, field, value) => updateListItem("slides", index, field, value)}
              onUpload={handleBannerUpload}
              uploadingIndex={uploadingBannerIndex}
            />
          )}

          {activeTab === "navigation" && (
            <NavigationSettings
              items={form.headerNav}
              catalogGroups={catalogGroups}
              onAdd={() => addListItem("headerNav", { label: "Liên kết mới", path: "/shop", active: true, _type: "custom" })}
              onRemove={(index) => removeListItem("headerNav", index)}
              onMove={(index, direction) => moveListItem("headerNav", index, direction)}
              onChange={(index, field, value) => updateListItem("headerNav", index, field, value)}
            />
          )}

          {activeTab === "catalog" && (
            <CatalogSettings
              brands={form.brands}
              targets={form.targets}
              categories={form.categories}
              catalogGroups={catalogGroups}
              onField={updateField}
              onSyncCatalog={handleSyncCatalog}
              onAddCategory={() => addListItem("categories", {
                name: "Danh mục mới",
                icon: "category",
                path: "/shop",
                color: "bg-surface-muted text-text-primary",
                active: true,
              })}
              onRemoveCategory={(index) => removeListItem("categories", index)}
              onMoveCategory={(index, direction) => moveListItem("categories", index, direction)}
              onCategoryChange={(index, field, value) => updateListItem("categories", index, field, value)}
            />
          )}

          {activeTab === "shipping" && (
            <ShippingSettings
              shippingFee={form.shippingFee}
              freeShipLimit={form.freeShipLimit}
              onField={updateField}
            />
          )}

          {activeTab === "contact" && (
            <ContactSettings hotline={form.hotline} onField={updateField} />
          )}
        </div>
      </form>
    </div>
  );
}

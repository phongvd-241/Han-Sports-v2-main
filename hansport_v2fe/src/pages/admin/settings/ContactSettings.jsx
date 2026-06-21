import { Section, Input } from "./components/SettingUI";
import PreviewPanel from "./components/PreviewPanel";

export default function ContactSettings({ hotline, onField }) {
  return (
    <Section title="Hotline và liên hệ" description="Số điện thoại hiển thị ở header/footer và các điểm hỗ trợ khách hàng.">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
        <div className="max-w-md">
          <Input label="Hotline" value={hotline} onChange={(value) => onField("hotline", value)} placeholder="090 123 4567" />
        </div>
        <PreviewPanel title="Preview header/footer">
          <div className="flex items-center gap-3 rounded-xl border border-surface-border bg-white p-4">
            <div className="w-10 h-10 rounded-full bg-brand-blue-light text-brand-blue flex items-center justify-center">
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>call</span>
            </div>
            <div>
              <p className="text-xs text-text-muted">Hotline hỗ trợ</p>
              <p className="font-bold text-text-primary">{hotline || "Chưa cấu hình"}</p>
            </div>
          </div>
        </PreviewPanel>
      </div>
    </Section>
  );
}

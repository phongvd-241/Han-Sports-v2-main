import { Section, Input } from "./components/SettingUI";
import PreviewPanel from "./components/PreviewPanel";
import { formatVnd } from "./settingsUtils";

export default function ShippingSettings({ shippingFee, freeShipLimit, onField }) {
  return (
    <Section title="Cấu hình vận chuyển" description="Thiết lập phí vận chuyển mặc định và điều kiện miễn phí ship.">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input type="number" label="Phí vận chuyển (VND)" value={shippingFee} onChange={(value) => onField("shippingFee", value)} placeholder="30000" />
          <Input type="number" label="Mức miễn phí ship (VND)" value={freeShipLimit} onChange={(value) => onField("freeShipLimit", value)} placeholder="500000" />
        </div>
        <PreviewPanel title="Preview chính sách">
          <div className="rounded-xl bg-brand-green-light border border-brand-green/20 p-4 text-brand-green">
            <p className="text-sm font-bold">Miễn phí vận chuyển</p>
            <p className="text-sm mt-1">Áp dụng cho đơn hàng từ {formatVnd(freeShipLimit)}.</p>
            <p className="text-xs mt-3 text-text-muted">Đơn dưới mức này áp dụng phí {formatVnd(shippingFee)}.</p>
          </div>
        </PreviewPanel>
      </div>
    </Section>
  );
}

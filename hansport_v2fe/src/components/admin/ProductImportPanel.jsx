import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { productApi } from "../../api/productApi";

export default function ProductImportPanel({ onImported }) {
  const fileRef = useRef(null);
  const [file, setFile] = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (event) => {
    const selected = event.target.files?.[0] || null;
    setFile(selected);
    setReport(null);
  };

  const runImport = async (dryRun) => {
    if (!file) {
      toast.error("Chọn file Excel hoặc CSV trước");
      return;
    }
    setLoading(true);
    try {
      const res = await productApi.importProducts(file, dryRun);
      const nextReport = res.data?.data;
      setReport(nextReport);
      if (dryRun) {
        toast.success("Đã kiểm tra file import");
      } else {
        toast.success("Đã import dữ liệu sản phẩm");
        onImported?.();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Import sản phẩm thất bại");
    } finally {
      setLoading(false);
    }
  };

  const canApply = file && report && report.errorRows === 0 && !report.applied;
  const previewRows = report?.rows?.slice(0, 8) || [];

  return (
    <section className="border border-surface-border rounded-xl bg-white shadow-sm">
      <div className="p-4 border-b border-surface-border flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-brand-blue" style={{ fontSize: 20 }}>upload_file</span>
            Import sản phẩm bằng Excel/CSV
          </h2>
          <p className="text-xs text-text-muted mt-1">
            Hỗ trợ sheet SanPham_ChuanHoa, dry-run trước khi ghi DB. Sản phẩm DRAFT sẽ được import ở trạng thái ẩn.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.csv"
            className="hidden"
            onChange={handleFileChange}
          />
          <button type="button" className="btn-outline px-4 py-2 text-sm" onClick={() => fileRef.current?.click()}>
            <span className="material-symbols-outlined" style={{ fontSize: 17 }}>attach_file</span>
            {file ? file.name : "Chọn file"}
          </button>
          <button type="button" disabled={!file || loading} className="btn-outline px-4 py-2 text-sm disabled:opacity-50" onClick={() => runImport(true)}>
            <span className="material-symbols-outlined" style={{ fontSize: 17 }}>fact_check</span>
            Kiểm tra
          </button>
          <button type="button" disabled={!canApply || loading} className="btn-primary px-4 py-2 text-sm disabled:opacity-50" onClick={() => runImport(false)}>
            <span className="material-symbols-outlined" style={{ fontSize: 17 }}>database_upload</span>
            Import
          </button>
        </div>
      </div>

      {report && (
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <ImportStat label="Tổng dòng" value={report.totalRows} />
            <ImportStat label="Hợp lệ" value={report.validRows} tone="green" />
            <ImportStat label="Lỗi" value={report.errorRows} tone={report.errorRows > 0 ? "danger" : "green"} />
            <ImportStat label="Tạo mới" value={report.createdCount} tone="blue" />
            <ImportStat label="Cập nhật" value={report.updatedCount} tone="teal" />
          </div>

          {report.warnings?.length > 0 && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
              {report.warnings.map((warning) => <p key={warning}>{warning}</p>)}
            </div>
          )}

          {previewRows.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead className="bg-surface-muted text-text-muted">
                  <tr>
                    <th className="px-3 py-2 text-left">Dòng</th>
                    <th className="px-3 py-2 text-left">SKU</th>
                    <th className="px-3 py-2 text-left">Sản phẩm</th>
                    <th className="px-3 py-2 text-left">Hành động</th>
                    <th className="px-3 py-2 text-left">Trạng thái</th>
                    <th className="px-3 py-2 text-left">Ghi chú</th>
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row) => (
                    <tr key={`${row.rowNumber}-${row.sku || row.name}`} className="border-b border-surface-border">
                      <td className="px-3 py-2">{row.rowNumber}</td>
                      <td className="px-3 py-2 font-mono">{row.sku || "-"}</td>
                      <td className="px-3 py-2 max-w-xs truncate">{row.name}</td>
                      <td className="px-3 py-2">{row.action}</td>
                      <td className="px-3 py-2">
                        <span className={row.status === "ERROR" ? "badge-danger" : "badge-green"}>{row.status}</span>
                      </td>
                      <td className="px-3 py-2 min-w-[220px]">
                        {[...(row.errors || []), ...(row.warnings || [])].slice(0, 2).join(" | ") || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {report.rows.length > previewRows.length && (
                <p className="text-xs text-text-muted mt-2">Chỉ hiển thị {previewRows.length} dòng đầu để review nhanh.</p>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function ImportStat({ label, value, tone = "blue" }) {
  const toneClass = {
    blue: "text-brand-blue bg-brand-blue-light",
    green: "text-brand-green bg-brand-green-light",
    teal: "text-brand-teal bg-brand-teal-light",
    danger: "text-danger bg-red-50",
  }[tone] || "text-brand-blue bg-brand-blue-light";

  return (
    <div className={`rounded-lg px-3 py-2 ${toneClass}`}>
      <p className="text-[11px] font-bold uppercase">{label}</p>
      <p className="text-lg font-black">{Number(value || 0).toLocaleString("vi-VN")}</p>
    </div>
  );
}

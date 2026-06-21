import DataTable from "../../../components/admin/DataTable";
import IconButton from "../../../components/admin/IconButton";
import { getImageUrl, formatVND } from "../../../utils/constants";
import { getProductFirstImage } from "./productFormUtils";

const PRODUCT_COLUMNS = [
  { key: "index", label: "#", className: "px-4 py-3 text-left w-12", skeletonClassName: "h-8" },
  { key: "image", label: "Ảnh", className: "px-4 py-3 text-left", skeletonClassName: "h-8" },
  { key: "name", label: "Tên sản phẩm", className: "px-4 py-3 text-left", skeletonClassName: "h-8" },
  { key: "category", label: "Danh mục", className: "px-4 py-3 text-left", skeletonClassName: "h-8" },
  { key: "brand", label: "Thương hiệu", className: "px-4 py-3 text-left", skeletonClassName: "h-8" },
  { key: "price", label: "Giá", className: "px-4 py-3 text-right", skeletonClassName: "h-8" },
  { key: "stock", label: "Tồn kho", className: "px-4 py-3 text-right", skeletonClassName: "h-8" },
  { key: "actions", label: "Thao tác", className: "px-4 py-3 text-center", skeletonClassName: "h-8" },
];

export default function ProductTable({
  products,
  loading,
  page,
  totalPages,
  onPageChange,
  selectedIds,
  onSelectAll,
  onSelectRow,
  isAllSelected,
  onOpenEdit,
  onOpenDelete,
}) {
  const dynamicColumns = [
    {
      key: "select",
      label: (
        <input
          type="checkbox"
          checked={isAllSelected}
          onChange={onSelectAll}
          aria-label="Chọn tất cả sản phẩm"
          className="w-4 h-4 rounded border-surface-border text-brand-blue cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-blue"
        />
      ),
      className: "px-4 py-3 text-center w-10",
      skeletonClassName: "h-8"
    },
    ...PRODUCT_COLUMNS
  ];

  const renderProductCard = (p, index) => {
    const isSelected = selectedIds.includes(p.id);
    const firstImage = getProductFirstImage(p);

    return (
      <div className="flex flex-col gap-3">
        {/* Hàng đầu: Checkbox + Số thứ tự + Badge danh mục / thương hiệu */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onSelectRow(p.id)}
              aria-label={`Chọn sản phẩm ${p.name}`}
              className="w-4.5 h-4.5 rounded border-surface-border text-brand-blue cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-blue"
            />
            <span className="text-[11px] text-text-muted font-semibold">
              #{page * 10 + index + 1}
            </span>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {p.brand && <span className="badge-blue text-[10px]">{p.brand}</span>}
            {p.category && (
              <span className="px-2 py-0.5 bg-surface-muted rounded text-[9px] font-bold uppercase text-text-secondary">
                {p.category}
              </span>
            )}
          </div>
        </div>

        {/* Hàng giữa: Thông tin ảnh, tên, giá, tồn kho */}
        <div className="flex gap-3">
          {/* Cột trái: Ảnh */}
          <div className="w-16 h-16 rounded-xl bg-surface-muted overflow-hidden flex-shrink-0 border border-surface-border">
            {firstImage ? (
              <img
                src={getImageUrl(firstImage)}
                alt={p.name}
                className="w-full h-full object-contain p-1"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-text-muted bg-surface-soft">
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                  image_not_supported
                </span>
              </div>
            )}
          </div>

          {/* Cột phải: Chi tiết */}
          <div className="flex-1 min-w-0 flex flex-col justify-between">
            <div>
              <p className="font-bold text-text-primary text-sm line-clamp-1 leading-snug">
                {p.name}
              </p>
              <div className="flex gap-2 items-center mt-0.5 text-[11px] text-text-muted font-medium">
                {p.sku && <span className="font-mono">SKU: {p.sku}</span>}
                {p.target && <span>• {p.target}</span>}
              </div>
            </div>
            
            <div className="flex items-baseline justify-between mt-1">
              <div className="flex items-baseline gap-1.5">
                <span className="font-extrabold text-brand-blue text-sm">
                  {formatVND(p.price)}
                </span>
                {Number(p.originalPrice || 0) > Number(p.price || 0) && (
                  <span className="text-[10px] text-text-muted line-through">
                    {formatVND(p.originalPrice)}
                  </span>
                )}
              </div>
              <span className={p.quantity > 0 ? "badge-green text-[10px]" : "badge-danger text-[10px]"}>
                Tồn: {p.quantity}
              </span>
            </div>
          </div>
        </div>

        {/* Hàng cuối: Hidden badge và các action buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-surface-border border-dashed mt-1">
          <div>
            {p.active === false && (
              <span className="badge-danger text-[9px] py-0.5 px-1.5">Đã ẩn</span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onOpenEdit(p)}
              className="flex items-center gap-1 py-1.5 px-3 bg-brand-blue-light text-brand-blue rounded-xl text-xs font-bold hover:bg-brand-blue hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>edit</span>
              Sửa
            </button>
            <button
              onClick={() => onOpenDelete(p)}
              className="flex items-center gap-1 py-1.5 px-3 bg-red-50 text-danger rounded-xl text-xs font-bold hover:bg-danger hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>delete</span>
              Xóa
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <DataTable
      columns={dynamicColumns}
      loading={loading}
      isEmpty={products.length === 0}
      emptyIcon="inventory_2"
      emptyTitle="Không có sản phẩm nào"
      page={page}
      totalPages={totalPages}
      onPageChange={onPageChange}
      mobileCardRenderer={renderProductCard}
      items={products}
    >
      {products.map((p, i) => (
        <tr key={p.id} className="hover:bg-surface-soft transition-colors">
          <td className="px-4 py-3 text-center w-10">
            <input
              type="checkbox"
              checked={selectedIds.includes(p.id)}
              onChange={() => onSelectRow(p.id)}
              aria-label={`Chọn sản phẩm ${p.name}`}
              className="w-4 h-4 rounded border-surface-border text-brand-blue cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-blue"
            />
          </td>
          <td className="px-4 py-3 text-text-muted text-xs">{page * 10 + i + 1}</td>
          <td className="px-4 py-3">
            <div className="w-12 h-12 rounded-lg bg-surface-muted overflow-hidden flex-shrink-0">
              {getProductFirstImage(p)
                ? <img src={getImageUrl(getProductFirstImage(p))} alt={p.name} className="w-full h-full object-contain p-1" />
                : <div className="w-full h-full flex items-center justify-center text-text-muted"><span className="material-symbols-outlined" style={{ fontSize: 20 }}>image_not_supported</span></div>
              }
            </div>
          </td>
          <td className="px-4 py-3">
            <p className="font-semibold text-text-primary line-clamp-1">{p.name}</p>
            {p.sku && <p className="text-[11px] text-text-muted font-mono mt-0.5">{p.sku}</p>}
            {p.target && <p className="text-xs text-text-muted mt-0.5">{p.target}</p>}
            {p.active === false && <span className="badge-danger mt-1 inline-flex">Hidden</span>}
          </td>
          <td className="px-4 py-3">
            {p.category ? <span className="px-2 py-1 bg-surface-muted rounded text-[10px] font-bold uppercase">{p.category}</span> : <span className="text-text-muted">-</span>}
          </td>
          <td className="px-4 py-3">
            {p.brand ? <span className="badge-blue">{p.brand}</span> : <span className="text-text-muted">-</span>}
          </td>
          <td className="px-4 py-3 text-right">
            <p className="font-bold text-brand-blue">{formatVND(p.price)}</p>
            {Number(p.originalPrice || 0) > Number(p.price || 0) && (
              <p className="text-[11px] text-text-muted line-through">{formatVND(p.originalPrice)}</p>
            )}
          </td>
          <td className="px-4 py-3 text-right">
            <span className={p.quantity > 0 ? "badge-green" : "badge-danger"}>{p.quantity}</span>
          </td>
          <td className="px-4 py-3">
            <div className="flex items-center justify-center gap-2">
              <IconButton icon="edit" label="Sửa sản phẩm" variant="primary" onClick={() => onOpenEdit(p)} />
              <IconButton icon="delete" label="Xóa sản phẩm" variant="danger" onClick={() => onOpenDelete(p)} />
            </div>
          </td>
        </tr>
      ))}
    </DataTable>
  );
}

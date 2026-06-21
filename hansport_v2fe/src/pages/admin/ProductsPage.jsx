import AdminMetricCard from "../../components/admin/AdminMetricCard";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import { useProductsAdmin } from "./products/useProductsAdmin";
import ProductFilters from "./products/ProductFilters";
import ProductTable from "./products/ProductTable";
import ProductFormModal from "./products/ProductFormModal";
import ProductImportModal from "./products/ProductImportModal";

export default function ProductsPage() {
  const {
    CATEGORIES,
    BRANDS,
    products,
    loading,
    totalPages,
    totalElements,
    page,
    setPage,
    search,
    setSearch,
    selectedIds,
    modal,
    setModal,
    form,
    setForm,
    saving,
    uploading,
    selectedProduct,
    fileRef,
    descriptionFileRef,
    openAdd,
    openEdit,
    openDelete,
    closeModal,
    handleReset,
    removeImage,
    setMainImage,
    handleUpload,
    handleDescriptionImport,
    handleSave,
    handleDelete,
    handleDeleteBulk,
    handleSelectAll,
    handleSelectRow,
    isAllSelected,
    outOfStockOnPage,
    withImagesOnPage,
    fetchProducts
  } = useProductsAdmin();

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Sản phẩm"
        description={`${totalElements} sản phẩm trong danh mục`}
        actions={(
          <button type="button" onClick={openAdd} className="btn-primary">
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
            Thêm sản phẩm
          </button>
        )}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <AdminMetricCard icon="inventory_2" label="Tổng sản phẩm" value={totalElements.toLocaleString("vi-VN")} tone="blue" />
        <AdminMetricCard icon="widgets" label="Đang hiển thị" value={products.length.toLocaleString("vi-VN")} tone="teal" />
        <AdminMetricCard icon="image" label="Có ảnh" value={withImagesOnPage.toLocaleString("vi-VN")} tone="green" />
        <AdminMetricCard
          icon={outOfStockOnPage > 0 ? "error" : "warning"}
          label="Cần chú ý"
          value={`${outOfStockOnPage} hết hàng`}
          tone={outOfStockOnPage > 0 ? "danger" : "amber"}
        />
      </div>

      <ProductFilters
        search={search}
        setSearch={(val) => { setSearch(val); setPage(0); }}
        selectedIds={selectedIds}
        onOpenDeleteBulk={() => setModal("delete_bulk")}
        onOpenImport={() => setModal("import")}
      />

      <ProductTable
        products={products}
        loading={loading}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        selectedIds={selectedIds}
        onSelectAll={handleSelectAll}
        onSelectRow={handleSelectRow}
        isAllSelected={isAllSelected}
        onOpenEdit={openEdit}
        onOpenDelete={openDelete}
      />

      {(modal === "add" || modal === "edit") && (
        <ProductFormModal
          modal={modal}
          form={form}
          setForm={setForm}
          saving={saving}
          uploading={uploading}
          categories={CATEGORIES}
          brands={BRANDS}
          onClose={closeModal}
          onSave={handleSave}
          onReset={handleReset}
          descriptionFileRef={descriptionFileRef}
          onDescriptionImport={handleDescriptionImport}
          fileRef={fileRef}
          onUpload={handleUpload}
          onRemove={removeImage}
          onSetMain={setMainImage}
        />
      )}

      {modal === "import" && (
        <ProductImportModal
          onClose={closeModal}
          onImported={() => {
            fetchProducts();
          }}
        />
      )}

      {modal === "delete" && selectedProduct && (
        <ConfirmDialog
          title="Xác nhận xóa sản phẩm?"
          description={`Bạn sắp xóa "${selectedProduct.name}". Hành động này không thể hoàn tác.`}
          icon="delete_forever"
          confirmLabel="Xóa sản phẩm"
          loading={saving}
          onCancel={closeModal}
          onConfirm={handleDelete}
        />
      )}

      {modal === "delete_bulk" && selectedIds.length > 0 && (
        <ConfirmDialog
          title="Xác nhận xóa hàng loạt?"
          description={`Bạn sắp xóa ${selectedIds.length} sản phẩm đã chọn. Hành động này không thể hoàn tác.`}
          icon="delete_forever"
          confirmLabel="Xóa các sản phẩm"
          loading={saving}
          onCancel={closeModal}
          onConfirm={handleDeleteBulk}
        />
      )}
    </div>
  );
}

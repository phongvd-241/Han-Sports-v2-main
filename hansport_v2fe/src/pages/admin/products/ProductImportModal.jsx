import FormModal from "../../../components/admin/FormModal";
import ProductImportPanel from "../../../components/admin/ProductImportPanel";

export default function ProductImportModal({ onClose, onImported }) {
  return (
    <FormModal
      title="Import Excel/CSV"
      onClose={onClose}
      maxWidth="max-w-5xl"
    >
      <div className="p-6">
        <ProductImportPanel onImported={onImported} />
      </div>
    </FormModal>
  );
}

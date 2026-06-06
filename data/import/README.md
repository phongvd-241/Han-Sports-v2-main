# Product Import Data

Put product import files here only when they are safe to keep in the repository.

Recommended structure:

```text
data/import/
+-- products.xlsx
+-- media/
    +-- product/
    +-- logo/
    +-- banner/
```

Rules:

- Do not commit private customer data.
- Do not commit real secrets.
- Product image filenames in Excel should match files in `media/product`.
- Run backup before importing into Docker or local DB.
- Prefer a dry-run import before applying changes.

See:

```text
docs/PRODUCT_EXCEL_IMPORT_WORKFLOW.md
```

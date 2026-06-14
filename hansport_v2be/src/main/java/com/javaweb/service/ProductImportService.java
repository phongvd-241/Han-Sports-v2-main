package com.javaweb.service;

import com.javaweb.domain.Product;
import com.javaweb.domain.ProductImage;
import com.javaweb.domain.response.product.ResProductImportDTO;
import com.javaweb.domain.response.product.ResProductImportRowDTO;
import com.javaweb.repository.ProductRepository;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

@Service
public class ProductImportService {
    private static final int MAX_IMPORT_ROWS = 1000;
    private static final String PREFERRED_SHEET = "SanPham_ChuanHoa";

    private final ProductRepository productRepository;

    public ProductImportService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    @Transactional
    public ResProductImportDTO importProducts(MultipartFile file, boolean dryRun) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Import file must not be empty");
        }

        String fileName = file.getOriginalFilename() == null ? "" : file.getOriginalFilename();
        ParsedImportFile parsedFile = parseFile(file);
        List<ImportProductRow> importRows = buildRows(parsedFile);

        ResProductImportDTO report = validateRows(importRows, dryRun, fileName, parsedFile.sheetName());
        if (!dryRun && report.getErrorRows() == 0) {
            applyRows(importRows, report);
            report.setApplied(true);
        }
        return report;
    }

    private ParsedImportFile parseFile(MultipartFile file) throws IOException {
        String fileName = file.getOriginalFilename() == null ? "" : file.getOriginalFilename().toLowerCase(Locale.ROOT);
        if (fileName.endsWith(".xlsx")) {
            return parseExcel(file);
        }
        if (fileName.endsWith(".csv")) {
            return parseCsv(file);
        }
        throw new IllegalArgumentException("Only .xlsx and .csv import files are supported");
    }

    private ParsedImportFile parseExcel(MultipartFile file) throws IOException {
        try (Workbook workbook = WorkbookFactory.create(file.getInputStream())) {
            Sheet sheet = workbook.getSheet(PREFERRED_SHEET);
            if (sheet == null) {
                sheet = workbook.getNumberOfSheets() > 0 ? workbook.getSheetAt(0) : null;
            }
            if (sheet == null) {
                throw new IllegalArgumentException("Excel file does not contain a worksheet");
            }

            DataFormatter formatter = new DataFormatter(Locale.ROOT);
            List<List<String>> rows = new ArrayList<>();
            for (Row row : sheet) {
                int lastCell = row.getLastCellNum();
                if (lastCell <= 0) {
                    continue;
                }
                List<String> values = new ArrayList<>();
                boolean hasValue = false;
                for (int i = 0; i < lastCell; i++) {
                    String value = formatter.formatCellValue(row.getCell(i)).trim();
                    values.add(value);
                    hasValue = hasValue || !value.isBlank();
                }
                if (hasValue) {
                    rows.add(values);
                }
            }
            return new ParsedImportFile(sheet.getSheetName(), rows);
        }
    }

    private ParsedImportFile parseCsv(MultipartFile file) throws IOException {
        List<List<String>> rows = new ArrayList<>();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
            String line;
            Character delimiter = null;
            while ((line = reader.readLine()) != null) {
                if (delimiter == null) {
                    delimiter = detectDelimiter(line);
                }
                List<String> values = parseCsvLine(line, delimiter);
                boolean hasValue = values.stream().anyMatch(value -> value != null && !value.isBlank());
                if (hasValue) {
                    rows.add(values);
                }
            }
        }
        return new ParsedImportFile("CSV", rows);
    }

    private List<ImportProductRow> buildRows(ParsedImportFile parsedFile) {
        if (parsedFile.rows().isEmpty()) {
            throw new IllegalArgumentException("Import file does not contain a header row");
        }

        Map<String, Integer> headers = indexHeaders(parsedFile.rows().get(0));
        List<ImportProductRow> rows = new ArrayList<>();
        int dataRows = 0;
        for (int i = 1; i < parsedFile.rows().size(); i++) {
            if (++dataRows > MAX_IMPORT_ROWS) {
                throw new IllegalArgumentException("Import file exceeds the limit of " + MAX_IMPORT_ROWS + " rows");
            }
            rows.add(toImportRow(i + 1, parsedFile.rows().get(i), headers));
        }
        return rows;
    }

    private ResProductImportDTO validateRows(List<ImportProductRow> rows, boolean dryRun, String fileName, String sheetName) {
        ResProductImportDTO report = new ResProductImportDTO();
        report.setDryRun(dryRun);
        report.setFileName(fileName);
        report.setMatchedSheet(sheetName);
        report.setTotalRows(rows.size());

        Set<String> seenKeys = new HashSet<>();
        for (ImportProductRow row : rows) {
            validateRequiredFields(row);
            validateLengths(row);
            validateImages(row);
            validateDuplicateImportKey(row, seenKeys);
            resolveAction(row);

            ResProductImportRowDTO rowReport = new ResProductImportRowDTO();
            rowReport.setRowNumber(row.rowNumber);
            rowReport.setSku(row.sku);
            rowReport.setName(row.name);
            rowReport.setAction(row.action);
            rowReport.setStatus(row.errors.isEmpty() ? "VALID" : "ERROR");
            rowReport.setErrors(row.errors);
            rowReport.setWarnings(row.warnings);
            report.getRows().add(rowReport);

            if (row.errors.isEmpty()) {
                report.setValidRows(report.getValidRows() + 1);
                if ("CREATE".equals(row.action)) {
                    report.setCreatedCount(report.getCreatedCount() + 1);
                } else if ("UPDATE".equals(row.action)) {
                    report.setUpdatedCount(report.getUpdatedCount() + 1);
                } else {
                    report.setSkippedCount(report.getSkippedCount() + 1);
                }
            } else {
                report.setErrorRows(report.getErrorRows() + 1);
            }
        }

        if (report.getErrorRows() > 0) {
            report.getWarnings().add("Import has validation errors. Fix the file before applying changes.");
        }
        if (!dryRun && report.getErrorRows() > 0) {
            report.getWarnings().add("Apply was skipped because at least one row has errors.");
        }
        return report;
    }

    private void applyRows(List<ImportProductRow> rows, ResProductImportDTO report) {
        for (ImportProductRow row : rows) {
            if (!row.errors.isEmpty() || "SKIP".equals(row.action)) {
                continue;
            }

            Product product = row.existingProduct == null ? new Product() : row.existingProduct;
            product.setSku(row.sku);
            product.setName(row.name);
            product.setPrice(row.price);
            product.setQuantity(row.quantity);
            product.setSold(product.getId() == 0 ? 0 : product.getSold());
            product.setBrand(row.brand);
            product.setTarget(row.target);
            product.setCategory(row.category);
            product.setShortDesc(row.shortDesc);
            product.setDetailDesc(row.detailDesc);
            product.setActive(row.active);
            replaceImages(product, row.images);
            this.productRepository.save(product);
        }

        report.getWarnings().add("Products imported. External image URLs can display for review, but production should move media to owned storage.");
    }

    private ImportProductRow toImportRow(int rowNumber, List<String> values, Map<String, Integer> headers) {
        ImportProductRow row = new ImportProductRow();
        row.rowNumber = rowNumber;
        row.sku = normalizeSku(value(values, headers, "sku", "internal_sku_base", "source_product_code"));
        row.name = value(values, headers, "name", "product_name");
        row.category = value(values, headers, "category");
        row.brand = value(values, headers, "brand");
        row.target = value(values, headers, "target");
        row.price = parseLong(value(values, headers, "price", "current_price_vnd"), -1);
        row.quantity = parseLong(value(values, headers, "quantity"), 0);
        row.shortDesc = value(values, headers, "short_desc", "short_description");
        row.detailDesc = firstNonBlank(
                value(values, headers, "detail_desc", "detail_description", "detail_description_draft"),
                row.shortDesc
        );
        row.images = splitImages(value(values, headers, "image_names", "images", "external_image_urls"));
        row.active = isActiveStatus(value(values, headers, "active", "publish_status"));

        String publishStatus = value(values, headers, "publish_status");
        if (!publishStatus.isBlank() && !row.active) {
            row.warnings.add("publish_status=" + publishStatus + " maps to active=false; product is hidden from public listings.");
        }
        String dataStatus = value(values, headers, "data_status");
        if (!dataStatus.isBlank() && !"READY_FOR_DRY_RUN".equalsIgnoreCase(dataStatus)) {
            row.warnings.add("data_status=" + dataStatus + " should be reviewed before applying.");
        }
        if (row.sku == null) {
            row.warnings.add("Missing SKU; future updates will match by product name only.");
        }
        return row;
    }

    private void validateRequiredFields(ImportProductRow row) {
        if (row.name.isBlank()) {
            row.errors.add("Product name is required");
        }
        if (row.price <= 0) {
            row.errors.add("Price must be greater than 0");
        }
        if (row.quantity < 0) {
            row.errors.add("Quantity must not be negative");
        }
        if (row.shortDesc.isBlank()) {
            row.errors.add("Short description is required");
        }
        if (row.detailDesc.isBlank()) {
            row.errors.add("Detail description is required");
        }
    }

    private void validateLengths(ImportProductRow row) {
        validateMaxLength(row.sku, 100, "SKU", row.errors);
        validateMaxLength(row.name, 255, "Product name", row.errors);
        validateMaxLength(row.shortDesc, 255, "Short description", row.errors);
        validateMaxLength(row.brand, 255, "Brand", row.errors);
        validateMaxLength(row.target, 255, "Target", row.errors);
        validateMaxLength(row.category, 255, "Category", row.errors);
    }

    private void validateImages(ImportProductRow row) {
        for (String image : row.images) {
            if (image.length() > 255) {
                row.errors.add("Image reference exceeds 255 characters: " + image);
            }
            if (!isExternalUrl(image) && (image.contains("..") || image.contains("/") || image.contains("\\"))) {
                row.errors.add("Local image name is invalid: " + image);
            }
        }
    }

    private void validateDuplicateImportKey(ImportProductRow row, Set<String> seenKeys) {
        String key = row.sku != null ? "SKU:" + row.sku : "NAME:" + row.name.toLowerCase(Locale.ROOT);
        if (!seenKeys.add(key)) {
            row.errors.add("Duplicate product key in import file");
        }
    }

    private void resolveAction(ImportProductRow row) {
        if (!row.errors.isEmpty()) {
            row.action = "SKIP";
            return;
        }

        Optional<Product> existingBySku = row.sku == null ? Optional.empty() : this.productRepository.findBySku(row.sku);
        if (existingBySku.isPresent()) {
            row.existingProduct = existingBySku.get();
            row.action = "UPDATE";
            return;
        }

        Optional<Product> existingByName = this.productRepository.findByName(row.name);
        if (existingByName.isPresent()) {
            row.existingProduct = existingByName.get();
            row.action = "UPDATE";
            if (row.sku != null) {
                row.warnings.add("SKU was not found; matched existing product by name and will attach SKU.");
            }
            return;
        }

        row.action = "CREATE";
    }

    private void replaceImages(Product product, List<String> images) {
        if (images == null || images.isEmpty()) {
            return;
        }
        product.getImages().clear();
        for (String image : new LinkedHashSet<>(images)) {
            ProductImage productImage = new ProductImage();
            productImage.setImageUrl(image);
            productImage.setProduct(product);
            product.getImages().add(productImage);
        }
    }

    private Map<String, Integer> indexHeaders(List<String> headerRow) {
        Map<String, Integer> headers = new LinkedHashMap<>();
        for (int i = 0; i < headerRow.size(); i++) {
            String header = normalizeHeader(headerRow.get(i));
            if (!header.isBlank()) {
                headers.put(header, i);
            }
        }
        if (!headers.containsKey("product_name") && !headers.containsKey("name")) {
            throw new IllegalArgumentException("Import file must contain product_name or name column");
        }
        return headers;
    }

    private String value(List<String> values, Map<String, Integer> headers, String... names) {
        for (String name : names) {
            Integer index = headers.get(normalizeHeader(name));
            if (index != null && index < values.size()) {
                String value = values.get(index);
                if (value != null && !value.isBlank()) {
                    return value.trim();
                }
            }
        }
        return "";
    }

    private String normalizeHeader(String value) {
        return value == null
                ? ""
                : value.replace("\uFEFF", "")
                        .trim()
                        .toLowerCase(Locale.ROOT)
                        .replaceAll("[^a-z0-9]+", "_")
                        .replaceAll("^_+|_+$", "");
    }

    private String normalizeSku(String sku) {
        if (sku == null || sku.isBlank()) {
            return null;
        }
        return sku.trim().toUpperCase(Locale.ROOT);
    }

    private long parseLong(String value, long defaultValue) {
        if (value == null || value.isBlank()) {
            return defaultValue;
        }
        String normalized = value.trim().replace(".", "").replace(",", "");
        try {
            return Long.parseLong(normalized);
        } catch (NumberFormatException ex) {
            return defaultValue;
        }
    }

    private void validateMaxLength(String value, int maxLength, String field, List<String> errors) {
        if (value != null && value.length() > maxLength) {
            errors.add(field + " exceeds " + maxLength + " characters");
        }
    }

    private List<String> splitImages(String value) {
        if (value == null || value.isBlank()) {
            return List.of();
        }
        List<String> images = new ArrayList<>();
        for (String token : value.split("[,;|\\r\\n]+")) {
            String image = token.trim();
            if (!image.isBlank()) {
                images.add(image);
            }
        }
        return images;
    }

    private boolean isExternalUrl(String value) {
        String normalized = value.toLowerCase(Locale.ROOT);
        return normalized.startsWith("http://") || normalized.startsWith("https://");
    }

    private boolean isActiveStatus(String value) {
        if (value == null || value.isBlank()) {
            return true;
        }
        String normalized = value.trim().toUpperCase(Locale.ROOT);
        return Set.of("TRUE", "YES", "1", "ACTIVE", "PUBLISHED", "PUBLIC").contains(normalized);
    }

    private String firstNonBlank(String first, String fallback) {
        return first == null || first.isBlank() ? (fallback == null ? "" : fallback.trim()) : first.trim();
    }

    private Character detectDelimiter(String line) {
        Map<Character, Integer> counts = new HashMap<>();
        for (char delimiter : new char[] {',', ';', '\t'}) {
            counts.put(delimiter, countOutsideQuotes(line, delimiter));
        }
        return counts.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse(',');
    }

    private int countOutsideQuotes(String line, char delimiter) {
        boolean inQuotes = false;
        int count = 0;
        for (int i = 0; i < line.length(); i++) {
            char current = line.charAt(i);
            if (current == '"') {
                inQuotes = !inQuotes;
            } else if (!inQuotes && current == delimiter) {
                count++;
            }
        }
        return count;
    }

    private List<String> parseCsvLine(String line, char delimiter) {
        List<String> values = new ArrayList<>();
        StringBuilder current = new StringBuilder();
        boolean inQuotes = false;
        for (int i = 0; i < line.length(); i++) {
            char c = line.charAt(i);
            if (c == '"') {
                if (inQuotes && i + 1 < line.length() && line.charAt(i + 1) == '"') {
                    current.append('"');
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (c == delimiter && !inQuotes) {
                values.add(current.toString().trim());
                current.setLength(0);
            } else {
                current.append(c);
            }
        }
        values.add(current.toString().trim());
        return values;
    }

    private record ParsedImportFile(String sheetName, List<List<String>> rows) {
    }

    private static class ImportProductRow {
        private int rowNumber;
        private String sku;
        private String name = "";
        private String category = "";
        private String brand = "";
        private String target = "";
        private long price;
        private long quantity;
        private String shortDesc = "";
        private String detailDesc = "";
        private boolean active = true;
        private List<String> images = List.of();
        private String action = "SKIP";
        private Product existingProduct;
        private final List<String> errors = new ArrayList<>();
        private final List<String> warnings = new ArrayList<>();
    }
}

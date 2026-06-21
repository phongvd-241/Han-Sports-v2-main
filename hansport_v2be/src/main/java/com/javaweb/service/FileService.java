package com.javaweb.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.InputStreamResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@Service
public class FileService {

    private static final Set<String> ALLOWED_FOLDERS = Set.of("product", "logo", "banner", "avatar");
    private static final Set<String> ALLOWED_IMAGE_EXTENSIONS = Set.of("jpg", "jpeg", "png", "webp");
    private static final Map<String, Set<String>> ALLOWED_CONTENT_TYPES = Map.of(
            "jpg", Set.of("image/jpeg"),
            "jpeg", Set.of("image/jpeg"),
            "png", Set.of("image/png"),
            "webp", Set.of("image/webp")
    );
    private static final long MAX_IMAGE_BYTES = 5L * 1024 * 1024;

    @Value("${hansport.upload-file.base-path}")
    private String basePath;

    public void validateImageFile(MultipartFile file, String folder) throws IOException {
        resolveFolder(folder);
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File must not be empty");
        }
        if (file.getSize() > MAX_IMAGE_BYTES) {
            throw new IllegalArgumentException("Image file must not exceed 5MB");
        }

        String extension = getExtension(file.getOriginalFilename());
        if (!ALLOWED_IMAGE_EXTENSIONS.contains(extension)) {
            throw new IllegalArgumentException("Only JPG, JPEG, PNG, or WebP images are allowed");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.getOrDefault(extension, Set.of()).contains(contentType.toLowerCase(Locale.ROOT))) {
            throw new IllegalArgumentException("Invalid image MIME type");
        }

        if (!hasValidImageSignature(file, extension)) {
            throw new IllegalArgumentException("Invalid image file content");
        }
    }

    public void createDirectory(String folder) throws IOException {
        Files.createDirectories(resolveFolder(folder));
    }

    public String store(MultipartFile file, String folder) throws IOException {
        String originalName = StringUtils.cleanPath(file.getOriginalFilename() == null ? "file" : file.getOriginalFilename());
        String safeName = originalName.replaceAll("[^a-zA-Z0-9._-]", "_");
        String finalName = System.currentTimeMillis() + "-" + safeName;
        Path path = resolveFile(folder, finalName);
        try (InputStream inputStream = file.getInputStream()) {
            Files.copy(inputStream, path, StandardCopyOption.REPLACE_EXISTING);
        }
        return finalName;
    }

    public long getFileLength(String fileName, String folder) {
        Path path = resolveFile(folder, fileName);
        File file = path.toFile();
        if (!file.exists() || file.isDirectory()) {
            return 0;
        }
        return file.length();
    }

    public InputStreamResource getResource(String fileName, String folder) throws FileNotFoundException {
        return new InputStreamResource(new FileInputStream(resolveFile(folder, fileName).toFile()));
    }

    public boolean deleteIfExists(String fileName, String folder) throws IOException {
        if (!isLocalFileName(fileName)) {
            return false;
        }
        return Files.deleteIfExists(resolveFile(folder, fileName));
    }

    private Path resolveFolder(String folder) {
        if (folder == null || !ALLOWED_FOLDERS.contains(folder)) {
            throw new IllegalArgumentException("Invalid upload folder");
        }
        Path root = Paths.get(basePath).toAbsolutePath().normalize();
        Path folderPath = root.resolve(folder).normalize();
        if (!folderPath.startsWith(root)) {
            throw new IllegalArgumentException("Invalid upload path");
        }
        return folderPath;
    }

    private Path resolveFile(String folder, String fileName) {
        String safeName = StringUtils.cleanPath(fileName == null ? "" : fileName);
        if (safeName.isBlank() || safeName.contains("..") || safeName.contains("/") || safeName.contains("\\")) {
            throw new IllegalArgumentException("Invalid file name");
        }
        return resolveFolder(folder).resolve(safeName).normalize();
    }

    private String getExtension(String fileName) {
        String safeName = StringUtils.cleanPath(fileName == null ? "" : fileName);
        int dotIndex = safeName.lastIndexOf(".");
        if (dotIndex < 0 || dotIndex == safeName.length() - 1) {
            return "";
        }
        return safeName.substring(dotIndex + 1).toLowerCase(Locale.ROOT);
    }

    private boolean isLocalFileName(String fileName) {
        String safeName = StringUtils.cleanPath(fileName == null ? "" : fileName);
        return !safeName.isBlank()
                && !safeName.contains("..")
                && !safeName.contains("/")
                && !safeName.contains("\\")
                && !safeName.contains("://");
    }

    private boolean hasValidImageSignature(MultipartFile file, String extension) throws IOException {
        byte[] header = new byte[12];
        int read;
        try (InputStream inputStream = file.getInputStream()) {
            read = inputStream.read(header);
        }

        if (read < 4) {
            return false;
        }
        if ("jpg".equals(extension) || "jpeg".equals(extension)) {
            return (header[0] & 0xFF) == 0xFF && (header[1] & 0xFF) == 0xD8 && (header[2] & 0xFF) == 0xFF;
        }
        if ("png".equals(extension)) {
            return read >= 8
                    && (header[0] & 0xFF) == 0x89
                    && header[1] == 0x50
                    && header[2] == 0x4E
                    && header[3] == 0x47
                    && header[4] == 0x0D
                    && header[5] == 0x0A
                    && header[6] == 0x1A
                    && header[7] == 0x0A;
        }
        if ("webp".equals(extension)) {
            return read >= 12
                    && header[0] == 0x52
                    && header[1] == 0x49
                    && header[2] == 0x46
                    && header[3] == 0x46
                    && header[8] == 0x57
                    && header[9] == 0x45
                    && header[10] == 0x42
                    && header[11] == 0x50;
        }
        return false;
    }
}

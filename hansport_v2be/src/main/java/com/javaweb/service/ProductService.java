package com.javaweb.service;

import com.javaweb.domain.Product;
import com.javaweb.domain.ProductImage;
import com.javaweb.domain.request.ReqProductDTO;
import com.javaweb.domain.response.ResultPaginationDTO;
import com.javaweb.domain.response.product.ResCreateProductDTO;
import com.javaweb.domain.response.product.ResProductDTO;
import com.javaweb.domain.response.product.ResUpdateProductDTO;
import com.javaweb.repository.ProductImageRepository;
import com.javaweb.repository.ProductRepository;
import com.javaweb.util.error.IdInvalidException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class ProductService {
    private static final Logger log = LoggerFactory.getLogger(ProductService.class);

    private final ProductRepository productRepository;
    private final ProductImageRepository productImageRepository;
    private final FileService fileService;

    public ProductService(ProductRepository productRepository,
                          ProductImageRepository productImageRepository,
                          FileService fileService) {
        this.productRepository = productRepository;
        this.productImageRepository = productImageRepository;
        this.fileService = fileService;
    }

    @Transactional
    public ResCreateProductDTO handleSaveProduct(ReqProductDTO req) throws IdInvalidException {
        String sku = normalizeSku(req.getSku());
        if (sku != null && this.productRepository.existsBySku(sku)) {
            throw new IdInvalidException("SKU da ton tai");
        }
        if (this.productRepository.existsByName(req.getName())) {
            throw new IdInvalidException("Sản phẩm đã tồn tại");
        }
        Product product = new Product();
        this.applyProductRequest(product, req);
        Product currentProduct = this.productRepository.save(product);
        this.addImage(req.getImages(), currentProduct);
        return this.convertToResCreateProductDTO(currentProduct);
    }

    @Transactional
    public ResUpdateProductDTO handleUpdateProduct(ReqProductDTO product) throws IdInvalidException {
        Product currentProduct = this.productRepository.findById(product.getId())
                .orElseThrow(() -> new IdInvalidException("Không có sản phẩm"));

        Optional<Product> sameName = this.productRepository.findByName(product.getName());
        if (sameName.isPresent() && sameName.get().getId() != currentProduct.getId()) {
            throw new IdInvalidException("Tên sản phẩm đã tồn tại");
        }

        String sku = normalizeSku(product.getSku());
        if (sku != null) {
            Optional<Product> sameSku = this.productRepository.findBySku(sku);
            if (sameSku.isPresent() && sameSku.get().getId() != currentProduct.getId()) {
                throw new IdInvalidException("SKU da ton tai");
            }
        }

        this.applyProductRequest(currentProduct, product);
        this.replaceImages(product.getImages(), currentProduct);
        this.productRepository.save(currentProduct);
        return convertToResUpdateProductDTO(currentProduct);
    }

    @Transactional(readOnly = true)
    public ResProductDTO fetchProductById(long id) throws IdInvalidException {
        Product product = this.productRepository.findById(id)
                .orElseThrow(() -> new IdInvalidException("Không có sản phẩm"));
        return convertToResProductDTO(product);
    }

    @Transactional
    public void deleteProductById(long id) {
        Product currentProduct = this.productRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Product not found"));
        List<ProductImage> productImages = this.productImageRepository.findByProductId(id);
        for (ProductImage productImage : productImages) {
            this.deleteProductImageFileIfUnused(productImage.getImageUrl());
            this.productImageRepository.delete(productImage);
        }
        this.productRepository.delete(currentProduct);
    }

    @Transactional(readOnly = true)
    public ResultPaginationDTO fetchAllProducts(Specification<Product> spec, Pageable pageable){
        return fetchAllProducts(spec, pageable, false);
    }

    @Transactional(readOnly = true)
    public ResultPaginationDTO fetchAllProducts(Specification<Product> spec, Pageable pageable, boolean includeInactive){
        return fetchAllProducts(spec, pageable, includeInactive, null);
    }

    @Transactional(readOnly = true)
    public ResultPaginationDTO fetchAllProducts(Specification<Product> spec, Pageable pageable,
                                                boolean includeInactive, String query){
        return fetchAllProducts(spec, pageable, includeInactive, query, null, null, null, null);
    }

    @Transactional(readOnly = true)
    public ResultPaginationDTO fetchAllProducts(Specification<Product> spec, Pageable pageable,
                                                boolean includeInactive, String query,
                                                String brand, String target, Long minPrice, Long maxPrice){
        Specification<Product> activeSpec = (root, criteriaQuery, criteriaBuilder) ->
                criteriaBuilder.isTrue(root.get("active"));
        Specification<Product> finalSpec = includeInactive ? spec : combine(spec, activeSpec);
        Specification<Product> searchSpec = productSearch(query);
        finalSpec = combine(finalSpec, searchSpec);
        finalSpec = combine(finalSpec, productFilters(brand, target, minPrice, maxPrice));
        Page<Product> products = this.productRepository.findAll(finalSpec, pageable);
        ResultPaginationDTO resultPaginationDTO = new ResultPaginationDTO();
        ResultPaginationDTO.Meta meta = new ResultPaginationDTO.Meta();

        meta.setPage(pageable.getPageNumber()+1);
        meta.setPagesize(pageable.getPageSize());
        meta.setPages(products.getTotalPages());
        meta.setTotal(products.getTotalElements());

        resultPaginationDTO.setMeta(meta);

        List<ResProductDTO> listProduct = products.getContent().
                stream().map(item -> this.convertToResProductDTO(item))
                .collect(Collectors.toList());

        resultPaginationDTO.setResult(listProduct);

        return resultPaginationDTO;
    }

    private Specification<Product> combine(Specification<Product> first, Specification<Product> second) {
        if (first == null) {
            return second;
        }
        return second == null ? first : first.and(second);
    }

    private Specification<Product> productSearch(String query) {
        if (query == null || query.isBlank()) {
            return null;
        }
        String escaped = query.trim().toLowerCase(Locale.ROOT)
                .replace("\\", "\\\\")
                .replace("%", "\\%")
                .replace("_", "\\_");
        String pattern = "%" + escaped + "%";
        return (root, criteriaQuery, criteriaBuilder) -> criteriaBuilder.or(
                criteriaBuilder.like(criteriaBuilder.lower(root.get("name")), pattern, '\\'),
                criteriaBuilder.like(criteriaBuilder.lower(root.get("sku")), pattern, '\\'),
                criteriaBuilder.like(criteriaBuilder.lower(root.get("brand")), pattern, '\\'),
                criteriaBuilder.like(criteriaBuilder.lower(root.get("category")), pattern, '\\')
        );
    }

    private Specification<Product> productFilters(String brand, String target, Long minPrice, Long maxPrice) {
        Specification<Product> result = null;
        if (brand != null && !brand.isBlank()) {
            String normalizedBrand = brand.trim().toLowerCase(Locale.ROOT);
            result = combine(result, (root, criteriaQuery, criteriaBuilder) ->
                    criteriaBuilder.equal(criteriaBuilder.lower(root.get("brand")), normalizedBrand));
        }
        if (target != null && !target.isBlank()) {
            String normalizedTarget = target.trim().toLowerCase(Locale.ROOT);
            result = combine(result, (root, criteriaQuery, criteriaBuilder) ->
                    criteriaBuilder.equal(criteriaBuilder.lower(root.get("target")), normalizedTarget));
        }
        if (minPrice != null && minPrice >= 0) {
            result = combine(result, (root, criteriaQuery, criteriaBuilder) ->
                    criteriaBuilder.greaterThanOrEqualTo(root.get("price"), minPrice));
        }
        if (maxPrice != null && maxPrice >= 0) {
            result = combine(result, (root, criteriaQuery, criteriaBuilder) ->
                    criteriaBuilder.lessThanOrEqualTo(root.get("price"), maxPrice));
        }
        return result;
    }
    public boolean existsByName(String name){
        return this.productRepository.existsByName(name);
    }

    public boolean existsById(long id){
        return this.productRepository.existsById(id);
    }

    private void applyProductRequest(Product product, ReqProductDTO req) {
        product.setSku(normalizeSku(req.getSku()));
        product.setName(req.getName());
        product.setPrice(req.getPrice());
        product.setShortDesc(req.getShortDesc());
        product.setDetailDesc(req.getDetailDesc());
        product.setBrand(req.getBrand());
        product.setTarget(req.getTarget());
        product.setCategory(req.getCategory());
        product.setQuantity(req.getQuantity());
        product.setSold(req.getSold());
        product.setActive(req.getActive() == null || req.getActive());

    }

    private String normalizeSku(String sku) {
        if (sku == null || sku.isBlank()) {
            return null;
        }
        return sku.trim().toUpperCase();
    }

    @Transactional
    public List<ProductImage> addImage(List<String> images, Product product){
        List<ProductImage> managedImages = product.getImages();
        if (managedImages == null) {
            managedImages = new ArrayList<>();
            product.setImages(managedImages);
        }
        for(String image : normalizeImages(images)){
            ProductImage productImage = new ProductImage();
            productImage.setImageUrl(image);
            productImage.setProduct(product);
            managedImages.add(productImage);
        }
        this.productRepository.save(product);
        return new ArrayList<>(managedImages);
    }

    private void replaceImages(List<String> requestedImages, Product product) {
        if (requestedImages == null) {
            return;
        }

        List<String> normalizedImages = normalizeImages(requestedImages);
        Set<String> requestedImageSet = new LinkedHashSet<>(normalizedImages);
        List<ProductImage> managedImages = product.getImages();
        if (managedImages == null) {
            managedImages = new ArrayList<>();
            product.setImages(managedImages);
        }

        List<ProductImage> existingImages = new ArrayList<>(managedImages);
        Map<String, ProductImage> existingByUrl = existingImages.stream()
                .collect(Collectors.toMap(
                        ProductImage::getImageUrl,
                        image -> image,
                        (first, ignored) -> first,
                        LinkedHashMap::new
                ));

        for (ProductImage existingImage : existingImages) {
            if (!requestedImageSet.contains(existingImage.getImageUrl())) {
                this.deleteProductImageFileIfUnused(existingImage.getImageUrl());
            }
        }

        List<ProductImage> orderedImages = new ArrayList<>();
        for (String requestedImage : normalizedImages) {
            ProductImage productImage = existingByUrl.get(requestedImage);
            if (productImage == null) {
                productImage = new ProductImage();
                productImage.setImageUrl(requestedImage);
                productImage.setProduct(product);
            }
            orderedImages.add(productImage);
        }

        managedImages.clear();
        managedImages.addAll(orderedImages);
    }

    private List<String> normalizeImages(List<String> images) {
        if (images == null) {
            return List.of();
        }
        return images.stream()
                .filter(image -> image != null && !image.isBlank())
                .map(String::trim)
                .distinct()
                .collect(Collectors.toList());
    }

    private void deleteProductImageFileIfUnused(String imageUrl) {
        if (imageUrl == null || this.productImageRepository.countByImageUrl(imageUrl) > 1) {
            return;
        }
        try {
            this.fileService.deleteIfExists(imageUrl, "product");
        } catch (IOException | IllegalArgumentException e) {
            log.warn("Could not delete product image file {}", imageUrl, e);
        }
    }

    public ResCreateProductDTO convertToResCreateProductDTO(Product product) {
        ResCreateProductDTO resCreateProductDTO = new ResCreateProductDTO();
        resCreateProductDTO.setId(product.getId());
        resCreateProductDTO.setSku(product.getSku());
        resCreateProductDTO.setName(product.getName());
        resCreateProductDTO.setPrice(product.getPrice());
        resCreateProductDTO.setDetailDesc(product.getDetailDesc());
        resCreateProductDTO.setShortDesc(product.getShortDesc());
        resCreateProductDTO.setQuantity(product.getQuantity());
        resCreateProductDTO.setSold(product.getSold());
        resCreateProductDTO.setTarget(product.getTarget());
        resCreateProductDTO.setCategory(product.getCategory());
        resCreateProductDTO.setBrand(product.getBrand());
        resCreateProductDTO.setActive(product.isActive());

        List<String> images = new ArrayList<>();
        List<ProductImage> productImages = product.getImages();
        if (productImages != null) {
            for(ProductImage productImage : productImages){
                images.add(productImage.getImageUrl());
            }
        }
        resCreateProductDTO.setImages(images);
        resCreateProductDTO.setCreatedAt(product.getCreatedAt());
        return resCreateProductDTO;
    }

    public ResUpdateProductDTO convertToResUpdateProductDTO(Product product) {
        ResUpdateProductDTO resUpdateProductDTO = new ResUpdateProductDTO();
        resUpdateProductDTO.setId(product.getId());
        resUpdateProductDTO.setSku(product.getSku());
        resUpdateProductDTO.setName(product.getName());
        resUpdateProductDTO.setPrice(product.getPrice());
        resUpdateProductDTO.setDetailDesc(product.getDetailDesc());
        resUpdateProductDTO.setShortDesc(product.getShortDesc());
        resUpdateProductDTO.setQuantity(product.getQuantity());
        resUpdateProductDTO.setSold(product.getSold());
        resUpdateProductDTO.setTarget(product.getTarget());
        resUpdateProductDTO.setCategory(product.getCategory());
        resUpdateProductDTO.setBrand(product.getBrand());
        resUpdateProductDTO.setActive(product.isActive());

        List<String> images = new ArrayList<>();
        List<ProductImage> productImages = product.getImages();
        if (productImages != null) {
            for(ProductImage productImage : productImages){
                images.add(productImage.getImageUrl());
            }
        }
        resUpdateProductDTO.setImages(images);
        resUpdateProductDTO.setUpdatedAt(product.getUpdatedAt());
        return resUpdateProductDTO;
    }

    public ResProductDTO convertToResProductDTO(Product product) {
        ResProductDTO resProductDTO = new ResProductDTO();
        resProductDTO.setId(product.getId());
        resProductDTO.setSku(product.getSku());
        resProductDTO.setName(product.getName());
        resProductDTO.setPrice(product.getPrice());
        resProductDTO.setDetailDesc(product.getDetailDesc());
        resProductDTO.setShortDesc(product.getShortDesc());
        resProductDTO.setQuantity(product.getQuantity());
        resProductDTO.setSold(product.getSold());
        resProductDTO.setTarget(product.getTarget());
        resProductDTO.setCategory(product.getCategory());
        resProductDTO.setBrand(product.getBrand());
        resProductDTO.setActive(product.isActive());

        List<String> images = new ArrayList<>();
        List<ProductImage> productImages = product.getImages();
        if (productImages != null) {
            for(ProductImage productImage : productImages){
                images.add(productImage.getImageUrl());
            }
        }
        resProductDTO.setImages(images);
        resProductDTO.setCreatedAt(product.getCreatedAt());
        resProductDTO.setUpdatedAt(product.getUpdatedAt());
        return resProductDTO;
    }
}

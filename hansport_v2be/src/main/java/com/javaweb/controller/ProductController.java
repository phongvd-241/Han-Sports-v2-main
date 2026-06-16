package com.javaweb.controller;

import com.javaweb.domain.Product;
import com.javaweb.domain.request.ReqProductDTO;
import com.javaweb.domain.response.ResultPaginationDTO;
import com.javaweb.domain.response.product.ResCreateProductDTO;
import com.javaweb.domain.response.product.ResProductImportDTO;
import com.javaweb.domain.response.product.ResProductNavigationDTO;
import com.javaweb.domain.response.product.ResProductDTO;
import com.javaweb.domain.response.product.ResUpdateProductDTO;
import com.javaweb.service.ProductImportService;
import com.javaweb.service.ProductService;
import com.javaweb.util.annotation.ApiMessage;
import com.javaweb.util.error.IdInvalidException;
import com.turkraft.springfilter.boot.Filter;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api/v1")
public class ProductController {
    private final ProductService productService;
    private final ProductImportService productImportService;

    public ProductController(ProductService productService, ProductImportService productImportService) {
        this.productService = productService;
        this.productImportService = productImportService;
    }

    @PostMapping("/products")
    @ApiMessage("create a product")
    public ResponseEntity<ResCreateProductDTO> createProduct(@RequestBody @Valid ReqProductDTO product) throws IdInvalidException {
        return ResponseEntity.status(HttpStatus.CREATED).body(this.productService.handleSaveProduct(product));
    }

    @PutMapping("/products")
    @ApiMessage("update a product")
    public ResponseEntity<ResUpdateProductDTO> updateProduct(@RequestBody @Valid ReqProductDTO product) throws IdInvalidException {
        if(!this.productService.existsById(product.getId())){
            throw new IdInvalidException("Không có sản phẩm");
        }
        return ResponseEntity.ok().body(this.productService.handleUpdateProduct(product));
    }

    @PostMapping(value = "/products/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ApiMessage("import products from excel or csv")
    public ResponseEntity<ResProductImportDTO> importProducts(@RequestParam("file") MultipartFile file,
                                                              @RequestParam(name = "dryRun", defaultValue = "true") boolean dryRun)
            throws IOException {
        return ResponseEntity.ok(this.productImportService.importProducts(file, dryRun));
    }

    @DeleteMapping("/products/{id}")
    @ApiMessage("delete a products")
    public ResponseEntity<Void> deleteProduct(@PathVariable long id) throws IdInvalidException {
        if(!this.productService.existsById(id)){
            throw new IdInvalidException("Không có sản phẩm");
        }
        this.productService.deleteProductById(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/products/{id}")
    @ApiMessage("get product by id")
    public ResponseEntity<ResProductDTO> getProductById(@PathVariable long id) throws IdInvalidException {
        if(!this.productService.existsById(id)){
            throw new IdInvalidException("Không có sản phẩm");
        }

        return ResponseEntity.ok().body(this.productService.fetchProductById(id));
    }

    @GetMapping("/products/navigation")
    @ApiMessage("get product catalog navigation")
    public ResponseEntity<ResProductNavigationDTO> getProductNavigation() {
        return ResponseEntity.ok(this.productService.fetchProductNavigation());
    }

    @GetMapping("/products")
    @ApiMessage("get all products")
    public ResponseEntity<ResultPaginationDTO> getAllProducts(@Filter Specification<Product> spec,
                                                              Pageable pageable,
                                                              @RequestParam(name = "includeInactive", defaultValue = "false") boolean includeInactive,
                                                              @RequestParam(name = "q", required = false) String query,
                                                              @RequestParam(name = "brand", required = false) String brand,
                                                              @RequestParam(name = "target", required = false) String target,
                                                              @RequestParam(name = "category", required = false) String category,
                                                              @RequestParam(name = "minPrice", required = false) Long minPrice,
                                                              @RequestParam(name = "maxPrice", required = false) Long maxPrice,
                                                              Authentication authentication){
        boolean canIncludeInactive = includeInactive && isAdmin(authentication);
        return ResponseEntity.status(HttpStatus.OK)
                .body(this.productService.fetchAllProducts(
                        spec, pageable, canIncludeInactive, query, brand, target, category, minPrice, maxPrice));
    }

    private boolean isAdmin(Authentication authentication) {
        return authentication != null && authentication.getAuthorities().stream()
                .anyMatch(authority -> "ROLE_ADMIN".equals(authority.getAuthority()));
    }

}

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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ProductService {
    private final ProductRepository productRepository;
    private final ProductImageRepository productImageRepository;
    public ProductService(ProductRepository productRepository, ProductImageRepository productImageRepository) {
        this.productRepository = productRepository;
        this.productImageRepository = productImageRepository;
    }

    @Transactional
    public ResCreateProductDTO handleSaveProduct(ReqProductDTO req) throws IdInvalidException {
        if (this.productRepository.existsByName(req.getName())) {
            throw new IdInvalidException("Sản phẩm đã tồn tại");
        }
        Product product = new Product();
        this.applyProductRequest(product, req);
        Product currentProduct = this.productRepository.save(product);
        currentProduct.setImages(this.addImage(req.getImages(), currentProduct));
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

        this.applyProductRequest(currentProduct, product);
        this.productRepository.save(currentProduct);
        this.addImage(product.getImages(), currentProduct);
        return convertToResUpdateProductDTO(currentProduct);
    }
    public ResProductDTO fetchProductById(long id) throws IdInvalidException {
        Product product = this.productRepository.findById(id)
                .orElseThrow(() -> new IdInvalidException("Không có sản phẩm"));
        return convertToResProductDTO(product);
    }

    @Transactional
    public void deleteProductById(long id) {
        Product currentProduct = this.productRepository.findById(id).isPresent()?
                this.productRepository.findById(id).get() : null;
        List<ProductImage> productImages = currentProduct.getImages();
        for (ProductImage productImage : productImages) {
            this.productImageRepository.delete(productImage);
        }
        this.productRepository.deleteById(id);
    }

    public ResultPaginationDTO fetchAllProducts(Specification<Product> spec, Pageable pageable){
        Page<Product> products = this.productRepository.findAll(spec, pageable);
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
    public boolean existsByName(String name){
        return this.productRepository.existsByName(name);
    }

    public boolean existsById(long id){
        return this.productRepository.existsById(id);
    }

    private void applyProductRequest(Product product, ReqProductDTO req) {
        product.setName(req.getName());
        product.setPrice(req.getPrice());
        product.setShortDesc(req.getShortDesc());
        product.setDetailDesc(req.getDetailDesc());
        product.setBrand(req.getBrand());
        product.setTarget(req.getTarget());
        product.setCategory(req.getCategory());
        product.setQuantity(req.getQuantity());
        product.setSold(req.getSold());

    }

    public List<ProductImage> addImage(List<String> images, Product product){
        List<ProductImage> imageList = new ArrayList<>();
        for(String image : images){
            ProductImage productImage = new ProductImage();
            productImage.setImageUrl(image);
            productImage.setProduct(product);
            this.productImageRepository.save(productImage);
            imageList.add(productImage);
        }
        return imageList;   }

    public ResCreateProductDTO convertToResCreateProductDTO(Product product) {
        ResCreateProductDTO resCreateProductDTO = new ResCreateProductDTO();
        resCreateProductDTO.setId(product.getId());
        resCreateProductDTO.setName(product.getName());
        resCreateProductDTO.setPrice(product.getPrice());
        resCreateProductDTO.setDetailDesc(product.getDetailDesc());
        resCreateProductDTO.setShortDesc(product.getShortDesc());
        resCreateProductDTO.setQuantity(product.getQuantity());
        resCreateProductDTO.setSold(product.getSold());
        resCreateProductDTO.setTarget(product.getTarget());
        resCreateProductDTO.setCategory(product.getCategory());
        resCreateProductDTO.setBrand(product.getBrand());

        List<String> images = new ArrayList<>();
        List<ProductImage> productImages = product.getImages();
        for(ProductImage productImage : productImages){
            images.add(productImage.getImageUrl());
        }
        resCreateProductDTO.setImages(images);
        resCreateProductDTO.setCreatedAt(product.getCreatedAt());
        return resCreateProductDTO;
    }

    public ResUpdateProductDTO convertToResUpdateProductDTO(Product product) {
        ResUpdateProductDTO resUpdateProductDTO = new ResUpdateProductDTO();
        resUpdateProductDTO.setId(product.getId());
        resUpdateProductDTO.setName(product.getName());
        resUpdateProductDTO.setPrice(product.getPrice());
        resUpdateProductDTO.setDetailDesc(product.getDetailDesc());
        resUpdateProductDTO.setShortDesc(product.getShortDesc());
        resUpdateProductDTO.setQuantity(product.getQuantity());
        resUpdateProductDTO.setSold(product.getSold());
        resUpdateProductDTO.setTarget(product.getTarget());
        resUpdateProductDTO.setCategory(product.getCategory());
        resUpdateProductDTO.setBrand(product.getBrand());

        List<String> images = new ArrayList<>();
        List<ProductImage> productImages = product.getImages();
        for(ProductImage productImage : productImages){
            images.add(productImage.getImageUrl());
        }
        resUpdateProductDTO.setImages(images);
        resUpdateProductDTO.setUpdatedAt(product.getUpdatedAt());
        return resUpdateProductDTO;
    }

    public ResProductDTO convertToResProductDTO(Product product) {
        ResProductDTO resProductDTO = new ResProductDTO();
        resProductDTO.setId(product.getId());
        resProductDTO.setName(product.getName());
        resProductDTO.setPrice(product.getPrice());
        resProductDTO.setDetailDesc(product.getDetailDesc());
        resProductDTO.setShortDesc(product.getShortDesc());
        resProductDTO.setQuantity(product.getQuantity());
        resProductDTO.setSold(product.getSold());
        resProductDTO.setTarget(product.getTarget());
        resProductDTO.setCategory(product.getCategory());
        resProductDTO.setBrand(product.getBrand());

        List<String> images = new ArrayList<>();
        List<ProductImage> productImages = product.getImages();
        for(ProductImage productImage : productImages){
            images.add(productImage.getImageUrl());
        }
        resProductDTO.setImages(images);
        resProductDTO.setCreatedAt(product.getCreatedAt());
        resProductDTO.setUpdatedAt(product.getUpdatedAt());
        return resProductDTO;
    }
}

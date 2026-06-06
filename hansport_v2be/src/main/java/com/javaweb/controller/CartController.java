package com.javaweb.controller;

import com.javaweb.domain.Cart;
import com.javaweb.domain.request.ReqAddProductToCartDTO;
import com.javaweb.domain.request.ReqUpdateCartDetailDTO;
import com.javaweb.domain.response.cart.ResCartDTO;
import com.javaweb.service.CartService;
import com.javaweb.util.SecurityUtil;
import com.javaweb.util.annotation.ApiMessage;
import com.javaweb.util.error.IdInvalidException;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
public class CartController {
    private final CartService cartService;

    public CartController(CartService cartService) {
        this.cartService = cartService;
    }

    @PostMapping("/carts/add")
    @ApiMessage("Add product to cart")
    public ResponseEntity<ResCartDTO> addToCart(@RequestBody @Valid ReqAddProductToCartDTO reqAddProductToCartDTO) throws IdInvalidException
    {
        String email = SecurityUtil.getCurrentUserLogin().isPresent() ?
                SecurityUtil.getCurrentUserLogin().get() : "";
        ResCartDTO cart = this.cartService.addProductToCart(email, reqAddProductToCartDTO);
        return ResponseEntity.ok().body(cart);
    }

    @GetMapping("/carts")
    @ApiMessage("show cart")
    public ResponseEntity<ResCartDTO> getCart() throws IdInvalidException
    {
        String email = SecurityUtil.getCurrentUserLogin().isPresent() ?
                SecurityUtil.getCurrentUserLogin().get() : "";
        ResCartDTO cart = this.cartService.getCart(email);

        return ResponseEntity.ok().body(cart);
    }

    @DeleteMapping("/carts/{id}")
    @ApiMessage("Delete cart detail")
    public ResponseEntity<Void> deleteCartDetail(@PathVariable long id) throws IdInvalidException {

        if(!this.cartService.isCartDetailExist(id)){
            throw new IdInvalidException("Cart Detail khng tồn tại");
        }

        String email = SecurityUtil.getCurrentUserLogin().isPresent() ?
                SecurityUtil.getCurrentUserLogin().get() : "";
        this.cartService.deleteCartDetail(email, id);


        return ResponseEntity.ok().body(null);
    }

    @PutMapping("/carts/{id}")
    @ApiMessage("Update cart detail quantity")
    public ResponseEntity<ResCartDTO> updateCartDetail(@PathVariable long id,
                                                       @RequestBody @Valid ReqUpdateCartDetailDTO req)
            throws IdInvalidException {
        String email = SecurityUtil.getCurrentUserLogin().isPresent() ?
                SecurityUtil.getCurrentUserLogin().get() : "";
        ResCartDTO cart = this.cartService.updateCartDetailQuantity(email, id, req.getQuantity());
        return ResponseEntity.ok().body(cart);
    }
}

package com.javaweb.controller;

import com.javaweb.service.EmailService;
import com.javaweb.service.OrderService;
import com.javaweb.util.annotation.ApiMessage;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class EmailController {

    private OrderService orderService;
    public EmailController(OrderService orderService) {
        this.orderService = orderService;
    }

    @GetMapping("/email/{id}")
    @ApiMessage("Send simple email")
    public ResponseEntity<Void> sendSimpleEmail(@PathVariable long id) {

        this.orderService.sendOrderEmail(id);
        return ResponseEntity.ok().build();
    }

}

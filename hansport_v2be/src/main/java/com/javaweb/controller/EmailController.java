package com.javaweb.controller;

import com.javaweb.service.OrderService;
import com.javaweb.util.annotation.ApiMessage;
import com.javaweb.util.error.IdInvalidException;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class EmailController {

    private final OrderService orderService;

    public EmailController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping("/orders/{id}/send-email")
    @ApiMessage("Send order email")
    public String sendOrderEmail(@PathVariable long id) throws IdInvalidException {
        this.orderService.sendOrderEmail(id);
        return "ok";
    }
}

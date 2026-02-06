package cl.pymerp.minimarket.api;

import cl.pymerp.minimarket.domain.WebOrder;
import cl.pymerp.minimarket.domain.WebOrderItem;
import cl.pymerp.minimarket.domain.WebOrderStatus;
import cl.pymerp.minimarket.security.UserPrincipal;
import cl.pymerp.minimarket.service.WebOrderService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/web-orders")
public class WebOrderController {
  private final WebOrderService webOrderService;

  public WebOrderController(WebOrderService webOrderService) {
    this.webOrderService = webOrderService;
  }

  @PostMapping
  public WebOrderResponse create(@Valid @RequestBody WebOrderRequest request) {
    return toResponse(webOrderService.createOrder(request));
  }

  @GetMapping
  public List<WebOrderResponse> list(@RequestParam(required = false) WebOrderStatus status) {
    return webOrderService.list(status).stream().map(this::toResponse).collect(Collectors.toList());
  }

  @PatchMapping("/{id}/status")
  public WebOrderResponse updateStatus(
      @PathVariable UUID id,
      @Valid @RequestBody WebOrderStatusRequest request,
      @AuthenticationPrincipal UserPrincipal principal) {
    if (request.getUserId() == null && principal != null) {
      request.setUserId(principal.getId());
    }
    return toResponse(webOrderService.updateStatus(id, request.getStatus(), request.getUserId()));
  }

  private WebOrderResponse toResponse(WebOrder order) {
    List<WebOrderItemResponse> items = order.getItems() == null
        ? List.of()
        : order.getItems().stream().map(this::toItemResponse).collect(Collectors.toList());
    return WebOrderResponse.builder()
        .id(order.getId())
        .customerName(order.getCustomerName())
        .customerPhone(order.getCustomerPhone())
        .customerEmail(order.getCustomerEmail())
        .status(order.getStatus())
        .totalAmount(order.getTotalAmount())
        .items(items)
        .build();
  }

  private WebOrderItemResponse toItemResponse(WebOrderItem item) {
    return WebOrderItemResponse.builder()
        .productId(item.getProduct().getId())
        .quantity(item.getQuantity())
        .unitPrice(item.getUnitPrice())
        .build();
  }
}

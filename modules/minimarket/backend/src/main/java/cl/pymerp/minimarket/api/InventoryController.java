package cl.pymerp.minimarket.api;

import cl.pymerp.minimarket.domain.InventoryMovement;
import cl.pymerp.minimarket.security.UserPrincipal;
import cl.pymerp.minimarket.service.InventoryService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/inventory")
public class InventoryController {
  private final InventoryService inventoryService;

  public InventoryController(InventoryService inventoryService) {
    this.inventoryService = inventoryService;
  }

  @PostMapping("/purchase")
  public MovementResponse registerPurchase(
      @Valid @RequestBody PurchaseRequest request,
      @AuthenticationPrincipal UserPrincipal principal) {
    if (request.getUserId() == null && principal != null) {
      request.setUserId(principal.getId());
    }
    return toResponse(inventoryService.registerPurchase(request));
  }

  @PostMapping("/adjustments")
  public MovementResponse registerAdjustment(
      @Valid @RequestBody AdjustmentRequest request,
      @AuthenticationPrincipal UserPrincipal principal) {
    if (request.getUserId() == null && principal != null) {
      request.setUserId(principal.getId());
    }
    return toResponse(inventoryService.registerAdjustment(request));
  }

  @GetMapping("/{productId}/stock")
  public StockResponse getStock(@PathVariable UUID productId) {
    long stockOnHand = inventoryService.getStockOnHand(productId);
    long reserved = inventoryService.getReserved(productId);
    long available = stockOnHand - reserved;
    return StockResponse.builder()
        .productId(productId)
        .stockOnHand(stockOnHand)
        .reserved(reserved)
        .available(available)
        .build();
  }

  @GetMapping("/{productId}/movements")
  public List<MovementResponse> getMovements(@PathVariable UUID productId) {
    return inventoryService.getMovements(productId).stream().map(this::toResponse).collect(Collectors.toList());
  }

  private MovementResponse toResponse(InventoryMovement movement) {
    return MovementResponse.builder()
        .id(movement.getId())
        .productId(movement.getProduct().getId())
        .type(movement.getType())
        .reason(movement.getReason())
        .quantity(movement.getQuantity())
        .documentType(movement.getDocumentType())
        .documentNumber(movement.getDocumentNumber())
        .notes(movement.getNotes())
        .userId(movement.getUser().getId())
        .createdAt(movement.getCreatedAt())
        .build();
  }
}

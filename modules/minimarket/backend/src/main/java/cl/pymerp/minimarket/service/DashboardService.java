package cl.pymerp.minimarket.service;

import cl.pymerp.minimarket.api.DashboardResponse;
import cl.pymerp.minimarket.api.DashboardResponse.AdjustmentItem;
import cl.pymerp.minimarket.api.DashboardResponse.WebOrderSummary;
import cl.pymerp.minimarket.domain.InventoryMovement;
import cl.pymerp.minimarket.domain.MovementType;
import cl.pymerp.minimarket.domain.WebOrder;
import cl.pymerp.minimarket.domain.WebOrderStatus;
import cl.pymerp.minimarket.repository.InventoryMovementRepository;
import cl.pymerp.minimarket.repository.InventoryProjectionRepository;
import cl.pymerp.minimarket.repository.LocalSaleRepository;
import cl.pymerp.minimarket.repository.WebOrderRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

@Service
public class DashboardService {
  private final LocalSaleRepository localSaleRepository;
  private final WebOrderRepository webOrderRepository;
  private final InventoryMovementRepository movementRepository;
  private final InventoryProjectionRepository projectionRepository;

  public DashboardService(
      LocalSaleRepository localSaleRepository,
      WebOrderRepository webOrderRepository,
      InventoryMovementRepository movementRepository,
      InventoryProjectionRepository projectionRepository) {
    this.localSaleRepository = localSaleRepository;
    this.webOrderRepository = webOrderRepository;
    this.movementRepository = movementRepository;
    this.projectionRepository = projectionRepository;
  }

  public DashboardResponse getSummary() {
    ZoneId zone = ZoneId.of("America/Santiago");
    LocalDate today = LocalDate.now(zone);
    OffsetDateTime start = today.atStartOfDay(zone).toOffsetDateTime();
    OffsetDateTime end = today.plusDays(1).atStartOfDay(zone).toOffsetDateTime();

    var salesToday = localSaleRepository.findByCreatedAtBetween(start, end);
    BigDecimal total = salesToday.stream()
        .map(sale -> sale.getTotalAmount())
        .reduce(BigDecimal.ZERO, BigDecimal::add);

    List<WebOrder> pending = webOrderRepository.findByStatusOrderByCreatedAtAsc(WebOrderStatus.PENDING);
    List<WebOrderSummary> pendingSummaries = pending.stream()
        .limit(10)
        .map(order -> WebOrderSummary.builder()
            .id(order.getId())
            .customerName(order.getCustomerName())
            .totalAmount(order.getTotalAmount())
            .createdAt(order.getCreatedAt())
            .build())
        .collect(Collectors.toList());

    List<InventoryMovement> adjustments = movementRepository.findTop10ByTypeOrderByCreatedAtDesc(MovementType.ADJUST);
    List<AdjustmentItem> adjustmentItems = adjustments.stream()
        .map(movement -> AdjustmentItem.builder()
            .id(movement.getId())
            .productId(movement.getProduct().getId())
            .productName(movement.getProduct().getName())
            .quantity(movement.getQuantity())
            .reason(movement.getReason().name())
            .createdAt(movement.getCreatedAt())
            .build())
        .collect(Collectors.toList());

    return DashboardResponse.builder()
        .salesTodayTotal(total)
        .salesTodayCount(salesToday.size())
        .pendingWebOrders(pending.size())
        .pendingOrders(pendingSummaries)
        .lowStock(projectionRepository.findLowStock())
        .recentAdjustments(adjustmentItems)
        .build();
  }
}

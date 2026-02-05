package cl.pymerp.minimarket.api;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class DashboardResponse {
  private BigDecimal salesTodayTotal;
  private int salesTodayCount;
  private int pendingWebOrders;
  private List<WebOrderSummary> pendingOrders;
  private List<LowStockItem> lowStock;
  private List<AdjustmentItem> recentAdjustments;

  @Getter
  @Builder
  public static class WebOrderSummary {
    private UUID id;
    private String customerName;
    private BigDecimal totalAmount;
    private OffsetDateTime createdAt;
  }

  @Getter
  @Builder
  public static class LowStockItem {
    private UUID productId;
    private String name;
    private long stockOnHand;
    private int threshold;
  }

  @Getter
  @Builder
  public static class AdjustmentItem {
    private UUID id;
    private UUID productId;
    private String productName;
    private int quantity;
    private String reason;
    private OffsetDateTime createdAt;
  }
}

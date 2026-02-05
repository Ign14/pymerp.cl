package cl.pymerp.minimarket.api;

import java.math.BigDecimal;
import java.util.UUID;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ProductResponse {
  private UUID id;
  private UUID categoryId;
  private String sku;
  private String barcode;
  private String name;
  private String description;
  private String unit;
  private BigDecimal price;
  private BigDecimal cost;
  private boolean visibleWeb;
  private boolean active;
  private int lowStockThreshold;
}

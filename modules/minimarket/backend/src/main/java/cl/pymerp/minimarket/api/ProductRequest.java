package cl.pymerp.minimarket.api;

import java.math.BigDecimal;
import java.util.UUID;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ProductRequest {
  private UUID categoryId;
  private String sku;
  private String barcode;

  @NotBlank
  private String name;

  private String description;

  @NotBlank
  private String unit;

  @NotNull
  @PositiveOrZero
  private BigDecimal price;

  @NotNull
  @PositiveOrZero
  private BigDecimal cost;

  private boolean visibleWeb = true;
  private boolean active = true;

  @PositiveOrZero
  private int lowStockThreshold = 3;
}

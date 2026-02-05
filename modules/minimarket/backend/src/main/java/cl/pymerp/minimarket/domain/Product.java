package cl.pymerp.minimarket.domain;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "products")
@Getter
@Setter
public class Product {
  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @ManyToOne
  @JoinColumn(name = "category_id")
  private Category category;

  private String sku;

  private String barcode;

  @Column(nullable = false)
  private String name;

  private String description;

  @Column(nullable = false)
  private String unit = "unidad";

  @Column(nullable = false)
  private BigDecimal price;

  @Column(nullable = false)
  private BigDecimal cost = BigDecimal.ZERO;

  @Column(name = "visible_web", nullable = false)
  private boolean visibleWeb = true;

  @Column(nullable = false)
  private boolean active = true;

  @Column(name = "low_stock_threshold", nullable = false)
  private int lowStockThreshold = 3;

  @Column(name = "created_at", nullable = false)
  private OffsetDateTime createdAt = OffsetDateTime.now();

  @Column(name = "updated_at", nullable = false)
  private OffsetDateTime updatedAt = OffsetDateTime.now();

  @PreUpdate
  public void onUpdate() {
    this.updatedAt = OffsetDateTime.now();
  }
}

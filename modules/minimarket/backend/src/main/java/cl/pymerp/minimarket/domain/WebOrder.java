package cl.pymerp.minimarket.domain;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "web_orders")
@Getter
@Setter
public class WebOrder {
  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(name = "customer_name", nullable = false)
  private String customerName;

  @Column(name = "customer_phone", nullable = false)
  private String customerPhone;

  @Column(name = "customer_email")
  private String customerEmail;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private WebOrderStatus status = WebOrderStatus.REQUESTED;

  @Column(name = "total_amount", nullable = false)
  private BigDecimal totalAmount = BigDecimal.ZERO;

  @Column(name = "created_at", nullable = false)
  private OffsetDateTime createdAt = OffsetDateTime.now();

  @Column(name = "updated_at", nullable = false)
  private OffsetDateTime updatedAt = OffsetDateTime.now();

  @OneToMany(mappedBy = "webOrder", cascade = CascadeType.ALL)
  private List<WebOrderItem> items;

  @PreUpdate
  public void onUpdate() {
    this.updatedAt = OffsetDateTime.now();
  }
}

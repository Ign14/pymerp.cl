package cl.pymerp.minimarket.domain;

import java.math.BigDecimal;
import java.util.UUID;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "web_order_items")
@Getter
@Setter
public class WebOrderItem {
  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @ManyToOne(optional = false)
  @JoinColumn(name = "web_order_id", nullable = false)
  private WebOrder webOrder;

  @ManyToOne(optional = false)
  @JoinColumn(name = "product_id", nullable = false)
  private Product product;

  @Column(nullable = false)
  private int quantity;

  @Column(name = "unit_price", nullable = false)
  private BigDecimal unitPrice;
}

package cl.pymerp.minimarket.domain;

import java.math.BigDecimal;
import java.util.UUID;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "local_sale_items")
@Getter
@Setter
public class LocalSaleItem {
  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @ManyToOne(optional = false)
  @JoinColumn(name = "local_sale_id", nullable = false)
  private LocalSale localSale;

  @ManyToOne(optional = false)
  @JoinColumn(name = "product_id", nullable = false)
  private Product product;

  @Column(nullable = false)
  private int quantity;

  @Column(name = "unit_price", nullable = false)
  private BigDecimal unitPrice;
}

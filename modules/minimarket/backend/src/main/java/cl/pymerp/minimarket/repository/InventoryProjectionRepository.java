package cl.pymerp.minimarket.repository;

import cl.pymerp.minimarket.api.DashboardResponse.LowStockItem;
import java.util.List;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class InventoryProjectionRepository {
  private final JdbcTemplate jdbcTemplate;

  public InventoryProjectionRepository(JdbcTemplate jdbcTemplate) {
    this.jdbcTemplate = jdbcTemplate;
  }

  public List<LowStockItem> findLowStock() {
    String sql = """
        SELECT p.id, p.name, i.stock_on_hand, p.low_stock_threshold
        FROM products p
        JOIN inventory i ON i.product_id = p.id
        WHERE p.active = true AND i.stock_on_hand <= p.low_stock_threshold
        ORDER BY i.stock_on_hand ASC
        LIMIT 20
        """;
    return jdbcTemplate.query(
        sql,
        (rs, rowNum) -> LowStockItem.builder()
            .productId(UUID.fromString(rs.getString("id")))
            .name(rs.getString("name"))
            .stockOnHand(rs.getLong("stock_on_hand"))
            .threshold(rs.getInt("low_stock_threshold"))
            .build());
  }
}

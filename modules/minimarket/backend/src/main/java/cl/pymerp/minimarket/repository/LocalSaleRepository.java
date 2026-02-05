package cl.pymerp.minimarket.repository;

import cl.pymerp.minimarket.domain.LocalSale;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LocalSaleRepository extends JpaRepository<LocalSale, UUID> {
  List<LocalSale> findByCreatedAtBetween(OffsetDateTime start, OffsetDateTime end);
}

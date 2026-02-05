package cl.pymerp.minimarket.repository;

import cl.pymerp.minimarket.domain.LocalSaleItem;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LocalSaleItemRepository extends JpaRepository<LocalSaleItem, UUID> {}

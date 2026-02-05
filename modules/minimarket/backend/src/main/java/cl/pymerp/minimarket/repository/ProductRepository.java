package cl.pymerp.minimarket.repository;

import cl.pymerp.minimarket.domain.Product;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductRepository extends JpaRepository<Product, UUID> {}

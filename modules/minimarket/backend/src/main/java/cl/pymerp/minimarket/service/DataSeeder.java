package cl.pymerp.minimarket.service;

import cl.pymerp.minimarket.domain.Category;
import cl.pymerp.minimarket.domain.InventoryMovement;
import cl.pymerp.minimarket.domain.MovementReason;
import cl.pymerp.minimarket.domain.MovementType;
import cl.pymerp.minimarket.domain.Product;
import cl.pymerp.minimarket.domain.User;
import cl.pymerp.minimarket.repository.CategoryRepository;
import cl.pymerp.minimarket.repository.InventoryMovementRepository;
import cl.pymerp.minimarket.repository.ProductRepository;
import cl.pymerp.minimarket.repository.UserRepository;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class DataSeeder implements CommandLineRunner {
  private final UserRepository userRepository;
  private final CategoryRepository categoryRepository;
  private final ProductRepository productRepository;
  private final InventoryMovementRepository movementRepository;
  private final PasswordEncoder passwordEncoder;
  private final boolean enabled;

  public DataSeeder(
      UserRepository userRepository,
      CategoryRepository categoryRepository,
      ProductRepository productRepository,
      InventoryMovementRepository movementRepository,
      PasswordEncoder passwordEncoder,
      @Value("${seed.enabled:true}") boolean enabled) {
    this.userRepository = userRepository;
    this.categoryRepository = categoryRepository;
    this.productRepository = productRepository;
    this.movementRepository = movementRepository;
    this.passwordEncoder = passwordEncoder;
    this.enabled = enabled;
  }

  @Override
  @Transactional
  public void run(String... args) {
    if (!enabled) {
      return;
    }

    User admin = userRepository.findByEmail("admin@minimarket.cl").orElse(null);
    if (admin == null) {
      admin = new User();
      admin.setEmail("admin@minimarket.cl");
      admin.setFullName("Admin Minimarket");
      admin.setRole("ADMIN");
      admin.setPasswordHash(passwordEncoder.encode("admin123"));
      admin.setActive(true);
      admin = userRepository.save(admin);
    }

    if (categoryRepository.count() > 0) {
      return;
    }

    Category abarrotes = new Category();
    abarrotes.setName("Abarrotes");
    Category bebidas = new Category();
    bebidas.setName("Bebidas");
    Category lacteos = new Category();
    lacteos.setName("Lacteos");
    categoryRepository.saveAll(List.of(abarrotes, bebidas, lacteos));

    Product arroz = createProduct("Arroz 1kg", abarrotes, new BigDecimal("1250"));
    Product fideos = createProduct("Fideos 400g", abarrotes, new BigDecimal("990"));
    Product agua = createProduct("Agua 1.5L", bebidas, new BigDecimal("850"));
    Product leche = createProduct("Leche entera 1L", lacteos, new BigDecimal("1100"));
    productRepository.saveAll(List.of(arroz, fideos, agua, leche));

    seedStock(arroz, admin, 30);
    seedStock(fideos, admin, 25);
    seedStock(agua, admin, 40);
    seedStock(leche, admin, 20);
  }

  private Product createProduct(String name, Category category, BigDecimal price) {
    Product product = new Product();
    product.setName(name);
    product.setCategory(category);
    product.setUnit("unidad");
    product.setPrice(price);
    product.setCost(price.multiply(new BigDecimal("0.7")));
    return product;
  }

  private void seedStock(Product product, User user, int quantity) {
    InventoryMovement movement = new InventoryMovement();
    movement.setProduct(product);
    movement.setType(MovementType.IN);
    movement.setReason(MovementReason.compra);
    movement.setQuantity(quantity);
    movement.setDocumentType("Factura");
    movement.setDocumentNumber("SEED-001");
    movement.setNotes("Stock inicial");
    movement.setUser(user);
    movementRepository.save(movement);
  }
}

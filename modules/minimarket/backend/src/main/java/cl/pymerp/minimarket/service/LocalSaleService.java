package cl.pymerp.minimarket.service;

import cl.pymerp.minimarket.api.LocalSaleItemRequest;
import cl.pymerp.minimarket.api.LocalSaleRequest;
import cl.pymerp.minimarket.domain.InventoryMovement;
import cl.pymerp.minimarket.domain.LocalSale;
import cl.pymerp.minimarket.domain.LocalSaleItem;
import cl.pymerp.minimarket.domain.MovementReason;
import cl.pymerp.minimarket.domain.MovementType;
import cl.pymerp.minimarket.domain.Payment;
import cl.pymerp.minimarket.domain.Product;
import cl.pymerp.minimarket.domain.SaleStatus;
import cl.pymerp.minimarket.domain.SaleType;
import cl.pymerp.minimarket.domain.User;
import cl.pymerp.minimarket.repository.InventoryMovementRepository;
import cl.pymerp.minimarket.repository.LocalSaleRepository;
import cl.pymerp.minimarket.repository.PaymentRepository;
import cl.pymerp.minimarket.repository.ProductRepository;
import cl.pymerp.minimarket.repository.UserRepository;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class LocalSaleService {
  private final LocalSaleRepository saleRepository;
  private final ProductRepository productRepository;
  private final UserRepository userRepository;
  private final InventoryMovementRepository movementRepository;
  private final PaymentRepository paymentRepository;
  private final InventoryService inventoryService;

  public LocalSaleService(
      LocalSaleRepository saleRepository,
      ProductRepository productRepository,
      UserRepository userRepository,
      InventoryMovementRepository movementRepository,
      PaymentRepository paymentRepository,
      InventoryService inventoryService) {
    this.saleRepository = saleRepository;
    this.productRepository = productRepository;
    this.userRepository = userRepository;
    this.movementRepository = movementRepository;
    this.paymentRepository = paymentRepository;
    this.inventoryService = inventoryService;
  }

  @Transactional
  public LocalSale create(LocalSaleRequest request) {
    if (request.getUserId() == null) {
      throw new IllegalArgumentException("userId es obligatorio");
    }
    User user = userRepository.findById(request.getUserId()).orElseThrow();

    LocalSale sale = new LocalSale();
    sale.setUser(user);
    sale.setStatus(SaleStatus.COMPLETED);

    List<LocalSaleItem> items = new ArrayList<>();
    BigDecimal total = BigDecimal.ZERO;

    for (LocalSaleItemRequest itemRequest : request.getItems()) {
      Product product = productRepository.findById(itemRequest.getProductId()).orElseThrow();
      long available = inventoryService.getStockOnHand(product.getId())
          - inventoryService.getReserved(product.getId());
      if (itemRequest.getQuantity() > available) {
        throw new IllegalArgumentException("stock insuficiente para producto: " + product.getName());
      }

      LocalSaleItem item = new LocalSaleItem();
      item.setLocalSale(sale);
      item.setProduct(product);
      item.setQuantity(itemRequest.getQuantity());
      item.setUnitPrice(product.getPrice());
      items.add(item);

      total = total.add(product.getPrice().multiply(BigDecimal.valueOf(itemRequest.getQuantity())));
    }

    sale.setItems(items);
    sale.setTotalAmount(total);

    LocalSale saved = saleRepository.save(sale);

    for (LocalSaleItem item : items) {
      InventoryMovement movement = new InventoryMovement();
      movement.setProduct(item.getProduct());
      movement.setType(MovementType.OUT);
      movement.setReason(MovementReason.venta);
      movement.setQuantity(item.getQuantity());
      movement.setNotes("Venta local: " + saved.getId());
      movement.setUser(user);
      movementRepository.save(movement);
    }

    Payment payment = new Payment();
    payment.setSaleType(SaleType.LOCAL_SALE);
    payment.setReferenceId(saved.getId());
    payment.setMethod(request.getMethod());
    payment.setAmount(total);
    paymentRepository.save(payment);

    return saved;
  }
}

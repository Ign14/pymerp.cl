package cl.pymerp.minimarket.service;

import cl.pymerp.minimarket.api.AdjustmentRequest;
import cl.pymerp.minimarket.api.PurchaseRequest;
import cl.pymerp.minimarket.domain.InventoryMovement;
import cl.pymerp.minimarket.domain.MovementReason;
import cl.pymerp.minimarket.domain.MovementType;
import cl.pymerp.minimarket.domain.Product;
import cl.pymerp.minimarket.domain.ReservationStatus;
import cl.pymerp.minimarket.domain.User;
import cl.pymerp.minimarket.repository.InventoryMovementRepository;
import cl.pymerp.minimarket.repository.ProductRepository;
import cl.pymerp.minimarket.repository.StockReservationRepository;
import cl.pymerp.minimarket.repository.UserRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class InventoryService {
  private final InventoryMovementRepository movementRepository;
  private final ProductRepository productRepository;
  private final UserRepository userRepository;
  private final StockReservationRepository reservationRepository;

  public InventoryService(
      InventoryMovementRepository movementRepository,
      ProductRepository productRepository,
      UserRepository userRepository,
      StockReservationRepository reservationRepository) {
    this.movementRepository = movementRepository;
    this.productRepository = productRepository;
    this.userRepository = userRepository;
    this.reservationRepository = reservationRepository;
  }

  public long getStockOnHand(UUID productId) {
    return movementRepository.getStockOnHand(productId);
  }

  public long getReserved(UUID productId) {
    return reservationRepository.sumByProductAndStatus(productId, ReservationStatus.ACTIVE);
  }

  public List<InventoryMovement> getMovements(UUID productId) {
    return movementRepository.findByProductIdOrderByCreatedAtDesc(productId);
  }

  @Transactional
  public InventoryMovement registerPurchase(PurchaseRequest request) {
    if (request.getDocumentType() == null || request.getDocumentType().isBlank()) {
      throw new IllegalArgumentException("documentType es obligatorio para ingresos");
    }
    if (request.getDocumentNumber() == null || request.getDocumentNumber().isBlank()) {
      throw new IllegalArgumentException("documentNumber es obligatorio para ingresos");
    }

    if (request.getUserId() == null) {
      throw new IllegalArgumentException("userId es obligatorio");
    }

    Product product = productRepository.findById(request.getProductId()).orElseThrow();
    User user = userRepository.findById(request.getUserId()).orElseThrow();

    InventoryMovement movement = new InventoryMovement();
    movement.setProduct(product);
    movement.setType(MovementType.IN);
    movement.setReason(MovementReason.compra);
    movement.setQuantity(request.getQuantity());
    movement.setDocumentType(request.getDocumentType());
    movement.setDocumentNumber(request.getDocumentNumber());
    movement.setNotes(request.getNotes());
    movement.setUser(user);

    return movementRepository.save(movement);
  }

  @Transactional
  public InventoryMovement registerAdjustment(AdjustmentRequest request) {
    if (request.getReason() == null) {
      throw new IllegalArgumentException("reason es obligatorio");
    }
    if (request.getQuantity() == null || request.getQuantity() == 0) {
      throw new IllegalArgumentException("quantity no puede ser 0 en ajustes");
    }
    if (request.getReason() == MovementReason.compra || request.getReason() == MovementReason.venta) {
      throw new IllegalArgumentException("reason de ajuste no puede ser compra o venta");
    }

    if (request.getUserId() == null) {
      throw new IllegalArgumentException("userId es obligatorio");
    }

    Product product = productRepository.findById(request.getProductId()).orElseThrow();
    User user = userRepository.findById(request.getUserId()).orElseThrow();

    long stockOnHand = getStockOnHand(product.getId());
    long projected = stockOnHand + request.getQuantity();
    if (projected < 0) {
      throw new IllegalArgumentException("stock no puede quedar negativo");
    }

    InventoryMovement movement = new InventoryMovement();
    movement.setProduct(product);
    movement.setType(MovementType.ADJUST);
    movement.setReason(request.getReason());
    movement.setQuantity(request.getQuantity());
    movement.setNotes(request.getNotes());
    movement.setUser(user);

    return movementRepository.save(movement);
  }
}

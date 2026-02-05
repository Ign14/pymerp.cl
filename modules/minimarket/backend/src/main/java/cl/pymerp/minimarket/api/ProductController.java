package cl.pymerp.minimarket.api;

import cl.pymerp.minimarket.domain.Product;
import cl.pymerp.minimarket.service.ProductService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/products")
public class ProductController {
  private final ProductService productService;

  public ProductController(ProductService productService) {
    this.productService = productService;
  }

  @PostMapping
  public ProductResponse create(@Valid @RequestBody ProductRequest request) {
    return toResponse(productService.create(request));
  }

  @PutMapping("/{id}")
  public ProductResponse update(@PathVariable UUID id, @Valid @RequestBody ProductRequest request) {
    return toResponse(productService.update(id, request));
  }

  @GetMapping
  public List<ProductResponse> list() {
    return productService.list().stream().map(this::toResponse).collect(Collectors.toList());
  }

  private ProductResponse toResponse(Product product) {
    return ProductResponse.builder()
        .id(product.getId())
        .categoryId(product.getCategory() != null ? product.getCategory().getId() : null)
        .sku(product.getSku())
        .barcode(product.getBarcode())
        .name(product.getName())
        .description(product.getDescription())
        .unit(product.getUnit())
        .price(product.getPrice())
        .cost(product.getCost())
        .visibleWeb(product.isVisibleWeb())
        .active(product.isActive())
        .lowStockThreshold(product.getLowStockThreshold())
        .build();
  }
}

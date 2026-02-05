package cl.pymerp.minimarket.api;

import java.util.List;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class WebOrderRequest {
  @NotBlank
  private String customerName;

  @NotBlank
  private String customerPhone;

  private String customerEmail;

  @Valid
  @NotEmpty
  private List<WebOrderItemRequest> items;
}

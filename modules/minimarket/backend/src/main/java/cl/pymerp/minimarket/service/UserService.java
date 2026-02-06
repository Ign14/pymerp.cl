package cl.pymerp.minimarket.service;

import cl.pymerp.minimarket.api.UserRequest;
import cl.pymerp.minimarket.domain.User;
import cl.pymerp.minimarket.repository.UserRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {
  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;

  public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
    this.userRepository = userRepository;
    this.passwordEncoder = passwordEncoder;
  }

  @Transactional(readOnly = true)
  public List<User> list() {
    return userRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"));
  }

  @Transactional
  public User create(UserRequest request) {
    userRepository.findByEmail(request.getEmail()).ifPresent(existing -> {
      throw new IllegalArgumentException("email ya existe");
    });
    User user = new User();
    user.setEmail(request.getEmail().trim().toLowerCase());
    user.setFullName(deriveName(request.getEmail()));
    user.setRole("STAFF");
    user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
    user.setActive(true);
    return userRepository.save(user);
  }

  @Transactional
  public User update(UUID id, UserRequest request) {
    User user = userRepository.findById(id).orElseThrow();
    String nextEmail = request.getEmail().trim().toLowerCase();
    if (!nextEmail.equals(user.getEmail())) {
      userRepository.findByEmail(nextEmail).ifPresent(existing -> {
        throw new IllegalArgumentException("email ya existe");
      });
      user.setEmail(nextEmail);
      user.setFullName(deriveName(nextEmail));
    }
    if (request.getPassword() != null && !request.getPassword().isBlank()) {
      user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
    }
    return userRepository.save(user);
  }

  @Transactional
  public void delete(UUID id) {
    User user = userRepository.findById(id).orElseThrow();
    user.setActive(false);
    userRepository.save(user);
  }

  private String deriveName(String email) {
    if (email == null || email.isBlank()) return "Usuario Minimarket";
    String prefix = email.split("@")[0];
    if (prefix.isBlank()) return "Usuario Minimarket";
    return prefix.replace('.', ' ').trim();
  }
}

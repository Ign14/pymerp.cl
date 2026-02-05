package cl.pymerp.minimarket.security;

import cl.pymerp.minimarket.repository.UserRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class UserAuthService implements UserDetailsService {
  private final UserRepository userRepository;

  public UserAuthService(UserRepository userRepository) {
    this.userRepository = userRepository;
  }

  @Override
  public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
    return userRepository.findByEmail(username)
        .map(UserPrincipal::new)
        .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado"));
  }
}

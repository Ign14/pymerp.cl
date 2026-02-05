package cl.pymerp.minimarket.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import java.security.Key;
import java.util.Date;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class JwtService {
  private final Key signingKey;
  private final long expirationMillis;

  public JwtService(
      @Value("${security.jwt.secret}") String secret,
      @Value("${security.jwt.expiration-minutes:720}") long expirationMinutes) {
    this.signingKey = Keys.hmacShaKeyFor(Decoders.BASE64.decode(secret));
    this.expirationMillis = expirationMinutes * 60 * 1000;
  }

  public String generateToken(UserPrincipal principal) {
    Date now = new Date();
    Date expiry = new Date(now.getTime() + expirationMillis);

    return Jwts.builder()
        .setSubject(principal.getUsername())
        .claim("uid", principal.getId().toString())
        .claim("role", principal.getRole())
        .setIssuedAt(now)
        .setExpiration(expiry)
        .signWith(signingKey, SignatureAlgorithm.HS256)
        .compact();
  }

  public String extractUsername(String token) {
    return extractAllClaims(token).getSubject();
  }

  public boolean isTokenValid(String token) {
    try {
      Claims claims = extractAllClaims(token);
      return claims.getExpiration().after(new Date());
    } catch (Exception ex) {
      return false;
    }
  }

  private Claims extractAllClaims(String token) {
    return Jwts.parserBuilder()
        .setSigningKey(signingKey)
        .build()
        .parseClaimsJws(token)
        .getBody();
  }
}

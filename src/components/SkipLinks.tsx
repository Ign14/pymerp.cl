import SkipLink from './SkipLink';

export default function SkipLinks() {
  return (
    <nav aria-label="Enlaces de navegación rápida" className="skip-links">
      <SkipLink href="#main-content">Saltar al contenido principal</SkipLink>
      <SkipLink href="#navigation">Saltar a la navegación</SkipLink>
      <SkipLink href="#footer">Saltar al pie de página</SkipLink>
    </nav>
  );
}


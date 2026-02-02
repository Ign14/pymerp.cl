const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'public', 'layouts', 'BarberiasPublicLayout.tsx');

// Leer el archivo
let content = fs.readFileSync(filePath, 'utf8');

// Buscar el pattern problemático y reemplazarlo
const pattern = /background: `linear-gradient\(165deg, \$\{theme\.cardColor \|\| '#ffffff'\} 0%, \$\{theme\.cardColor \? theme\.cardColor \+ 'e8' : '#fafbfc'\} 100%\)`,/g;
const replacement = 'background: cardGradient,';

const newContent = content.replace(pattern, replacement);

if (content !== newContent) {
  fs.writeFileSync(filePath, newContent, 'utf8');
  console.log('✅ Archivo corregido exitosamente');
} else {
  console.log('⚠️  No se encontró el pattern o ya estaba corregido');
}

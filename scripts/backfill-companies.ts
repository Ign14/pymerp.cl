/**
 * Script de backfill para empresas existentes
 * Asigna valores por defecto a campos nuevos:
 * - categoryId: 'otros' si no existe
 * - categoryGroup: 'OTROS' si no existe
 * - publicEnabled: false si no existe
 * - planId: 'BASIC' si no existe
 * 
 * Uso:
 *   - Ejecutar desde el directorio raíz: npx tsx scripts/backfill-companies.ts
 *   - Requiere Firebase Admin SDK configurado
 */

import * as admin from 'firebase-admin';
import { resolveCategoryId } from '../src/config/categories';

// Inicializar Firebase Admin
if (!admin.apps.length) {
  try {
    admin.initializeApp();
  } catch (error) {
    console.error('Error inicializando Firebase Admin:', error);
    process.exit(1);
  }
}

const db = admin.firestore();

interface CompanyDoc {
  id: string;
  category_id?: string;
  categoryGroup?: string;
  publicEnabled?: boolean;
  planId?: string;
  business_type?: string;
  [key: string]: any;
}

async function backfillCompanies() {
  console.log('🔄 Iniciando backfill de empresas...');

  try {
    const companiesRef = db.collection('companies');
    const snapshot = await companiesRef.get();

    if (snapshot.empty) {
      console.log('✅ No hay empresas para procesar');
      return;
    }

    console.log(`📊 Encontradas ${snapshot.size} empresas`);

    let updated = 0;
    let skipped = 0;
    const batch = db.batch();
    let batchCount = 0;
    const BATCH_SIZE = 500; // Límite de Firestore

    for (const doc of snapshot.docs) {
      const company = { id: doc.id, ...doc.data() } as CompanyDoc;
      const updates: Partial<CompanyDoc> = {};
      let needsUpdate = false;

      // 1. Asignar categoryId si no existe
      if (!company.category_id) {
        updates.category_id = 'otros';
        needsUpdate = true;
      }

      // 2. Resolver categoryId válido y asignar categoryGroup
      const resolvedCategoryId = resolveCategoryId(company);
      if (company.category_id !== resolvedCategoryId) {
        updates.category_id = resolvedCategoryId;
        needsUpdate = true;
      }

      // 3. Asignar categoryGroup si no existe
      if (!company.categoryGroup) {
        // Importar getCategoryConfig dinámicamente
        const { getCategoryConfig } = await import('../src/config/categories');
        const config = getCategoryConfig(resolvedCategoryId);
        updates.categoryGroup = config.group;
        needsUpdate = true;
      }

      // 4. Asignar publicEnabled si no existe
      if (company.publicEnabled === undefined) {
        updates.publicEnabled = false;
        needsUpdate = true;
      }

      // 5. Asignar planId si no existe
      if (!company.planId) {
        // Migrar de subscription_plan legacy si existe
        if (company.subscription_plan) {
          const planMapping: Record<string, string> = {
            BASIC: 'BASIC',
            STANDARD: 'STARTER',
            PRO: 'PRO',
            APPROVED25: 'BUSINESS',
          };
          updates.planId = (planMapping[company.subscription_plan] || 'BASIC') as any;
        } else {
          updates.planId = 'BASIC';
        }
        needsUpdate = true;
      }

      // 6. Asignar businessMode desde business_type si no existe
      if (!company.businessMode && company.business_type) {
        updates.businessMode = company.business_type as any;
        needsUpdate = true;
      }

      if (needsUpdate) {
        const companyRef = companiesRef.doc(company.id);
        batch.update(companyRef, {
          ...updates,
          updated_at: admin.firestore.FieldValue.serverTimestamp(),
        });
        batchCount++;
        updated++;

        if (batchCount >= BATCH_SIZE) {
          await batch.commit();
          console.log(`✅ Procesado batch de ${batchCount} empresas`);
          batchCount = 0;
        }
      } else {
        skipped++;
      }
    }

    // Commit del batch final
    if (batchCount > 0) {
      await batch.commit();
      console.log(`✅ Procesado batch final de ${batchCount} empresas`);
    }

    console.log('\n📈 Resumen:');
    console.log(`   ✅ Actualizadas: ${updated}`);
    console.log(`   ⏭️  Omitidas: ${skipped}`);
    console.log(`   📊 Total: ${snapshot.size}`);
    console.log('\n✨ Backfill completado exitosamente');

  } catch (error) {
    console.error('❌ Error durante backfill:', error);
    throw error;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  backfillCompanies()
    .then(() => {
      console.log('✅ Script finalizado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error fatal:', error);
      process.exit(1);
    });
}

export { backfillCompanies };


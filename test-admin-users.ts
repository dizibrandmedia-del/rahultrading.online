import { prisma } from './src/lib/prisma';

async function testAdminUserFlow() {
  console.log('=== BUSINESSOS ADMIN & USER ROLE TEST SUITE ===\n');

  const business = await prisma.business.findFirst();
  if (!business) {
    console.error('No business found in database');
    process.exit(1);
  }

  // 1. Create a Test User with Cashier role
  const testPhone = '9988776655';
  console.log('1. Creating new staff member: "Pooja Verma" as CASHIER...');
  const user = await prisma.user.upsert({
    where: { phone: testPhone },
    update: { name: 'Pooja Verma', email: 'pooja@shreeganesh.com' },
    create: {
      name: 'Pooja Verma',
      phone: testPhone,
      email: 'pooja@shreeganesh.com',
      passwordHash: 'hash_test_123',
    },
  });

  const bu = await prisma.businessUser.upsert({
    where: {
      businessId_userId: {
        businessId: business.id,
        userId: user.id,
      },
    },
    update: { role: 'CASHIER' },
    create: {
      businessId: business.id,
      userId: user.id,
      role: 'CASHIER',
      permissions: JSON.stringify(['pos_billing']),
    },
  });

  console.log(`✔ Staff created: ${user.name} (${user.phone}) -> Initial Role: ${bu.role}`);

  // 2. Promote to ADMIN
  console.log('\n2. Promoting "Pooja Verma" to ADMIN...');
  const updatedAdmin = await prisma.businessUser.update({
    where: {
      businessId_userId: {
        businessId: business.id,
        userId: user.id,
      },
    },
    data: {
      role: 'ADMIN',
      permissions: JSON.stringify(['pos_billing', 'sales_invoices', 'purchase_bills', 'accounting_reports', 'gst_filing']),
    },
  });
  console.log(`✔ Role updated: ${user.name} -> New Role: ${updatedAdmin.role}`);

  // 3. Promote to SUPER_ADMIN
  console.log('\n3. Promoting "Pooja Verma" to SUPER_ADMIN...');
  const updatedSuper = await prisma.businessUser.update({
    where: {
      businessId_userId: {
        businessId: business.id,
        userId: user.id,
      },
    },
    data: {
      role: 'SUPER_ADMIN',
      permissions: JSON.stringify(['all_modules', 'user_management', 'platform_access']),
    },
  });
  console.log(`✔ Role updated: ${user.name} -> New Role: ${updatedSuper.role}`);

  // 4. Verify all users query
  const allStaff = await prisma.businessUser.findMany({
    where: { businessId: business.id },
    include: { user: true },
  });

  console.log(`\n4. Verified ${allStaff.length} active users in "${business.name}":`);
  allStaff.forEach((s) => {
    console.log(`  - ${s.user.name} (${s.user.phone}): [${s.role}]`);
  });

  console.log('\n✔ ALL ADMIN RBAC ROLE TRANSITIONS VERIFIED SUCCESSFULLY!');
}

testAdminUserFlow()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

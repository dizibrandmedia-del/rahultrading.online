import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding BusinessOS Indian Enterprise Demo Database...');

  const existingBusiness = await prisma.business.findFirst();
  if (existingBusiness) {
    console.log('Business already exists. Skipping seed.');
    return;
  }

  // 1. Create Demo User
  const user = await prisma.user.upsert({
    where: { phone: '8887754821' },
    update: {},
    create: {
      name: 'Rahul Jee',
      email: 'rahuljee1217@gmail.com',
      phone: '8887754821',
      passwordHash: 'demo_password_hash_2026',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    },
  });

  // 2. Create Demo Business
  const business = await prisma.business.create({
    data: {
      name: 'RAHUL JEE TRADING COMPANY',
      legalName: 'RAHUL JEE TRADING COMPANY',
      type: 'Retail & Wholesale',
      gstin: '09DMCPG4193P1ZG',
      pan: 'DMCPG4193P',
      state: 'Uttar Pradesh',
      stateCode: '09',
      city: 'Yusufpur, Mohammadabad',
      pincode: '233227',
      address: 'Allahabad Bank Road, Yusufpur, Mohammadabad, Dist- Ghazipur (U.P.) - 233227',
      phone: '8887754821',
      email: 'rahuljee1217@gmail.com',
      currency: 'INR',
      fyStart: '2026-04-01',
      isGstRegistered: true,
      gstScheme: 'REGULAR',
      invoicePrefix: 'RT/26-27/',
      invoiceNextNumber: 106,
      purchasePrefix: 'PUR/26-27/',
      purchaseNextNumber: 43,
      thermalWidth: '80mm',
      upiId: '8887754821@upi',
      upiName: 'RAHUL JEE TRADING COMPANY',
      bankName: 'HDFC Bank Ltd',
      bankAccountNo: '50200088991122',
      bankIfsc: 'HDFC0001234',
      bankBranch: 'Mohammadabad, Ghazipur',
      termsAndConditions: '1. Goods once sold will not be taken back without original bill.\n2. Subject to Mohammadabad, Ghazipur Jurisdiction.',
    },
  });

  // Link User to Business
  await prisma.businessUser.create({
    data: {
      businessId: business.id,
      userId: user.id,
      role: 'OWNER',
    },
  });

  // 3. Create Standard Chart of Accounts
  const standardAccounts = [
    { code: '1000', name: 'Cash in Hand', type: 'ASSET', subType: 'CURRENT_ASSET', balance: 45200 },
    { code: '1100', name: 'HDFC Bank Operating Account', type: 'ASSET', subType: 'CURRENT_ASSET', balance: 285400 },
    { code: '1200', name: 'Accounts Receivable (Customers)', type: 'ASSET', subType: 'CURRENT_ASSET', balance: 84600 },
    { code: '1300', name: 'Input GST Credit Pool', type: 'ASSET', subType: 'TAX_CREDIT', balance: 21400 },
    { code: '1400', name: 'Inventory Stock Value', type: 'ASSET', subType: 'CURRENT_ASSET', balance: 340000 },
    { code: '2000', name: 'Accounts Payable (Suppliers)', type: 'LIABILITY', subType: 'CURRENT_LIABILITY', balance: 62000 },
    { code: '2100', name: 'Output GST Tax Payable', type: 'LIABILITY', subType: 'TAX_PAYABLE', balance: 31200 },
    { code: '3000', name: 'Owner Capital Equity', type: 'EQUITY', subType: 'EQUITY', balance: 600000 },
    { code: '4000', name: 'Sales Revenue', type: 'REVENUE', subType: 'OPERATING_REVENUE', balance: 185000 },
    { code: '5000', name: 'Cost of Goods Sold (Purchases)', type: 'EXPENSE', subType: 'COGS', balance: 110000 },
    { code: '5100', name: 'Shop Rent & Utilities', type: 'EXPENSE', subType: 'OPERATING_EXPENSE', balance: 22000 },
  ];

  for (const acc of standardAccounts) {
    await prisma.account.create({
      data: {
        businessId: business.id,
        code: acc.code,
        name: acc.name,
        type: acc.type,
        subType: acc.subType,
        balance: acc.balance,
      },
    });
  }

  // 4. Create Standard Units
  const unitsData = [
    { name: 'Pieces', shortName: 'PCS', precision: 0 },
    { name: 'Boxes', shortName: 'BOX', precision: 0 },
    { name: 'Kilograms', shortName: 'KG', precision: 2 },
    { name: 'Litres', shortName: 'LTR', precision: 2 },
    { name: 'Meters', shortName: 'MTR', precision: 2 },
    { name: 'Packets', shortName: 'PKT', precision: 0 },
  ];

  const createdUnits: Record<string, string> = {};
  for (const u of unitsData) {
    const unit = await prisma.unit.create({
      data: {
        businessId: business.id,
        name: u.name,
        shortName: u.shortName,
        precision: u.precision,
      },
    });
    createdUnits[u.shortName] = unit.id;
  }

  // 5. Create Categories
  const categoriesData = [
    { name: 'Daily Groceries & Grains', description: 'Pulses, Rice, Atta, Sugar, Oil' },
    { name: 'Packaged Foods & Snacks', description: 'Biscuits, Chocolates, Instant Noodles' },
    { name: 'Beverages & Dairy', description: 'Tea, Coffee, Milk, Juices, Cold drinks' },
    { name: 'Electronics & Accessories', description: 'Cables, Chargers, Smart gadgets, Bulbs' },
    { name: 'Personal Care & Hygiene', description: 'Soaps, Shampoos, Detergents' },
  ];

  const createdCategories: Record<string, string> = {};
  for (const cat of categoriesData) {
    const c = await prisma.category.create({
      data: {
        businessId: business.id,
        name: cat.name,
        description: cat.description,
      },
    });
    createdCategories[cat.name] = c.id;
  }

  // 6. Create Demo Products
  const productsData = [
    {
      name: 'Fortune Sunlite Refined Sunflower Oil 1L Pouch',
      sku: 'OIL-FORT-1L',
      barcode: '8906007281012',
      hsnCode: '1512',
      categoryId: createdCategories['Daily Groceries & Grains'],
      unitId: createdUnits['PKT'],
      purchasePrice: 125,
      salePrice: 145,
      mrp: 160,
      wholesalePrice: 138,
      minStock: 20,
      maxStock: 200,
      currentStock: 85,
      stockValue: 85 * 125,
      gstRate: 5,
    },
    {
      name: 'Tata Sampann Premium Unpolished Toor Dal 1kg',
      sku: 'DAL-TATA-1KG',
      barcode: '8901058852301',
      hsnCode: '0713',
      categoryId: createdCategories['Daily Groceries & Grains'],
      unitId: createdUnits['KG'],
      purchasePrice: 155,
      salePrice: 180,
      mrp: 195,
      wholesalePrice: 170,
      minStock: 15,
      maxStock: 150,
      currentStock: 42,
      stockValue: 42 * 155,
      gstRate: 5,
    },
    {
      name: 'Havells 9W LED Cool Day Light Bulb (B22)',
      sku: 'ELEC-HAV-9W',
      barcode: '8901764049811',
      hsnCode: '8539',
      categoryId: createdCategories['Electronics & Accessories'],
      unitId: createdUnits['PCS'],
      purchasePrice: 65,
      salePrice: 99,
      mrp: 120,
      wholesalePrice: 85,
      minStock: 10,
      maxStock: 100,
      currentStock: 64,
      stockValue: 64 * 65,
      gstRate: 18,
    },
    {
      name: 'boAt Type-C Fast Charging Braided Cable 1.5m',
      sku: 'ELEC-BOAT-USBC',
      barcode: '8904330901234',
      hsnCode: '8544',
      categoryId: createdCategories['Electronics & Accessories'],
      unitId: createdUnits['PCS'],
      purchasePrice: 140,
      salePrice: 299,
      mrp: 499,
      wholesalePrice: 220,
      minStock: 8,
      maxStock: 50,
      currentStock: 24,
      stockValue: 24 * 140,
      gstRate: 18,
    },
    {
      name: 'Cadbury Celebrations Premium Gift Box 180g',
      sku: 'CHOC-CAD-180G',
      barcode: '8901233024567',
      hsnCode: '1806',
      categoryId: createdCategories['Packaged Foods & Snacks'],
      unitId: createdUnits['BOX'],
      purchasePrice: 110,
      salePrice: 150,
      mrp: 165,
      wholesalePrice: 135,
      minStock: 12,
      maxStock: 120,
      currentStock: 6, // Low stock alert trigger
      stockValue: 6 * 110,
      gstRate: 18,
    },
    {
      name: 'Taj Mahal Premium Leaf Tea Pouch 500g',
      sku: 'TEA-TAJ-500G',
      barcode: '8901030382910',
      hsnCode: '0902',
      categoryId: createdCategories['Beverages & Dairy'],
      unitId: createdUnits['PKT'],
      purchasePrice: 290,
      salePrice: 345,
      mrp: 375,
      wholesalePrice: 320,
      minStock: 10,
      maxStock: 80,
      currentStock: 35,
      stockValue: 35 * 290,
      gstRate: 5,
    },
  ];

  const createdProducts: any[] = [];
  for (const p of productsData) {
    const prod = await prisma.product.create({
      data: {
        businessId: business.id,
        ...p,
      },
    });
    createdProducts.push(prod);
  }

  // 7. Create Demo Parties (Customers & Suppliers)
  const partiesData = [
    {
      name: 'Sharma General Kirana Mart',
      type: 'CUSTOMER',
      phone: '9811223344',
      email: 'sharmakiranadelhi@gmail.com',
      gstin: '07BBBBB1111B1Z2',
      pan: 'BBBBB1111B',
      state: 'Delhi',
      stateCode: '07',
      city: 'Delhi',
      pincode: '110007',
      address: 'Plot 12, Kamla Nagar Market',
      openingBalance: 15000,
      currentBalance: 32400,
      creditLimit: 100000,
      creditDays: 30,
    },
    {
      name: 'Gupta Electronic Solutions',
      type: 'CUSTOMER',
      phone: '9988776655',
      email: 'guptaelectronics@gmail.com',
      gstin: '06CCCCC2222C1Z8', // Haryana (Inter-state)
      pan: 'CCCCC2222C',
      state: 'Haryana',
      stateCode: '06',
      city: 'Gurugram',
      pincode: '122001',
      address: 'Shop 8, Sector 14 Main Market',
      openingBalance: 0,
      currentBalance: 14850,
      creditLimit: 50000,
      creditDays: 15,
    },
    {
      name: 'Vikram Singh (Cash Walk-in)',
      type: 'CUSTOMER',
      phone: '9711002233',
      state: 'Delhi',
      stateCode: '07',
      city: 'Delhi',
      pincode: '110006',
      openingBalance: 0,
      currentBalance: 0,
      creditLimit: 0,
      creditDays: 0,
    },
    {
      name: 'Hindustan Unilever Wholesale Distributors',
      type: 'SUPPLIER',
      phone: '9822334455',
      email: 'orders.delhi@huldistributors.com',
      gstin: '07DDDDD3333D1Z4',
      pan: 'DDDDD3333D',
      state: 'Delhi',
      stateCode: '07',
      city: 'Delhi',
      pincode: '110020',
      address: 'Okhla Industrial Area Phase 2',
      openingBalance: -40000,
      currentBalance: -52000,
      creditLimit: 500000,
      creditDays: 45,
    },
    {
      name: 'Havells India Regional Depot',
      type: 'SUPPLIER',
      phone: '9899112233',
      email: 'depot.delhi@havells.com',
      gstin: '07EEEEE4444E1Z9',
      pan: 'EEEEE4444E',
      state: 'Delhi',
      stateCode: '07',
      city: 'Delhi',
      pincode: '110028',
      address: 'Naraina Industrial Area Phase 1',
      openingBalance: 0,
      currentBalance: -10000,
      creditLimit: 300000,
      creditDays: 30,
    },
  ];

  const createdParties: any[] = [];
  for (const party of partiesData) {
    const p = await prisma.party.create({
      data: {
        businessId: business.id,
        ...party,
      },
    });
    createdParties.push(p);
  }

  // 8. Create Demo Sales Invoices
  const sale1 = await prisma.sale.create({
    data: {
      businessId: business.id,
      invoiceNumber: 'SGE/26-27/0101',
      invoiceDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      partyId: createdParties[0].id,
      partyName: createdParties[0].name,
      partyGstin: createdParties[0].gstin,
      partyPhone: createdParties[0].phone,
      partyState: 'Delhi',
      isInterState: false,
      subTotal: 15500,
      discountTotal: 500,
      taxableTotal: 15000,
      cgstTotal: 675,
      sgstTotal: 675,
      igstTotal: 0,
      taxTotal: 1350,
      roundOff: 0,
      grandTotal: 16350,
      paidAmount: 10000,
      balanceAmount: 6350,
      paymentStatus: 'PARTIAL',
      paymentMode: 'UPI',
      notes: 'Delivered via Porter. Balance due in 15 days.',
    },
  });

  await prisma.saleItem.createMany({
    data: [
      {
        saleId: sale1.id,
        productId: createdProducts[0].id,
        productName: createdProducts[0].name,
        hsnCode: '1512',
        quantity: 50,
        unit: 'PKT',
        unitPrice: 145,
        discountPercent: 0,
        discountAmount: 0,
        taxableAmount: 7250,
        gstRate: 5,
        cgstRate: 2.5,
        cgstAmount: 181.25,
        sgstRate: 2.5,
        sgstAmount: 181.25,
        igstRate: 0,
        igstAmount: 0,
        totalAmount: 7612.5,
      },
      {
        saleId: sale1.id,
        productId: createdProducts[2].id,
        productName: createdProducts[2].name,
        hsnCode: '8539',
        quantity: 80,
        unit: 'PCS',
        unitPrice: 99,
        discountPercent: 5,
        discountAmount: 396,
        taxableAmount: 7524,
        gstRate: 18,
        cgstRate: 9,
        cgstAmount: 677.16,
        sgstRate: 9,
        sgstAmount: 677.16,
        igstRate: 0,
        igstAmount: 0,
        totalAmount: 8878.32,
      },
    ],
  });

  // Inter-State Sale
  const sale2 = await prisma.sale.create({
    data: {
      businessId: business.id,
      invoiceNumber: 'SGE/26-27/0102',
      invoiceDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      partyId: createdParties[1].id,
      partyName: createdParties[1].name,
      partyGstin: createdParties[1].gstin,
      partyPhone: createdParties[1].phone,
      partyState: 'Haryana',
      isInterState: true,
      subTotal: 12500,
      discountTotal: 0,
      taxableTotal: 12500,
      cgstTotal: 0,
      sgstTotal: 0,
      igstTotal: 2250,
      taxTotal: 2250,
      roundOff: 0,
      grandTotal: 14750,
      paidAmount: 14750,
      balanceAmount: 0,
      paymentStatus: 'PAID',
      paymentMode: 'BANK',
      notes: 'Paid via IMPS transfer.',
    },
  });

  await prisma.saleItem.create({
    data: {
      saleId: sale2.id,
      productId: createdProducts[3].id,
      productName: createdProducts[3].name,
      hsnCode: '8544',
      quantity: 50,
      unit: 'PCS',
      unitPrice: 250,
      discountPercent: 0,
      discountAmount: 0,
      taxableAmount: 12500,
      gstRate: 18,
      cgstRate: 0,
      cgstAmount: 0,
      sgstRate: 0,
      sgstAmount: 0,
      igstRate: 18,
      igstAmount: 2250,
      totalAmount: 14750,
    },
  });

  // 9. Create Expense Categories & Expenses
  const expCat1 = await prisma.expenseCategory.create({
    data: {
      businessId: business.id,
      name: 'Shop Electricity & Maintenance',
      isGstApplicable: false,
      defaultGstRate: 0,
    },
  });

  const expCat2 = await prisma.expenseCategory.create({
    data: {
      businessId: business.id,
      name: 'Logistics & Porter Delivery',
      isGstApplicable: true,
      defaultGstRate: 18,
    },
  });

  await prisma.expense.create({
    data: {
      businessId: business.id,
      categoryId: expCat1.id,
      title: 'BSES Electricity Bill - Commercial Meter',
      amount: 4850,
      taxAmount: 0,
      gstRate: 0,
      paymentMode: 'UPI',
      vendorName: 'BSES Yamuna Power Ltd',
      expenseDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.expense.create({
    data: {
      businessId: business.id,
      categoryId: expCat2.id,
      title: 'Local Dispatch Delivery to Chandni Chowk Mart',
      amount: 1180,
      taxAmount: 180,
      gstRate: 18,
      paymentMode: 'CASH',
      vendorName: 'Porter Express Logistics',
      vendorGstin: '07AAACP9999P1Z1',
      expenseDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
  });

  console.log('Seeding completed successfully! Default business ready: Shree Ganesh Enterprises');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { prisma } from './prisma';

export const STANDARD_ACCOUNTS = [
  { code: '1000', name: 'Cash in Hand', type: 'ASSET', subType: 'CURRENT_ASSET' },
  { code: '1100', name: 'Bank Account', type: 'ASSET', subType: 'CURRENT_ASSET' },
  { code: '1200', name: 'Accounts Receivable (Customers)', type: 'ASSET', subType: 'CURRENT_ASSET' },
  { code: '1300', name: 'Input GST Credit', type: 'ASSET', subType: 'TAX_CREDIT' },
  { code: '1400', name: 'Stock Inventory', type: 'ASSET', subType: 'CURRENT_ASSET' },
  { code: '2000', name: 'Accounts Payable (Suppliers)', type: 'LIABILITY', subType: 'CURRENT_LIABILITY' },
  { code: '2100', name: 'Output GST Payable', type: 'LIABILITY', subType: 'TAX_PAYABLE' },
  { code: '3000', name: 'Owner Capital', type: 'EQUITY', subType: 'EQUITY' },
  { code: '4000', name: 'Sales Revenue', type: 'REVENUE', subType: 'OPERATING_REVENUE' },
  { code: '5000', name: 'Cost of Goods Sold / Purchases', type: 'EXPENSE', subType: 'COGS' },
  { code: '5100', name: 'Operating Expenses', type: 'EXPENSE', subType: 'OPERATING_EXPENSE' },
];

export async function ensureDefaultAccounts(businessId: string) {
  for (const acc of STANDARD_ACCOUNTS) {
    const existing = await prisma.account.findFirst({
      where: { businessId, code: acc.code }
    });
    if (!existing) {
      await prisma.account.create({
        data: {
          businessId,
          code: acc.code,
          name: acc.name,
          type: acc.type,
          subType: acc.subType,
          balance: 0
        }
      });
    }
  }
}

export async function postSaleJournalEntry(saleId: string) {
  const sale = await prisma.sale.findUnique({
    where: { id: saleId },
    include: { business: true, party: true }
  });

  if (!sale) return;

  await ensureDefaultAccounts(sale.businessId);

  const accounts = await prisma.account.findMany({
    where: { businessId: sale.businessId }
  });

  const getAcc = (code: string) => accounts.find(a => a.code === code)?.id;
  const cashAccId = getAcc('1000') || accounts[0]?.id;
  const bankAccId = getAcc('1100') || accounts[0]?.id;
  const arAccId = getAcc('1200') || accounts[0]?.id;
  const salesAccId = getAcc('4000') || accounts[0]?.id;
  const gstPayableAccId = getAcc('2100') || accounts[0]?.id;

  const entryNumber = `JE-SALE-${sale.invoiceNumber}`;
  
  // Create Journal Entry
  const journal = await prisma.journalEntry.create({
    data: {
      businessId: sale.businessId,
      entryNumber,
      entryDate: sale.invoiceDate,
      referenceType: 'SALE',
      referenceId: sale.id,
      narration: `Sales Invoice #${sale.invoiceNumber} to ${sale.partyName}`
    }
  });

  const ledgerPostings: {
    accountId: string;
    debit: number;
    credit: number;
    description: string;
    partyId?: string;
  }[] = [];

  // Debit Paid Amount (Cash/Bank)
  if (sale.paidAmount > 0) {
    const paymentAccId = (sale.paymentMode === 'BANK' || sale.paymentMode === 'UPI' || sale.paymentMode === 'CARD') 
      ? bankAccId 
      : cashAccId;
    
    ledgerPostings.push({
      accountId: paymentAccId,
      debit: sale.paidAmount,
      credit: 0,
      description: `Payment received for Invoice #${sale.invoiceNumber} via ${sale.paymentMode}`
    });
  }

  // Debit Receivable for unpaid balance
  if (sale.balanceAmount > 0) {
    ledgerPostings.push({
      accountId: arAccId,
      debit: sale.balanceAmount,
      credit: 0,
      description: `Accounts Receivable for Invoice #${sale.invoiceNumber}`,
      partyId: sale.partyId || undefined
    });
  }

  // Credit Sales Revenue for Taxable Total
  ledgerPostings.push({
    accountId: salesAccId,
    debit: 0,
    credit: sale.taxableTotal,
    description: `Sales Revenue from Invoice #${sale.invoiceNumber}`
  });

  // Credit Output GST
  if (sale.taxTotal > 0) {
    ledgerPostings.push({
      accountId: gstPayableAccId,
      debit: 0,
      credit: sale.taxTotal,
      description: `Output GST Liability on Invoice #${sale.invoiceNumber}`
    });
  }

  for (const item of ledgerPostings) {
    await prisma.ledgerEntry.create({
      data: {
        journalEntryId: journal.id,
        accountId: item.accountId,
        businessId: sale.businessId,
        partyId: item.partyId || null,
        debit: item.debit,
        credit: item.credit,
        description: item.description
      }
    });

    // Update account balance
    const diff = item.debit - item.credit;
    await prisma.account.update({
      where: { id: item.accountId },
      data: { balance: { increment: diff } }
    });
  }

  // If party exists, update current balance
  if (sale.partyId && sale.balanceAmount > 0) {
    await prisma.party.update({
      where: { id: sale.partyId },
      data: { currentBalance: { increment: sale.balanceAmount } }
    });
  }
}

export async function reverseSaleJournalEntry(saleId: string) {
  const journals = await prisma.journalEntry.findMany({
    where: { referenceId: saleId, referenceType: 'SALE' },
    include: { entries: true },
  });

  for (const j of journals) {
    for (const e of j.entries) {
      const diff = e.debit - e.credit;
      await prisma.account.update({
        where: { id: e.accountId },
        data: { balance: { decrement: diff } },
      });
    }
    await prisma.ledgerEntry.deleteMany({ where: { journalEntryId: j.id } });
    await prisma.journalEntry.delete({ where: { id: j.id } });
  }
}

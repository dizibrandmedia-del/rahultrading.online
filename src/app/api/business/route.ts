import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrCreateDefaultBusiness } from '@/lib/seed-helper';

export async function GET() {
  try {
    const business = await getOrCreateDefaultBusiness();

    return NextResponse.json({ success: true, business });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      id,
      name,
      legalName,
      type,
      gstin,
      pan,
      state,
      stateCode,
      city,
      pincode,
      address,
      phone,
      email,
      upiId,
      upiName,
      bankName,
      bankAccountNo,
      bankIfsc,
      bankBranch,
      termsAndConditions,
      invoicePrefix,
      thermalWidth,
      userName,
    } = body;

    // 1. Locate the existing active business so we never duplicate or replace previous data
    let existingBusiness = id
      ? await prisma.business.findUnique({
          where: { id },
          include: { users: { include: { user: true } } },
        })
      : null;

    if (!existingBusiness) {
      existingBusiness = await prisma.business.findFirst({
        include: { users: { include: { user: true } } },
      });
    }

    let updated;
    if (existingBusiness) {
      updated = await prisma.business.update({
        where: { id: existingBusiness.id },
        data: {
          name: name !== undefined ? name : existingBusiness.name,
          legalName: legalName !== undefined ? legalName : existingBusiness.legalName,
          type: type !== undefined ? type : existingBusiness.type,
          gstin: gstin !== undefined ? gstin : existingBusiness.gstin,
          pan: pan !== undefined ? pan : existingBusiness.pan,
          state: state !== undefined ? state : existingBusiness.state,
          stateCode: stateCode !== undefined ? stateCode : existingBusiness.stateCode,
          city: city !== undefined ? city : existingBusiness.city,
          pincode: pincode !== undefined ? pincode : existingBusiness.pincode,
          address: address !== undefined ? address : existingBusiness.address,
          phone: phone !== undefined ? phone : existingBusiness.phone,
          email: email !== undefined ? email : existingBusiness.email,
          upiId: upiId !== undefined ? upiId : existingBusiness.upiId,
          upiName: upiName !== undefined ? upiName : existingBusiness.upiName,
          bankName: bankName !== undefined ? bankName : existingBusiness.bankName,
          bankAccountNo: bankAccountNo !== undefined ? bankAccountNo : existingBusiness.bankAccountNo,
          bankIfsc: bankIfsc !== undefined ? bankIfsc : existingBusiness.bankIfsc,
          bankBranch: bankBranch !== undefined ? bankBranch : existingBusiness.bankBranch,
          termsAndConditions: termsAndConditions !== undefined ? termsAndConditions : existingBusiness.termsAndConditions,
          invoicePrefix: invoicePrefix !== undefined ? invoicePrefix : existingBusiness.invoicePrefix,
          thermalWidth: thermalWidth !== undefined ? thermalWidth : existingBusiness.thermalWidth,
        },
        include: { users: { include: { user: true } } },
      });

      // Update linked user profile (e.g. name = "Rahul")
      const linkedUser = existingBusiness.users?.[0]?.user;
      if (linkedUser && (userName || phone || email)) {
        await prisma.user.update({
          where: { id: linkedUser.id },
          data: {
            name: userName ? userName.trim() : linkedUser.name,
            phone: phone ? phone.trim() : linkedUser.phone,
            email: email ? email.trim() : linkedUser.email,
          },
        });
      }
    } else {
      // Create new business only if database was completely empty
      updated = await prisma.business.create({
        data: {
          name: name || 'RAHUL JEE TRADING COMPANY',
          legalName: legalName || 'RAHUL JEE TRADING COMPANY',
          type: type || 'Retail',
          gstin: gstin || '09DMCPG4193P1ZG',
          pan: pan || 'DMCPG4193P',
          state: state || 'Uttar Pradesh',
          stateCode: stateCode || '09',
          city: city || 'Yusufpur, Mohammadabad',
          pincode: pincode || '233227',
          address: address || 'Allahabad Bank Road, Yusufpur, Mohammadabad, Dist- Ghazipur (U.P.) - 233227',
          phone: phone || '8887754821',
          email: email || 'rahuljee1217@gmail.com',
          upiId: upiId || '8887754821@upi',
          upiName: upiName || 'RAHUL JEE TRADING COMPANY',
          bankName: bankName || 'HDFC Bank Ltd',
          bankAccountNo: bankAccountNo || '50200088991122',
          bankIfsc: bankIfsc || 'HDFC0001234',
          bankBranch: bankBranch || 'Mohammadabad, Ghazipur',
          termsAndConditions: termsAndConditions || '1. Goods once sold will not be taken back without original bill.\n2. Subject to Mohammadabad, Ghazipur Jurisdiction.',
          invoicePrefix: invoicePrefix || 'RT/26-27/',
          thermalWidth: thermalWidth || '80mm',
        },
        include: { users: { include: { user: true } } },
      });
    }

    return NextResponse.json({ success: true, business: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

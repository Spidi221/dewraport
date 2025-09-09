import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@/lib/db';
import { sendOnboardingEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized - no session' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      companyName,
      legalForm,
      krs,
      ceidg,
      nip,
      regon,
      phone,
      website,
      street,
      houseNumber,
      apartmentNumber,
      postalCode,
      city,
      municipality,
      county,
      voivodeship,
      clientId
    } = body;

    // Validate required fields
    if (!companyName || !nip || !regon || !clientId) {
      return NextResponse.json(
        { error: 'Missing required fields: companyName, nip, regon' },
        { status: 400 }
      );
    }

    // Check if developer profile already exists for this user
    const existingUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { developer: true }
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (existingUser.developer) {
      return NextResponse.json(
        { error: 'Developer profile already exists' },
        { status: 409 }
      );
    }

    // Check if clientId is already taken
    const existingClientId = await prisma.developer.findUnique({
      where: { clientId }
    });

    if (existingClientId) {
      return NextResponse.json(
        { error: 'Client ID already exists - please contact support' },
        { status: 409 }
      );
    }

    // Create developer profile
    const developer = await prisma.developer.create({
      data: {
        companyName,
        legalForm,
        krs: krs || null,
        ceidg: ceidg || null,
        nip,
        regon,
        email: session.user.email,
        phone: phone || null,
        website: website || null,
        
        // Address
        street: street || null,
        houseNumber: houseNumber || null,
        apartmentNumber: apartmentNumber || null,
        postalCode: postalCode || null,
        city: city || null,
        municipality: municipality || null,
        county: county || null,
        voivodeship: voivodeship || null,
        
        status: 'PENDING',
        clientId,
        harvesterConfigured: false
      }
    });

    // Link user to developer
    await prisma.user.update({
      where: { id: existingUser.id },
      data: { developerId: developer.id }
    });

    // Send onboarding email with dane.gov.pl instructions
    const emailSent = await sendOnboardingEmail(developer);
    
    if (!emailSent) {
      console.warn(`Failed to send onboarding email to ${developer.email}`);
    }

    // Log the onboarding event
    console.log('New developer onboarded:', {
      developerId: developer.id,
      clientId,
      companyName,
      email: session.user.email,
      emailSent
    });

    return NextResponse.json({
      success: true,
      developer: {
        id: developer.id,
        clientId: developer.clientId,
        companyName: developer.companyName,
        email: developer.email,
        status: developer.status,
        xmlUrl: `${process.env.BASE_URL || 'https://api.devreporter.pl'}/data/${clientId}/latest.xml`,
        md5Url: `${process.env.BASE_URL || 'https://api.devreporter.pl'}/data/${clientId}/latest.md5`
      },
      message: 'Developer profile created successfully. Check your email for dane.gov.pl registration instructions.',
      emailSent
    });

  } catch (error) {
    console.error('Onboarding error:', error);
    
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { error: 'Developer profile already exists or email is already registered' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error during onboarding' },
      { status: 500 }
    );
  }
}
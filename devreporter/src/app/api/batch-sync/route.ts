import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendSyncNotification } from '@/lib/email';

interface BatchSyncResult {
  clientId: string;
  companyName: string;
  success: boolean;
  recordsCount?: number;
  error?: string;
  xmlUrl?: string;
  md5Url?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Security check - this endpoint should only be called by n8n or cron
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.BATCH_SYNC_TOKEN;
    
    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get all active developers with their latest apartment data
    const developers = await prisma.developer.findMany({
      where: {
        status: 'ACTIVE',
        // Only sync developers that have uploaded data
        apartments: {
          some: {}
        }
      },
      include: {
        apartments: {
          take: 1000, // Limit for safety
          orderBy: { updatedAt: 'desc' }
        }
      }
    });

    console.log(`Starting batch sync for ${developers.length} developers`);

    const results: BatchSyncResult[] = [];
    const batchId = new Date().toISOString();

    // Process each developer
    for (const developer of developers) {
      const clientId = developer.clientId;
      
      try {
        console.log(`Processing developer: ${developer.companyName} (${clientId})`);

        // Convert apartments to CSV-like format for n8n
        const apartmentData = developer.apartments.map(apt => ({
          // Developer info (repeated for each apartment)
          'Nazwa dewelopera': developer.companyName,
          'Forma prawna': developer.legalForm || '',
          'Nr KRS': developer.krs || '',
          'Nr CEiDG': developer.ceidg || '',
          'NIP': developer.nip,
          'REGON': developer.regon,
          'Telefon': developer.phone || '',
          'Email': developer.email,
          'Strona WWW': developer.website || '',
          
          // Developer address
          'Ulica siedziby': developer.street || '',
          'Nr nieruchomości siedziby': developer.houseNumber || '',
          'Nr lokalu siedziby': developer.apartmentNumber || '',
          'Kod pocztowy siedziby': developer.postalCode || '',
          'Miejscowość siedziby': developer.city || '',
          'Gmina siedziby': developer.municipality || '',
          'Powiat siedziby': developer.county || '',
          'Województwo siedziby': developer.voivodeship || '',
          
          // Investment location (using apartment data if available)
          'Ulica inwestycji': '', // TODO: Add investment relation
          'Nr nieruchomości inwestycji': '',
          'Kod pocztowy inwestycji': '',
          'Miejscowość inwestycji': '',
          'Gmina inwestycji': '',
          'Powiat inwestycji': '',
          'Województwo inwestycji': '',
          
          // Apartment data
          'Nr lokalu': apt.apartmentNumber,
          'Rodzaj': apt.propertyType === 'MIESZKANIE' ? 'Lokal mieszkalny' : 'Dom jednorodzinny',
          'Powierzchnia użytkowa': apt.usableArea?.toString() || '',
          'Cena za m²': apt.pricePerM2.toString(),
          'Cena bazowa': apt.basePrice.toString(),
          'Cena finalna': apt.finalPrice.toString(),
          'Data obowiązywania od': apt.priceValidFrom.toISOString().split('T')[0],
          'Data obowiązywania do': apt.priceValidTo?.toISOString().split('T')[0] || '',
          
          // Additional services (stored as JSON)
          'Miejsca postojowe - oznaczenie': apt.parkingSpaces ? JSON.stringify(apt.parkingSpaces) : '',
          'Miejsca postojowe - cena': '',
          'Komórki lokatorskie - oznaczenie': apt.storageRooms ? JSON.stringify(apt.storageRooms) : '',
          'Komórki lokatorskie - cena': '',
          'Inne świadczenia': apt.otherServices ? JSON.stringify(apt.otherServices) : ''
        }));

        if (apartmentData.length === 0) {
          results.push({
            clientId,
            companyName: developer.companyName,
            success: false,
            error: 'No apartment data found'
          });
          continue;
        }

        // Call n8n workflow
        const n8nUrl = process.env.N8N_WEBHOOK_URL || 'http://localhost:5678/webhook';
        const webhookEndpoint = `${n8nUrl}/process-developer-data`;

        const n8nPayload = {
          clientId,
          developerInfo: {
            companyName: developer.companyName,
            nip: developer.nip,
            regon: developer.regon,
            email: developer.email,
            phone: developer.phone,
            // ... other developer fields
          },
          apartmentData,
          timestamp: new Date().toISOString(),
          batchSync: true,
          batchId
        };

        const n8nResponse = await fetch(webhookEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(process.env.N8N_API_KEY && { 
              'Authorization': `Bearer ${process.env.N8N_API_KEY}` 
            })
          },
          body: JSON.stringify(n8nPayload),
          // timeout handled by Vercel (60s max)
        });

        if (!n8nResponse.ok) {
          throw new Error(`n8n failed: ${n8nResponse.status} ${n8nResponse.statusText}`);
        }

        const n8nResult = await n8nResponse.json();

        // Log successful sync
        await prisma.syncLog.create({
          data: {
            developerId: developer.id,
            syncDate: new Date(),
            syncType: 'AUTOMATIC',
            apartmentsCount: apartmentData.length,
            xmlGenerated: true,
            filesUploaded: true,
            xmlUrl: n8nResult.xmlUrl,
            md5Url: n8nResult.md5Url
          }
        });

        results.push({
          clientId,
          companyName: developer.companyName,
          success: true,
          recordsCount: apartmentData.length,
          xmlUrl: n8nResult.xmlUrl,
          md5Url: n8nResult.md5Url
        });

        // Send success notification (optional, can be disabled for batch)
        if (process.env.SEND_BATCH_NOTIFICATIONS === 'true') {
          await sendSyncNotification(developer, 'success', {
            recordsCount: apartmentData.length,
            batchSync: true
          });
        }

      } catch (error) {
        console.error(`Error processing developer ${clientId}:`, error);

        // Log failed sync
        await prisma.syncLog.create({
          data: {
            developerId: developer.id,
            syncDate: new Date(),
            syncType: 'AUTOMATIC',
            apartmentsCount: developer.apartments.length,
            xmlGenerated: false,
            filesUploaded: false,
            errors: JSON.stringify({
              error: error instanceof Error ? error.message : 'Unknown error',
              batchId
            })
          }
        });

        results.push({
          clientId,
          companyName: developer.companyName,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });

        // Send error notification
        if (process.env.SEND_BATCH_NOTIFICATIONS === 'true') {
          await sendSyncNotification(developer, 'error', {
            error: error instanceof Error ? error.message : 'Unknown error',
            batchSync: true
          });
        }
      }

      // Small delay between developers to prevent overload
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Summary statistics
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    const totalRecords = results.reduce((sum, r) => sum + (r.recordsCount || 0), 0);

    console.log(`Batch sync completed: ${successful} successful, ${failed} failed, ${totalRecords} total records`);

    return NextResponse.json({
      success: true,
      batchId,
      summary: {
        totalDevelopers: developers.length,
        successful,
        failed,
        totalRecords
      },
      results: results.map(r => ({
        clientId: r.clientId,
        companyName: r.companyName,
        success: r.success,
        recordsCount: r.recordsCount,
        error: r.error
      }))
    });

  } catch (error) {
    console.error('Batch sync error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check batch sync status
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const days = parseInt(url.searchParams.get('days') || '7');

    // Get recent sync logs summary
    const since = new Date();
    since.setDate(since.getDate() - days);

    const syncLogs = await prisma.syncLog.findMany({
      where: {
        createdAt: { gte: since },
        syncType: 'AUTOMATIC'
      },
      include: {
        developer: {
          select: { companyName: true, clientId: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    const summary = {
      totalSyncs: syncLogs.length,
      successful: syncLogs.filter(log => log.xmlGenerated && log.filesUploaded).length,
      failed: syncLogs.filter(log => !log.xmlGenerated || !log.filesUploaded).length,
      totalRecords: syncLogs.reduce((sum, log) => sum + log.apartmentsCount, 0)
    };

    return NextResponse.json({
      summary,
      recentSyncs: syncLogs.map(log => ({
        date: log.syncDate,
        clientId: log.developer.clientId,
        companyName: log.developer.companyName,
        recordsCount: log.apartmentsCount,
        success: log.xmlGenerated && log.filesUploaded,
        error: log.errors
      }))
    });

  } catch (error) {
    console.error('Get batch sync status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
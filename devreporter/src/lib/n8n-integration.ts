import { ApartmentRow, generateClientId } from './validation';

export interface DeveloperInfo {
  companyName: string;
  legalForm?: string;
  krs?: string;
  ceidg?: string;
  nip: string;
  regon: string;
  email: string;
  phone?: string;
  website?: string;
  
  // Address fields
  street?: string;
  houseNumber?: string;
  apartmentNumber?: string;
  postalCode?: string;
  city?: string;
  municipality?: string;
  county?: string;
  voivodeship?: string;
}

export interface N8nWebhookPayload {
  clientId: string;
  developerInfo: DeveloperInfo;
  apartmentData: ApartmentRow[];
  timestamp: string;
}

export function extractDeveloperInfo(firstRow: ApartmentRow): DeveloperInfo {
  return {
    companyName: firstRow['Nazwa dewelopera'],
    legalForm: firstRow['Forma prawna'],
    krs: firstRow['Nr KRS'],
    ceidg: firstRow['Nr CEiDG'],
    nip: firstRow['NIP'],
    regon: firstRow['REGON'],
    email: firstRow['Email'],
    phone: firstRow['Telefon'],
    website: firstRow['Strona WWW'],
    
    // Address
    street: firstRow['Ulica siedziby'],
    houseNumber: firstRow['Nr nieruchomości siedziby'],
    apartmentNumber: firstRow['Nr lokalu siedziby'],
    postalCode: firstRow['Kod pocztowy siedziby'],
    city: firstRow['Miejscowość siedziby'],
    municipality: firstRow['Gmina siedziby'],
    county: firstRow['Powiat siedziby'],
    voivodeship: firstRow['Województwo siedziby']
  };
}

export async function triggerN8nWorkflow(csvData: ApartmentRow[]): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  try {
    if (!csvData || csvData.length === 0) {
      throw new Error('No data to process');
    }

    const firstRow = csvData[0];
    const clientId = generateClientId(firstRow['Nazwa dewelopera']);
    const developerInfo = extractDeveloperInfo(firstRow);

    const payload: N8nWebhookPayload = {
      clientId,
      developerInfo,
      apartmentData: csvData,
      timestamp: new Date().toISOString()
    };

    console.log('Triggering n8n workflow for client:', clientId);
    console.log('Data summary:', {
      clientId,
      developer: developerInfo.companyName,
      apartmentCount: csvData.length,
      timestamp: payload.timestamp
    });

    // Call n8n webhook endpoint
    const n8nUrl = process.env.N8N_WEBHOOK_URL || 'http://localhost:5678/webhook';
    const webhookEndpoint = `${n8nUrl}/process-developer-data`;

    const response = await fetch(webhookEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.N8N_API_KEY && { 
          'Authorization': `Bearer ${process.env.N8N_API_KEY}` 
        })
      },
      body: JSON.stringify(payload),
      timeout: 30000 // 30 second timeout
    });

    if (!response.ok) {
      throw new Error(`n8n webhook failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('n8n workflow completed:', result);

    return {
      success: true,
      data: {
        clientId,
        xmlUrl: result.xmlUrl || `https://api.devreporter.pl/data/${clientId}/latest.xml`,
        md5Url: result.md5Url || `https://api.devreporter.pl/data/${clientId}/latest.md5`,
        recordsProcessed: result.recordsCount || csvData.length,
        md5Hash: result.md5Hash,
        generatedAt: result.generatedAt
      }
    };

  } catch (error) {
    console.error('n8n workflow error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}
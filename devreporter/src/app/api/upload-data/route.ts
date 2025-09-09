import { NextRequest, NextResponse } from 'next/server';
import { ApartmentRow } from '@/lib/validation';
import { XmlPreviewData } from '@/lib/xml';
import { triggerN8nWorkflow } from '@/lib/n8n-integration';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { csvData, xmlPreview }: { csvData: ApartmentRow[], xmlPreview: XmlPreviewData } = body;

    if (!csvData || csvData.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Brak danych do przetworzenia' },
        { status: 400 }
      );
    }

    console.log('Processing upload:', {
      recordCount: csvData.length,
      developer: csvData[0]['Nazwa dewelopera'],
      xmlSize: xmlPreview.fileSize
    });

    // Trigger n8n workflow with real integration
    const n8nResult = await triggerN8nWorkflow(csvData);

    if (!n8nResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Błąd n8n workflow: ${n8nResult.error}`,
          fallback: {
            recordsProcessed: csvData.length,
            xmlPreview: xmlPreview,
            note: 'Dane nie zostały przesłane do dane.gov.pl z powodu błędu workflow'
          }
        },
        { status: 500 }
      );
    }

    // TODO: Save to database for future reference
    // await saveSyncLog({
    //   clientId: n8nResult.data.clientId,
    //   recordsCount: csvData.length,
    //   status: 'success',
    //   xmlUrl: n8nResult.data.xmlUrl,
    //   md5Url: n8nResult.data.md5Url
    // });

    return NextResponse.json({
      success: true,
      message: 'Dane zostały pomyślnie przesłane do dane.gov.pl via n8n workflow',
      details: {
        clientId: n8nResult.data?.clientId,
        recordsProcessed: n8nResult.data?.recordsProcessed || csvData.length,
        xmlUrl: n8nResult.data?.xmlUrl,
        md5Url: n8nResult.data?.md5Url,
        md5Hash: n8nResult.data?.md5Hash,
        generatedAt: n8nResult.data?.generatedAt,
        workflowStatus: 'completed'
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { success: false, error: 'Błąd serwera podczas przetwarzania danych' },
      { status: 500 }
    );
  }
}
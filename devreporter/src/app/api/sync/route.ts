import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // Mock n8n trigger - replace with real n8n webhook call
    // const n8nResponse = await fetch(process.env.N8N_WEBHOOK_URL + '/sync-developer', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ developerId: 'tambud' })
    // });

    // Mock response for development
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate processing time

    return NextResponse.json({ 
      success: true, 
      message: 'Synchronizacja rozpoczęta pomyślnie' 
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Błąd synchronizacji' },
      { status: 500 }
    );
  }
}
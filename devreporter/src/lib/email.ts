import nodemailer from 'nodemailer';
import { Developer } from '@prisma/client';

const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

export async function sendOnboardingEmail(developer: Developer): Promise<boolean> {
  try {
    const clientId = developer.clientId;
    const xmlUrl = `${process.env.BASE_URL || 'https://api.devreporter.pl'}/data/${clientId}/latest.xml`;
    const md5Url = `${process.env.BASE_URL || 'https://api.devreporter.pl'}/data/${clientId}/latest.md5`;

    // Email template for dane.gov.pl registration
    const daneGovEmailTemplate = `Dzień dobry,

Zwracam się z wnioskiem o założenie profilu dostawcy danych oraz konfigurację harvestera dla automatycznego pobierania danych o cenach mieszkań zgodnie z ustawą z dnia 21 maja 2025 r. o jawności cen.

DANE DEWELOPERA:
- Pełna nazwa dewelopera: ${developer.companyName}
- Forma prawna: ${developer.legalForm || 'N/A'}
- NIP: ${developer.nip}
- REGON: ${developer.regon}
- Adres email: ${developer.email}
- Telefon: ${developer.phone || 'N/A'}

ADRES SIEDZIBY:
${developer.street ? `- Ulica: ${developer.street}` : ''}
${developer.houseNumber ? `- Numer nieruchomości: ${developer.houseNumber}` : ''}
${developer.city ? `- Miejscowość: ${developer.city}` : ''}
${developer.postalCode ? `- Kod pocztowy: ${developer.postalCode}` : ''}
${developer.municipality ? `- Gmina: ${developer.municipality}` : ''}
${developer.county ? `- Powiat: ${developer.county}` : ''}
${developer.voivodeship ? `- Województwo: ${developer.voivodeship}` : ''}

KONFIGURACJA HARVESTERA:
- URL do pliku XML: ${xmlUrl}
- URL do pliku MD5: ${md5Url}
- Częstotliwość aktualizacji: codziennie o 05:00
- Format danych: zgodny ze schematem urn:otwarte-dane:harvester:1.13

DODATKOWE INFORMACJE:
- Dane są automatycznie aktualizowane codziennie o 04:00
- System zapewnia pełną zgodność z wymaganiami ustawy
- Pliki XML i MD5 są dostępne 24/7 pod powyższymi adresami
- W przypadku pytań proszę o kontakt pod adresem email: ${developer.email}

Proszę o potwierdzenie założenia profilu oraz poprawnej konfiguracji harvestera.

Pozdrawiam,
${developer.companyName}

---
Ten email został wygenerowany automatycznie przez system DevReporter.
W przypadku problemów technicznych prosimy o kontakt: support@devreporter.pl`;

    // Instructions email to developer
    const instructionsEmailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>DevReporter - Instrukcje konfiguracji dane.gov.pl</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #2563eb;">Witamy w DevReporter! 🎉</h2>
    
    <p>Dziękujemy za założenie konta. Twój system automatycznego raportowania jest już skonfigurowany.</p>
    
    <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #1f2937;">📋 Twoje dane URL:</h3>
      <p><strong>XML:</strong> <code style="background: #fff; padding: 2px 6px; border-radius: 4px;">${xmlUrl}</code></p>
      <p><strong>MD5:</strong> <code style="background: #fff; padding: 2px 6px; border-radius: 4px;">${md5Url}</code></p>
      <p><strong>Client ID:</strong> <code style="background: #fff; padding: 2px 6px; border-radius: 4px;">${clientId}</code></p>
    </div>
    
    <h3 style="color: #dc2626;">🚨 WAŻNE - Wymagane działanie:</h3>
    <p>Aby ukończyć proces rejestracji, musisz:</p>
    
    <ol>
      <li><strong>Skopiuj poniższy email</strong> i wyślij go na adres: <strong>kontakt@dane.gov.pl</strong></li>
      <li><strong>Poczekaj na potwierdzenie</strong> od Ministerstwa (zwykle 1-3 dni robocze)</li>
      <li><strong>Wgraj swoje dane mieszkań</strong> przez panel DevReporter</li>
    </ol>
    
    <div style="background: #fef3c7; border: 2px solid #f59e0b; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <h4 style="margin-top: 0; color: #92400e;">📧 EMAIL DO SKOPIOWANIA I WYSŁANIA:</h4>
      <div style="background: #fff; padding: 15px; border-radius: 4px; font-family: monospace; font-size: 12px; white-space: pre-line; border: 1px solid #d1d5db;">${daneGovEmailTemplate}</div>
    </div>
    
    <h3 style="color: #059669;">✅ Co dzieje się automatycznie:</h3>
    <ul>
      <li>Codziennie o <strong>04:00</strong> system aktualizuje Twoje pliki XML</li>
      <li>O <strong>05:00</strong> harvester dane.gov.pl pobiera najnowsze dane</li>
      <li>Otrzymujesz powiadomienia o statusie synchronizacji</li>
      <li>Dashboard pokazuje statystyki w czasie rzeczywistym</li>
    </ul>
    
    <div style="background: #dbeafe; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <h4 style="margin-top: 0; color: #1e40af;">🔗 Następne kroki:</h4>
      <p>1. <a href="${process.env.NEXTAUTH_URL}/dashboard" style="color: #2563eb;">Zaloguj się do panelu</a></p>
      <p>2. <a href="${process.env.NEXTAUTH_URL}/upload" style="color: #2563eb;">Wgraj pierwszy plik CSV</a></p>
      <p>3. Sprawdź czy Twoje URL-e zwracają poprawne dane</p>
    </div>
    
    <hr style="margin: 30px 0;">
    
    <p style="font-size: 12px; color: #6b7280;">
      DevReporter - Automatyczne raportowanie cen mieszkań<br>
      W razie pytań: <a href="mailto:support@devreporter.pl">support@devreporter.pl</a>
    </p>
  </div>
</body>
</html>`;

    // Send email to developer
    await transporter.sendMail({
      from: `"DevReporter" <${process.env.SMTP_USER}>`,
      to: developer.email,
      subject: '🏠 DevReporter - Instrukcje konfiguracji dane.gov.pl',
      html: instructionsEmailHtml
    });

    console.log(`Onboarding email sent to ${developer.email} for client ${clientId}`);
    return true;

  } catch (error) {
    console.error('Error sending onboarding email:', error);
    return false;
  }
}

export async function sendSyncNotification(
  developer: Developer, 
  status: 'success' | 'error', 
  details: any
): Promise<boolean> {
  try {
    const subject = status === 'success' 
      ? '✅ DevReporter - Synchronizacja zakończona pomyślnie'
      : '❌ DevReporter - Błąd synchronizacji';

    const html = `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: ${status === 'success' ? '#059669' : '#dc2626'};">${subject}</h2>
    
    <div style="background: ${status === 'success' ? '#d1fae5' : '#fee2e2'}; padding: 15px; border-radius: 8px;">
      <p><strong>Deweloper:</strong> ${developer.companyName}</p>
      <p><strong>Client ID:</strong> ${developer.clientId}</p>
      <p><strong>Data/czas:</strong> ${new Date().toLocaleString('pl-PL')}</p>
      ${details.recordsCount ? `<p><strong>Mieszkania:</strong> ${details.recordsCount}</p>` : ''}
      ${details.error ? `<p><strong>Błąd:</strong> ${details.error}</p>` : ''}
    </div>
    
    <p style="margin-top: 20px;">
      <a href="${process.env.NEXTAUTH_URL}/dashboard" style="background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
        Przejdź do panelu
      </a>
    </p>
  </div>
</body>
</html>`;

    await transporter.sendMail({
      from: `"DevReporter" <${process.env.SMTP_USER}>`,
      to: developer.email,
      subject,
      html
    });

    return true;

  } catch (error) {
    console.error('Error sending sync notification:', error);
    return false;
  }
}
// n8n Code Node - Generowanie XML dla dane.gov.pl (MULTI-TENANT VERSION)
// Otrzymujemy dane z NextJS webhook i tworzymy osobny dataset dla każdej nieruchomości

const inputData = $input.all();

// Funkcja do escape XML
function escapeXml(text) {
  if (typeof text !== 'string') {
    return String(text);
  }
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// MULTI-TENANT: Otrzymujemy dane z NextJS webhook
const webhookData = inputData[0].json;
const clientId = webhookData.clientId || 'default';
const developerInfo = webhookData.developerInfo || {};
const apartmentData = webhookData.apartmentData || [];

// Aktualna data dla ID
const now = new Date();
const currentDate = now.toISOString().split('T')[0]; // Format YYYY-MM-DD
const currentDateTime = now.toISOString(); // Format ISO dla dateTime

// DYNAMIC DEVELOPER DATA (zamiast hardcoded TAMBUD)
const developerName = developerInfo.companyName || "Unknown Developer";
const developerEmail = developerInfo.email || "";
const developerPhone = developerInfo.phone || "";
const developerNip = developerInfo.nip || "";
const developerRegon = developerInfo.regon || "";

// Generowanie XML z osobnym dataset dla każdej nieruchomości
let datasetsXml = '';

apartmentData.forEach((data, index) => {
  // Przygotowanie danych z nowego formatu CSV (zgodnego z NextJS)
  const propertyNumber = escapeXml(data["Nr lokalu"] || "");
  const location = `${data["Miejscowość inwestycji"]}, ${data["Ulica inwestycji"]} ${data["Nr nieruchomości inwestycji"]}`;
  const pricePerM2 = data["Cena za m²"];
  const basePrice = data["Cena bazowa"];
  const finalPrice = data["Cena finalna"];
  const usableArea = data["Powierzchnia użytkowa"];
  const propertyType = escapeXml(data["Rodzaj"] || "");
  const parkingSpot = escapeXml(data["Miejsca postojowe - oznaczenie"] || "");
  const parkingPrice = data["Miejsca postojowe - cena"];
  
  datasetsXml += `
  <dataset status="published">
    <extIdent>${currentDate}-${clientId}-${index + 1}</extIdent>
    <title>
      <polish>Nieruchomość ${propertyNumber} - ${developerName}</polish>
      <english>Property ${propertyNumber} - ${developerName}</english>
    </title>
    <description>
      <polish>${propertyType} nr ${propertyNumber} w lokalizacji ${escapeXml(location)}. Powierzchnia: ${usableArea} m2. Cena za m2: ${pricePerM2} zł, cena bazowa: ${basePrice} zł, cena końcowa: ${finalPrice} zł. ${parkingSpot ? `Miejsce postojowe ${parkingSpot} za ${parkingPrice} zł.` : ''} Deweloper: ${developerName}.</polish>
      <english>${propertyType} no. ${propertyNumber} located at ${escapeXml(location)}. Area: ${usableArea} m2. Price per m2: ${pricePerM2} PLN, base price: ${basePrice} PLN, final price: ${finalPrice} PLN. ${parkingSpot ? `Parking space ${parkingSpot} for ${parkingPrice} PLN.` : ''} Developer: ${developerName}.</english>
    </description>
    <url>https://api.devreporter.pl/data/${clientId}/latest.xml</url>
    <updateFrequency>daily</updateFrequency>
    <categories>
      <category>ECON</category>
    </categories>
    <resources>
      <resource status="published">
        <extIdent>${currentDate}-${clientId}-${index + 1}-resource</extIdent>
        <url>https://api.devreporter.pl/data/${clientId}/latest.xml</url>
        <title>
          <polish>Szczegóły nieruchomości ${propertyNumber}</polish>
          <english>Property ${propertyNumber} details</english>
        </title>
        <description>
          <polish>Kompletne dane dotyczące ${propertyType.toLowerCase()} ${propertyNumber}: lokalizacja ${escapeXml(location)}, powierzchnia ${usableArea} m2, cena ${pricePerM2} zł/m2, cena bazowa ${basePrice} zł, cena końcowa ${finalPrice} zł. Kontakt z deweloperem: ${developerEmail}, tel. ${developerPhone}. ${parkingSpot ? `Dodatkowe miejsce postojowe ${parkingSpot} za ${parkingPrice} zł.` : ''}</polish>
          <english>Complete data for ${propertyType.toLowerCase()} ${propertyNumber}: location ${escapeXml(location)}, area ${usableArea} m2, price ${pricePerM2} PLN/m2, base price ${basePrice} PLN, final price ${finalPrice} PLN. Developer contact: ${developerEmail}, phone ${developerPhone}. ${parkingSpot ? `Additional parking space ${parkingSpot} for ${parkingPrice} PLN.` : ''}</english>
        </description>
        <availability>remote</availability>
        <dataDate>${currentDate}</dataDate>
        <lastUpdateDate>${currentDateTime}</lastUpdateDate>
        <hasDynamicData>true</hasDynamicData>
        <hasHighValueData>false</hasHighValueData>
        <hasHighValueDataFromEuropeanCommissionList>false</hasHighValueDataFromEuropeanCommissionList>
        <hasResearchData>false</hasResearchData>
        <containsProtectedData>false</containsProtectedData>
      </resource>
    </resources>
    <tags>
      <tag lang="pl">nieruchomość</tag>
      <tag lang="pl">${escapeXml(propertyNumber)}</tag>
      <tag lang="pl">${escapeXml(data["Miejscowość inwestycji"] || "").toLowerCase()}</tag>
      <tag lang="pl">${escapeXml(data["Gmina inwestycji"] || "").toLowerCase()}</tag>
      <tag lang="pl">${escapeXml(data["Województwo inwestycji"] || "").toLowerCase()}</tag>
      <tag lang="pl">${Math.round(pricePerM2)}zlm2</tag>
      <tag lang="pl">${clientId}</tag>
      <tag lang="en">property</tag>
      <tag lang="en">${escapeXml(propertyNumber)}</tag>
      <tag lang="en">real-estate</tag>
    </tags>
    <lastUpdateDate>${currentDateTime}</lastUpdateDate>
    <hasDynamicData>true</hasDynamicData>
    <hasHighValueData>false</hasHighValueData>
    <hasHighValueDataFromEuropeanCommissionList>false</hasHighValueDataFromEuropeanCommissionList>
    <hasResearchData>false</hasResearchData>
  </dataset>`;
});

const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<datasets xmlns="urn:otwarte-dane:harvester:1.13">${datasetsXml}
</datasets>`;

// FILE STORAGE: Zapisz pliki na VPS zamiast webhook response
const fs = require('fs').promises;
const crypto = require('crypto');

// Generate proper MD5 hash
const md5Hash = crypto.createHash('md5').update(xmlContent).digest('hex');

// Save files to VPS storage
const storagePath = `/var/www/devreporter/storage/${clientId}/`;

try {
  // Create directory if it doesn't exist
  await fs.mkdir(storagePath, { recursive: true });
  
  // Save XML file
  await fs.writeFile(`${storagePath}latest.xml`, xmlContent, 'utf8');
  
  // Save MD5 file
  await fs.writeFile(`${storagePath}latest.md5`, md5Hash, 'utf8');
  
  console.log(`Files saved successfully for client: ${clientId}`);
  
} catch (error) {
  console.error(`Error saving files for client ${clientId}:`, error);
  throw error;
}

// Zwracamy wynik z informacjami o zapisanych plikach
return [
  {
    json: {
      success: true,
      clientId: clientId,
      xmlUrl: `https://api.devreporter.pl/data/${clientId}/latest.xml`,
      md5Url: `https://api.devreporter.pl/data/${clientId}/latest.md5`,
      recordsCount: apartmentData.length,
      generatedAt: currentDateTime,
      md5Hash: md5Hash,
      developerName: developerName
    }
  }
];
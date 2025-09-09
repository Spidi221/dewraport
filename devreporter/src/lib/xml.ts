import { ApartmentRow } from './validation';

export interface XmlGenerationOptions {
  clientId: string;
  generateMd5?: boolean;
}

export function generateXmlPreview(data: ApartmentRow[], options: XmlGenerationOptions): string {
  if (!data || data.length === 0) {
    throw new Error('Brak danych do generowania XML');
  }

  const firstRow = data[0];
  const currentDate = new Date().toISOString().split('T')[0];
  
  // XML Header
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<dataset xmlns="urn:otwarte-dane:harvester:1.13">
  <header>
    <title>Dane o cenach lokali mieszkalnych - ${firstRow['Nazwa dewelopera']}</title>
    <description>Codzienne raportowanie cen mieszkań zgodnie z ustawą z dnia 21 maja 2025 r. o jawności cen</description>
    <publisher>
      <name>${firstRow['Nazwa dewelopera']}</name>
      <email>${firstRow['Email']}</email>
    </publisher>
    <created>${currentDate}</created>
    <modified>${currentDate}</modified>
    <source>DevReporter - System automatycznego raportowania</source>
  </header>
  <data>`;

  // Generate records for each apartment
  data.forEach((row, index) => {
    xml += `
    <record id="${index + 1}">
      <!-- Dane dewelopera -->
      <developer>
        <name>${escapeXml(row['Nazwa dewelopera'])}</name>
        <legal_form>${escapeXml(row['Forma prawna'] || '')}</legal_form>
        <krs>${escapeXml(row['Nr KRS'] || '')}</krs>
        <ceidg>${escapeXml(row['Nr CEiDG'] || '')}</ceidg>
        <nip>${escapeXml(row['NIP'])}</nip>
        <regon>${escapeXml(row['REGON'])}</regon>
        <phone>${escapeXml(row['Telefon'] || '')}</phone>
        <email>${escapeXml(row['Email'])}</email>
        <website>${escapeXml(row['Strona WWW'] || '')}</website>
        
        <!-- Adres siedziby -->
        <address>
          <street>${escapeXml(row['Ulica siedziby'] || '')}</street>
          <house_number>${escapeXml(row['Nr nieruchomości siedziby'] || '')}</house_number>
          <apartment_number>${escapeXml(row['Nr lokalu siedziby'] || '')}</apartment_number>
          <postal_code>${escapeXml(row['Kod pocztowy siedziby'] || '')}</postal_code>
          <city>${escapeXml(row['Miejscowość siedziby'] || '')}</city>
          <municipality>${escapeXml(row['Gmina siedziby'] || '')}</municipality>
          <county>${escapeXml(row['Powiat siedziby'] || '')}</county>
          <voivodeship>${escapeXml(row['Województwo siedziby'] || '')}</voivodeship>
        </address>
      </developer>
      
      <!-- Lokalizacja inwestycji -->
      <investment_location>
        <street>${escapeXml(row['Ulica inwestycji'] || '')}</street>
        <house_number>${escapeXml(row['Nr nieruchomości inwestycji'] || '')}</house_number>
        <postal_code>${escapeXml(row['Kod pocztowy inwestycji'] || '')}</postal_code>
        <city>${escapeXml(row['Miejscowość inwestycji'] || '')}</city>
        <municipality>${escapeXml(row['Gmina inwestycji'] || '')}</municipality>
        <county>${escapeXml(row['Powiat inwestycji'] || '')}</county>
        <voivodeship>${escapeXml(row['Województwo inwestycji'] || '')}</voivodeship>
      </investment_location>
      
      <!-- Dane mieszkania -->
      <apartment>
        <apartment_number>${escapeXml(row['Nr lokalu'])}</apartment_number>
        <property_type>${escapeXml(row['Rodzaj'])}</property_type>
        <usable_area>${parseFloat(row['Powierzchnia użytkowa']?.replace(',', '.') || '0').toFixed(2)}</usable_area>
        
        <!-- Ceny -->
        <pricing>
          <price_per_m2>${parseFloat(row['Cena za m²']?.replace(',', '.') || '0').toFixed(2)}</price_per_m2>
          <base_price>${parseFloat(row['Cena bazowa']?.replace(',', '.') || '0').toFixed(2)}</base_price>
          <final_price>${parseFloat(row['Cena finalna']?.replace(',', '.') || '0').toFixed(2)}</final_price>
          <valid_from>${formatDateForXml(row['Data obowiązywania od'])}</valid_from>
          <valid_to>${formatDateForXml(row['Data obowiązywania do'])}</valid_to>
        </pricing>
        
        <!-- Dodatki -->
        <additional_services>`;
    
    // Parking spaces
    if (row['Miejsca postojowe - oznaczenie'] || row['Miejsca postojowe - cena']) {
      xml += `
          <parking_spaces>
            <designation>${escapeXml(row['Miejsca postojowe - oznaczenie'] || '')}</designation>
            <price>${parseFloat(row['Miejsca postojowe - cena']?.replace(',', '.') || '0').toFixed(2)}</price>
          </parking_spaces>`;
    }
    
    // Storage rooms
    if (row['Komórki lokatorskie - oznaczenie'] || row['Komórki lokatorskie - cena']) {
      xml += `
          <storage_rooms>
            <designation>${escapeXml(row['Komórki lokatorskie - oznaczenie'] || '')}</designation>
            <price>${parseFloat(row['Komórki lokatorskie - cena']?.replace(',', '.') || '0').toFixed(2)}</price>
          </storage_rooms>`;
    }
    
    // Other services
    if (row['Inne świadczenia']) {
      xml += `
          <other_services>${escapeXml(row['Inne świadczenia'])}</other_services>`;
    }
    
    xml += `
        </additional_services>
      </apartment>
    </record>`;
  });

  xml += `
  </data>
</dataset>`;

  return xml;
}

export function generateMd5Hash(xmlContent: string): string {
  // Simple MD5-like hash for development - replace with proper crypto.md5 in production
  let hash = 0;
  if (xmlContent.length === 0) return hash.toString();
  
  for (let i = 0; i < xmlContent.length; i++) {
    const char = xmlContent.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  return Math.abs(hash).toString(16).toLowerCase().padStart(32, '0');
}

function escapeXml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatDateForXml(dateStr: string): string {
  if (!dateStr) return '';
  
  try {
    const date = new Date(dateStr);
    return date.toISOString().split('T')[0]; // YYYY-MM-DD format
  } catch (error) {
    return '';
  }
}

export interface XmlPreviewData {
  xml: string;
  md5: string;
  recordCount: number;
  fileSize: string;
}

export function createXmlPreview(data: ApartmentRow[], clientId: string): XmlPreviewData {
  const xml = generateXmlPreview(data, { clientId });
  const md5 = generateMd5Hash(xml);
  const fileSize = new Blob([xml]).size;
  
  return {
    xml,
    md5,
    recordCount: data.length,
    fileSize: formatFileSize(fileSize)
  };
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
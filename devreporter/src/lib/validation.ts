// CSV validation functions based on CLAUDE.md specification

export interface ApartmentRow {
  [key: string]: string | undefined;
  // Dane dewelopera
  'Nazwa dewelopera': string;
  'Forma prawna': string;
  'Nr KRS': string;
  'Nr CEiDG': string;
  'NIP': string;
  'REGON': string;
  'Telefon': string;
  'Email': string;
  'Strona WWW': string;
  
  // Adres siedziby dewelopera
  'Ulica siedziby': string;
  'Nr nieruchomości siedziby': string;
  'Nr lokalu siedziby': string;
  'Kod pocztowy siedziby': string;
  'Miejscowość siedziby': string;
  'Gmina siedziby': string;
  'Powiat siedziby': string;
  'Województwo siedziby': string;
  
  // Lokalizacja inwestycji
  'Ulica inwestycji': string;
  'Nr nieruchomości inwestycji': string;
  'Kod pocztowy inwestycji': string;
  'Miejscowość inwestycji': string;
  'Gmina inwestycji': string;
  'Powiat inwestycji': string;
  'Województwo inwestycji': string;
  
  // Dane mieszkania
  'Nr lokalu': string;
  'Rodzaj': string; // 'Lokal mieszkalny' | 'Dom jednorodzinny'
  'Powierzchnia użytkowa': string;
  'Cena za m²': string;
  'Cena bazowa': string;
  'Cena finalna': string;
  'Data obowiązywania od': string;
  'Data obowiązywania do': string;
  
  // Dodatki
  'Miejsca postojowe - oznaczenie': string;
  'Miejsca postojowe - cena': string;
  'Komórki lokatorskie - oznaczenie': string;
  'Komórki lokatorskie - cena': string;
  'Inne świadczenia': string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  processedData: ApartmentRow[];
}

const REQUIRED_FIELDS = [
  'Nazwa dewelopera',
  'NIP',
  'REGON',
  'Email',
  'Nr lokalu',
  'Rodzaj',
  'Powierzchnia użytkowa',
  'Cena za m²',
  'Cena bazowa',
  'Cena finalna',
  'Data obowiązywania od'
];

const PROPERTY_TYPES = ['Lokal mieszkalny', 'Dom jednorodzinny'];

export function validateCsvData(data: any[]): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const processedData: ApartmentRow[] = [];

  if (!data || data.length === 0) {
    errors.push('Plik CSV jest pusty');
    return { isValid: false, errors, warnings, processedData };
  }

  // Check required columns
  const firstRow = data[0];
  const missingColumns = REQUIRED_FIELDS.filter(field => !(field in firstRow));
  if (missingColumns.length > 0) {
    errors.push(`Brakujące kolumny: ${missingColumns.join(', ')}`);
  }

  data.forEach((row, index) => {
    const rowNumber = index + 1;
    const rowErrors: string[] = [];

    // Validate required fields
    REQUIRED_FIELDS.forEach(field => {
      if (!row[field] || row[field].trim() === '') {
        rowErrors.push(`Wiersz ${rowNumber}: Brak wartości w polu "${field}"`);
      }
    });

    // Validate property type
    if (row['Rodzaj'] && !PROPERTY_TYPES.includes(row['Rodzaj'])) {
      rowErrors.push(`Wiersz ${rowNumber}: Nieprawidłowy rodzaj "${row['Rodzaj']}". Dozwolone: ${PROPERTY_TYPES.join(', ')}`);
    }

    // Validate numeric fields
    const numericFields = ['Powierzchnia użytkowa', 'Cena za m²', 'Cena bazowa', 'Cena finalna'];
    numericFields.forEach(field => {
      const value = row[field];
      if (value && isNaN(parseFloat(value.replace(',', '.')))) {
        rowErrors.push(`Wiersz ${rowNumber}: "${field}" musi być liczbą`);
      }
    });

    // Validate dates
    const dateFields = ['Data obowiązywania od', 'Data obowiązywania do'];
    dateFields.forEach(field => {
      const value = row[field];
      if (value && isNaN(Date.parse(value))) {
        rowErrors.push(`Wiersz ${rowNumber}: "${field}" ma nieprawidłowy format daty`);
      }
    });

    // Validate email format
    if (row['Email']) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(row['Email'])) {
        rowErrors.push(`Wiersz ${rowNumber}: Nieprawidłowy format email`);
      }
    }

    // Validate NIP format (10 digits)
    if (row['NIP']) {
      const nipRegex = /^\d{10}$/;
      const nip = row['NIP'].replace(/[-\s]/g, '');
      if (!nipRegex.test(nip)) {
        rowErrors.push(`Wiersz ${rowNumber}: NIP musi mieć 10 cyfr`);
      }
    }

    // Validate REGON format (9 or 14 digits)
    if (row['REGON']) {
      const regonRegex = /^\d{9}$|^\d{14}$/;
      const regon = row['REGON'].replace(/[-\s]/g, '');
      if (!regonRegex.test(regon)) {
        rowErrors.push(`Wiersz ${rowNumber}: REGON musi mieć 9 lub 14 cyfr`);
      }
    }

    // Check price logic
    const pricePerM2 = parseFloat(row['Cena za m²']?.replace(',', '.') || '0');
    const usableArea = parseFloat(row['Powierzchnia użytkowa']?.replace(',', '.') || '0');
    const basePrice = parseFloat(row['Cena bazowa']?.replace(',', '.') || '0');
    
    if (pricePerM2 > 0 && usableArea > 0) {
      const expectedBasePrice = pricePerM2 * usableArea;
      const priceDifference = Math.abs(basePrice - expectedBasePrice);
      
      if (priceDifference > expectedBasePrice * 0.01) { // 1% tolerance
        warnings.push(`Wiersz ${rowNumber}: Cena bazowa (${basePrice}) nie jest iloczynem ceny za m² × powierzchnię (${expectedBasePrice.toFixed(2)})`);
      }
    }

    errors.push(...rowErrors);
    
    // Only add valid rows to processed data
    if (rowErrors.length === 0) {
      processedData.push(row as ApartmentRow);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    processedData
  };
}

export function generateClientId(companyName: string): string {
  return companyName
    .toLowerCase()
    .replace(/sp\.?\s*z\s*o\.?o\.?/gi, '') // Remove "Sp. z o.o."
    .replace(/s\.?a\.?/gi, '') // Remove "S.A."
    .replace(/[^\w\s]/g, '') // Remove special characters
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with dashes
    .substring(0, 20); // Limit length
}
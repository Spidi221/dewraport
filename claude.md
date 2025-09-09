# DevReporter - Aplikacja SaaS Automatyzacji Raportowania Cen Mieszkań

## 📋 Executive Summary

**DevReporter** to aplikacja SaaS automatyzująca obowiązkowe codzienne raportowanie cen mieszkań przez deweloperów do portalu dane.gov.pl zgodnie z ustawą z dnia 21 maja 2025 r. o jawności cen. 

**Problem**: Od 11 lipca 2025 roku deweloperzy muszą codziennie raportować wszystkie ceny mieszkań do dane.gov.pl, niezależnie od tego czy ceny się zmieniły. Ręczne raportowanie to duże ryzyko błędów i kary UOKiK.

**Rozwiązanie**: Pełna automatyzacja - deweloper raz konfiguruje, system działa bez jego udziału.

## 🎯 Model Biznesowy

- **Target Market**: ~2000 aktywnych deweloperów w Polsce
- **Pricing**: 149-299 zł/miesiąc za dewelopera
- **Revenue Potential**: 149 zł × 1000 klientów = 149,000 zł MRR
- **Przewaga konkurencyjna**: Pierwszy kompletny system na rynku z działającą technologią

## 🏗️ Obecny Stan Technologii

### ✅ Co już mamy (workflow n8n):
- **Google Sheets Integration**: Pobieranie danych mieszkań z arkuszy
- **XML Generator**: Generuje pliki zgodne ze schematem `urn:otwarte-dane:harvester:1.13`
- **CSV Export**: Format dla użytkowników
- **MD5 Hashe**: Wymagane przez harvester dane.gov.pl
- **Email Automation**: Powiadomienia i załączniki
- **Scheduling**: Codziennie o 8:00 + manual trigger
- **Data Validation**: Filtrowanie pustych rekordów

### 🔄 Co należy zmodyfikować:
1. **Hosting plików**: Zmienić z webhook-ów na stałe URL-e
2. **Multi-tenant**: Obsługa wielu deweloperów
3. **Frontend**: Interface dla konfiguracji i monitoringu

## 📊 Format Danych (58 pól)

Aplikacja obsługuje pełny zakres danych wymaganych przez Ministerstwo:

### Dane dewelopera:
- Nazwa dewelopera, forma prawna
- Nr KRS, CEiDG, NIP, REGON
- Kontakt: telefon, email, strona www
- Adres siedziby (pełny)

### Lokalizacja inwestycji:
- Województwo, powiat, gmina, miejscowość
- Ulica, numer nieruchomości, kod pocztowy

### Dane mieszkania:
- **Nr lokalu**: Identyfikator nadany przez dewelopera
- **Rodzaj**: Lokal mieszkalny / Dom jednorodzinny
- **Cena za m²**: [zł]
- **Cena bazowa**: Iloczyn ceny m² × powierzchnia [zł]
- **Cena finalna**: Z dodatkowymi składnikami [zł]
- **Daty obowiązywania**: Dla każdej ceny

### Elementy dodatkowe:
- **Miejsca postojowe**: Oznaczenie + cena
- **Komórki lokatorskie**: Oznaczenie + cena
- **Pomieszczenia przynależne**: Zgodnie z art. 2 ust. 4
- **Inne świadczenia**: Wymagane ustawą

## 🏛️ Architektura Systemowa

### Stack Technologiczny:
```
Frontend:     Claude Code (React/Next.js)
Backend:      Claude Code (Node.js/Express)  
Workflow:     n8n (self-hosted na VPS)
Database:     PostgreSQL
File Storage: VPS (nginx static files)
Monitoring:   Custom dashboard
```

### Przepływ danych:
```
Google Sheets → n8n → VPS Storage → dane.gov.pl harvester
                ↓
            DevReporter Dashboard (monitoring)
```

### URL Structure:
```
https://api.devreporter.pl/data/{clientId}/latest.xml
https://api.devreporter.pl/data/{clientId}/latest.md5
```

## 🔧 Funkcjonalności MVP

### 1. Onboarding Wizard (5 minut setup)
- **Krok 1**: Rejestracja firmy deweloperskiej
- **Krok 2**: Upload pliku CSV z mieszkaniami
- **Krok 3**: Weryfikacja danych i mapping
- **Krok 4**: Generowanie XML preview
- **Krok 5**: Automatyczne tworzenie profilu dostawcy dla dane.gov.pl

### 2. Dashboard Główny
```typescript
interface Dashboard {
  lastSync: Date;           // Ostatnia synchronizacja
  status: 'OK' | 'ERROR';   // Status systemu
  apartmentsCount: number;  // Liczba mieszkań
  errorsCount: number;      // Błędy walidacji  
  nextSync: Date;           // Kolejna aktualizacja
}
```

### 3. Zarządzanie Danymi
- **CSV Upload**: Drag & drop interface
- **Live Preview**: Podgląd generowanego XML
- **Validation Engine**: Sprawdzanie poprawności
- **History Log**: Historia wszystkich zmian cen

### 4. Integracja dane.gov.pl
- **Profil Generator**: Automatyczne tworzenie maila rejestracyjnego
- **Harvester Setup**: Konfiguracja URL-i do plików
- **Status Monitor**: Sprawdzanie czy harvester pobiera dane

### 5. System Powiadomień
- **Email Alerts**: Błędy, potwierdzenia synchronizacji
- **Slack Integration**: Dla większych deweloperów
- **SMS Alerts**: Krytyczne błędy systemowe

## 🔐 Proces Integracji z dane.gov.pl

### Automatyzacja rejestracji:
```javascript
// Generator maila do kontakt@dane.gov.pl
const registrationEmail = {
  to: 'kontakt@dane.gov.pl',
  subject: `Założenie profilu dla dewelopera - ${companyName}`,
  body: `
    Dzień dobry,

    Zwracam się z wnioskiem o założenie profilu dostawcy dla:
    - Pełna nazwa dewelopera: ${companyName}
    - Dane adresowe: ${address}
    - REGON: ${regon}
    - Email: ${email}
    - Telefon: ${phone}

    Proszę o skonfigurowanie harvestera dla automatycznego pobierania danych:
    - URL do pliku XML: https://api.devreporter.pl/data/${clientId}/latest.xml
    - URL do pliku MD5: https://api.devreporter.pl/data/${clientId}/latest.md5
    - Częstotliwość aktualizacji: codziennie

    Pozdrawiam,
    ${contactPerson}
    ${companyName}
  `
};
```

## 💾 Struktura Bazy Danych

```sql
-- Tabela deweloperów
CREATE TABLE developers (
    id UUID PRIMARY KEY,
    company_name VARCHAR(255),
    regon VARCHAR(20),
    nip VARCHAR(15),
    email VARCHAR(255),
    phone VARCHAR(20),
    status ENUM('active', 'pending', 'suspended'),
    created_at TIMESTAMP,
    harvester_configured BOOLEAN DEFAULT FALSE
);

-- Tabela mieszkań
CREATE TABLE apartments (
    id UUID PRIMARY KEY,
    developer_id UUID REFERENCES developers(id),
    apartment_number VARCHAR(50),
    property_type ENUM('mieszkanie', 'dom'),
    price_per_m2 DECIMAL(10,2),
    base_price DECIMAL(12,2),
    final_price DECIMAL(12,2),
    valid_from DATE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Historia cen
CREATE TABLE price_history (
    id UUID PRIMARY KEY,
    apartment_id UUID REFERENCES apartments(id),
    old_price DECIMAL(12,2),
    new_price DECIMAL(12,2),
    changed_at TIMESTAMP,
    reason VARCHAR(255)
);

-- Logi synchronizacji
CREATE TABLE sync_logs (
    id UUID PRIMARY KEY,
    developer_id UUID REFERENCES developers(id),
    sync_date DATE,
    apartments_count INTEGER,
    xml_generated BOOLEAN,
    harvester_success BOOLEAN,
    errors TEXT,
    created_at TIMESTAMP
);
```

## 🔄 Modyfikacje n8n Workflow

### Obecny workflow:
```javascript
// Zmiany w Code Node - zamiana webhook na file storage
const fs = require('fs').promises;

// Zamiast webhook response:
return { 
  json: { 
    message: "XML sent via webhook" 
  }
};

// Nowe: Zapis na VPS
const clientId = 'tambud'; // dynamically from input
const basePath = `/var/www/devreporter/storage/${clientId}/`;

// Ensure directory exists
await fs.mkdir(basePath, { recursive: true });

// Write files
await fs.writeFile(`${basePath}latest.xml`, xmlContent);
await fs.writeFile(`${basePath}latest.md5`, md5Hash.toLowerCase());

return {
  json: {
    message: "Files saved successfully",
    xmlUrl: `https://api.devreporter.pl/data/${clientId}/latest.xml`,
    md5Url: `https://api.devreporter.pl/data/${clientId}/latest.md5`
  }
};
```

### Multi-tenant setup:
```javascript
// Dynamic client handling
const inputData = $input.all();
const clientData = inputData.map(item => ({
  ...item.json,
  clientId: item.json['Nazwa dewelopera']
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}));

// Separate XML generation for each client
clientData.forEach(async (client) => {
  const xmlContent = generateClientXML(client);
  const md5Hash = calculateMD5(xmlContent);
  await saveClientFiles(client.clientId, xmlContent, md5Hash);
});
```

## 🎨 Frontend Components (Claude Code)

### 1. Layout główny:
```typescript
// src/components/Layout.tsx
export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold">DevReporter</h1>
            </div>
            <div className="flex items-center space-x-4">
              <StatusIndicator />
              <UserMenu />
            </div>
          </div>
        </div>
      </nav>
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
```

### 2. Dashboard:
```typescript
// src/pages/Dashboard.tsx
import { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Upload, Calendar } from 'lucide-react';

export default function Dashboard() {
  const [status, setStatus] = useState(null);
  
  useEffect(() => {
    fetchSyncStatus();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Panel Główny</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          Synchronizuj Teraz
        </button>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatusCard 
          title="Status Systemu" 
          value={status?.isOnline ? "Online" : "Offline"}
          icon={status?.isOnline ? CheckCircle : AlertCircle}
          color={status?.isOnline ? "green" : "red"}
        />
        <StatusCard 
          title="Mieszkania" 
          value={status?.apartmentsCount}
          icon={Upload}
          color="blue"
        />
        <StatusCard 
          title="Ostatnia Sync" 
          value={status?.lastSync}
          icon={Calendar}
          color="purple"
        />
        <StatusCard 
          title="Błędy" 
          value={status?.errorsCount}
          icon={AlertCircle}
          color={status?.errorsCount > 0 ? "red" : "green"}
        />
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Ostatnia Aktywność</h3>
        <ActivityLog />
      </div>
    </div>
  );
}
```

### 3. CSV Upload Component:
```typescript
// src/components/CsvUpload.tsx
import { useState, useCallback } from 'react';
import { Upload, FileText, CheckCircle } from 'lucide-react';

export default function CsvUpload({ onUpload }: { onUpload: (data: any) => void }) {
  const [dragActive, setDragActive] = useState(false);
  const [processing, setProcessing] = useState(false);

  const handleFile = useCallback(async (file: File) => {
    setProcessing(true);
    
    try {
      const text = await file.text();
      const parsed = Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        delimiter: ';'
      });
      
      // Validate required fields
      const validation = validateCsvData(parsed.data);
      
      if (validation.isValid) {
        onUpload({
          data: parsed.data,
          meta: parsed.meta,
          preview: generateXmlPreview(parsed.data)
        });
      } else {
        throw new Error(`Błędy walidacji: ${validation.errors.join(', ')}`);
      }
    } catch (error) {
      alert(`Błąd przetwarzania pliku: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  }, [onUpload]);

  return (
    <div 
      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
        dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
      }`}
      onDragEnter={() => setDragActive(true)}
      onDragLeave={() => setDragActive(false)}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        setDragActive(false);
        const file = e.dataTransfer.files[0];
        if (file?.type === 'text/csv') handleFile(file);
      }}
    >
      {processing ? (
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Przetwarzanie pliku...</p>
        </div>
      ) : (
        <div>
          <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-lg mb-2">Przeciągnij plik CSV lub kliknij aby wybrać</p>
          <p className="text-sm text-gray-500">Obsługujemy format zgodny z wymaganiami Ministerstwa</p>
          <input 
            type="file" 
            accept=".csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
        </div>
      )}
    </div>
  );
}
```

## ⚙️ Backend API Endpoints

```typescript
// src/api/sync.ts
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { developerId } = req.body;
    
    try {
      // Trigger n8n workflow
      const n8nResponse = await fetch('http://localhost:5678/webhook/sync-developer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ developerId })
      });
      
      if (!n8nResponse.ok) {
        throw new Error('n8n workflow failed');
      }
      
      // Log sync attempt
      await logSync(developerId, 'manual', true);
      
      res.status(200).json({ 
        success: true, 
        message: 'Synchronizacja rozpoczęta' 
      });
    } catch (error) {
      await logSync(developerId, 'manual', false, error.message);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }
}

// src/api/developers.ts - CRUD operations
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  switch (req.method) {
    case 'GET':
      const developers = await db.developers.findMany();
      res.json(developers);
      break;
      
    case 'POST':
      const newDeveloper = await db.developers.create({
        data: req.body
      });
      res.json(newDeveloper);
      break;
      
    case 'PUT':
      const updatedDeveloper = await db.developers.update({
        where: { id: req.body.id },
        data: req.body
      });
      res.json(updatedDeveloper);
      break;
      
    case 'DELETE':
      await db.developers.delete({
        where: { id: req.body.id }
      });
      res.json({ success: true });
      break;
  }
}
```

## 🚀 Deployment & Infrastructure

### VPS Setup (Hetzner CPX21 - €5.90/mies):
```bash
# Initial server setup
apt update && apt upgrade -y
apt install -y nodejs npm nginx postgresql certbot python3-certbot-nginx

# Create app directory
mkdir -p /var/www/devreporter/{app,storage,logs}
chown -R www-data:www-data /var/www/devreporter

# Setup nginx
cat > /etc/nginx/sites-available/devreporter << 'EOF'
server {
    listen 80;
    server_name api.devreporter.pl;
    
    # Static files (XML/MD5)
    location /data/ {
        alias /var/www/devreporter/storage/;
        add_header Access-Control-Allow-Origin *;
        add_header Cache-Control "no-cache";
        expires -1;
    }
    
    # App API
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

ln -s /etc/nginx/sites-available/devreporter /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

### SSL Certificate:
```bash
certbot --nginx -d api.devreporter.pl
```

### Process Management:
```bash
# PM2 for production
npm install -g pm2

# Start app
cd /var/www/devreporter/app
pm2 start npm --name "devreporter" -- start
pm2 startup
pm2 save
```

## 📈 Roadmap & Skalowanie

### Faza 1: MVP (2 miesiące)
- [x] **n8n workflow** - GOTOWE
- [ ] **Frontend Dashboard** - 3 tygodnie
- [ ] **VPS hosting** - 1 tydzień  
- [ ] **Beta test z TAMBUD** - 1 tydzień

### Faza 2: Komercjalizacja (3 miesiące)
- [ ] **Multi-tenant architecture**
- [ ] **Payment system** (Stripe)
- [ ] **Email marketing** (ConvertKit)
- [ ] **First 10 paying customers**

### Faza 3: Expansion (6 miesięcy)
- [ ] **Advanced analytics**
- [ ] **API dla integratorów**
- [ ] **White-label rozwiązania**
- [ ] **Eksport na inne rynki UE**

## 💰 Business Metrics

### KPIs do trackowania:
```typescript
interface BusinessMetrics {
  // Revenue
  monthlyRecurringRevenue: number;
  averageRevenuePerUser: number;
  churnRate: number;
  
  // Product
  dailyActiveUsers: number;
  successfulSyncs: number;
  errorRate: number;
  
  // Growth
  signupRate: number;
  conversionRate: number;
  customerLifetimeValue: number;
}
```

### Pricing Strategy:
```
Starter: 149 zł/mies
- 1 inwestycja
- Podstawowy support
- Dashboard

Professional: 249 zł/mies  
- 5 inwestycji
- Priority support
- Analytics
- API access

Enterprise: 399 zł/mies
- Unlimited inwestycje
- Dedicated support
- White-label
- Custom integrations
```

## 🔧 Instrukcje dla Claude Code

### Setup Projektu:
```bash
# Stworzenie projektu
claude create devreporter-saas --template nextjs
cd devreporter-saas

# Dependencies
npm install papaparse lucide-react @headlessui/react
npm install -D tailwindcss @types/papaparse

# Database
npm install prisma @prisma/client
npx prisma init
```

### Struktura folderów:
```
src/
├── components/
│   ├── Layout.tsx
│   ├── Dashboard/
│   ├── Upload/
│   └── Monitoring/
├── pages/
│   ├── api/
│   ├── dashboard.tsx
│   ├── onboarding.tsx
│   └── settings.tsx
├── lib/
│   ├── db.ts
│   ├── xml.ts
│   └── validation.ts
└── styles/
```

### Key Tasks dla Claude Code:

1. **Dashboard Implementation**
   - Real-time status monitoring
   - Charts dla sync history
   - Error alerting system

2. **CSV Upload & Validation**
   - Drag & drop interface
   - Real-time field mapping
   - XML preview generation

3. **Integration Layer**
   - n8n webhook triggers
   - File storage management
   - dane.gov.pl status checking

4. **Multi-tenant Setup**
   - User authentication
   - Data isolation
   - Billing integration

## 🎯 Success Metrics

**MVP Success (3 miesiące):**
- 5 paying customers
- 95% uptime
- 0 critical bugs
- <24h response time

**Scale Success (12 miesięcy):**
- 100+ paying customers  
- 15,000 zł MRR
- Market leader position
- Expansion ready

---

**Ten dokument zawiera kompletną specyfikację aplikacji DevReporter gotową do implementacji w Claude Code. System wykorzystuje istniejącą technologię n8n i rozbudowuje ją o frontend oraz multi-tenant architecture, tworząc kompletne rozwiązanie SaaS dla rynku deweloperskiego.**
# DevReporter - Plan Działania

## 🎯 Cel: MVP w 8 tygodni

**Status**: ✅ n8n workflow GOTOWY → 🔨 Frontend + Multi-tenant → 🚀 Production

---

## 📋 FAZA 1: Setup Projektu (Tydzień 1)

### 1.1 Inicjalizacja Next.js App
- [ ] Stworzenie projektu Next.js z TypeScript
- [ ] Konfiguracja Tailwind CSS
- [ ] Setup ESLint + Prettier
- [ ] Struktura folderów zgodna ze specyfikacją

### 1.2 Database Setup
- [ ] Instalacja Prisma ORM
- [ ] Utworzenie schema.prisma (tabele: developers, apartments, price_history, sync_logs)
- [ ] Setup PostgreSQL lokalnie
- [ ] Pierwsze migracje

### 1.3 Core Dependencies
```bash
npm install:
- papaparse @types/papaparse  # CSV parsing
- lucide-react                # Icons
- @headlessui/react          # UI components  
- prisma @prisma/client      # Database ORM
- bcryptjs jsonwebtoken      # Auth
- axios                      # HTTP client
```

---

## 📋 FAZA 2: Core Components (Tydzień 2-3)

### 2.1 Layout & Navigation
- [ ] `src/components/Layout.tsx` - główny layout
- [ ] `src/components/StatusIndicator.tsx` - status systemu
- [ ] `src/components/UserMenu.tsx` - menu użytkownika
- [ ] Responsive design (mobile-first)

### 2.2 Dashboard Główny
- [ ] `src/pages/dashboard.tsx` - główny widok
- [ ] `src/components/Dashboard/StatusCard.tsx` - karty statusu
- [ ] `src/components/Dashboard/ActivityLog.tsx` - log aktywności
- [ ] Real-time status checking

### 2.3 CSV Upload System
- [ ] `src/components/CsvUpload.tsx` - drag & drop interface
- [ ] `src/lib/validation.ts` - walidacja 58 pól
- [ ] `src/lib/xml.ts` - generator XML preview
- [ ] Error handling i user feedback

---

## 📋 FAZA 3: Backend API (Tydzień 3-4)

### 3.1 Database Layer
- [ ] `src/lib/db.ts` - Prisma client setup
- [ ] `src/lib/models/` - modele dla każdej tabeli
- [ ] Seed data dla testów

### 3.2 API Endpoints
- [ ] `src/pages/api/auth/` - rejestracja, login, logout
- [ ] `src/pages/api/developers/` - CRUD deweloperów  
- [ ] `src/pages/api/apartments/` - CRUD mieszkań
- [ ] `src/pages/api/sync.ts` - trigger n8n workflow
- [ ] `src/pages/api/status.ts` - status systemu

### 3.3 n8n Integration
- [ ] HTTP client do n8n webhook
- [ ] Error handling dla failed workflows  
- [ ] Logging wszystkich sync attempts

---

## 📋 FAZA 4: Multi-Tenant Architecture (Tydzień 4-5)

### 4.1 User Authentication
- [ ] JWT-based auth system
- [ ] Middleware dla route protection
- [ ] Role-based access (admin/developer)

### 4.2 Data Isolation
- [ ] Developer ID w wszystkich queries
- [ ] File storage per client (`/storage/{clientId}/`)
- [ ] URL routing: `/data/{clientId}/latest.xml`

### 4.3 Onboarding Flow
- [ ] `src/pages/onboarding.tsx` - 5-step wizard
- [ ] Company registration form
- [ ] CSV upload & validation
- [ ] XML preview & confirmation
- [ ] Auto email generation for dane.gov.pl

---

## 📋 FAZA 5: Advanced Features (Tydzień 5-6)

### 5.1 Monitoring System
- [ ] `src/components/Monitoring/` - monitoring dashboard
- [ ] Sync history charts
- [ ] Error alerting system
- [ ] Performance metrics

### 5.2 Settings & Configuration
- [ ] `src/pages/settings.tsx` - ustawienia konta
- [ ] Email preferences
- [ ] Notification settings
- [ ] API keys management

### 5.3 Data Management
- [ ] Bulk CSV operations
- [ ] Price history tracking
- [ ] Data export functions
- [ ] Backup & restore

---

## 📋 FAZA 6: Integration & Testing (Tydzień 6-7)

### 6.1 n8n Workflow Modifications
- [ ] Modyfikacja workflow na multi-tenant
- [ ] File storage zamiast webhook
- [ ] Dynamic client handling
- [ ] Error reporting do aplikacji

### 6.2 VPS Deployment Setup
- [ ] Server provisioning (Hetzner CPX21)
- [ ] Nginx configuration
- [ ] SSL certificates (Let's Encrypt)
- [ ] PM2 process management

### 6.3 Testing
- [ ] Unit tests dla core functions
- [ ] Integration tests dla API
- [ ] End-to-end tests dla user flows
- [ ] Performance testing

---

## 📋 FAZA 7: Production Deployment (Tydzień 7-8)

### 7.1 Production Environment
- [ ] Database setup (PostgreSQL production)
- [ ] Environment variables configuration
- [ ] Backup strategies
- [ ] Monitoring & logging

### 7.2 dane.gov.pl Integration
- [ ] Test harvestera z real URLs
- [ ] Email automation dla registration
- [ ] Status monitoring from dane.gov.pl
- [ ] Error handling & retries

### 7.3 Beta Testing
- [ ] TAMBUD integration test
- [ ] Full workflow validation
- [ ] Performance optimization
- [ ] Bug fixes & improvements

---

## 🛠️ Szczegółowe Task List

### Pierwszeństwo WYSOKIE (Must Have):
1. **Dashboard z real-time status** - kluczowy UX
2. **CSV upload + validation** - core functionality  
3. **XML generation + preview** - walidacja przed sync
4. **n8n integration** - trigger automated workflow
5. **Multi-tenant file storage** - `/data/{clientId}/latest.xml`

### Pierwszeństwo ŚREDNIE (Should Have):
1. **User authentication** - bezpieczeństwo
2. **Error monitoring** - reliability
3. **Email notifications** - user engagement
4. **Settings panel** - customization

### Pierwszeństwo NISKIE (Nice to Have):
1. **Advanced analytics** - business metrics
2. **API documentation** - developer experience
3. **Mobile responsiveness** - broader access

---

## 📊 Success Criteria MVP

### Technical:
- [ ] 100% automated sync workflow
- [ ] <2s response time dla dashboard
- [ ] 99.9% uptime dla file hosting
- [ ] Zero data loss

### Business:
- [ ] TAMBUD fully operational (1 paying customer)
- [ ] Complete onboarding w <5 minut
- [ ] dane.gov.pl harvester integration working
- [ ] Ready for next 10 customers

### User Experience:
- [ ] Intuitive dashboard (no training needed)
- [ ] Clear error messages & resolution steps
- [ ] Responsive design (desktop + mobile)
- [ ] Fast CSV processing (<30s for 1000 apartments)

---

## 🚀 Next Steps

1. **START**: Uruchom `npx create-next-app@latest devreporter --typescript --tailwind`
2. **SETUP**: Database schema + core dependencies
3. **BUILD**: Dashboard + CSV upload (core MVP)
4. **INTEGRATE**: n8n workflow connection
5. **DEPLOY**: VPS setup + production testing
6. **LAUNCH**: TAMBUD beta test

**Całkowity czas realizacji: 8 tygodni**  
**Pierwsza wersja działająca: 4 tygodnie**
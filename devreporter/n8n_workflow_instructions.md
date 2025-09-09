# n8n Workflow - Instrukcje modyfikacji

## 🎯 **Zmiany wymagane w Twoim n8n workflow:**

### **1. Dodaj nowy Webhook Node**
- Utwórz nowy Webhook node na początku workflow
- **Path**: `/process-developer-data`
- **Method**: `POST`
- **Response Mode**: `Response Node` (jak w obecnym)
- Zastąp istniejący trigger Google Sheets tym webhook-iem

### **2. Zaktualizuj Code Node**
Zamień zawartość Code Node na kod z pliku `n8n_modified_code.js`:

**Kluczowe zmiany:**
- ✅ **Multi-tenant support** (dynamiczne clientId)
- ✅ **Webhook input** zamiast Google Sheets
- ✅ **File storage** na VPS zamiast webhook response
- ✅ **Proper MD5 generation** (crypto.md5)
- ✅ **Dynamic developer data** zamiast hardcoded TAMBUD

### **3. Konfiguracja Environment Variables**
W n8n ustaw te zmienne środowiskowe:
```bash
# W n8n Settings > Environment Variables
STORAGE_PATH="/var/www/devreporter/storage"
BASE_URL="https://api.devreporter.pl"
```

### **4. Testowanie**
Po wprowadzeniu zmian:

1. **Uruchom NextJS app** (`npm run dev`)
2. **Wgraj sample_data.csv** przez interface
3. **Sprawdź logi n8n** czy webhook został wywołany
4. **Sprawdź czy pliki zostały zapisane** w `/var/www/devreporter/storage/tambud/`

### **5. File System Permissions** 
Upewnij się, że n8n ma uprawnienia do zapisu:
```bash
sudo mkdir -p /var/www/devreporter/storage
sudo chown -R n8n-user:n8n-user /var/www/devreporter/storage
sudo chmod -R 755 /var/www/devreporter/storage
```

## 📋 **Webhook Endpoint Details**

**URL**: `http://your-n8n-server:5678/webhook/process-developer-data`

**Payload Format**:
```json
{
  "clientId": "tambud",
  "developerInfo": {
    "companyName": "TAMBUD Sp. z o.o.",
    "nip": "1234567890",
    "regon": "123456789",
    "email": "kontakt@tambud.pl",
    "phone": "+48123456789"
  },
  "apartmentData": [
    {
      "Nr lokalu": "1/1",
      "Rodzaj": "Lokal mieszkalny", 
      "Powierzchnia użytkowa": "45.5",
      "Cena za m²": "12000",
      "Cena bazowa": "546000",
      "Cena finalna": "560000",
      // ... wszystkie 58 pól
    }
  ],
  "timestamp": "2025-01-01T08:00:00.000Z"
}
```

**Response Format**:
```json
{
  "success": true,
  "clientId": "tambud",
  "xmlUrl": "https://api.devreporter.pl/data/tambud/latest.xml",
  "md5Url": "https://api.devreporter.pl/data/tambud/latest.md5", 
  "recordsCount": 3,
  "generatedAt": "2025-01-01T08:00:00.000Z",
  "md5Hash": "abc123...",
  "developerName": "TAMBUD Sp. z o.o."
}
```

## ✅ **To-Do Checklist**

- [ ] Backup istniejącego workflow (Export JSON)
- [ ] Dodać nowy Webhook node (`/process-developer-data`)
- [ ] Zastąpić kod w Code Node (użyj `n8n_modified_code.js`)
- [ ] Usunąć/wyłączyć Google Sheets node
- [ ] Przetestować z NextJS app + sample_data.csv
- [ ] Sprawdzić czy pliki XML/MD5 są generowane
- [ ] Sprawdzić permissions dla VPS storage

## 🔧 **Environment Setup**

**NextJS .env**:
```bash
N8N_WEBHOOK_URL="http://localhost:5678/webhook"
```

**VPS nginx** (dla plików static):
```nginx
location /data/ {
  alias /var/www/devreporter/storage/;
  add_header Access-Control-Allow-Origin *;
  add_header Cache-Control "no-cache";
}
```

**Po wprowadzeniu tych zmian workflow będzie w pełni compatibly z naszą NextJS aplikacją!** 🚀
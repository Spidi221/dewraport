# n8n Daily Batch Processing Workflow

## 🕐 **Schedule Node Configuration**

### **Primary Workflow: Daily Sync All Clients**
- **Schedule**: Cron expression `0 4 * * *` (4:00 AM daily)
- **Timezone**: Europe/Warsaw
- **Description**: Triggers daily batch processing for all active developers

### **Backup Workflow: Manual Batch Trigger**
- **Webhook**: `/webhook/trigger-batch-sync`
- **Method**: POST
- **Description**: Manual trigger for batch processing

## 🔄 **Workflow Structure**

```
Schedule (4:00 AM) → HTTP Request → Batch Processing → Email Summary
       ↓
Webhook Manual → HTTP Request → Batch Processing → Error Handling
```

## 📝 **HTTP Request Node Configuration**

### **URL**: 
```
{{$env.NEXTJS_APP_URL}}/api/batch-sync
```

### **Method**: POST

### **Headers**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer {{$env.BATCH_SYNC_TOKEN}}"
}
```

### **Body**:
```json
{
  "triggeredBy": "n8n-schedule",
  "timestamp": "{{$now}}",
  "batchId": "{{$now.format('YYYY-MM-DD-HH-mm-ss')}}"
}
```

## 📊 **Response Processing Node (JavaScript)**

```javascript
// Process batch sync results
const inputData = $input.all()[0].json;

if (!inputData.success) {
  throw new Error(`Batch sync failed: ${inputData.error}`);
}

const summary = inputData.summary;
const results = inputData.results || [];

// Prepare email summary
const successfulClients = results.filter(r => r.success);
const failedClients = results.filter(r => !r.success);

const emailSummary = {
  batchId: inputData.batchId,
  timestamp: new Date().toISOString(),
  totalDevelopers: summary.totalDevelopers,
  successful: summary.successful,
  failed: summary.failed,
  totalRecords: summary.totalRecords,
  
  successfulClients: successfulClients.map(c => ({
    companyName: c.companyName,
    clientId: c.clientId,
    recordsCount: c.recordsCount
  })),
  
  failedClients: failedClients.map(c => ({
    companyName: c.companyName,
    clientId: c.clientId,
    error: c.error
  })),
  
  // URLs for verification
  sampleUrls: successfulClients.slice(0, 3).map(c => ({
    clientId: c.clientId,
    xmlUrl: `https://api.devreporter.pl/data/${c.clientId}/latest.xml`,
    md5Url: `https://api.devreporter.pl/data/${c.clientId}/latest.md5`
  }))
};

return [{ json: emailSummary }];
```

## 📧 **Email Summary Node Configuration**

### **Gmail/SMTP Configuration**:
```javascript
// Email template for daily batch summary
const data = $input.all()[0].json;

const subject = data.failed > 0 
  ? `⚠️ DevReporter Daily Sync - ${data.failed} błędów z ${data.totalDevelopers} deweloperów`
  : `✅ DevReporter Daily Sync - Wszystko OK (${data.totalDevelopers} deweloperów)`;

const htmlBody = `
<!DOCTYPE html>
<html>
<head><title>DevReporter Daily Sync Report</title></head>
<body style="font-family: Arial, sans-serif; line-height: 1.6;">
  <div style="max-width: 800px; margin: 0 auto; padding: 20px;">
    <h2 style="color: ${data.failed > 0 ? '#dc2626' : '#059669'};">${subject}</h2>
    
    <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <h3>📊 Podsumowanie</h3>
      <ul>
        <li><strong>Data/czas:</strong> ${new Date(data.timestamp).toLocaleString('pl-PL')}</li>
        <li><strong>Batch ID:</strong> <code>${data.batchId}</code></li>
        <li><strong>Deweloperzy:</strong> ${data.totalDevelopers}</li>
        <li><strong>Pomyślne:</strong> <span style="color: #059669;">${data.successful}</span></li>
        <li><strong>Błędy:</strong> <span style="color: #dc2626;">${data.failed}</span></li>
        <li><strong>Mieszkania:</strong> ${data.totalRecords}</li>
      </ul>
    </div>

    ${data.successful > 0 ? `
    <div style="background: #d1fae5; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <h3 style="color: #059669;">✅ Pomyślne synchronizacje (${data.successful})</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr style="background: #10b981; color: white;">
          <th style="padding: 8px; text-align: left;">Deweloper</th>
          <th style="padding: 8px; text-align: left;">Client ID</th>
          <th style="padding: 8px; text-align: right;">Mieszkania</th>
        </tr>
        ${data.successfulClients.map(c => `
        <tr style="border-bottom: 1px solid #10b981;">
          <td style="padding: 8px;">${c.companyName}</td>
          <td style="padding: 8px;"><code>${c.clientId}</code></td>
          <td style="padding: 8px; text-align: right;">${c.recordsCount}</td>
        </tr>
        `).join('')}
      </table>
    </div>
    ` : ''}

    ${data.failed > 0 ? `
    <div style="background: #fee2e2; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <h3 style="color: #dc2626;">❌ Błędy synchronizacji (${data.failed})</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr style="background: #ef4444; color: white;">
          <th style="padding: 8px; text-align: left;">Deweloper</th>
          <th style="padding: 8px; text-align: left;">Client ID</th>
          <th style="padding: 8px; text-align: left;">Błąd</th>
        </tr>
        ${data.failedClients.map(c => `
        <tr style="border-bottom: 1px solid #ef4444;">
          <td style="padding: 8px;">${c.companyName}</td>
          <td style="padding: 8px;"><code>${c.clientId}</code></td>
          <td style="padding: 8px; font-size: 12px;">${c.error}</td>
        </tr>
        `).join('')}
      </table>
    </div>
    ` : ''}

    ${data.sampleUrls.length > 0 ? `
    <div style="background: #dbeafe; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <h3 style="color: #1d4ed8;">🔗 Przykładowe URL-e do weryfikacji</h3>
      ${data.sampleUrls.map(u => `
      <div style="margin: 10px 0; padding: 10px; background: white; border-radius: 4px;">
        <strong>${u.clientId}:</strong><br>
        <small>
          XML: <a href="${u.xmlUrl}">${u.xmlUrl}</a><br>
          MD5: <a href="${u.md5Url}">${u.md5Url}</a>
        </small>
      </div>
      `).join('')}
    </div>
    ` : ''}

    <hr style="margin: 30px 0;">
    <p style="font-size: 12px; color: #6b7280;">
      DevReporter - Automated Daily Sync Report<br>
      Następna synchronizacja: jutro o 04:00<br>
      Panel administratora: <a href="https://api.devreporter.pl/admin">api.devreporter.pl/admin</a>
    </p>
  </div>
</body>
</html>
`;

return {
  to: process.env.ADMIN_EMAIL || 'admin@devreporter.pl',
  cc: process.env.BACKUP_ADMIN_EMAIL,
  subject: subject,
  html: htmlBody
};
```

## ⚠️ **Error Handling Node**

```javascript
// Handle batch sync failures
const error = $input.all()[0].error || 'Unknown error';

const criticalAlert = {
  to: process.env.ADMIN_EMAIL,
  subject: '🚨 CRITICAL: DevReporter Daily Sync Failed',
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #dc2626;">🚨 Critical System Failure</h2>
      <div style="background: #fee2e2; padding: 20px; border-radius: 8px;">
        <p><strong>Time:</strong> ${new Date().toLocaleString('pl-PL')}</p>
        <p><strong>Error:</strong> ${error}</p>
        <p><strong>Impact:</strong> Daily sync for ALL developers failed</p>
        <p><strong>Action Required:</strong> Immediate investigation needed</p>
      </div>
      <p>Check system logs and manual trigger: 
        <a href="https://api.devreporter.pl/api/batch-sync">Manual Batch Sync</a>
      </p>
    </div>
  `
};

return [{ json: criticalAlert }];
```

## 🌐 **Environment Variables**

### **n8n Settings**:
```bash
NEXTJS_APP_URL="https://api.devreporter.pl"
BATCH_SYNC_TOKEN="your-secure-token-here"
ADMIN_EMAIL="admin@devreporter.pl"
BACKUP_ADMIN_EMAIL="backup@devreporter.pl"
```

### **NextJS .env**:
```bash
BATCH_SYNC_TOKEN="your-secure-token-here"
SEND_BATCH_NOTIFICATIONS="false"  # Set to "true" for individual notifications
N8N_WEBHOOK_URL="http://n8n:5678/webhook"
```

## 🔧 **Cron Schedule Details**

### **4:00 AM Daily**:
- **Expression**: `0 4 * * *`
- **Timezone**: `Europe/Warsaw`
- **Why 4:00 AM**: dane.gov.pl harvester runs at 5:00 AM
- **Duration**: ~15-30 minutes for 100 developers
- **Completion**: Files ready by 4:30 AM latest

### **Manual Triggers**:
- **Webhook**: `POST /webhook/trigger-batch-sync`
- **Admin Panel**: Manual button in dashboard
- **CLI**: `curl -X POST n8n-server/webhook/trigger-batch-sync`

## ✅ **Testing Checklist**

- [ ] Schedule trigger works at 4:00 AM
- [ ] Batch API processes all active developers
- [ ] Files are saved to VPS storage correctly
- [ ] Email summaries are sent to admins
- [ ] Error handling works for failed developers
- [ ] Manual trigger works for urgent updates
- [ ] Webhook security token is validated
- [ ] Performance is acceptable for 100+ developers

**Ten workflow zapewnia pełną automatyzację daily sync dla wszystkich deweloperów w systemie DevReporter!** 🚀
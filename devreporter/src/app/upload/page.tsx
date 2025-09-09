'use client';

import { useState } from 'react';
import { ArrowLeft, Download, Eye, Send } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import CsvUpload from '@/components/CsvUpload';
import { ApartmentRow, ValidationResult } from '@/lib/validation';
import { XmlPreviewData } from '@/lib/xml';

interface UploadData {
  csvData: ApartmentRow[];
  validation: ValidationResult;
  xmlPreview: XmlPreviewData;
}

export default function UploadPage() {
  const router = useRouter();
  const [uploadData, setUploadData] = useState<UploadData | null>(null);
  const [showXmlPreview, setShowXmlPreview] = useState(false);
  const [sending, setSending] = useState(false);

  const handleUpload = (data: UploadData) => {
    setUploadData(data);
  };

  const handleSendToDaneGovPl = async () => {
    if (!uploadData || !uploadData.validation.isValid) {
      alert('Najpierw popraw wszystkie błędy walidacji');
      return;
    }

    setSending(true);
    try {
      const response = await fetch('/api/upload-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          csvData: uploadData.csvData,
          xmlPreview: uploadData.xmlPreview
        })
      });

      const result = await response.json();
      
      if (result.success) {
        alert('Dane zostały przesłane pomyślnie do dane.gov.pl!');
        router.push('/dashboard');
      } else {
        alert('Błąd wysyłania: ' + result.error);
      }
    } catch (error) {
      alert('Błąd połączenia z serwerem');
    } finally {
      setSending(false);
    }
  };

  const downloadXml = () => {
    if (!uploadData) return;

    const blob = new Blob([uploadData.xmlPreview.xml], { type: 'text/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mieszkania_export.xml';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadMd5 = () => {
    if (!uploadData) return;

    const blob = new Blob([uploadData.xmlPreview.md5], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mieszkania_export.md5';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h2 className="text-2xl font-bold text-gray-900">Wgraj dane mieszkań</h2>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-2">Instrukcje</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Przygotuj plik CSV z danymi wszystkich mieszkań (format z separatorem średnik ";")</li>
            <li>• Plik musi zawierać wszystkie 58 wymaganych pól zgodnie z ustawą</li>
            <li>• System automatycznie zwaliduje dane i wygeneruje XML dla dane.gov.pl</li>
            <li>• Po pozytywnej walidacji możesz od razu przesłać dane do systemu</li>
          </ul>
        </div>

        {/* CSV Upload Component */}
        <CsvUpload onUpload={handleUpload} />

        {/* Actions Section */}
        {uploadData && uploadData.validation.isValid && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Akcje</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Preview XML */}
              <button
                onClick={() => setShowXmlPreview(!showXmlPreview)}
                className="flex items-center justify-center space-x-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-lg transition-colors"
              >
                <Eye className="h-4 w-4" />
                <span>Podgląd XML</span>
              </button>

              {/* Download XML */}
              <button
                onClick={downloadXml}
                className="flex items-center justify-center space-x-2 bg-blue-100 hover:bg-blue-200 text-blue-700 px-4 py-3 rounded-lg transition-colors"
              >
                <Download className="h-4 w-4" />
                <span>Pobierz XML</span>
              </button>

              {/* Download MD5 */}
              <button
                onClick={downloadMd5}
                className="flex items-center justify-center space-x-2 bg-purple-100 hover:bg-purple-200 text-purple-700 px-4 py-3 rounded-lg transition-colors"
              >
                <Download className="h-4 w-4" />
                <span>Pobierz MD5</span>
              </button>

              {/* Send to dane.gov.pl */}
              <button
                onClick={handleSendToDaneGovPl}
                disabled={sending}
                className="flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg transition-colors"
              >
                <Send className={`h-4 w-4 ${sending ? 'animate-pulse' : ''}`} />
                <span>{sending ? 'Wysyłanie...' : 'Wyślij do dane.gov.pl'}</span>
              </button>
            </div>
          </div>
        )}

        {/* XML Preview Modal */}
        {showXmlPreview && uploadData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] flex flex-col">
              <div className="flex items-center justify-between p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900">Podgląd XML</h3>
                <button
                  onClick={() => setShowXmlPreview(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              <div className="flex-1 overflow-auto p-6">
                <pre className="text-xs text-gray-600 bg-gray-50 p-4 rounded-lg overflow-auto">
                  {uploadData.xmlPreview.xml}
                </pre>
              </div>
              <div className="p-6 border-t flex justify-end space-x-3">
                <button
                  onClick={downloadXml}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Pobierz XML
                </button>
                <button
                  onClick={() => setShowXmlPreview(false)}
                  className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300"
                >
                  Zamknij
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
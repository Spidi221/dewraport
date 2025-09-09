'use client';

import { useState, useCallback } from 'react';
import { Upload, FileText, CheckCircle, AlertTriangle, X } from 'lucide-react';
import Papa from 'papaparse';
import { validateCsvData, ValidationResult, ApartmentRow } from '@/lib/validation';
import { createXmlPreview, XmlPreviewData } from '@/lib/xml';

interface CsvUploadProps {
  onUpload: (data: {
    csvData: ApartmentRow[];
    validation: ValidationResult;
    xmlPreview: XmlPreviewData;
  }) => void;
}

export default function CsvUpload({ onUpload }: CsvUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    validation: ValidationResult;
    xmlPreview: XmlPreviewData;
  } | null>(null);

  const handleFile = useCallback(async (file: File) => {
    setProcessing(true);
    setUploadResult(null);
    
    try {
      // Validate file type
      if (!file.name.toLowerCase().endsWith('.csv')) {
        throw new Error('Plik musi mieć rozszerzenie .csv');
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('Plik nie może być większy niż 10MB');
      }

      const text = await file.text();
      
      // Parse CSV with Papa Parse
      const parsed = Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        delimiter: ';', // Polish CSV standard
        encoding: 'UTF-8'
      });
      
      if (parsed.errors.length > 0) {
        throw new Error(`Błędy parsowania CSV: ${parsed.errors.map(e => e.message).join(', ')}`);
      }

      // Validate data according to specification
      const validation = validateCsvData(parsed.data);
      
      if (validation.processedData.length === 0) {
        throw new Error('Nie znaleziono prawidłowych rekordów do przetworzenia');
      }

      // Generate XML preview
      const xmlPreview = createXmlPreview(validation.processedData, 'tambud'); // TODO: Dynamic client ID

      const result = {
        validation,
        xmlPreview
      };

      setUploadResult(result);

      // Call parent callback
      onUpload({
        csvData: validation.processedData,
        validation,
        xmlPreview
      });

    } catch (error) {
      alert(`Błąd przetwarzania pliku: ${error instanceof Error ? error.message : 'Nieznany błąd'}`);
    } finally {
      setProcessing(false);
    }
  }, [onUpload]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setDragActive(true);
    }
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv')) {
        handleFile(file);
      } else {
        alert('Proszę wybierz plik CSV');
      }
    }
  }, [handleFile]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
    // Reset input
    e.target.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div 
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
          dragActive 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        } ${processing ? 'pointer-events-none opacity-50' : ''}`}
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {processing ? (
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-lg font-medium text-gray-700">Przetwarzanie pliku...</p>
            <p className="text-sm text-gray-500 mt-2">Validacja danych i generowanie podglądu XML</p>
          </div>
        ) : (
          <div>
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Przeciągnij plik CSV lub kliknij aby wybrać
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Obsługujemy format zgodny z wymaganiami Ministerstwa (58 pól)
            </p>
            <div className="flex justify-center">
              <label className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 cursor-pointer transition-colors">
                Wybierz plik CSV
                <input 
                  type="file" 
                  accept=".csv"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Validation Results */}
      {uploadResult && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Wyniki walidacji</h3>
            <button 
              onClick={() => setUploadResult(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-600">Prawidłowe rekordy</p>
                  <p className="text-2xl font-bold text-green-900">{uploadResult.validation.processedData.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-red-50 rounded-lg p-4">
              <div className="flex items-center">
                <AlertTriangle className="h-8 w-8 text-red-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-600">Błędy</p>
                  <p className="text-2xl font-bold text-red-900">{uploadResult.validation.errors.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-yellow-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-yellow-600">Ostrzeżenia</p>
                  <p className="text-2xl font-bold text-yellow-900">{uploadResult.validation.warnings.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Error Messages */}
          {uploadResult.validation.errors.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-medium text-red-900 mb-2">Błędy wymagające poprawy:</h4>
              <div className="bg-red-50 rounded-lg p-4 max-h-48 overflow-y-auto">
                {uploadResult.validation.errors.map((error, index) => (
                  <p key={index} className="text-sm text-red-700 mb-1">• {error}</p>
                ))}
              </div>
            </div>
          )}

          {/* Warning Messages */}
          {uploadResult.validation.warnings.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-medium text-yellow-900 mb-2">Ostrzeżenia:</h4>
              <div className="bg-yellow-50 rounded-lg p-4 max-h-32 overflow-y-auto">
                {uploadResult.validation.warnings.map((warning, index) => (
                  <p key={index} className="text-sm text-yellow-700 mb-1">• {warning}</p>
                ))}
              </div>
            </div>
          )}

          {/* XML Preview Info */}
          {uploadResult.validation.isValid && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Podgląd XML:</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-blue-600">Rekordy:</span>
                  <span className="ml-2 font-medium">{uploadResult.xmlPreview.recordCount}</span>
                </div>
                <div>
                  <span className="text-blue-600">Rozmiar:</span>
                  <span className="ml-2 font-medium">{uploadResult.xmlPreview.fileSize}</span>
                </div>
                <div>
                  <span className="text-blue-600">MD5:</span>
                  <span className="ml-2 font-mono text-xs">{uploadResult.xmlPreview.md5.substring(0, 8)}...</span>
                </div>
                <div>
                  <span className="text-blue-600">Status:</span>
                  <span className="ml-2 font-medium text-green-600">Gotowe</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
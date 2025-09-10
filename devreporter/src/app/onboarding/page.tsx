'use client';

// This page uses NextAuth session which requires runtime
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { CheckCircle, ArrowRight, Building, Phone, MapPin } from 'lucide-react';
import { generateClientId } from '@/lib/validation';

interface DeveloperForm {
  companyName: string;
  legalForm: string;
  krs: string;
  ceidg: string;
  nip: string;
  regon: string;
  phone: string;
  website: string;
  
  // Address
  street: string;
  houseNumber: string;
  apartmentNumber: string;
  postalCode: string;
  city: string;
  municipality: string;
  county: string;
  voivodeship: string;
}

export default function Onboarding() {
  const sessionData = useSession();
  const session = sessionData?.data;
  const status = sessionData?.status;
  const _router = useRouter();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<DeveloperForm>({
    companyName: '',
    legalForm: 'Spółka z ograniczoną odpowiedzialnością',
    krs: '',
    ceidg: '',
    nip: '',
    regon: '',
    phone: '',
    website: '',
    street: '',
    houseNumber: '',
    apartmentNumber: '',
    postalCode: '',
    city: '',
    municipality: '',
    county: '',
    voivodeship: ''
  });

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      _router.push('/auth/signin');
      return;
    }

    // Check if developer profile already exists
    if (session.user?.developer) {
      _router.push('/dashboard');
      return;
    }
  }, [session, status, _router]);

  const handleInputChange = (field: keyof DeveloperForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const clientId = generateClientId(form.companyName);
      
      const response = await fetch('/api/onboarding/developer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          clientId
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Błąd podczas tworzenia profilu');
      }

      // Success - redirect to dashboard
      _router.push('/dashboard?onboarding=success');

    } catch (error) {
      alert(`Błąd: ${error instanceof Error ? error.message : 'Nieznany błąd'}`);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Konfiguracja profilu dewelopera</h1>
          <p className="mt-2 text-gray-600">
            Uzupełnij dane swojej firmy aby rozpocząć automatyczne raportowanie
          </p>
        </div>

        {/* Progress indicators */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-full">
                <span className="text-white text-sm font-medium">1</span>
              </div>
              <span className="ml-2 text-sm font-medium text-blue-600">Dane firmy</span>
            </div>
            <div className="flex-1 mx-4 h-1 bg-gray-200 rounded">
              <div className="h-full bg-blue-600 rounded" style={{ width: '100%' }}></div>
            </div>
            <div className="flex items-center">
              <div className="flex items-center justify-center w-8 h-8 bg-gray-200 rounded-full">
                <CheckCircle className="w-4 h-4 text-gray-400" />
              </div>
              <span className="ml-2 text-sm text-gray-500">Gotowe</span>
            </div>
          </div>
        </div>

        <div className="bg-white shadow-lg rounded-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Company Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Nazwa dewelopera *
                </label>
                <div className="mt-1 relative">
                  <input
                    type="text"
                    required
                    value={form.companyName}
                    onChange={(e) => handleInputChange('companyName', e.target.value)}
                    className="block w-full px-3 py-2 pl-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="np. TAMBUD Sp. z o.o."
                  />
                  <Building className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Forma prawna
                </label>
                <select
                  value={form.legalForm}
                  onChange={(e) => handleInputChange('legalForm', e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Spółka z ograniczoną odpowiedzialnością">Sp. z o.o.</option>
                  <option value="Spółka akcyjna">S.A.</option>
                  <option value="Jednoosobowa działalność gospodarcza">JDG</option>
                  <option value="Spółka jawna">Spółka jawna</option>
                  <option value="Inna">Inna</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  NIP *
                </label>
                <input
                  type="text"
                  required
                  value={form.nip}
                  onChange={(e) => handleInputChange('nip', e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="1234567890"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  REGON *
                </label>
                <input
                  type="text"
                  required
                  value={form.regon}
                  onChange={(e) => handleInputChange('regon', e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="123456789"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Telefon
                </label>
                <div className="mt-1 relative">
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="block w-full px-3 py-2 pl-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="+48 123 456 789"
                  />
                  <Phone className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>

            {/* Address Section */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <MapPin className="h-5 w-5 text-gray-400 mr-2" />
                Adres siedziby
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Ulica</label>
                  <input
                    type="text"
                    value={form.street}
                    onChange={(e) => handleInputChange('street', e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nr nieruchomości</label>
                  <input
                    type="text"
                    value={form.houseNumber}
                    onChange={(e) => handleInputChange('houseNumber', e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Miejscowość</label>
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Kod pocztowy</label>
                  <input
                    type="text"
                    value={form.postalCode}
                    onChange={(e) => handleInputChange('postalCode', e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="00-000"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Województwo</label>
                  <input
                    type="text"
                    value={form.voivodeship}
                    onChange={(e) => handleInputChange('voivodeship', e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-6 border-t">
              <button
                type="submit"
                disabled={loading || !form.companyName || !form.nip || !form.regon}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <>
                    Utwórz profil i wyślij instrukcje
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
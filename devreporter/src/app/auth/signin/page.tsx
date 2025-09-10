'use client';

import { useState } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Mail, ArrowRight, CheckCircle } from 'lucide-react';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const _router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await signIn('email', {
        email,
        redirect: false,
        callbackUrl: '/onboarding'
      });

      if (result?.error) {
        alert('Błąd logowania: ' + result.error);
      } else {
        setEmailSent(true);
      }
    } catch {
      alert('Błąd połączenia z serwerem');
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Sprawdź swoją skrzynkę email
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Wysłaliśmy link do logowania na adres:
            </p>
            <p className="mt-1 text-sm font-medium text-blue-600">{email}</p>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="text-sm text-blue-800">
              <p className="font-medium">Następne kroki:</p>
              <ol className="mt-2 list-decimal list-inside space-y-1">
                <li>Kliknij link w emailu aby się zalogować</li>
                <li>Uzupełnij profil swojej firmy deweloperskiej</li>
                <li>Otrzymasz instrukcje rejestracji w dane.gov.pl</li>
                <li>Wgraj pierwszy plik CSV z mieszkaniami</li>
              </ol>
            </div>
          </div>
          
          <button
            onClick={() => setEmailSent(false)}
            className="w-full text-center text-sm text-blue-600 hover:text-blue-500"
          >
            Wyślij ponownie
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            DevReporter
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Automatyczne raportowanie cen mieszkań do dane.gov.pl
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Adres email firmy deweloperskiej
              </label>
              <div className="mt-1 relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none relative block w-full px-3 py-2 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="kontakt@twojafirma.pl"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !email}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <>
                  Wyślij link do logowania
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </div>

        <div className="text-center">
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-900 mb-2">Jak to działa?</h3>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• Bezpieczne logowanie przez email (bez hasła)</li>
              <li>• Automatyczna synchronizacja codziennie o 4:00</li>
              <li>• Zgodność z ustawą o jawności cen</li>
              <li>• Pełne wsparcie techniczne</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
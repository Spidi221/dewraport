import { useState } from 'react';
import { ChevronDown, User, Settings, LogOut } from 'lucide-react';

export default function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);

  // Mock user data - replace with real auth
  const user = {
    name: 'TAMBUD Sp. z o.o.',
    email: 'kontakt@tambud.pl'
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 focus:outline-none"
      >
        <div className="flex items-center space-x-2">
          <User className="h-5 w-5" />
          <span className="text-sm font-medium">{user.name}</span>
        </div>
        <ChevronDown className="h-4 w-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
          <div className="px-4 py-2 text-sm text-gray-500 border-b">
            {user.email}
          </div>
          <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
            <Settings className="h-4 w-4 mr-2" />
            Ustawienia
          </button>
          <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
            <LogOut className="h-4 w-4 mr-2" />
            Wyloguj
          </button>
        </div>
      )}
    </div>
  );
}
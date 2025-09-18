import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-app-blue text-white px-6 py-4 shadow-app-lg">
      <div className="flex items-center">
        <div className="flex items-center space-x-3">
          {/* Icon placeholder */}
          <div className="w-8 h-8 bg-white bg-opacity-20 rounded-md flex items-center justify-center">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold">Reuters Script Manager</h1>
        </div>
      </div>
    </header>
  );
};

export default Header;
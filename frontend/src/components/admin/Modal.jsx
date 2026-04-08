import { useEffect } from 'react';

const CloseIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

export default function Modal({ isOpen, onClose, title, children, size = 'md', variant = 'light' }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  const isDark = variant === 'dark';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className={`fixed inset-0 transition-opacity ${isDark ? 'bg-black/75' : 'bg-black bg-opacity-50'}`}
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className={`relative w-full ${sizeClasses[size]} rounded-xl shadow-2xl transform transition-all ${
            isDark
              ? 'bg-zinc-900 border border-zinc-700 text-zinc-200'
              : 'bg-white border border-transparent'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            className={`flex items-center justify-between px-6 py-4 border-b ${
              isDark ? 'border-zinc-700' : 'border-gray-100'
            }`}
          >
            <h3 className={`text-lg font-semibold ${isDark ? 'text-zinc-100' : 'text-gray-900'}`}>
              {title}
            </h3>
            <button
              onClick={onClose}
              className={`p-1.5 rounded-lg transition-colors ${
                isDark
                  ? 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                  : 'text-gray-400 hover:bg-gray-100'
              }`}
            >
              <CloseIcon />
            </button>
          </div>

          {/* Body */}
          <div
            className={`px-6 py-4 max-h-[calc(100vh-200px)] overflow-y-auto ${
              isDark ? 'bg-zinc-900' : ''
            }`}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

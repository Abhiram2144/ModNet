import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

export default function CustomSelect({ 
  value, 
  onChange, 
  options = [], 
  placeholder = "Select an option",
  disabled = false,
  className = ""
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [displayText, setDisplayText] = useState(placeholder);
  const containerRef = useRef(null);

  // Update display text when value changes
  useEffect(() => {
    const selected = options.find(opt => opt.value === value);
    setDisplayText(selected ? selected.label : placeholder);
  }, [value, options, placeholder]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Button/Display */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="w-full rounded-lg border border-gray-300 bg-white p-3 text-sm text-gray-900 shadow-sm transition-all flex items-center justify-between hover:border-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-500"
      >
        <span className="text-left">{displayText}</span>
        <ChevronDown 
          size={18} 
          className={`transition-transform text-gray-600 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-lg border border-gray-300 bg-white shadow-lg">
          <ul className="max-h-60 overflow-y-auto py-1">
            {options.map((option) => (
              <li key={option.value}>
                <button
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                    value === option.value
                      ? 'bg-blue-100 text-blue-900 font-medium'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {option.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTrading } from '../../contexts/TradingContext';
import { tradingApiService } from '../../services/tradingApiService';
import type { TradingInstrument } from '../../contexts/TradingContext';

interface InstrumentSearchProps {
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  onInstrumentSelect?: (instrument: TradingInstrument) => void;
}

const InstrumentSearch: React.FC<InstrumentSearchProps> = ({
  className = '',
  placeholder = 'Search stocks (e.g., RELIANCE, TATASTEEL, INFY)',
  disabled = false,
  onInstrumentSelect,
}) => {
  const {
    state,
    setSearchQuery,
    setSearchResults,
    setSearching,
    selectInstrument,
    clearInstrument,
  } = useTrading();

  const [inputValue, setInputValue] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounced search
  const [debouncedQuery, setDebouncedQuery] = useState('');
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(inputValue);
    }, 300);

    return () => clearTimeout(timer);
  }, [inputValue]);

  // Search query with React Query
  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['instruments', 'search', debouncedQuery],
    queryFn: () => tradingApiService.searchInstruments(debouncedQuery),
    enabled: debouncedQuery.length >= 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Update search results in context
  useEffect(() => {
    if (searchResults) {
      setSearchResults(searchResults);
      setShowDropdown(searchResults.length > 0 && inputValue.length >= 2);
    } else {
      setSearchResults([]);
      setShowDropdown(false);
    }
  }, [searchResults, setSearchResults, inputValue]);

  // Update searching state
  useEffect(() => {
    setSearching(isLoading);
  }, [isLoading, setSearching]);

  // Handle input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    setSearchQuery(value);
    setSelectedIndex(-1);

    if (value.length < 2) {
      setShowDropdown(false);
      setSearchResults([]);
    }
  }, [setSearchQuery, setSearchResults]);

  // Handle instrument selection
  const handleInstrumentSelect = useCallback((instrument: TradingInstrument) => {
    selectInstrument(instrument);
    setInputValue(`${instrument.tradingsymbol} (${instrument.exchange})`);
    setShowDropdown(false);
    setSelectedIndex(-1);
    
    if (onInstrumentSelect) {
      onInstrumentSelect(instrument);
    }
  }, [selectInstrument, onInstrumentSelect]);

  // Handle clear
  const handleClear = useCallback(() => {
    setInputValue('');
    setSearchQuery('');
    clearInstrument();
    setShowDropdown(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  }, [setSearchQuery, clearInstrument]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!showDropdown || !searchResults?.length) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < searchResults.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && searchResults[selectedIndex]) {
          handleInstrumentSelect(searchResults[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        setSelectedIndex(-1);
        break;
    }
  }, [showDropdown, searchResults, selectedIndex, handleInstrumentSelect]);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowDropdown(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get exchange badge color
  const getExchangeColor = (exchange: string) => {
    switch (exchange) {
      case 'NSE':
        return 'bg-blue-500/20 text-blue-300 border-blue-400/30';
      case 'BSE':
        return 'bg-green-500/20 text-green-300 border-green-400/30';
      case 'NFO':
        return 'bg-purple-500/20 text-purple-300 border-purple-400/30';
      case 'BFO':
        return 'bg-orange-500/20 text-orange-300 border-orange-400/30';
      case 'CDS':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-400/30';
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-400/30';
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Input Field */}
      <div className="relative">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (searchResults?.length && inputValue.length >= 2) {
                setShowDropdown(true);
              }
            }}
            placeholder={placeholder}
            disabled={disabled}
            className="w-full px-4 py-3 pr-20 bg-gradient-to-r from-slate-900/50 to-slate-800/50 border border-violet-400/30 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400/50 focus:border-violet-400/50 transition-all duration-300 backdrop-blur-sm"
          />
          
          {/* Loading Spinner */}
          {isLoading && (
            <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-violet-400/30 border-t-violet-400 rounded-full animate-spin"></div>
            </div>
          )}
          
          {/* Clear Button */}
          {(inputValue || state.selectedInstrument) && (
            <button
              onClick={handleClear}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-slate-400 hover:text-white transition-colors duration-200"
              type="button"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Selected Instrument Indicator */}
        {state.selectedInstrument && (
          <div className="absolute -bottom-8 left-0 flex items-center space-x-2 text-xs">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-green-300">Selected</span>
            </div>
            <span className="text-slate-400">•</span>
            <span className="text-slate-300">{state.selectedInstrument.name}</span>
          </div>
        )}
      </div>

      {/* Dropdown Results */}
      {showDropdown && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-2 bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-md border border-violet-400/30 rounded-xl shadow-2xl shadow-violet-500/10 max-h-80 overflow-y-auto"
        >
          {searchResults?.length ? (
            <div className="p-2 space-y-1">
              {searchResults.map((instrument, index) => (
                <button
                  key={`${instrument.tradingsymbol}-${instrument.exchange}-${instrument.instrument_token}`}
                  onClick={() => handleInstrumentSelect(instrument)}
                  className={`w-full text-left p-3 rounded-lg transition-all duration-200 ${
                    index === selectedIndex
                      ? 'bg-violet-500/20 border border-violet-400/40'
                      : 'hover:bg-slate-700/50 border border-transparent hover:border-slate-600/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-semibold text-white text-sm">
                          {instrument.tradingsymbol}
                        </span>
                        <span
                          className={`px-2 py-0.5 text-xs font-medium rounded-md border ${getExchangeColor(
                            instrument.exchange
                          )}`}
                        >
                          {instrument.exchange}
                        </span>
                        {instrument.instrument_type !== 'EQ' && (
                          <span className="px-2 py-0.5 text-xs font-medium rounded-md bg-slate-600/30 text-slate-300 border border-slate-500/30">
                            {instrument.instrument_type}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 truncate">
                        {instrument.name}
                      </div>
                      {instrument.segment && instrument.segment !== instrument.exchange && (
                        <div className="text-xs text-slate-500 mt-0.5">
                          Segment: {instrument.segment}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-3">
                      {instrument.lot_size > 1 && (
                        <div className="text-right">
                          <div className="text-xs text-slate-400">Lot Size</div>
                          <div className="text-xs font-medium text-slate-300">
                            {instrument.lot_size.toLocaleString()}
                          </div>
                        </div>
                      )}
                      
                      <svg
                        className={`w-4 h-4 text-violet-400 transition-transform duration-200 ${
                          index === selectedIndex ? 'scale-110' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-slate-400">
              <div className="w-8 h-8 mx-auto mb-2 text-slate-500">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <p className="text-sm">
                {inputValue.length < 2 
                  ? 'Type at least 2 characters to search'
                  : 'No instruments found'
                }
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InstrumentSearch;
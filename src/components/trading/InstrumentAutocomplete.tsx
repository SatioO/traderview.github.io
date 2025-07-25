import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTrading } from '../../contexts/TradingContext';
import { tradingApiService } from '../../services/tradingApiService';
import type { TradingInstrument } from '../../contexts/TradingContext';
import { useAuth } from '../../contexts/AuthContext';
import '../ui/CinematicAnimations.css';

interface InstrumentAutocompleteProps {
  className?: string;
}

const InstrumentAutocomplete: React.FC<InstrumentAutocompleteProps> = ({
  className = '',
}) => {
  const {
    selectInstrument,
    clearInstrument,
    setInstrumentQuote,
    setLoadingQuote,
    setQuoteError,
  } = useTrading();
  const { isAuthenticated } = useAuth();
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedInstrument, setSelectedInstrument] =
    useState<TradingInstrument | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [showRecentSearches, setShowRecentSearches] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>(null);

  // Debounced search with proper cleanup
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      if (inputValue.length >= 2 && !selectedInstrument) {
        setSearchQuery(inputValue.trim());
      } else {
        setSearchQuery('');
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [inputValue, selectedInstrument]);

  // Search instruments with proper error handling
  const {
    data: instruments = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['instruments', 'search', searchQuery],
    queryFn: () => tradingApiService.searchInstruments(searchQuery),
    enabled: searchQuery.length >= 2,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // Fetch recent searches for authenticated users
  const {
    data: recentSearches = [],
    isLoading: isLoadingRecent,
    refetch: refetchRecentSearches,
  } = useQuery({
    queryKey: ['instruments', 'recent-searches'],
    queryFn: () => tradingApiService.getRecentSearches(),
    enabled: isAuthenticated && showRecentSearches,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // Handle input changes
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setInputValue(value);

      // Clear selection if user is typing after selecting
      if (selectedInstrument && value !== selectedInstrument.tradingsymbol) {
        setSelectedInstrument(null);
        clearInstrument();
      }

      // Reset highlighted index when typing
      setHighlightedIndex(-1);

      // Determine what to show in dropdown
      if (value.length === 0) {
        // Show recent searches when input is empty (if authenticated)
        setShowRecentSearches(isAuthenticated);
        setIsOpen(isAuthenticated); // Only open if authenticated
      } else if (value.length >= 2 && !selectedInstrument) {
        // Show search results when typing 2+ characters
        setShowRecentSearches(false);
        setIsOpen(true);
      } else {
        // Hide dropdown for 1 character or when instrument is selected
        setShowRecentSearches(false);
        setIsOpen(false);
      }
    },
    [selectedInstrument, clearInstrument, isAuthenticated]
  );

  // Fetch quote for selected instrument
  const fetchInstrumentQuote = useCallback(
    async (instrument: TradingInstrument) => {
      try {
        setLoadingQuote(true);
        setQuoteError(null);

        const quote = await tradingApiService.getSingleInstrumentQuote(
          instrument.tradingsymbol,
          instrument.exchange
        );

        if (quote) {
          setInstrumentQuote(quote);
        } else {
          setQuoteError('Quote not available for this instrument');
        }
      } catch (error) {
        console.error('Error fetching instrument quote:', error);
        setQuoteError(
          error instanceof Error ? error.message : 'Failed to fetch quote'
        );
      } finally {
        setLoadingQuote(false);
      }
    },
    [setInstrumentQuote, setLoadingQuote, setQuoteError]
  );

  // Handle instrument selection
  const handleSelect = useCallback(
    (instrument: TradingInstrument) => {
      // Cancel any pending debounced search
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      // Clear search query first to stop any pending API calls
      setSearchQuery('');
      setSelectedInstrument(instrument);
      setInputValue(instrument.tradingsymbol);
      setIsOpen(false);
      setShowRecentSearches(false);
      setHighlightedIndex(-1);

      // Select instrument in context first
      selectInstrument(instrument);

      // Save to recent searches using tradingsymbol and exchange
      if (isAuthenticated) {
        console.log(
          'Saving to recent searches:',
          instrument.tradingsymbol,
          instrument.exchange
        );
        tradingApiService.addToRecentSearches(
          instrument.tradingsymbol,
          instrument.exchange
        );
      } else {
        console.log('User not authenticated, skipping recent search save');
      }

      // Then fetch the quote asynchronously
      fetchInstrumentQuote(instrument);

      inputRef.current?.blur();
    },
    [selectInstrument, fetchInstrumentQuote, isAuthenticated]
  );

  // Handle clear button
  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setInputValue('');
      setSelectedInstrument(null);
      setIsOpen(true);
      setSearchQuery('');
      setShowRecentSearches(true);
      setHighlightedIndex(-1);
      clearInstrument();
      refetchRecentSearches();
      inputRef.current?.focus();
    },
    [clearInstrument]
  );

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Determine current list to navigate
      const currentList = showRecentSearches
        ? recentSearches.map((rs) => rs.instrument)
        : instruments;

      if (!isOpen || currentList.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev < currentList.length - 1 ? prev + 1 : prev
          );
          break;

        case 'ArrowUp':
          e.preventDefault();
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
          break;

        case 'Enter':
          e.preventDefault();
          if (highlightedIndex >= 0 && highlightedIndex < currentList.length) {
            handleSelect(currentList[highlightedIndex]);
          }
          break;

        case 'Escape':
          e.preventDefault();
          setIsOpen(false);
          setShowRecentSearches(false);
          setHighlightedIndex(-1);
          inputRef.current?.blur();
          break;
      }
    },
    [
      isOpen,
      instruments,
      recentSearches,
      showRecentSearches,
      highlightedIndex,
      handleSelect,
    ]
  );

  // Handle focus events
  const handleFocus = useCallback(() => {
    if (inputValue.length === 0 && isAuthenticated && !selectedInstrument) {
      // Show recent searches when input is empty and user is authenticated
      setShowRecentSearches(true);
      setIsOpen(true);
    } else if (
      inputValue.length >= 2 &&
      !selectedInstrument &&
      instruments.length > 0
    ) {
      // Show search results when query is 2+ chars and has results
      setShowRecentSearches(false);
      setIsOpen(true);
    }
  }, [inputValue, selectedInstrument, instruments, isAuthenticated]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setShowRecentSearches(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Reset highlighted index when instruments or recent searches change
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [instruments, recentSearches, showRecentSearches]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && dropdownRef.current) {
      const highlightedElement = dropdownRef.current.querySelector(
        `#option-${highlightedIndex}`
      );
      if (highlightedElement) {
        highlightedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth',
        });
      }
    }
  }, [highlightedIndex]);

  // Show dropdown based on conditions
  const shouldShowDropdown =
    isOpen &&
    !selectedInstrument &&
    // Show recent searches mode
    ((showRecentSearches && isAuthenticated) ||
      // Show search results mode
      (searchQuery.length >= 2 &&
        (isLoading ||
          instruments.length > 0 ||
          (!isLoading && instruments.length === 0))));

  // Elegant exchange color system
  const getExchangeStyle = (exchange: string) => {
    const styles: Record<string, any> = {
      NSE: {
        bg: 'bg-gradient-to-r from-blue-500/15 to-indigo-500/15',
        text: 'text-blue-300',
        border: 'border-blue-400/30',
        glow: 'shadow-blue-400/20',
      },
      BSE: {
        bg: 'bg-gradient-to-r from-emerald-500/15 to-teal-500/15',
        text: 'text-emerald-300',
        border: 'border-emerald-400/30',
        glow: 'shadow-emerald-400/20',
      },
      NFO: {
        bg: 'bg-gradient-to-r from-purple-500/15 to-violet-500/15',
        text: 'text-purple-300',
        border: 'border-purple-400/30',
        glow: 'shadow-purple-400/20',
      },
      BFO: {
        bg: 'bg-gradient-to-r from-orange-500/15 to-amber-500/15',
        text: 'text-orange-300',
        border: 'border-orange-400/30',
        glow: 'shadow-orange-400/20',
      },
      MCX: {
        bg: 'bg-gradient-to-r from-yellow-500/15 to-amber-500/15',
        text: 'text-yellow-300',
        border: 'border-yellow-400/30',
        glow: 'shadow-yellow-400/20',
      },
      CDS: {
        bg: 'bg-gradient-to-r from-cyan-500/15 to-sky-500/15',
        text: 'text-cyan-300',
        border: 'border-cyan-400/30',
        glow: 'shadow-cyan-400/20',
      },
      BCD: {
        bg: 'bg-gradient-to-r from-pink-500/15 to-rose-500/15',
        text: 'text-pink-300',
        border: 'border-pink-400/30',
        glow: 'shadow-pink-400/20',
      },
    };

    return (
      styles[exchange] || {
        bg: 'bg-gradient-to-r from-slate-500/15 to-gray-500/15',
        text: 'text-slate-300',
        border: 'border-slate-400/30',
        glow: 'shadow-slate-400/20',
      }
    );
  };

  return (
    <div className={`space-y-2 ${className}`} ref={containerRef}>
      <label className="text-sm font-medium text-purple-300 flex items-center">
        <svg
          className="w-4 h-4 mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        Select Instrument
      </label>

      <div className="relative">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            placeholder="Search (e.g., infy, reliance)"
            className="w-full px-4 py-4 pr-12 bg-black/30 border border-purple-500/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-200 uppercase tracking-wider text-md"
            role="combobox"
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            aria-autocomplete="list"
            aria-activedescendant={
              highlightedIndex >= 0 ? `option-${highlightedIndex}` : undefined
            }
          />

          {/* Right side icons */}
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
            {/* Loading spinner */}
            {isLoading && (
              <div className="w-4 h-4 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin"></div>
            )}

            {/* Clear button */}
            {inputValue && (
              <button
                onClick={handleClear}
                className="p-0.5 text-gray-400 hover:text-white transition-colors rounded"
                type="button"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Enhanced Cinematic Dropdown */}
        {shouldShowDropdown && (
          <div
            ref={dropdownRef}
            className="absolute z-50 w-full mt-2 transform transition-all duration-500 ease-out animate-fade-in-scale"
          >
            {/* Premium gradient backdrop */}
            <div className="absolute inset-0 rounded-xl overflow-hidden">
              {/* Multi-layer gradient foundation */}
              <div className="absolute inset-0 bg-gradient-to-br from-slate-900/98 via-purple-900/85 to-slate-800/98 backdrop-blur-3xl" />

              {/* Atmospheric overlay */}
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/20 via-transparent to-violet-900/15" />

              {/* Sophisticated border */}
              <div className="absolute inset-0 rounded-xl border border-purple-400/30 shadow-2xl shadow-purple-500/20" />

              {/* Dynamic top highlight */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-400/40 to-transparent" />

              {/* Enhanced glass morphism */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] via-purple-500/[0.01] to-black/[0.08] rounded-xl pointer-events-none" />

              {/* Subtle inner glow */}
              <div className="absolute inset-1 rounded-xl bg-gradient-to-br from-purple-500/[0.02] via-transparent to-indigo-500/[0.01] pointer-events-none" />
            </div>

            <div className="relative max-h-120 overflow-hidden rounded-xl">
              {/* Recent Searches Mode */}
              {showRecentSearches ? (
                <>
                  {isLoadingRecent ? (
                    <div className="p-6 text-center">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <div className="relative">
                          <div className="w-8 h-8 border-2 border-cyan-400/20 border-t-cyan-400 rounded-full animate-spin"></div>
                          <div
                            className="absolute inset-0 w-8 h-8 border-2 border-purple-400/20 border-r-purple-400 rounded-full animate-spin"
                            style={{ animationDirection: 'reverse' }}
                          ></div>
                        </div>
                        <span className="text-cyan-300 text-sm font-medium">
                          Loading recent searches...
                        </span>
                      </div>
                    </div>
                  ) : recentSearches.length > 0 ? (
                    <>
                      {/* Recent searches header */}
                      <div className="px-4 py-3 border-b border-slate-700/30 bg-gradient-to-r from-cyan-500/10 to-purple-500/10">
                        <div className="flex items-center space-x-2">
                          <svg
                            className="w-4 h-4 text-cyan-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <span className="text-sm font-semibold text-cyan-300 tracking-wide">
                            RECENT SEARCHES
                          </span>
                          <div className="flex-1"></div>
                          <span className="text-xs text-slate-400">
                            {recentSearches.length}/5
                          </span>
                        </div>
                      </div>

                      <div
                        className="max-h-80 overflow-y-auto custom-scrollbar"
                        role="listbox"
                      >
                        {recentSearches.map((recentSearch, index) => {
                          const instrument = recentSearch.instrument;

                          return (
                            <button
                              key={`recent-${instrument.tradingsymbol}-${instrument.exchange}-${index}`}
                              id={`option-${index}`}
                              onClick={() => handleSelect(instrument)}
                              className={`group w-full text-left p-3 border-b border-slate-700/20 last:border-b-0 focus:outline-none transition-all duration-200 relative ${
                                index === highlightedIndex
                                  ? 'bg-cyan-500/20 border-cyan-400/30'
                                  : 'hover:bg-slate-800/40 focus:bg-slate-700/30'
                              }`}
                              style={{ animationDelay: `${index * 50}ms` }}
                              role="option"
                              aria-selected={index === highlightedIndex}
                            >
                              {/* Recent indicator */}
                              <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-cyan-400/40 group-hover:bg-cyan-400/80 transition-all duration-200" />

                              <div className="relative flex items-center justify-between pl-2">
                                <div className="flex-1 min-w-0 space-y-1">
                                  <div className="flex items-center space-x-3">
                                    {/* Recent icon */}
                                    <svg
                                      className="w-3 h-3 text-cyan-400/60 group-hover:text-cyan-400 transition-colors duration-200"
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                                        clipRule="evenodd"
                                      />
                                    </svg>

                                    {/* Symbol */}
                                    <span className="font-bold text-white text-sm tracking-wide group-hover:text-cyan-200 transition-colors duration-300">
                                      {instrument.tradingsymbol}
                                    </span>

                                    {/* Instrument type badge */}
                                    {instrument.instrument_type !== 'EQ' && (
                                      <span className="px-2 py-1 text-xs font-semibold rounded-md bg-slate-700/50 text-slate-300 border border-slate-600/50 group-hover:bg-slate-600/60 group-hover:border-slate-500/60 transition-all duration-300">
                                        {instrument.instrument_type}
                                      </span>
                                    )}
                                  </div>

                                  {/* Company name */}
                                  <div className="text-xs text-slate-400 group-hover:text-slate-300 transition-colors duration-300 truncate font-medium">
                                    {instrument.name}
                                  </div>
                                </div>

                                {/* Exchange badge */}
                                {(() => {
                                  const style = getExchangeStyle(
                                    instrument.exchange
                                  );
                                  return (
                                    <div className="ml-3">
                                      <span
                                        className={`px-3 py-1 text-xs font-bold rounded-lg ${style.bg} ${style.text} ${style.border} border backdrop-blur-sm shadow-lg ${style.glow} group-hover:scale-105 transition-all duration-200`}
                                      >
                                        {instrument.exchange}
                                      </span>
                                    </div>
                                  );
                                })()}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </>
                  ) : (
                    <div className="p-8 text-center">
                      <div className="space-y-4">
                        <div className="relative mx-auto w-16 h-16 mb-4">
                          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-full" />
                          <svg
                            className="relative w-16 h-16 text-cyan-400/60"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </div>
                        <div className="space-y-2">
                          <p className="text-slate-300 font-medium">
                            No recent searches
                          </p>
                          <p className="text-sm text-slate-500">
                            Start searching for instruments to see your recent
                            searches here
                          </p>
                          <p className="text-xs text-cyan-400/60">
                            Search for stocks like RELIANCE, INFY, TCS
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                /* Search Results Mode */
                <>
                  {isLoading ? (
                    <div className="p-6 text-center">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <div className="relative">
                          <div className="w-8 h-8 border-2 border-purple-400/20 border-t-purple-400 rounded-full animate-spin"></div>
                          <div
                            className="absolute inset-0 w-8 h-8 border-2 border-cyan-400/20 border-r-cyan-400 rounded-full animate-spin"
                            style={{ animationDirection: 'reverse' }}
                          ></div>
                        </div>
                        <div className="space-y-1">
                          <span className="text-purple-300 text-sm font-medium">
                            Searching instruments...
                          </span>
                          <div className="flex space-x-1 justify-center">
                            <div className="w-1 h-1 bg-purple-400 rounded-full animate-bounce" />
                            <div
                              className="w-1 h-1 bg-purple-400 rounded-full animate-bounce"
                              style={{ animationDelay: '0.1s' }}
                            />
                            <div
                              className="w-1 h-1 bg-purple-400 rounded-full animate-bounce"
                              style={{ animationDelay: '0.2s' }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : error ? (
                    <div className="p-6 text-center">
                      <div className="space-y-3">
                        <div className="w-12 h-12 mx-auto bg-red-500/20 rounded-full flex items-center justify-center">
                          <svg
                            className="w-6 h-6 text-red-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                            />
                          </svg>
                        </div>
                        <span className="text-red-300 text-sm font-medium">
                          Search failed. Please try again.
                        </span>
                      </div>
                    </div>
                  ) : instruments.length > 0 ? (
                    <div
                      className="max-h-80 overflow-y-auto custom-scrollbar"
                      role="listbox"
                    >
                      {instruments.map((instrument, index) => (
                        <button
                          key={`${instrument.tradingsymbol}-${instrument.exchange}-${instrument.instrument_token}`}
                          id={`option-${index}`}
                          onClick={() => handleSelect(instrument)}
                          className={`group w-full text-left p-3 border-b border-slate-700/20 last:border-b-0 focus:outline-none transition-all duration-200 relative ${
                            index === highlightedIndex
                              ? 'bg-purple-500/20 border-purple-400/30'
                              : 'hover:bg-slate-800/40 focus:bg-slate-700/30'
                          }`}
                          style={{ animationDelay: `${index * 50}ms` }}
                          role="option"
                          aria-selected={index === highlightedIndex}
                        >
                          <div className="absolute left-0 top-0 bottom-0 w-[1px] bg-purple-400/0 group-hover:bg-purple-400/60 transition-all duration-200" />

                          <div className="relative flex items-center justify-between">
                            <div className="flex-1 min-w-0 space-y-1">
                              <div className="flex items-center space-x-3">
                                <span className="font-bold text-white text-sm tracking-wide group-hover:text-purple-200 transition-colors duration-300">
                                  {instrument.tradingsymbol}
                                </span>

                                {instrument.instrument_type !== 'EQ' && (
                                  <span className="px-2 py-1 text-xs font-semibold rounded-md bg-slate-700/50 text-slate-300 border border-slate-600/50 group-hover:bg-slate-600/60 group-hover:border-slate-500/60 transition-all duration-300">
                                    {instrument.instrument_type}
                                  </span>
                                )}

                                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-400 to-cyan-400 opacity-60 group-hover:opacity-100 transition-opacity duration-300" />
                              </div>

                              <div className="text-xs text-slate-400 group-hover:text-slate-300 transition-colors duration-300 truncate font-medium">
                                {instrument.name}
                              </div>
                            </div>

                            {(() => {
                              const style = getExchangeStyle(
                                instrument.exchange
                              );
                              return (
                                <div className="ml-3">
                                  <span
                                    className={`px-3 py-1 text-xs font-bold rounded-lg ${style.bg} ${style.text} ${style.border} border backdrop-blur-sm shadow-lg ${style.glow} group-hover:scale-105 transition-all duration-200`}
                                  >
                                    {instrument.exchange}
                                  </span>
                                </div>
                              );
                            })()}
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : searchQuery.length >= 2 ? (
                    <div className="p-8 text-center">
                      <div className="space-y-4">
                        <div className="relative mx-auto w-16 h-16 mb-4">
                          <div className="absolute inset-0 bg-gradient-to-br from-slate-700/40 to-slate-800/40 rounded-full" />
                          <svg
                            className="relative w-16 h-16 text-slate-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                          </svg>
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-400/60 rounded-full animate-pulse" />
                        </div>
                        <div className="space-y-2">
                          <p className="text-slate-300 font-medium">
                            No instruments found
                          </p>
                          <p className="text-sm text-slate-500">
                            Try searching for{' '}
                            <span className="font-mono bg-slate-800/50 px-2 py-1 rounded text-slate-400">
                              "{searchQuery}"
                            </span>
                          </p>
                          <p className="text-xs text-slate-600">
                            Try different keywords or check the spelling
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InstrumentAutocomplete;

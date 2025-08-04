# Component Architecture Guide

## Key Components & Their Responsibilities

### 1. TradingCalculator (Main Container)
**Location**: `src/containers/TradingCalculator/TradingCalculator.tsx`

**Key Features**:
- Risk-based and allocation-based position sizing
- Entry price modes: MKT (market) and LMT (limit)
- Stop loss modes: Price (Rs) and Percentage (%)
- Auto-calculation engine for entry price and stop loss
- Live quote integration

**Key State**:
```typescript
const [entryPriceMode, setEntryPriceMode] = useState<'lmt' | 'mkt'>();
const [stopLossPercentage, setStopLossPercentage] = useState<number>();
const [formData, setFormData] = useState<FormData>();
const [isLoadingPrice, setIsLoadingPrice] = useState(false);
const [isAutoPopulating, setIsAutoPopulating] = useState(false);
```

**Key Functions**:
- `fetchLatestQuote()`: Gets fresh market data when switching to MKT mode
- `handleInputChange()`: Manages form field changes with auto-calculations
- `handleStopLossModeChange()`: Switches between Rs and % modes

### 2. Portfolio Components
**PortfolioSnapshot**: `src/components/Portfolio/PortfolioSnapshot.tsx`
- Displays active positions with center-aligned size column
- Grid layout: `'2fr 1fr 1fr 1.2fr 1fr 1fr 1.5fr'`
- Keyboard navigation support

### 3. Trading Context & Hooks
**TradingContext**: `src/contexts/TradingContext.tsx`
- Manages selectedInstrument, quotes, search results
- Provides currentPrice (may not always be fresh)

**SettingsContext**: `src/contexts/SettingsContext.tsx` 
- User preferences: defaultStopLossPercentage, stopLossMode
- Broker session state

## Component Interaction Patterns

### Auto-Calculation Flow
```
1. User selects instrument → Auto-populate entry price & stop loss
2. User changes entry price → Recalculate stop loss (based on default %)
3. User switches to MKT mode → Fetch fresh quote → Update prices
4. User switches SL modes → Respect manual input in Rs mode
```

### Mode-Specific Behavior
```typescript
// Stop Loss Mode Logic
if (stopLossMode === 'percentage') {
  // Auto-calculate price from percentage
  // Update price when percentage changes
} else { // 'price' mode
  // Allow manual Rs input
  // Only update percentage for display
}

// Entry Price Mode Logic  
if (entryPriceMode === 'mkt') {
  // Fetch fresh quote
  // Disable manual input
  // Auto-populate from API
} else { // 'lmt' mode  
  // Enable manual input
  // Use entered price
}
```

## State Management Patterns

### Loading States
```typescript
// Pattern for async operations
setIsLoadingPrice(true);     // Show loading in UI
setIsAutoPopulating(true);   // Prevent validation warnings

try {
  // Async operation
} finally {
  setIsLoadingPrice(false);
  setIsAutoPopulating(false);
}
```

### Form Updates
```typescript
// Always update form data atomically
setFormData((prev) => ({
  ...prev,
  entryPrice: newPrice,
  stopLoss: calculatedStopLoss,
}));
```

## Common Styling Patterns

### Input Field States
```typescript
className={`base-styles ${
  entryPriceMode === 'mkt' 
    ? 'disabled-styles cursor-not-allowed'
    : isLoading 
    ? 'loading-styles' 
    : 'active-styles'
}`}
```

### Grid Layouts
```typescript
// Table headers and rows must match
gridTemplateColumns: '2fr 1fr 1fr 1.2fr 1fr 1fr 1.5fr'

// Column meanings: Symbol | Status | Days | Management | Size | Group | Return
```

## Event Handling Best Practices

### useCallback for Performance
```typescript
const handleInputChange = useCallback((field, value) => {
  // Form update logic
}, [dependencies]);

const fetchLatestQuote = useCallback(async () => {
  // API call logic  
}, [selectedInstrument, settings]);
```

### useEffect for Side Effects
```typescript
// Mode switching
useEffect(() => {
  if (entryPriceMode === 'mkt' && selectedInstrument) {
    fetchLatestQuote();
  }
}, [entryPriceMode, selectedInstrument, fetchLatestQuote]);

// Settings sync
useEffect(() => {
  if (stopLossMode === 'percentage' && shouldRecalculate) {
    // Recalculate stop loss
  }
}, [stopLossMode, entryPrice, percentage]);
```

## Testing Scenarios

### Critical User Flows
1. **Instrument Selection**: Verify both prices auto-populate
2. **MKT Mode Switch**: Confirm fresh quote is fetched
3. **Rs Mode Manual Input**: Ensure no auto-override
4. **% Mode Changes**: Verify price recalculation
5. **Entry Price Changes**: Confirm SL recalculation

### Edge Cases
- No network connectivity during quote fetch
- Invalid instrument selection
- Empty form fields
- Mode switching during loading states

## Performance Considerations

### Optimization Techniques
- Use `useCallback` for expensive operations
- Implement proper dependency arrays
- Batch state updates when possible
- Use loading states to prevent UI flicker

### API Efficiency
- Always use existing service methods
- Implement proper error handling and fallbacks
- Use single instrument quote API for individual lookups
- Batch requests when fetching multiple instruments

---
*This guide helps maintain consistent component patterns and user experience*
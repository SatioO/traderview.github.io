# Development Workflow & Guidelines

## Development Environment
- **Framework**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Data Fetching**: TanStack Query (React Query)
- **Build Tool**: Vite
- **API**: Node.js backend at `localhost:8000`

## Code Quality Standards

### TypeScript Usage
```typescript
// ✅ Always define proper interfaces
interface FormData {
  entryPrice: number;
  stopLoss: number;
  // ...
}

// ✅ Use proper types for state
const [mode, setMode] = useState<'price' | 'percentage'>('price');

// ✅ Type API responses
interface InstrumentQuote {
  last_price: number;
  volume: number;
  // ...
}
```

### Component Structure
```typescript
// ✅ Proper component organization
const ComponentName: React.FC<Props> = ({ prop1, prop2 }) => {
  // 1. State declarations
  const [state, setState] = useState();
  
  // 2. Context/hooks
  const { contextValue } = useContext();
  
  // 3. Callbacks
  const handleAction = useCallback(() => {}, [deps]);
  
  // 4. Effects
  useEffect(() => {}, [deps]);
  
  // 5. Render
  return <div>...</div>;
};
```

## Recent Development Patterns

### Stop Loss Management
```typescript
// Mode-specific behavior pattern
const handleStopLossChange = useCallback((value: string) => {
  if (stopLossMode === 'price') {
    // Allow manual Rs input, update percentage for display only
    handleInputChange('stopLoss', value);
    if (entryPrice > 0) {
      const percentage = ((entryPrice - parseFloat(value)) / entryPrice) * 100;
      setStopLossPercentage(percentage);
    }
  } else {
    // In percentage mode, auto-calculate price
    const percentage = parseFloat(value);
    setStopLossPercentage(percentage);
    const stopPrice = entryPrice * (1 - percentage / 100);
    handleInputChange('stopLoss', stopPrice.toFixed(2));
  }
}, [stopLossMode, entryPrice, handleInputChange]);
```

### Fresh Quote Fetching
```typescript
// Always use existing API services
const fetchFreshQuote = useCallback(async () => {
  if (!selectedInstrument) return;
  
  try {
    setIsLoading(true);
    const quote = await tradingApiService.getSingleInstrumentQuote(
      selectedInstrument.tradingsymbol,
      selectedInstrument.exchange
    );
    
    if (quote?.last_price) {
      updatePrices(quote.last_price);
    }
  } catch (error) {
    handleError(error);
  } finally {
    setIsLoading(false);
  }
}, [selectedInstrument, updatePrices]);
```

## Testing Strategy

### Manual Testing Checklist
```markdown
## Entry Price & Stop Loss Testing
- [ ] Select instrument → Both prices auto-populate
- [ ] Change entry price → Stop loss recalculates  
- [ ] Switch to MKT mode → Fresh quote fetched
- [ ] In Rs mode → Manual SL input allowed
- [ ] In % mode → SL auto-calculates from percentage
- [ ] Mode switching → Values preserved appropriately

## UI/UX Testing  
- [ ] Loading states show during API calls
- [ ] Error handling works gracefully
- [ ] Keyboard navigation functions
- [ ] Responsive design on different screens
- [ ] Accessibility compliance
```

### Common Bug Patterns to Avoid
1. **Auto-calculation conflicts**: Don't override manual input in Rs mode
2. **Stale data usage**: Always fetch fresh quotes for MKT mode
3. **Race conditions**: Proper cleanup in useEffect
4. **Missing loading states**: Always show feedback during async operations
5. **Type errors**: Proper TypeScript usage throughout

## Git Workflow

### Commit Message Format
```
type(scope): brief description

- Detailed explanation of changes
- Why the change was necessary
- Any breaking changes or migration notes
```

### Branch Naming
- `feature/stop-loss-enhancements`
- `fix/portfolio-alignment-issues`
- `refactor/api-service-cleanup`

## Code Review Guidelines

### What to Look For
1. **API Usage**: Using correct endpoints and service methods
2. **Type Safety**: Proper TypeScript usage
3. **Performance**: Proper useCallback/useMemo usage
4. **UX**: Loading states and error handling
5. **Consistency**: Following established patterns

### Common Review Comments
```typescript
// ❌ Avoid direct API calls
const response = await fetch('/api/quotes');

// ✅ Use service methods
const quote = await tradingApiService.getSingleInstrumentQuote();

// ❌ Missing dependency array
useEffect(() => {
  fetchData();
}); // Missing deps

// ✅ Proper dependencies  
useEffect(() => {
  fetchData();
}, [selectedInstrument, mode]);
```

## Debugging Tips

### Common Issues
1. **Stop loss not updating**: Check stopLossMode conditions
2. **Quote not fetching**: Verify instrument selection and API endpoint
3. **UI not updating**: Check state management and re-render triggers
4. **Type errors**: Ensure proper interface definitions

### Debug Tools
```typescript
// Add temporary logging for development
console.log('🎯 Mode switched to:', entryPriceMode);
console.log('📊 Quote fetched:', quote);
console.log('💰 Prices updated:', { entryPrice, stopLoss });
```

## Performance Optimization

### Current Optimizations
- `useCallback` for expensive operations
- Proper dependency arrays to prevent unnecessary re-renders
- Loading states to prevent UI flicker
- Debounced input handling where appropriate

### Future Improvements
- Implement quote caching for frequently accessed instruments
- Add service worker for offline functionality
- Optimize bundle size with code splitting

---
*This workflow ensures consistent, high-quality development practices*
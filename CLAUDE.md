# TradingView Clone - Claude Context & Memory

## Project Overview
A sophisticated trading application built with React + TypeScript that provides comprehensive trading calculator functionality, portfolio management, and broker integration.

## Key Architecture & Components

### Core Trading Components
- **TradingCalculator** (`src/containers/TradingCalculator/TradingCalculator.tsx`)
  - Main trading calculator with risk-based and allocation-based position sizing
  - Entry price modes: Market (MKT) and Limit (LMT)
  - Stop loss modes: Price (Rs) and Percentage (%)
  - Auto-calculation features for entry price and stop loss
  - Instrument selection with live quote fetching

### API Services
- **Primary Quotes API**: `http://localhost:8000/api/instruments/quotes`
  - Use `tradingApiService.getSingleInstrumentQuote(tradingsymbol, exchange)` 
  - Returns `InstrumentQuote` object with `last_price`, `volume`, etc.
  - Always prefer this over other price fetching methods

### Trading Context & State Management
- **TradingContext** (`src/contexts/TradingContext.tsx`)
  - Manages selectedInstrument, quotes, order data
  - Provides `currentPrice` but may not always be fresh
  - Use direct API calls for fresh data when needed

### Key User Preferences
- **Settings** (`src/contexts/SettingsContext.tsx`) 
  - `defaultStopLossPercentage`: User's preferred stop loss %
  - `stopLossMode`: 'price' | 'percentage' - current mode
  - Auto-calculation behavior depends on these settings

## Recent Enhancements & Bug Fixes

### Stop Loss Functionality (Recently Fixed)
1. **Issue**: Stop loss was auto-calculating even in Rs mode
2. **Solution**: Added mode-specific logic
   - **Rs mode**: Manual input allowed, no auto-override
   - **% mode**: Auto-calculation based on percentage
   - **Entry price changes**: Always recalculate SL based on default %
   - **Instrument selection**: Always auto-populate both entry & SL

### Entry Price Mode Switching (Recently Added)
1. **MKT Mode**: Automatically fetches fresh quote via API
2. **Implementation**: Uses `fetchLatestQuote()` callback
3. **API Call**: `tradingApiService.getSingleInstrumentQuote()`
4. **Behavior**: Updates entry price + recalculates stop loss

### Portfolio Display (Recently Fixed)
- **Active Positions Table**: Size column center-aligned
- **Grid Template**: Adjusted to `2fr 1fr 1fr 1.2fr 1fr 1fr 1.5fr`

## Common Patterns & Best Practices

### API Calls
```typescript
// ✅ Correct - Use existing quotes API
const quote = await tradingApiService.getSingleInstrumentQuote(symbol, exchange);
const price = quote.last_price;

// ❌ Avoid - Don't create new API endpoints
```

### Stop Loss Logic
```typescript
// ✅ Correct - Mode-specific behavior
if (stopLossMode === 'percentage') {
  // Auto-calculate from percentage
} else {
  // Allow manual Rs input
}

// ✅ Always recalculate on entry price change
if (field === 'entryPrice') {
  // Calculate SL based on default percentage
}
```

### Loading States
```typescript
// ✅ Correct pattern for async operations
setIsLoadingPrice(true);
setIsAutoPopulating(true);
try {
  // API call
} finally {
  setIsLoadingPrice(false);
  setIsAutoPopulating(false);
}
```

## File Structure Importance
- **Services**: All API calls go through `src/services/`
- **Contexts**: Global state management in `src/contexts/`
- **Components**: Reusable UI in `src/components/`
- **Containers**: Feature-specific logic in `src/containers/`

## Key Dependencies & Tools
- React + TypeScript
- TanStack Query for data fetching
- Tailwind CSS for styling
- Lucide React for icons

## Common User Workflows
1. **Select Instrument** → Auto-populate entry price & stop loss
2. **Switch to MKT mode** → Fetch fresh quote & update prices
3. **Modify entry price** → Auto-recalculate stop loss
4. **Switch SL modes** → Respect manual input in Rs mode
5. **Place order** → Integration with GTT for stop loss management

## Development Guidelines
- Always use existing API endpoints
- Respect user preference settings
- Maintain loading states for better UX
- Follow mode-specific logic patterns
- Test both Rs and % modes thoroughly

## Recent Git Activity
- Fixed stop loss calculation issues
- Enhanced entry price mode switching
- Improved portfolio table alignment
- Added fresh quote fetching on MKT mode

---
*This file helps Claude understand the project context, recent changes, and development patterns for better assistance.*
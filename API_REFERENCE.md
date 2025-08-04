# TradingView API Reference

## Base URL
```
http://localhost:8000/api
```

## Authentication
All API calls use session-based authentication with credentials included.

## Core Endpoints

### 1. Instrument Quotes
**Primary endpoint for all quote data**

```typescript
// Get single instrument quote
GET /instruments/quotes
POST /instruments/quotes

// Service method (PREFERRED)
tradingApiService.getSingleInstrumentQuote(tradingsymbol: string, exchange: string)

// Response format
interface InstrumentQuote {
  instrument_token: number;
  timestamp: string;
  last_trade_time?: string;
  last_price: number;          // ← Use this for entry price
  last_quantity?: number;
  buy_quantity?: number;
  sell_quantity?: number;
  volume: number;
  average_price?: number;
  oi?: number;
}
```

### 2. Instrument Search
```typescript
// Search for trading instruments
GET /instruments/search?query=RELIANCE&exchange=NSE

// Service method
tradingApiService.searchInstruments(query: string, options?)

// Response
interface InstrumentSearchResponse {
  success: boolean;
  instruments: TradingInstrument[];
  count: number;
  // ... pagination data
}
```

### 3. Order Management
```typescript
// Place order
POST /brokers/kite/orders/place

// Service method
orderService.placeOrder(broker: 'kite', orderRequest: PlaceOrderRequest)
orderService.placeOrderWithGTT() // With stop loss GTT integration
```

### 4. Market Data
```typescript
// Alternative market price endpoint (avoid if possible)
GET /instruments/{exchange}/{tradingsymbol}/quote

// Use quotes endpoint instead for consistency
```

## Data Models

### TradingInstrument
```typescript
interface TradingInstrument {
  _id?: string;
  tradingsymbol: string;      // e.g., "RELIANCE"
  exchange: string;           // e.g., "NSE"
  name: string;
  segment: string;
  instrument_type: string;
  tick_size: number;
  lot_size: number;
  instrument_token: number;
}
```

### OrderData
```typescript
interface OrderData {
  tradingsymbol: string;
  exchange: string;
  transaction_type: 'BUY' | 'SELL';
  order_type: 'MARKET' | 'LIMIT' | 'SL' | 'SL-M';
  quantity: number;
  price?: number;
  product: 'CNC' | 'MIS' | 'NRML';
  validity: 'DAY' | 'IOC';
  // ... other fields
}
```

## Service Usage Patterns

### ✅ Correct Usage
```typescript
// Always use the quotes API for price data
const quote = await tradingApiService.getSingleInstrumentQuote('RELIANCE', 'NSE');
const currentPrice = quote.last_price;

// Use order service for placing orders
const orderRequest = orderService.createOrderRequest(instrument, formData, 'mkt', calculations);
await orderService.placeOrderWithGTT(broker, orderRequest, instrument, currentPrice, targetPrice, stopLossMetadata);
```

### ❌ Avoid
```typescript
// Don't create direct fetch calls when service methods exist
const response = await fetch('/api/instruments/quotes');

// Don't use other price endpoints when quotes API is available
const price = await tradingApiService.getMarketPrice(); // Use getSingleInstrumentQuote instead
```

## Error Handling
All services include built-in error handling with proper error messages and fallback mechanisms.

```typescript
try {
  const quote = await tradingApiService.getSingleInstrumentQuote(symbol, exchange);
  // Handle success
} catch (error) {
  console.error('Quote fetch failed:', error);
  // Handle fallback to cached currentPrice if available
}
```

## Rate Limiting & Performance
- Quotes API supports up to 500 instruments per request
- Use batch requests when possible
- Implement proper loading states for async operations

---
*This reference ensures consistent API usage across the application*
import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  type ReactNode,
} from 'react';

// Trading Instrument Interface
export interface TradingInstrument {
  tradingsymbol: string;
  exchange: string;
  name: string;
  segment: string;
  instrument_type: string;
  tick_size: number;
  lot_size: number;
  instrument_token: number;
}

// Order Data Interface (matching Kite Connect API)
export interface OrderData {
  tradingsymbol: string;
  exchange: string;
  transaction_type: 'BUY' | 'SELL';
  order_type: 'MARKET' | 'LIMIT' | 'SL' | 'SL-M';
  quantity: number;
  price?: number;
  trigger_price?: number;
  product: 'CNC' | 'MIS' | 'NRML';
  validity: 'DAY' | 'IOC';
  variety: 'regular' | 'bo' | 'co' | 'iceberg';
  disclosed_quantity?: number;
  squareoff?: number;
  stoploss?: number;
  tag?: string;
}

// Trading State Interface
interface TradingState {
  selectedInstrument: TradingInstrument | null;
  searchResults: TradingInstrument[];
  isSearching: boolean;
  searchQuery: string;
  orderData: Partial<OrderData>;
  orderStatus: 'idle' | 'validating' | 'placing' | 'success' | 'error';
  orderError: string | null;
  calculatedQuantity: number;
  estimatedCost: number;
  brokerageCalculation: {
    brokerage: number;
    taxes: number;
    total: number;
  } | null;
}

// Action Types
type TradingAction =
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_SEARCH_RESULTS'; payload: TradingInstrument[] }
  | { type: 'SET_SEARCHING'; payload: boolean }
  | { type: 'SELECT_INSTRUMENT'; payload: TradingInstrument }
  | { type: 'CLEAR_INSTRUMENT' }
  | { type: 'UPDATE_ORDER_DATA'; payload: Partial<OrderData> }
  | { type: 'SET_CALCULATED_QUANTITY'; payload: number }
  | { type: 'SET_ESTIMATED_COST'; payload: number }
  | { type: 'SET_BROKERAGE_CALCULATION'; payload: TradingState['brokerageCalculation'] }
  | { type: 'SET_ORDER_STATUS'; payload: TradingState['orderStatus'] }
  | { type: 'SET_ORDER_ERROR'; payload: string | null }
  | { type: 'RESET_ORDER' };

// Initial State
const initialState: TradingState = {
  selectedInstrument: null,
  searchResults: [],
  isSearching: false,
  searchQuery: '',
  orderData: {
    transaction_type: 'BUY',
    order_type: 'MARKET',
    product: 'CNC',
    validity: 'DAY',
    variety: 'regular',
  },
  orderStatus: 'idle',
  orderError: null,
  calculatedQuantity: 0,
  estimatedCost: 0,
  brokerageCalculation: null,
};

// Reducer Function
function tradingReducer(state: TradingState, action: TradingAction): TradingState {
  switch (action.type) {
    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.payload };
    
    case 'SET_SEARCH_RESULTS':
      return { ...state, searchResults: action.payload };
    
    case 'SET_SEARCHING':
      return { ...state, isSearching: action.payload };
    
    case 'SELECT_INSTRUMENT':
      return {
        ...state,
        selectedInstrument: action.payload,
        orderData: {
          ...state.orderData,
          tradingsymbol: action.payload.tradingsymbol,
          exchange: action.payload.exchange,
        },
        searchResults: [],
        searchQuery: `${action.payload.tradingsymbol} (${action.payload.exchange})`,
      };
    
    case 'CLEAR_INSTRUMENT':
      return {
        ...state,
        selectedInstrument: null,
        orderData: {
          ...initialState.orderData,
        },
        searchQuery: '',
        searchResults: [],
        calculatedQuantity: 0,
        estimatedCost: 0,
        brokerageCalculation: null,
      };
    
    case 'UPDATE_ORDER_DATA':
      return {
        ...state,
        orderData: { ...state.orderData, ...action.payload },
      };
    
    case 'SET_CALCULATED_QUANTITY':
      return {
        ...state,
        calculatedQuantity: action.payload,
        orderData: { ...state.orderData, quantity: action.payload },
      };
    
    case 'SET_ESTIMATED_COST':
      return { ...state, estimatedCost: action.payload };
    
    case 'SET_BROKERAGE_CALCULATION':
      return { ...state, brokerageCalculation: action.payload };
    
    case 'SET_ORDER_STATUS':
      return { ...state, orderStatus: action.payload };
    
    case 'SET_ORDER_ERROR':
      return { ...state, orderError: action.payload };
    
    case 'RESET_ORDER':
      return {
        ...state,
        orderStatus: 'idle',
        orderError: null,
        orderData: {
          ...state.orderData,
          price: undefined,
          trigger_price: undefined,
        },
      };
    
    default:
      return state;
  }
}

// Context Type
interface TradingContextType {
  state: TradingState;
  dispatch: React.Dispatch<TradingAction>;
  // Helper functions
  setSearchQuery: (query: string) => void;
  setSearchResults: (results: TradingInstrument[]) => void;
  setSearching: (searching: boolean) => void;
  selectInstrument: (instrument: TradingInstrument) => void;
  clearInstrument: () => void;
  updateOrderData: (data: Partial<OrderData>) => void;
  setCalculatedQuantity: (quantity: number) => void;
  setEstimatedCost: (cost: number) => void;
  setBrokerageCalculation: (calculation: TradingState['brokerageCalculation']) => void;
  setOrderStatus: (status: TradingState['orderStatus']) => void;
  setOrderError: (error: string | null) => void;
  resetOrder: () => void;
  // Computed properties
  isOrderReady: boolean;
  canPlaceOrder: boolean;
}

// Create Context
const TradingContext = createContext<TradingContextType | undefined>(undefined);

// Provider Component
interface TradingProviderProps {
  children: ReactNode;
}

export const TradingProvider: React.FC<TradingProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(tradingReducer, initialState);

  // Helper functions
  const setSearchQuery = useCallback((query: string) => {
    dispatch({ type: 'SET_SEARCH_QUERY', payload: query });
  }, []);

  const setSearchResults = useCallback((results: TradingInstrument[]) => {
    dispatch({ type: 'SET_SEARCH_RESULTS', payload: results });
  }, []);

  const setSearching = useCallback((searching: boolean) => {
    dispatch({ type: 'SET_SEARCHING', payload: searching });
  }, []);

  const selectInstrument = useCallback((instrument: TradingInstrument) => {
    dispatch({ type: 'SELECT_INSTRUMENT', payload: instrument });
  }, []);

  const clearInstrument = useCallback(() => {
    dispatch({ type: 'CLEAR_INSTRUMENT' });
  }, []);

  const updateOrderData = useCallback((data: Partial<OrderData>) => {
    dispatch({ type: 'UPDATE_ORDER_DATA', payload: data });
  }, []);

  const setCalculatedQuantity = useCallback((quantity: number) => {
    dispatch({ type: 'SET_CALCULATED_QUANTITY', payload: quantity });
  }, []);

  const setEstimatedCost = useCallback((cost: number) => {
    dispatch({ type: 'SET_ESTIMATED_COST', payload: cost });
  }, []);

  const setBrokerageCalculation = useCallback((calculation: TradingState['brokerageCalculation']) => {
    dispatch({ type: 'SET_BROKERAGE_CALCULATION', payload: calculation });
  }, []);

  const setOrderStatus = useCallback((status: TradingState['orderStatus']) => {
    dispatch({ type: 'SET_ORDER_STATUS', payload: status });
  }, []);

  const setOrderError = useCallback((error: string | null) => {
    dispatch({ type: 'SET_ORDER_ERROR', payload: error });
  }, []);

  const resetOrder = useCallback(() => {
    dispatch({ type: 'RESET_ORDER' });
  }, []);

  // Computed properties
  const isOrderReady = Boolean(
    state.selectedInstrument &&
    state.orderData.tradingsymbol &&
    state.orderData.exchange &&
    state.calculatedQuantity > 0
  );

  const canPlaceOrder = isOrderReady && 
    state.orderStatus !== 'placing' && 
    state.orderStatus !== 'validating';

  const value: TradingContextType = {
    state,
    dispatch,
    setSearchQuery,
    setSearchResults,
    setSearching,
    selectInstrument,
    clearInstrument,
    updateOrderData,
    setCalculatedQuantity,
    setEstimatedCost,
    setBrokerageCalculation,
    setOrderStatus,
    setOrderError,
    resetOrder,
    isOrderReady,
    canPlaceOrder,
  };

  return (
    <TradingContext.Provider value={value}>
      {children}
    </TradingContext.Provider>
  );
};

// Custom hook
export const useTrading = (): TradingContextType => {
  const context = useContext(TradingContext);
  if (context === undefined) {
    throw new Error('useTrading must be used within a TradingProvider');
  }
  return context;
};

export default TradingContext;
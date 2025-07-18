# Kite Integration with Existing Backend Service

This document explains how the frontend integrates with your existing Kite authentication backend service.

## Frontend Integration

The frontend has been refactored to work seamlessly with your existing backend service. Here's how it works:

### 1. Login Flow

1. **User clicks "Login with Kite"** in the login modal
2. **Frontend calls** `GET /api/auth/kite/login-url` to get the login URL
3. **User is redirected** to the Kite login page
4. **After authentication**, Kite redirects back to `/auth/kite/callback`
5. **Frontend extracts** the `request_token` from URL parameters
6. **Frontend calls** `POST /api/auth/kite/callback` with the request token
7. **Backend returns** JWT token and user data
8. **Frontend stores** the JWT token and redirects to main app

### 2. API Integration

The frontend makes these API calls to your backend:

#### Get Login URL
```javascript
GET /api/auth/kite/login-url
```

**Response:**
```json
{
  "loginUrl": "https://kite.trade/connect/login?api_key=xxx&state=xxx",
  "state": "random-state-string",
  "apiKey": "your-api-key"
}
```

#### Handle Callback
```javascript
POST /api/auth/kite/callback
```

**Request:**
```json
{
  "request_token": "token-from-kite",
  "action": "login",
  "status": "success"
}
```

**Response:**
```json
{
  "success": true,
  "accessToken": "jwt-token",
  "user": {
    "id": "user-id",
    "email": "user@example.com", 
    "firstName": "John",
    "lastName": "Doe",
    "broker": "kite"
  }
}
```

### 3. Frontend Configuration

Only the API key is needed on the frontend:

```bash
# .env
VITE_KITE_API_KEY=your_kite_api_key_here
VITE_API_BASE_URL=http://localhost:3000/api
```

### 4. Security

✅ **API Secret stays on backend** - Never exposed to frontend
✅ **State validation** - Your backend handles CSRF protection
✅ **JWT tokens** - Secure session management
✅ **Token refresh** - Automatic token refresh via your backend

### 5. Code Structure

```
src/
├── services/brokers/
│   ├── KiteBrokerService.ts     # Kite-specific implementation
│   ├── BaseBrokerService.ts     # Base class for all brokers
│   └── index.ts                 # Broker registry
├── components/auth/
│   ├── LoginModal.tsx           # Shows Kite login button
│   └── BrokerCallback.tsx       # Handles callback redirect
├── contexts/
│   └── AuthContext.tsx          # Authentication state management
└── types/
    └── broker.ts                # TypeScript interfaces
```

### 6. Adding More Brokers

To add additional brokers in the future:

1. **Create new broker service** (e.g., `AngelBrokerService.ts`)
2. **Add to broker registry** in `index.ts`
3. **Add API key** to environment variables
4. **Implement backend endpoints** following the same pattern

Example for Angel One:
```typescript
// AngelBrokerService.ts
export class AngelBrokerService extends BaseBrokerService {
  async initiateLogin(): Promise<void> {
    const response = await fetch(`${this.apiBaseUrl}/auth/angel/login-url`);
    const { loginUrl } = await response.json();
    window.location.href = loginUrl;
  }
  
  async handleCallback(data: BrokerCallbackData): Promise<BrokerAuthResponse> {
    const response = await fetch(`${this.apiBaseUrl}/auth/angel/callback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        auth_code: data.authCode,
        action: 'login',
        status: 'success',
      }),
    });
    
    return response.json();
  }
}
```

### 7. Benefits

- **Secure**: API secrets never leave the backend
- **Scalable**: Easy to add new brokers
- **Maintainable**: Clean separation of concerns
- **Flexible**: Works with any backend authentication service
- **Type-safe**: Full TypeScript support

Your existing backend service is perfect for this integration!
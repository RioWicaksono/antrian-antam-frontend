# Antrian Frontend - React + Vite

Interface user untuk sistem antrian auto-booking dengan React 18 & TypeScript.

## 🏗️ Tech Stack

- **React 18.2.0**
- **TypeScript**
- **Vite** (Build tool)
- **Tailwind CSS** (Styling)
- **Axios** (HTTP client)
- **React Query** (Data fetching)
- **Zustand** (State management)
- **Socket.IO** (Real-time WebSocket)
- **Radix UI** (Component library)

## 📋 Prerequisites

- Node.js 18+ atau lebih tinggi
- npm 9+ atau yarn 3+

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Create Environment File

Copy `.env.example` ke `.env.local`:

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
VITE_API_BASE_URL=http://localhost:8081/api
VITE_WS_URL=ws://localhost:8081/ws
VITE_ENVIRONMENT=development
```

### 3. Run Development Server

```bash
npm run dev
```

Frontend akan berjalan di: **http://localhost:5173**

## 📦 Project Structure

```
src/
├── components/              # Reusable React components
│   ├── Layout.tsx          # Main layout wrapper
│   ├── Modal.tsx           # Modal component
│   └── StatusBadge.tsx     # Status badge component
├── pages/                  # Page components
│   ├── LoginPage.tsx       # Login page
│   ├── DashboardPage.tsx   # Dashboard
│   ├── TasksPage.tsx       # Tasks management
│   ├── TaskDetailPage.tsx  # Task details
│   ├── TicketsPage.tsx     # Tickets
│   ├── MonitorPage.tsx     # Real-time monitor
│   ├── AccountsPage.tsx    # Accounts
│   ├── ProxiesPage.tsx     # Proxy management
│   ├── CaptchaDBPage.tsx   # Captcha database
│   └── SettingsPage.tsx    # Settings
├── services/               # API & utilities
│   ├── api.ts             # Axios instance & API calls
│   └── websocket.ts       # WebSocket connection
├── store/                  # State management (Zustand)
│   └── authStore.ts       # Auth state
├── types/                  # TypeScript types
│   └── index.ts           # Shared types
├── lib/                    # Utility functions
│   └── utils.ts           # Helper functions
├── App.tsx                # Main App component
├── main.tsx               # Entry point
└── index.css              # Global styles
```

## 🎨 Available Pages

| Page | Route | Description |
|------|-------|-------------|
| Login | `/login` | User authentication |
| Dashboard | `/` | Overview & statistics |
| Tasks | `/tasks` | Task management |
| Task Detail | `/tasks/:id` | Task details |
| Tickets | `/tickets` | Ticket system |
| Monitor | `/monitor` | Real-time monitoring |
| Accounts | `/accounts` | Account management |
| Proxies | `/proxies` | Proxy configuration |
| Captcha DB | `/captcha-db` | Captcha database |
| Settings | `/settings` | User settings |

## 🛠️ Development Commands

### Start Dev Server
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

### Generate Icons
```bash
npm run generate-icons
```

## 🔌 API Integration

### Axios Configuration

File: `src/services/api.ts`

```typescript
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});
```

### Example API Call

```typescript
import { api } from '@/services/api';

// GET request
const response = await api.get('/dashboard/stats');

// POST request
const newTask = await api.post('/tasks', { title: 'New Task' });

// PUT request
await api.put(`/tasks/${id}`, { status: 'completed' });

// DELETE request
await api.delete(`/tasks/${id}`);
```

## 🔄 WebSocket Connection

File: `src/services/websocket.ts`

```typescript
import SockJS from 'sockjs-client';
import StompJs from '@stomp/stompjs';

// Connection established
stompClient.onConnect = () => {
  console.log('WebSocket connected');
  
  // Subscribe to updates
  stompClient.subscribe('/topic/tasks', (message) => {
    console.log('Task update:', message.body);
  });
};
```

## 🎭 State Management

Using Zustand for state management:

```typescript
import create from 'zustand';

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  logout: () => set({ user: null, isAuthenticated: false }),
}));
```

## 🎨 Styling

- **Tailwind CSS** untuk utility-first styling
- **CSS Modules** untuk component-specific styles
- Custom theme di `tailwind.config.js`

### Tailwind Configuration

File: `tailwind.config.js`

```javascript
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Custom colors
      },
    },
  },
  plugins: [],
}
```

## 🐳 Docker Support

### Build Docker Image
```bash
docker build -t antrian-frontend:latest .
```

### Run Container
```bash
docker run -p 3001:80 antrian-frontend:latest
```

Frontend akan accessible di: **http://localhost:3001**

## 📝 Environment Variables

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:8081/api

# WebSocket Configuration
VITE_WS_URL=ws://localhost:8081/ws

# Environment
VITE_ENVIRONMENT=development|production

# Optional
VITE_APP_NAME=Antrian App
```

## 🚨 Troubleshooting

### Port 5173 Already in Use
```bash
# Kill the process
netstat -ano | findstr :5173
taskkill /PID <PORT_ID> /F

# Or use different port
npm run dev -- --port 3000
```

### API Connection Error
```
Failed to fetch from http://localhost:8081
```
✅ Pastikan backend running di http://localhost:8081

### Module Not Found
```bash
# Clear node_modules dan reinstall
rm -r node_modules package-lock.json
npm install
```

### Hot Module Replacement (HMR) Not Working
Edit `vite.config.ts`:
```typescript
export default defineConfig({
  server: {
    hmr: {
      host: 'localhost',
      port: 5173,
    },
  },
});
```

## 📚 Useful Resources

- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [TypeScript](https://www.typescriptlang.org)
- [Radix UI](https://www.radix-ui.com)
- [React Query](https://tanstack.com/query/latest)

## 🎯 Best Practices

1. **Component Structure**: Satu file = satu component
2. **Naming**: PascalCase untuk components, camelCase untuk utils
3. **Type Safety**: Gunakan TypeScript types jangan `any`
4. **API Calls**: Gunakan React Query untuk data fetching
5. **State**: Zustand untuk global state, React hooks untuk local state
6. **Styling**: Tailwind utility classes, hindari inline styles

## 👥 Contributing

1. Clone repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

Private Project

## 📧 Support

Untuk pertanyaan atau issue, hubungi tim development.

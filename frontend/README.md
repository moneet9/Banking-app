# 🚀 Web3 dApp Chat - Production-Ready Frontend

A modern, production-quality Web3 decentralized chat application built with React, TypeScript, and Ethereum wallet integration.

## ✨ Features

### 🔐 Authentication & Security
- **MetaMask Integration** - Connect with MetaMask wallet
- **SIWE (Sign-In with Ethereum)** - Secure signature-based authentication
- **Network Detection** - Automatic testnet verification (Sepolia, Goerli, Mumbai)
- **End-to-End Encryption** - AES-GCM client-side encryption for all messages

### 💬 Chat Functionality
- **1:1 Direct Messaging** - Private conversations
- **Group Chats** - Create and manage group conversations
- **Real-time Messaging** - WebSocket-powered instant delivery
- **Typing Indicators** - See when others are typing
- **Message Status** - Track sending/sent/delivered/failed states
- **Read Receipts** - Unread message counts
- **Online/Offline Status** - User presence indicators

### 🎨 User Experience
- **Mobile-First Design** - Fully responsive UI
- **Optimistic Updates** - Instant UI feedback with rollback on failure
- **Infinite Scroll** - Load message history on demand
- **Toast Notifications** - Clear user feedback
- **Empty States** - Helpful placeholders
- **Loading States** - Skeleton screens and spinners

### 🛡️ Security Features
- **Input Sanitization** - Prevent XSS attacks
- **File Validation** - Size and type checks
- **No Raw HTML Rendering** - Safe message display
- **Encrypted File Uploads** - Secure file sharing (UI ready)
- **Room-Based Encryption** - Unique keys per conversation

## 🏗️ Architecture

### Tech Stack
- **React 18.3** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS v4** - Styling
- **Zustand** - State management
- **React Router v7** - Navigation
- **Wagmi + Viem** - Web3 integration
- **Ethers.js** - Ethereum interactions
- **Socket.IO Client** - Real-time communication
- **SIWE** - Ethereum sign-in protocol
- **Motion (Framer Motion)** - Animations

### Project Structure

```
src/app/
├── components/          # React components
│   ├── chat/           # Chat-specific components
│   │   ├── ChatSidebar.tsx
│   │   ├── ChatListItem.tsx
│   │   ├── ChatRoom.tsx
│   │   ├── ChatHeader.tsx
│   │   ├── MessageList.tsx
│   │   ├── MessageBubble.tsx
│   │   ├── ChatInput.tsx
│   │   ├── TypingIndicator.tsx
│   │   └── WelcomeScreen.tsx
│   ├── modals/         # Modal dialogs
│   │   └── CreateGroupModal.tsx
│   ├── drawers/        # Side drawers
│   │   ├── GroupMembersDrawer.tsx
│   │   └── ProfileDrawer.tsx
│   └── ui/             # Reusable UI components (Radix UI)
│
├── pages/              # Page components
│   ├── LoginPage.tsx
│   └── ChatPage.tsx
│
├── hooks/              # Custom React hooks
│   ├── useWeb3Auth.ts  # Web3 authentication
│   └── useChat.ts      # Chat functionality
│
├── store/              # Zustand state management
│   ├── useAuthStore.ts # Authentication state
│   ├── useChatStore.ts # Chat state
│   └── useUIStore.ts   # UI state
│
├── services/           # API and Socket services
│   ├── mockApi.ts      # Mock REST API client
│   └── mockSocket.ts   # Mock WebSocket client
│
├── utils/              # Utility functions
│   ├── encryption.ts   # Encryption/decryption
│   ├── validation.ts   # Input validation
│   └── format.ts       # Formatting helpers
│
├── config/             # Configuration
│   ├── constants.ts    # App constants
│   └── wagmi.ts        # Wagmi configuration
│
├── types/              # TypeScript types
│   └── index.ts        # All type definitions
│
├── providers/          # React context providers
│   └── Web3Provider.tsx
│
├── routes.tsx          # React Router configuration
└── App.tsx             # Main app component
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm, yarn, or pnpm
- MetaMask browser extension

### Installation

1. **Clone and install dependencies:**
```bash
npm install
# or
pnpm install
# or
yarn install
```

2. **Set up environment variables:**
```bash
cp .env.example .env
```

Edit `.env` with your configuration (optional - works with defaults).

3. **Start development server:**
```bash
npm run dev
# or
pnpm dev
```

4. **Open your browser:**
Navigate to `http://localhost:5173`

### Usage

1. **Connect Wallet:**
   - Click "Connect MetaMask"
   - Approve the connection in MetaMask
   - Ensure you're on a supported testnet

2. **Sign In:**
   - Click "Sign Message"
   - Sign the SIWE message in MetaMask
   - You'll be redirected to the chat interface

3. **Start Chatting:**
   - Click the "+" icon to create a new group
   - Select participants and create
   - Send encrypted messages!

## 🔧 Configuration

### Supported Networks
- **Sepolia Testnet** (Chain ID: 11155111)
- **Goerli Testnet** (Chain ID: 5)
- **Polygon Mumbai** (Chain ID: 80001)

### Environment Variables
```env
VITE_API_URL=http://localhost:3001          # Backend API URL
VITE_SOCKET_URL=http://localhost:3001       # WebSocket server URL
VITE_APP_URL=http://localhost:5173          # Frontend URL
VITE_WALLETCONNECT_PROJECT_ID=              # Optional WalletConnect ID
```

## 🧪 Mock Adapters

The application includes fully functional mock adapters that simulate a real backend:

### Mock API (`mockApi.ts`)
- REST API endpoints for chats, messages, users
- Simulated network delays (300-800ms)
- 10% failure rate for testing error handling
- Persistent mock data during session

### Mock Socket (`mockSocket.ts`)
- WebSocket event simulation
- Real-time message delivery
- Typing indicators
- User status updates
- Auto-reconnection logic

**Note:** Replace mock adapters with real API clients when backend is ready.

## 🔐 Security Best Practices

### Implemented
- ✅ Client-side encryption (AES-GCM 256-bit)
- ✅ Input sanitization and validation
- ✅ XSS prevention (no raw HTML rendering)
- ✅ File type and size validation
- ✅ Signature-based authentication (SIWE)
- ✅ Secure key storage (localStorage - enhance in production)

### Production Recommendations
- 🔒 Use hardware security modules for key storage
- 🔒 Implement rate limiting
- 🔒 Add CSRF protection
- 🔒 Enable content security policy
- 🔒 Use secure WebSocket (WSS)
- 🔒 Implement proper session management
- 🔒 Add backend signature verification

## 📱 Responsive Design

- **Mobile** (<768px): Stacked layout, mobile-optimized navigation
- **Tablet** (768px-1024px): Sidebar + main view
- **Desktop** (>1024px): Full layout with all features

## 🎨 Customization

### Theme
Edit `/src/styles/theme.css` to customize colors and styles.

### Components
All components are built with Radix UI primitives and can be easily customized.

## 🐛 Error Handling

The application includes comprehensive error handling:
- **Network errors** - Retry logic and user notifications
- **Validation errors** - Input feedback
- **Encryption errors** - Graceful fallbacks
- **Authentication errors** - Clear user guidance
- **Optimistic updates** - Automatic rollback on failure

## 📊 State Management

### Zustand Stores

**Auth Store:**
- User authentication state
- Wallet connection status
- Persisted to localStorage

**Chat Store:**
- Chats and messages
- Users and typing indicators
- Loading and error states

**UI Store:**
- Modal and drawer state
- Mobile/desktop detection
- User selections

## 🔄 Real-time Features

- **Message delivery** - Instant via WebSocket
- **Typing indicators** - 3-second timeout
- **User presence** - Online/offline/away status
- **Message status** - Real-time updates
- **Auto-reconnect** - 5 attempts with backoff

## 📝 Type Safety

100% TypeScript coverage with strict mode enabled:
- All props are typed
- No `any` types in production code
- Complete API response types
- Exhaustive union type handling

## 🚀 Production Deployment

### Build
```bash
npm run build
```

### Deploy
Deploy the `dist/` folder to your hosting provider:
- Vercel
- Netlify
- AWS S3 + CloudFront
- Any static hosting service

### Environment
Set production environment variables in your hosting provider dashboard.

## 🤝 Backend Integration

To integrate with a real backend:

1. **Replace Mock API:**
   - Update `/src/app/services/mockApi.ts` with real HTTP calls
   - Use fetch or axios
   - Handle authentication headers

2. **Replace Mock Socket:**
   - Update `/src/app/services/mockSocket.ts` with real Socket.IO connection
   - Update event handlers
   - Handle reconnection logic

3. **Update Configuration:**
   - Set `VITE_API_URL` and `VITE_SOCKET_URL` to production endpoints

4. **Backend Requirements:**
   - SIWE signature verification
   - Chat and message CRUD APIs
   - WebSocket server for real-time events
   - File upload endpoint
   - User management

## 📄 License

MIT License - feel free to use this for your projects!

## 🙏 Credits

Built with:
- [React](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Radix UI](https://www.radix-ui.com/)
- [Wagmi](https://wagmi.sh/)
- [Zustand](https://zustand-demo.pmnd.rs/)
- [Socket.IO](https://socket.io/)

---

**Ready to build the future of decentralized communication! 🚀**

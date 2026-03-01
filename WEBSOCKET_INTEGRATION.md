# WebSocket Messaging Integration Guide

This guide explains how to integrate the WebSocket messaging system into your RentBackend and Zentry applications.

## Backend Setup (RentBackend)

### Installation

1. Install dependencies:
```bash
cd /Users/navneet/MyProjects/RentBackend
npm install
```

### New Files Added

- **src/models/Message.ts** - MongoDB schema for messages
- **src/services/websocket.ts** - WebSocket service handling real-time messaging
- **src/routes/messages.ts** - REST API endpoints for messaging

### Configuration

The WebSocket server is already integrated into `src/index.ts`:
- Uses Socket.IO for real-time communication
- Requires JWT token for authentication
- Listens on the same port as Express server

### Environment Variables

Add to your `.env` file:
```
JWT_SECRET=your-jwt-secret-key
PORT=3000
```

### Starting the Backend

```bash
npm run dev
# or
npm start
```

## Frontend Setup (Zentry)

### Installation

1. Update dependencies:
```bash
cd /Users/navneet/MyProjects/Zentry/zentry
flutter pub get
```

### New Files Added

- **lib/core/services/websocket_service.dart** - WebSocket client service
- **lib/core/services/messaging_api_service.dart** - REST API client for messaging
- **lib/core/models/message_model.dart** - Message and Conversation models
- **lib/core/providers/messaging_providers.dart** - Riverpod providers for state management
- **lib/features/shared/presentation/screens/messaging_screens.dart** - Example UI widgets

### Configuration

Update the base URL in `lib/core/providers/messaging_providers.dart`:

```dart
final messagingApiServiceProvider = Provider<MessagingApiService>((ref) {
  return MessagingApiService(
    baseUrl: 'http://your-server-url:3000', // Update this
    token: '', // Will be set from auth token
  );
});
```

## Usage Guide

### Backend - WebSocket Events

#### Client to Server Events

1. **join_chat** - Join a chat room
```typescript
socket.emit('join_chat', { receiverId: 'user-id' });
```

2. **send_message** - Send a message
```typescript
socket.emit('send_message', { 
  receiverId: 'user-id',
  content: 'message content'
});
```

3. **mark_as_read** - Mark messages as read
```typescript
socket.emit('mark_as_read', { senderId: 'user-id' });
```

4. **typing** - Send typing indicator
```typescript
socket.emit('typing', { receiverId: 'user-id' });
```

5. **stop_typing** - Stop typing indicator
```typescript
socket.emit('stop_typing', { receiverId: 'user-id' });
```

#### Server to Client Events

1. **receive_message** - New message received
```typescript
{
  _id: 'message-id',
  senderId: 'user-id',
  receiverId: 'user-id',
  content: 'message',
  read: false,
  createdAt: 'timestamp'
}
```

2. **user_typing** - User started typing
```typescript
{ userId: 'user-id' }
```

3. **user_stop_typing** - User stopped typing
```typescript
{ userId: 'user-id' }
```

4. **messages_read** - Messages marked as read
```typescript
{ reader: 'user-id', reader_id: 'user-id' }
```

5. **user_online** - User came online
```typescript
{ userId: 'user-id' }
```

6. **user_offline** - User went offline
```typescript
{ userId: 'user-id' }
```

### Backend - REST API Endpoints

All endpoints require JWT authentication token in Authorization header.

1. **GET /api/messages/:userId**
   - Get all messages with a specific user
   - Returns: `{ success: true, messages: [...] }`

2. **GET /api/messages**
   - Get all conversations for current user
   - Returns: `{ success: true, conversations: [...] }`

3. **GET /api/messages/unread/count**
   - Get unread message count
   - Returns: `{ success: true, unreadCount: number }`

4. **DELETE /api/messages/:messageId**
   - Delete a specific message
   - Returns: `{ success: true, message: 'Message deleted' }`

### Frontend - Setup in Your App

1. **Initialize WebSocket in your auth screen or app shell:**

```dart
// After user logs in
final wsService = ref.read(webSocketServiceProvider);
await wsService.connect(
  'http://your-server-url:3000',
  token,
  userId,
);
```

2. **Disconnect when user logs out:**

```dart
final wsService = ref.read(webSocketServiceProvider);
wsService.disconnect();
```

3. **Use the provided UI widgets:**

```dart
// Show conversations
ConversationsScreen(currentUserId: userId)

// Show specific chat
ChatScreen(
  chatUserId: otherUserId,
  chatUserName: userName,
  currentUserId: userId,
)
```

4. **Access messaging providers in your widgets:**

```dart
// Get messages for a user
final messages = ref.watch(messagesProvider('user-id'));

// Get all conversations
final conversations = ref.watch(conversationsProvider);

// Get unread count
final unreadCount = ref.watch(unreadCountProvider);

// Active chat messages (real-time)
final activeMessages = ref.watch(
  activeChatProvider((
    currentUserId: currentUserId,
    chatUserId: chatUserId,
  ))
);
```

## Integration Steps

### Step 1: Backend Integration
1. Install dependencies: `npm install`
2. Restart the backend server: `npm run dev`
3. WebSocket server should now be running on port 3000

### Step 2: Frontend Integration
1. Run: `flutter pub get`
2. Update the base URL in messaging providers
3. Connect WebSocket after authentication
4. Start using the messaging UI

### Step 3: User Authentication
- Ensure JWT token is being used for WebSocket authentication
- The token should be passed in the `token` field during connection
- Token verification happens in the WebSocket middleware

## Testing

### Using Postman for REST Endpoints
1. Set Authorization header: `Bearer <your-jwt-token>`
2. Test endpoints like `/api/messages` to fetch conversations

### Testing WebSocket Connection
Use WebSocket test tools or browser DevTools to test:
1. Connect with valid JWT token
2. Send `join_chat` event
3. Send `send_message` event
4. Verify messages are received in real-time

## Troubleshooting

### WebSocket Connection Issues
- Ensure backend is running
- Check CORS configuration in Socket.IO
- Verify JWT token is valid
- Check browser console for connection errors

### Message Not Sending
- Ensure user is authenticated
- Verify receiverId is valid
- Check server logs for errors

### Typing Indicator Not Working
- Ensure both users are in the same chat room
- Check that `join_chat` was called with correct receiverId

## Features Included

✅ Real-time messaging with WebSocket
✅ Message persistence in MongoDB
✅ Typing indicators
✅ Online/offline status
✅ Message read status
✅ Conversation list
✅ Unread message count
✅ JWT authentication
✅ REST API fallback
✅ Flutter Riverpod integration

## Next Steps

1. Add message notifications
2. Implement message search
3. Add group messaging
4. Add file/image sharing
5. Implement message reactions
6. Add message forwarding
7. Implement end-to-end encryption


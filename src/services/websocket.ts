/**
 * WebSocket Service
 * Handles real-time messaging using Socket.IO
 */

import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import Message from '../models/Message';

interface SocketUser {
  userId: string;
  socketId: string;
}

export class WebSocketService {
  private io: Server;
  private userSockets: Map<string, SocketUser> = new Map();

  constructor(httpServer: HTTPServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    });

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware() {
    this.io.use((socket, next) => {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Authentication error'));
      }

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        (socket.handshake as any).userId = (decoded as any).userId;
        next();
      } catch (err) {
        next(new Error('Authentication error'));
      }
    });
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: Socket) => {
      const userId = (socket.handshake as any).userId;
      console.log(`User ${userId} connected with socket ${socket.id}`);

      // Store user socket mapping
      this.userSockets.set(userId, { userId, socketId: socket.id });

      // Notify others that user is online
      socket.broadcast.emit('user_online', { userId });

      // Handle joining a chat room (conversation between two users)
      socket.on('join_chat', (data: { receiverId: string }) => {
        const roomId = this.generateRoomId(userId, data.receiverId);
        socket.join(roomId);
        console.log(`User ${userId} joined room ${roomId}`);
      });

      // Handle sending messages
      socket.on('send_message', async (data: { receiverId: string; content: string }) => {
        try {
          const roomId = this.generateRoomId(userId, data.receiverId);

          // Save message to database
          const message = new Message({
            senderId: userId,
            receiverId: data.receiverId,
            content: data.content,
          });

          await message.save();

          // Emit message to room
          this.io.to(roomId).emit('receive_message', {
            _id: message._id,
            senderId: userId,
            receiverId: data.receiverId,
            content: data.content,
            read: false,
            createdAt: message.createdAt,
          });

          console.log(`Message sent from ${userId} to ${data.receiverId}`);
        } catch (error) {
          console.error('Error sending message:', error);
          socket.emit('error', { message: 'Failed to send message' });
        }
      });

      // Handle marking messages as read
      socket.on('mark_as_read', async (data: { senderId: string }) => {
        try {
          await Message.updateMany(
            { senderId: data.senderId, receiverId: userId, read: false },
            { read: true }
          );

          const roomId = this.generateRoomId(userId, data.senderId);
          this.io.to(roomId).emit('messages_read', {
            reader: userId,
            reader_id: userId,
          });

          console.log(`Messages marked as read for ${userId}`);
        } catch (error) {
          console.error('Error marking messages as read:', error);
        }
      });

      // Handle typing indicator
      socket.on('typing', (data: { receiverId: string }) => {
        const roomId = this.generateRoomId(userId, data.receiverId);
        socket.to(roomId).emit('user_typing', { userId });
      });

      // Handle stop typing
      socket.on('stop_typing', (data: { receiverId: string }) => {
        const roomId = this.generateRoomId(userId, data.receiverId);
        socket.to(roomId).emit('user_stop_typing', { userId });
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        console.log(`User ${userId} disconnected`);
        this.userSockets.delete(userId);

        // Notify others that user is offline
        socket.broadcast.emit('user_offline', { userId });
      });

      // Handle errors
      socket.on('error', (error: any) => {
        console.error(`Socket error for user ${userId}:`, error);
      });
    });
  }

  private generateRoomId(userId: string, receiverId: string): string {
    // Generate consistent room ID regardless of order
    return [userId, receiverId].sort().join('_');
  }

  public getUserSocket(userId: string): SocketUser | undefined {
    return this.userSockets.get(userId);
  }

  public getIO(): Server {
    return this.io;
  }

  public isUserOnline(userId: string): boolean {
    return this.userSockets.has(userId);
  }
}

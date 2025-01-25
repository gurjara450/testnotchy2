// types/next.d.ts

import { Server as HTTPServer } from 'http';
import { Socket } from 'net';
import { Server as WebSocketServer } from 'ws';
import { NextApiResponse } from 'next';

export type NextApiResponseServerIO = NextApiResponse & {
  socket: Socket & {
    server: HTTPServer & {
      // WebSocket server instance
      wss: WebSocketServer;
    };
  };
};
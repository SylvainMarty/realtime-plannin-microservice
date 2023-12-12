import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { PlanningService } from './planning.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  transports: ['websocket'],
})
export class PlanningGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  constructor(private readonly planningService: PlanningService) {}

  @WebSocketServer()
  server: Server;
  wsClients: Record<string, WebSocket> = {};
  userIdsByDate: Record<string, string[]> = {};
  logger: Logger = new Logger(PlanningGateway.name);

  handleConnection(client: WebSocket) {
    this.logger.debug('Handle websocket client connected');
    const newUserId = uuidv4();
    this.wsClients[newUserId] = client;
    this.logger.log(`User connected | newUserId=${newUserId}`);
    client.send(
      JSON.stringify({ event: 'userIdCreated', data: { userId: newUserId } }),
    );
  }

  handleDisconnect(client: WebSocket) {
    this.logger.debug('Handle websocket client disconnected');
    const clients = Object.entries(this.wsClients);
    let disconnectedUserId;
    for (let i = 0; i < clients.length; i++) {
      const [userId, wsClient] = clients[i];
      if (wsClient === client) {
        disconnectedUserId = userId;
        delete this.wsClients[userId];
        break;
      }
    }
    if (disconnectedUserId) {
      for (const date in this.userIdsByDate) {
        const userIds = this.userIdsByDate[date];
        const index = userIds.indexOf(disconnectedUserId);
        if (index >= 0) {
          userIds.splice(index, 1);
        }
      }
      this.logger.log(
        `User disconnected | disconnectedUserId=${disconnectedUserId}`,
      );
    }
  }

  @SubscribeMessage('preparePlanning')
  async onPreparePlanning(
    @ConnectedSocket() client: WebSocket,
    @MessageBody()
    { from, to, userId }: { from: string; to: string; userId: string },
  ): Promise<void> {
    console.log({ from, to, userId });
    const planning = this.planningService.getPlanning(new Date(from), new Date(to));
    for (const p of planning) {
      if (!this.userIdsByDate[p.date]) {
        this.userIdsByDate[p.date] = [];
      }
      this.userIdsByDate[p.date].push(userId);
    }
    this.logger.log(`Planning prepared | userId=${userId}`, [planning, this.userIdsByDate]);
    client.send(
      JSON.stringify({
        event: 'planningReady',
        data: {
          planning,
        },
      }),
    );
  }

  updateClients(dates: string[]) {
    const datesByUserId: Record<string, string[]> = dates.reduce(
      (acc, curr) => {
        const userIds = this.userIdsByDate[curr];
        if (!userIds) {
          return acc;
        }
        for (const userId of userIds) {
          if (!acc[userId]) {
            acc[userId] = [];
          }
          acc[userId].push(curr);
        }
        return acc;
      },
      {},
    );
    for (const userId in datesByUserId) {
      const wsClient = this.wsClients[userId];
      if (!wsClient) {
        continue;
      }
      const dates = datesByUserId[userId];
      this.logger.log(`Planning updated | userId=${userId}`);
      wsClient.send(
        JSON.stringify({
          event: 'planningReady',
          data: {
            planning: this.planningService.getPlanning(
              new Date(dates[0]),
              new Date(dates[dates.length - 1]),
            ),
          },
        }),
      );
    }
  }
}

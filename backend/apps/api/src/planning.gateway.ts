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
import { addDays, format } from 'date-fns';

const DATE_INDEX_FORMAT = 'yyyy-MM-dd';

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
        if (!!this.userIdsByDate[date] && !this.userIdsByDate[date].length) {
          delete this.userIdsByDate[date];
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
    const fromDate = new Date(from);
    const toDate = new Date(to);
    this.syncUserIdsByDate(fromDate, toDate, userId);
    const planning = this.planningService.getPlanning(fromDate, toDate);
    this.logger.log(
      `Planning prepared | userId=${userId} planningSize=${planning.length}`,
    );
    client.send(
      JSON.stringify({
        event: 'planningReady',
        data: {
          planning,
        },
      }),
    );
  }

  private syncUserIdsByDate(from: Date, to: Date, userId: string): void {
    // Remove userId from all date indexes
    for (const date in this.userIdsByDate) {
      const userIds = this.userIdsByDate[date];
      const index = userIds.indexOf(userId);
      if (index >= 0) {
        userIds.splice(index, 1);
      }
      if (!!this.userIdsByDate[date] && !this.userIdsByDate[date].length) {
        delete this.userIdsByDate[date];
      }
    }

    let currDate = format(from, DATE_INDEX_FORMAT);
    let count = 1;
    const end = format(addDays(to, 1), DATE_INDEX_FORMAT);
    while (currDate !== end) {
      if (!this.userIdsByDate[currDate]) {
        this.userIdsByDate[currDate] = [];
      }
      this.userIdsByDate[currDate].push(userId);
      currDate = format(addDays(from, count), DATE_INDEX_FORMAT);
      count++;
    }
    this.logger.log(`UserIdsByDate synced | userId=${userId}`);
    console.log(this.userIdsByDate);
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

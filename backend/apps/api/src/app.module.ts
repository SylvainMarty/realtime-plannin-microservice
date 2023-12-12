import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { SharedModule } from '@shared';

@Module({
  imports: [SharedModule],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}

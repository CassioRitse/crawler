import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Crawler } from './crawler';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService, Crawler],
})
export class AppModule {}

import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Crawler } from './crawler';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly crawler: Crawler,
  ) {}

  @Get()
  getHello(): string {
    this.crawler.download();
    return this.appService.getHello();
  }

  @Get('all')
  getoab(): any {
    return this.crawler.getAllProcesses();
  }
}

import { Controller, Get, Query } from '@nestjs/common';
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
    this.crawler.downloadPdf();
    return this.appService.getHello();
  }

  @Get('all')
  getoab(): any {
    return this.crawler.execute();
  }

  @Get('/filtro')
  getone(@Query('keywords') keywords: Array<string> | string): any {
    const keywordsArray = Array.isArray(keywords) ? keywords : [keywords];
    return this.crawler.execute(keywordsArray);
  }
}

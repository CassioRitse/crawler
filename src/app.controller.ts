import { Controller, Get, Param } from '@nestjs/common';
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

  @Get('/:keyword')
  getone(@Param() params: any): any {
    return this.crawler.execute(params.keyword);
  }
}

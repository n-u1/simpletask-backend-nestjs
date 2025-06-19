import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  constructor(private readonly configService: ConfigService) {}

  getHello(): string {
    const appName = this.configService.getOrThrow<string>('app.name');
    const version = this.configService.getOrThrow<string>('app.version');
    return `${appName} v${version} is running!`;
  }

  getAppInfo(): {
    name: string;
    version: string;
    environment: string;
    apiPrefix: string;
  } {
    return {
      name: this.configService.getOrThrow<string>('app.name'),
      version: this.configService.getOrThrow<string>('app.version'),
      environment: this.configService.getOrThrow<string>('app.environment'),
      apiPrefix: this.configService.getOrThrow<string>('app.apiPrefix'),
    };
  }
}

import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(name?: string): string {
    if (name !== undefined && name.length > 0) {
      return `Hello ${name}!`;
    }
    return 'Hello World!';
  }
}

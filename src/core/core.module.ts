import { Global, Module } from '@nestjs/common';
import { TokenVersionService } from './services/token-version.service.js';

@Global()
@Module({
    providers: [TokenVersionService],
    exports: [TokenVersionService],
})
export class CoreModule { }

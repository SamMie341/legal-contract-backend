import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';

@Global()
@Module({
    providers: [PrismaService],
    exports: [PrismaService], // Export ให้ Module อื่นใช้ได้เลยเพราะเป็น Global
})
export class PrismaModule { }
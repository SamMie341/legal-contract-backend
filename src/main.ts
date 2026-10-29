import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';

// รองรับการแปลงค่า BigInt จาก Prisma (เช่น fileSize, AuditLog.id) เป็น JSON อัตโนมัติ
(BigInt.prototype as any).toJSON = function () {
  return Number(this) <= Number.MAX_SAFE_INTEGER ? Number(this) : this.toString();
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  // app.enableCors();

  const config = new DocumentBuilder()
    .setTitle('Legal Contract Management API')
    .setDescription('ລະບົບຈັດເກັບຂໍ້ມູນ ພະແນກສັນຍາທົ່ວໄປ (Legal Contract Management System API)')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT ?? 3001);
}
await bootstrap();

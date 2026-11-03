import { Module } from '@nestjs/common';
import { CoreModule } from './core/core.module.js';
import { PrismaModule } from './infrastructure/database/prisma.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { ConfigModule } from '@nestjs/config';
import { ContractsModule } from './modules/contracts/contracts.module.js';
import { ContractTypesModule } from './modules/contract-types/contract-types.module.js';
import { PowerContractsModule } from './modules/power-contracts/power-contracts.module.js';
import { DepartmentsModule } from './modules/departments/departments.module.js';
import { LegalDocumentsModule } from './modules/legal-documents/legal-documents.module.js';
import { LegalCasesModule } from './modules/legal-cases/legal-cases.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { RolesModule } from './modules/roles/roles.module.js';
import { SupportModule } from './modules/support/support.module.js';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module.js';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    CoreModule,
    PrismaModule,
    AuthModule,
    ContractsModule,
    ContractTypesModule,
    PowerContractsModule,
    DepartmentsModule,
    LegalDocumentsModule,
    LegalCasesModule,
    UsersModule,
    RolesModule,
    SupportModule,
    AuditLogsModule,
  ],
})
export class AppModule { }

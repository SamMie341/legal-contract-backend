import { SetMetadata } from '@nestjs/common';
import { SystemModule } from '../constants/division.constant.js';

export const REQUIRED_MODULE_KEY = 'required_module';
export const RequiredModule = (module: SystemModule | null) => SetMetadata(REQUIRED_MODULE_KEY, module);

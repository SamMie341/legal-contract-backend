import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    ParseUUIDPipe,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../core/guards/roles.guard.js';
import { DivisionGuard } from '../../../core/guards/division.guard.js';
import { RequiredModule } from '../../../core/decorators/required-module.decorator.js';
import { SystemModule } from '../../../core/constants/division.constant.js';
import { Roles } from '../../../core/decorators/roles.decorator.js';
import { CurrentUser } from '../../../core/decorators/current-user.decorator.js';

import { CreateUserDto } from '../application/dto/create-user.dto.js';
import { UpdateUserDto } from '../application/dto/update-user.dto.js';
import { ResetPasswordDto } from '../application/dto/reset-password.dto.js';
import { ChangePasswordDto } from '../application/dto/change-password.dto.js';

import { GetHrmEmployeeUseCase } from '../application/use-cases/get-hrm-employee.use-case.js';
import { CreateUserUseCase } from '../application/use-cases/create-user.use-case.js';
import { GetUsersUseCase } from '../application/use-cases/get-users.use-case.js';
import { GetUserByIdUseCase } from '../application/use-cases/get-user-by-id.use-case.js';
import { UpdateUserUseCase } from '../application/use-cases/update-user.use-case.js';
import { DeleteUserUseCase } from '../application/use-cases/delete-user.use-case.js';
import { ResetPasswordUseCase } from '../application/use-cases/reset-password.use-case.js';
import { ChangePasswordUseCase } from '../application/use-cases/change-password.use-case.js';

@ApiTags('Users (ການຈັດການຜູ້ໃຊ້ ແລະ Sync ຈາກ HRM)')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard, DivisionGuard)
@RequiredModule(SystemModule.USERS)
@Roles(UserRole.ADMIN)
export class UsersController {
    constructor(
        private readonly getHrmEmployeeUseCase: GetHrmEmployeeUseCase,
        private readonly createUserUseCase: CreateUserUseCase,
        private readonly getUsersUseCase: GetUsersUseCase,
        private readonly getUserByIdUseCase: GetUserByIdUseCase,
        private readonly updateUserUseCase: UpdateUserUseCase,
        private readonly deleteUserUseCase: DeleteUserUseCase,
        private readonly resetPasswordUseCase: ResetPasswordUseCase,
        private readonly changePasswordUseCase: ChangePasswordUseCase,
    ) { }

    @ApiOperation({ summary: 'ປ່ຽນລະຫັດຜ່ານຂອງຕົນເອງ (Change Password - ສຳລັບຜູ້ໃຊ້ທົ່ວໄປ ແລະ Admin)' })
    @Patch('change-password')
    @Roles(UserRole.ADMIN, UserRole.MAIN_USER, UserRole.EDITOR, UserRole.VIEWER)
    @RequiredModule(null)
    async changePassword(
        @Body() dto: ChangePasswordDto,
        @CurrentUser() user: any,
    ) {
        return this.changePasswordUseCase.execute(user.userId, dto);
    }

    @ApiOperation({ summary: 'ຣີເຊັດລະຫັດຜ່ານຂອງຜູ້ໃຊ້ (ສະເພາະ Admin)' })
    @Roles(UserRole.ADMIN)
    @Patch(':id/reset-password')
    async resetPassword(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: ResetPasswordDto,
        @CurrentUser() user: any,
    ) {
        return this.resetPasswordUseCase.execute(id, dto, user.userId);
    }

    @ApiOperation({
        summary: 'ຄົ້ນຫາຂໍ້ມູນພະນັກງານຈາກ HRM ດ້ວຍລະຫັດພະນັກງານ (ສຳລັບ Auto-fill ກ່ອນກົດບັນທຶກ)',
    })
    @Get('hrm/:empCode')
    async lookupHrmEmployee(@Param('empCode') empCode: string) {
        return this.getHrmEmployeeUseCase.execute(empCode);
    }

    @ApiOperation({ summary: 'ດຶງລາຍຊື່ຜູ້ໃຊ້ທັງໝົດ ພ້ອມ Pagination ແລະ Filter' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'search', required: false, type: String })
    @ApiQuery({ name: 'role', required: false, enum: UserRole })
    @ApiQuery({ name: 'isActive', required: false, type: Boolean })
    @Get()
    async findAll(@Query() query: any) {
        return this.getUsersUseCase.execute(query);
    }

    @ApiOperation({ summary: 'ດຶງຂໍ້ມູນຜູ້ໃຊ້ລາຍບຸກຄົນຕາມ ID' })
    @Get(':id')
    async findById(@Param('id', ParseUUIDPipe) id: string) {
        return this.getUserByIdUseCase.execute(id);
    }

    @ApiOperation({
        summary: 'ເພີ່ມຜູ້ໃຊ້ໃໝ່ໂດຍການປ້ອນລະຫັດພະນັກງານ ແລ້ວດຶງຂໍ້ມູນຈາກ HRM ອັດຕະໂນມັດ (ຂໍ້ 2)',
    })
    @Post()
    async create(
        @Body() dto: CreateUserDto,
        @CurrentUser() user: any,
    ) {
        return this.createUserUseCase.execute(dto, user.userId);
    }

    @ApiOperation({ summary: 'ແກ້ໄຂບົດບາດ, ສະຖານະ ແລະ ສິດທິລະອຽດຂອງຜູ້ໃຊ້ (ອັບໂຫຼດ, ແກ້ໄຂ, ລົບ, ດາວໂຫຼດ, View) (ຂໍ້ 2, 3, 4, 5)' })
    @Patch(':id')
    async update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateUserDto,
        @CurrentUser() user: any,
    ) {
        return this.updateUserUseCase.execute(id, dto, user.userId);
    }

    @ApiOperation({ summary: 'ລົບບັນຊີຜູ້ໃຊ້ (Soft Delete) (ຂໍ້ 2)' })
    @Delete(':id')
    async delete(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() user: any,
    ) {
        return this.deleteUserUseCase.execute(id, user.userId);
    }
}

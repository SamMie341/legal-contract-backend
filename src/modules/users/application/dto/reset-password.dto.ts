import { IsString, IsOptional, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ResetPasswordDto {
    @ApiPropertyOptional({
        description: 'ລະຫັດຜ່ານໃໝ່ (ຫາກບໍ່ລະບຸ ລະບົບຈະກຳນົດເປັນຄ່າເລີ່ມຕົ້ນ)',
        example: 'NewAdminSetPass@2026',
        minLength: 6,
    })
    @IsOptional()
    @IsString()
    @MinLength(6, { message: 'ລະຫັດຜ່ານໃໝ່ຕ້ອງມີຢ່າງໜ້ອຍ 6 ຕົວອັກສອນ' })
    newPassword?: string;
}

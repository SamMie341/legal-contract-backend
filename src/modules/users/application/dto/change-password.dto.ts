import { IsString, IsNotEmpty, MinLength, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ChangePasswordDto {
    @ApiProperty({
        description: 'ລະຫັດຜ່ານປັດຈຸບັນ',
        example: 'CurrentPass@123',
    })
    @IsString()
    @IsNotEmpty({ message: 'ກະລຸນາປ້ອນລະຫັດຜ່ານປັດຈຸບັນ' })
    currentPassword: string;

    @ApiProperty({
        description: 'ລະຫັດຜ່ານໃໝ່ (ຢ່າງໜ້ອຍ 6 ຕົວອັກສອນ)',
        example: 'NewSecurePass@2026',
        minLength: 6,
    })
    @IsString()
    @IsNotEmpty({ message: 'ກະລຸນາປ້ອນລະຫັດຜ່ານໃໝ່' })
    @MinLength(6, { message: 'ລະຫັດຜ່ານໃໝ່ຕ້ອງມີຢ່າງໜ້ອຍ 6 ຕົວອັກສອນ' })
    newPassword: string;

    @ApiPropertyOptional({
        description: 'ຢືນຢັນລະຫັດຜ່ານໃໝ່',
        example: 'NewSecurePass@2026',
    })
    @IsOptional()
    @IsString()
    confirmPassword?: string;
}

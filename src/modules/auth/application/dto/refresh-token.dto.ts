import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenDto {
    @ApiProperty({
        description: 'Refresh Token ທີ່ໄດ້ຮັບຕອນເຂົ້າສູ່ລະບົບ',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    })
    @IsNotEmpty({ message: 'ກະລຸນາສົ່ງ refreshToken ມາພ້ອມ' })
    @IsString()
    refreshToken!: string;
}

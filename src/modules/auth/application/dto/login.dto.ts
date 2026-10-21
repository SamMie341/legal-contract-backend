import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
    @IsNotEmpty({ message: 'ກະລຸນາປ້ອນຊື່ຜູ້ໃຊ້ (Username)' })
    @IsString()
    username: string;

    @IsNotEmpty({ message: 'ກະລຸນາປ້ອນລະຫັດຜ່ານ (Password)' })
    @IsString()
    password: string;
}
import { createZodDto } from 'nestjs-zod';
import { GetRentalsSchema } from '@repo/shared-types';

export class GetRentalsDto extends createZodDto(GetRentalsSchema) {}

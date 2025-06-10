import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';

config();

const configService = new ConfigService();

// CLI用のDataSource（localhost使用）
export default new DataSource({
  type: 'postgres',
  host: configService.get('CLI_DB_HOST', 'localhost'),
  port: parseInt(configService.get('CLI_DB_PORT', '5432'), 10),
  username: configService.getOrThrow('DB_USER'),
  password: configService.getOrThrow('DB_PASSWORD'),
  database: configService.getOrThrow('DB_NAME'),

  entities: ['src/**/*.entity.ts'],
  migrations: ['database/migrations/*.ts'],
  migrationsTableName: 'typeorm_migrations',

  synchronize: false,
  logging: false,
});

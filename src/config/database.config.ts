import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'blog_system',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  synchronize: process.env.APP_ENV === 'development',
  logging: process.env.APP_ENV === 'development',
  timezone: '+08:00',
  charset: 'utf8mb4',
}));
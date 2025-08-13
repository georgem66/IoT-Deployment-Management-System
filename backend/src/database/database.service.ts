import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class DatabaseService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    try {
      await this.$connect();
      console.log('Database connection established successfully');
    } catch (error) {
      console.error('Failed to connect to the database:', error);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  async cleanDatabase() {
    if (process.env.NODE_ENV === 'test') {
      const models = Reflect.ownKeys(this).filter((key) => {
        return typeof key === 'string' && key[0] !== '_';
      });
      return Promise.all(models.map((modelKey) => {
        const key = modelKey as string;
        return this[key].deleteMany();
      }));
    }
  }
}

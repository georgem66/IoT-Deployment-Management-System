import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class DatabaseService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    try {
      await this.$connect();
      console.log('Database connection established successfully');
    } catch (error) {
      // Do not expose connection details or accept requests without persistence.
      throw new Error('Database connection failed; check DATABASE_URL and database availability');
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

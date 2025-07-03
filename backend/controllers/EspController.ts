import type { FastifyInstance } from "fastify";
import type { PrismaClient } from "../generated/prisma";

export class EspController {
  constructor(private prisma: PrismaClient) {}
  /**
   * getLights
   */
  public async getLightStatus() {
    const lights = await this.prisma.billyardTable.findMany();
    return lights;
  }
}

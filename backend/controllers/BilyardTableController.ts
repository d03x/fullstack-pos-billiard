import type { FastifyReply, FastifyRequest } from "fastify";
import type {
  BillyardTableStatus,
  LightStatus,
  PrismaClient,
} from "../generated/prisma/client";

export class BilyardTableController {
  constructor(private prisma: PrismaClient) {}

  public async getTables() {
    try {
      const tables = await this.prisma.billyardTable.findMany();
      return tables;
    } catch (error) {
      console.error("Error fetching tables:", error);
      throw new Error("Failed to fetch tables");
    }
  }

  public async getTableById(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: number };
    try {
      const table = await this.prisma.billyardTable.findUnique({
        where: { id: Number(id) },
      });
      if (!table) {
        return reply.status(404).send({ error: "Table not found" });
      }
      reply.status(200).send(table);
    } catch (error) {
      console.error("Error fetching table:", error);
      reply.status(500).send({ error: "Failed to fetch table", errors: error });
    }
  }

  public async destroyTable(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: number };
    try {
      const table = await this.prisma.billyardTable.delete({
        where: { id: Number(id) },
      });
      reply.status(200).send(table);
    } catch (error) {
      console.error("Error deleting table:", error);
      reply.status(500).send({ error: "Failed to delete table", errors: error });
    }
  }

  public async updateTable(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: number };
    const { name, status, light_status, esp_pin, start_time, end_time } = request.body as {
      name: string;
      status: BillyardTableStatus;
      light_status: LightStatus;
      esp_pin?: string;
      start_time?: Date;
      end_time?: Date;
    };

    try {
      const table = await this.prisma.billyardTable.update({
        where: { id: Number(id) },
        data: { name, status, light_status, esp_pin, start_time, end_time },
      });
      reply.status(200).send(table);
    } catch (error) {
      console.error("Error updating table:", error);
      reply.status(500).send({ error: "Failed to update table", errors: error });
    }
  }

  public async updateTableStatus(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: number };
    const { status } = request.body as { status: BillyardTableStatus };
    try {
      const table = await this.prisma.billyardTable.update({
        where: { id: Number(id) },
        data: { status },
      });
      reply.status(200).send(table);
    } catch (error) {
      console.error("Error updating table status:", error);
      reply.status(500).send({ error: "Failed to update table status", errors: error });
    }
  }

  public async updateLightStatus(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: number };
    const { light_status } = request.body as { light_status: LightStatus };
    try {
      const table = await this.prisma.billyardTable.update({
        where: { id: Number(id) },
        data: { light_status },
      });
      reply.status(200).send(table);
    } catch (error) {
      console.error("Error updating light status:", error);
      reply.status(500).send({ error: "Failed to update light status", errors: error });
    }
  }

  public async addNewTable(request: FastifyRequest, reply: FastifyReply) {
    const { name, status, light_status, esp_pin, start_time, end_time } = request.body as {
      name: string;
      status?: BillyardTableStatus;
      light_status?: LightStatus;
      esp_pin?: string;
      start_time?: Date;
      end_time?: Date;
    };
    try {
      const newTable = await this.prisma.billyardTable.create({
        data: {
          name,
          status: status ?? "KOSONG",
          light_status: light_status ?? "OFF",
          esp_pin,
          start_time,
          end_time,
        },
      });
      reply.status(201).send(newTable);
    } catch (error) {
      console.error("Error adding new table:", error);
      reply.status(500).send({ error: "Failed to add new table", errors: error });
    }
  }
}

import type { FastifyInstance } from "fastify";
import { EspController } from "../controllers/EspController";
import { BilyardTableController } from "../controllers/BilyardTableController";

export const BilyardTableRoute = async (app: FastifyInstance) => {
  const prisma = app.prisma; // Access the Prisma client from the Fastify instance
  const TableController: BilyardTableController = new BilyardTableController(
    prisma
  );
  app.patch(
    "/api/billyard_table/:id/update-status",
    TableController.updateTableStatus.bind(TableController)
  );
  app.patch(
    "/api/billyard_table/:id/update-light-status",
    TableController.updateLightStatus.bind(TableController)
  );
  app.put(
    "/api/billyard_table",
    TableController.addNewTable.bind(TableController)
  );
  app.patch(
    "/api/billyard_table/:id/update",
    TableController.updateTable.bind(TableController)
  );
  app.delete(
    "/api/billyard_table/:id/delete",
    TableController.destroyTable.bind(TableController)
  );
  app.get(
    "/api/billyard_table",
    TableController.getTables.bind(TableController)
  );
  app.get(
    "/api/billyard_table/:id",
    TableController.getTableById.bind(TableController)
  );
};

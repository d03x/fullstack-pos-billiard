import type { FastifyReply, FastifyRequest } from "fastify";
import { type PrismaClient } from "../generated/prisma/client";
import { formatRupiah } from "../formatRupiah";
import dayjs from "dayjs";
interface CreateBookingRequest {
  customer_name: string;
  tableId: number;
  startTime: string;
  durationHours: number;
  notes: string;
}
export class PoolController {
  constructor(private prisma: PrismaClient) {}

  /**
   * async get
   */
  public async get(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = await this.prisma.poolTables.findMany({
        include: {
          PoolBookings: true,
        },
      });
      return data.map((data) => {
        const order = data.PoolBookings?.find(
          (booking) =>
            booking.status !== "Completed" && booking.status !== "Cancelled"
        );

        const isAvailable = !order || data.status === "Available";

        return {
          ...data,
          PoolBookings: order,
          history: data.PoolBookings,
          isAvailable: isAvailable,
        };
      });
    } catch (error) {
      return error;
    }
  }
  public async extendHourBooking(request:FastifyRequest, reply: FastifyReply) {
    try {
      const { bookingId, hours } = request.body as {
        bookingId: number;
        hours: number;
      };
      console.log("Extending booking:", bookingId, hours);
      
      if (!bookingId || !hours) {
        return reply.status(400).send({
          error: "Missing required fields: bookingId, additionalHours",
        });
      }

      const booking = await this.prisma.poolBookings.findUnique({
        where: { id: bookingId },
      });

      if (!booking) {
        return reply.status(404).send({ error: "Booking not found" });
      }

     

      const newEndTime = dayjs(booking.endTime)
        .add(hours, "hour")
        .toISOString();

      const updatedBooking = await this.prisma.poolBookings.update({
        where: { id: bookingId },
        data: {
          endTime: newEndTime,
          durationHours: booking.durationHours + hours,
          totalPrice:
            booking.totalPrice + booking.hourlyRate * hours,
        },
      });

      return reply.status(200).send({
        message: "Booking extended successfully",
        booking: updatedBooking,
      });
    } catch (error) {
      console.error("Error extending booking:", error);
      return reply.status(500).send({ error: "Internal server error" });
    }

  }
  public async createBooking(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { customer_name, tableId, startTime, durationHours, notes } =
        request.body as CreateBookingRequest;

      // Validate required fields
      if (!customer_name || !tableId || !startTime || !durationHours) {
        return reply.status(400).send({
          error:
            "Missing required fields: customer_name, tableId, startTime, durationHours",
        });
      }

      // Check if table exists and is available
      const poolTable = await this.prisma.poolTables.findUnique({
        where: { id: tableId },
      });

      if (!poolTable) {
        return reply.status(404).send({ error: "Table not found" });
      }

      if (poolTable.status !== "Available") {
        return reply
          .status(400)
          .send({ error: "Table is not available for booking" });
      }

      // Parse and validate times
      const startDateTime = dayjs(startTime);
      const endDateTime = startDateTime.add(durationHours, "hour");

      if (!startDateTime.isValid()) {
        return reply.status(400).send({ error: "Invalid start time format" });
      }

      // Check for overlapping bookings
      const overlappingBookings = await this.prisma.poolBookings.findMany({
        where: {
          tableId,
          OR: [
            {
              startTime: { lt: endDateTime.toISOString() },
              endTime: { gt: startDateTime.toISOString() },
            },
            {
              startTime: { gte: startDateTime.toISOString() },
              endTime: { lte: endDateTime.toISOString() },
            },
          ],
          status: { in: ["Reserved", "InProgress"] },
        },
      });

      if (overlappingBookings.length > 0) {
        return reply.status(409).send({
          error: "Table already booked for the selected time period",
          conflictingBookings: overlappingBookings.map((b) => ({
            id: b.id,
            startTime: b.startTime,
            endTime: b.endTime,
            status: b.status,
          })),
        });
      }

      // Calculate pricing
      const hourlyRate = Number(poolTable.hourly_rate);
      const totalPrice = hourlyRate * durationHours;

      // Create the booking
      const booking = await this.prisma.poolBookings.create({
        data: {
          customer_name,
          poolTable: { connect: { id: Number(tableId) } },
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          durationHours,
          hourlyRate,
          totalPrice,
          status: "Reserved",
          notes,
        },
        include: {
          poolTable: true,
        },
      });

      // Update table status if needed (optional)
      await this.prisma.poolTables.update({
        where: { id: tableId },
        data: { status: "Occupied" },
      });

      return reply.status(201).send({
        message: "Booking created successfully",
        booking: {
          ...booking,
          totalPrice: formatRupiah(booking.totalPrice || 0),
          hourlyRate: formatRupiah(booking.hourlyRate),
        },
      });
    } catch (error) {
      console.error("Error creating booking:", error);
      return reply.status(500).send({ error: "Internal server error" });
    }
  }
}

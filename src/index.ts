import express from "express";
import { v4 as uuidv4 } from 'uuid';
import { Server, StableBTreeMap } from 'azle';

// Define types for the Railway Management System

enum TrainStatus {
   OnTime = "on time",
   Delayed = "delayed",
   Cancelled = "cancelled"
}

type Train = {
   id: string;
   name: string;
   status: TrainStatus;
};

type BookingStatus = "confirmed" | "cancelled";

type Booking = {
   id: string;
   trainId: string;
   userId: string;
   status: BookingStatus;
};

type PaymentStatus = "successful" | "pending" | "failed";

type Payment = {
   id: string;
   bookingId: string;
   amount: number;
   status: PaymentStatus;
};

// Storage for trains, bookings, and payments
const trainsStorage = StableBTreeMap<string, Train>(0);
const bookingsStorage = StableBTreeMap<string, Booking>(0);
const paymentsStorage = StableBTreeMap<string, Payment>(0);

// Initialize Express app
const app = express();
app.use(express.json());

// Define endpoints

// Endpoint to list all trains
app.get("/trains", (req, res) => {
   res.json(trainsStorage.values());
});

// Endpoint to check train status by ID
app.get("/trains/:id/status", (req, res) => {
   const trainId = req.params.id;
   const train = trainsStorage.get(trainId);
   if (!train) {
      res.status(404).send(`Train with ID ${trainId} not found`);
   } else {
      res.json({ status: train.status });
   }
});

// Endpoint to list all bookings for a user
app.get("/bookings/:userId", (req, res) => {
   const userId = req.params.userId;
   const userBookings = bookingsStorage.values().filter(booking => booking.userId === userId);
   res.json(userBookings);
});

// Endpoint to book a train
app.post("/bookings", (req, res) => {
   const { trainId, userId } = req.body;
   // Check if the train exists
   const train = trainsStorage.get(trainId);
   if (!train) {
      res.status(404).send(`Train with ID ${trainId} not found`);
      return;
   }
   // Create a new booking
   const bookingId = uuidv4();
   const booking: Booking = {
      id: bookingId,
      trainId,
      userId,
      status: "confirmed", // Assuming the booking is confirmed by default
   };
   bookingsStorage.insert(bookingId, booking);
   res.json(booking);
});

// Endpoint to cancel a booking
app.delete("/bookings/:id", (req, res) => {
   const bookingId = req.params.id;
   // Check if the booking exists
   const booking = bookingsStorage.get(bookingId);
   if (!booking) {
      res.status(404).send(`Booking with ID ${bookingId} not found`);
      return;
   }
   // Update the booking status to "cancelled"
   booking.status = "cancelled";
   bookingsStorage.insert(bookingId, booking); // Update the booking in storage
   res.json({ message: "Booking cancelled successfully" });
});

// Endpoint to process a payment for a booking
app.post("/payments", (req, res) => {
   const { bookingId, amount } = req.body;
   // Check if the booking exists
   const booking = bookingsStorage.get(bookingId);
   if (!booking) {
      res.status(404).send(`Booking with ID ${bookingId} not found`);
      return;
   }
   // Perform payment processing logic (not implemented in this example)
   // For demonstration purposes, assume the payment is successful
   const paymentId = uuidv4();
   const payment: Payment = {
      id: paymentId,
      bookingId,
      amount,
      status: "successful",
   };
   paymentsStorage.insert(paymentId, payment);
   res.json(payment);
});

// Start the Express server
export default Server(() => {
   return app.listen();
});

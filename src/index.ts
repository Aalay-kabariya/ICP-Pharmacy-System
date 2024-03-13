import express, { Express, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Server, StableBTreeMap } from 'azle';

// Define types for Medicine and Order
interface Medicine {
  id: string;
  name: string;
  price: number;
  stock: number;
}

interface Order {
  id: string;
  userId: string;
  medicineId: string;
  quantity: number;
  paymentMethod: string;
  status: string;
}

const medicinesStorage = new StableBTreeMap<string, Medicine>(0);
const ordersStorage = new StableBTreeMap<string, Order>(0);

// Create express app
const app: Express = express();
app.use(express.json());

// Middleware for logging requests
app.use((req: Request, res: Response, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Add a new medicine
app.post("/medicines", (req: Request, res: Response) => {
  const { name, price, stock } = req.body;
  if (!name || !price || !stock) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const medicine: Medicine = { id: uuidv4(), name, price, stock };
  medicinesStorage.insert(medicine.id, medicine);
  res.json(medicine);
});

// List all medicines
app.get("/medicines", (req: Request, res: Response) => {
  res.json(medicinesStorage.values());
});

// Buy medicine
app.post("/orders", (req: Request, res: Response) => {
  const { userId, medicineId, quantity, paymentMethod } = req.body;
  if (!userId || !medicineId || !quantity || !paymentMethod) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const medicine = medicinesStorage.get(medicineId).Some;
  if (!medicine || medicine.stock < quantity) {
    return res.status(400).json({ error: "Not enough stock available for the requested quantity" });
  }

  const order: Order = { id: uuidv4(), userId, medicineId, quantity, paymentMethod, status: "Ordered" };
  medicinesStorage.insert(medicineId, { ...medicine, stock: medicine.stock - quantity });
  ordersStorage.insert(order.id, order);
  res.json(order);
});

// Cancel an order
app.delete("/orders/:id", (req: Request, res: Response) => {
  const orderId = req.params.id;
  const order = ordersStorage.get(orderId).Some;
  if (!order) {
    return res.status(404).json({ error: `Order with id=${orderId} not found` });
  }

  const medicine = medicinesStorage.get(order.medicineId).Some;
  medicinesStorage.insert(order.medicineId, { ...medicine, stock: medicine.stock + order.quantity });
  ordersStorage.remove(orderId);
  res.json({ message: "Order canceled successfully" });
});

// Check order status
app.get("/orders/:id", (req: Request, res: Response) => {
  const orderId = req.params.id;
  const order = ordersStorage.get(orderId);
  if ("None" in order) {
    return res.status(404).json({ error: `Order with id=${orderId} not found` });
  }
  const { status } = order.Some;
  res.json({ status });
});

// List all orders
app.get("/orders", (req: Request, res: Response) => {
  res.json(ordersStorage.values());
});

// Start the server
const server = Server(() => {
  return app.listen();
});

// Mocking the 'crypto' object for testing purposes
globalThis.crypto = {
  getRandomValues: () => {
    let array = new Uint8Array(32);
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
    return array;
  },
};

export default server;

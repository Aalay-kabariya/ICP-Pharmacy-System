// cannister code goes here
import { v4 as uuidv4 } from 'uuid';
import { Server, StableBTreeMap, ic } from 'azle';
import express from 'express';

/**
 * Type representing a medicine.
 */
class Medicine {
  id: string;
  name: string;
  price: number;
  stock: number;
}

/**
 * Type representing a user's order.
 */
class Order {
  id: string;
  userId: string;
  medicineId: string;
  quantity: number;
  paymentMethod: string;
  status: string;
}

const medicinesStorage = StableBTreeMap<string, Medicine>(0);
const ordersStorage = StableBTreeMap<string, Order>(0);

export default Server(() => {
  const app = express();
  app.use(express.json());

  // Add a new medicine
  app.post("/medicines", (req, res) => {
    const medicine: Medicine = { id: uuidv4(), ...req.body };
    medicinesStorage.insert(medicine.id, medicine);
    res.json(medicine);
  });

  // List all medicines
  app.get("/medicines", (req, res) => {
    res.json(medicinesStorage.values());
  });

  // Buy medicine
  app.post("/orders", (req, res) => {
    const order: Order = { id: uuidv4(), ...req.body, status: "Ordered" };
    const medicine = medicinesStorage.get(order.medicineId).Some;

    if (medicine.stock >= order.quantity) {
      medicinesStorage.insert(order.medicineId, { ...medicine, stock: medicine.stock - order.quantity });
      ordersStorage.insert(order.id, order);
      res.json(order);
    } else {
      res.status(400).send("Not enough stock available for the requested quantity.");
    }
  });

  // Cancel an order
  app.delete("/orders/:id", (req, res) => {
    const orderId = req.params.id;
    const order = ordersStorage.get(orderId).Some;
    const medicine = medicinesStorage.get(order.medicineId).Some;

    medicinesStorage.insert(order.medicineId, { ...medicine, stock: medicine.stock + order.quantity });
    ordersStorage.remove(orderId);

    res.json({ message: "Order canceled successfully." });
  });

  // Check order status
  app.get("/orders/:id", (req, res) => {
    const orderId = req.params.id;
    const order = ordersStorage.get(orderId);
    
    if ("None" in order) {
      res.status(404).send(`Order with id=${orderId} not found`);
    } else {
      const { status } = order.Some;
      res.json({ status });
    }
  });

  // List all orders
  app.get("/orders", (req, res) => {
    res.json(ordersStorage.values());
  });

  return app.listen();
});

// Mocking the 'crypto' object for testing purposes
globalThis.crypto = {
  getRandomValues: () => {
    let array = new Uint8Array(32);

    for let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }

    return array;
  },
};

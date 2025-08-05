import axios from "axios";

// Cambia si tu backend está en otro puerto o dominio
const BASE_URL = "http://localhost:3000/expense";

// Interfaces (ajusta si tu modelo cambia)
export interface Expense {
  expense_id?: string; // esto refleja el nombre de tu campo en la base de datos
  name: string;
  category_id: string;
  amount: number;
  description?: string;
  date?: string;
}

//  Obtener todos los gastos
export const getAllExpenses = async () => {
  return axios.get(`${BASE_URL}`);
};

//  Obtener gastos por ID
export const getExpenseById = async (id: string) => {
  return axios.get(`${BASE_URL}/${id}`);
};

//  Obtener gastos por ID de categoría
export const getExpensesByCategoryId = async (categoryId: string) => {
  return axios.get(`http://localhost:3000/expenses/${categoryId}`);
};

//  Crear nuevo gasto
export const createExpense = async (expense: Expense) => {
  return axios.post(`${BASE_URL}`, expense);
};

//  Actualizar gasto existente
export const updateExpense = async (
  id: string,
  updatedData: Partial<Expense>
) => {
  return axios.put(`${BASE_URL}/${id}`, updatedData);
};

//  Eliminar gasto
export const deleteExpense = async (id: string) => {
  return axios.delete(`${BASE_URL}/${id}`);
};

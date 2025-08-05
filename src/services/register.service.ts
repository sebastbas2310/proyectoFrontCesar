import axios from "axios";

const baseUrl = "http://localhost:3000/user"; // Ajusta si tu ruta es diferente

export interface RegisterData {
  user_name: string;
  email: string;
  password: string;
  phone_number?: string;
  user_status?: string;
}

export const registerUser = async (user: RegisterData) => {
  return axios.post(`${baseUrl}/addUser`, user);
};
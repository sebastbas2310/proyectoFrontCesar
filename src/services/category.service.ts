import axios from "axios";

const baseUrl = "http://localhost:3000/categories";

interface CreateCategoryPayload {
  email: string;
  name: string;
}

// Obtener todas las categorías
export const getAllCategories = async () => {
  return axios.get(baseUrl);
};

// Crear una nueva categoría (usando email y nombre)
export const createCategory = async (category: CreateCategoryPayload) => {
  return axios.post(`${baseUrl}/addCategories`, category);
};

// Obtener categorías por email
export const getCategoriesByUser = async (userEmail: string) => {
  return axios.get(`${baseUrl}/email/${encodeURIComponent(userEmail)}`);
};

// ✅ ACTUALIZAR categoría por ID (ya no por email)
export const updateCategoryById = async (
  categoryId: string,
  data: { name: string }
) => {
  return axios.put(`${baseUrl}/id/${categoryId}`, data);
};

// ✅ ELIMINAR categoría por ID (ya no por email)
export const deleteCategoryById = async (categoryId: string) => {
  return axios.delete(`${baseUrl}/id/${categoryId}`);
};

import axios from "axios";

const baseUrl = "http://localhost:3000/user";

// Helper function to get authorization headers
const getAuthHeaders = () => {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("AuthToken")}`,
  };
};

// Add a new user
export const addUser = async (user: any) => {
  const endpoint = `${baseUrl}/addUser`;
  return axios.post(endpoint, user);
};

// Get all users
export const getUsers = async () => {
  const headers = getAuthHeaders();
  return axios.get(baseUrl, { headers });
};

// Get a user by ID
export const getUserById = async (id: string) => {
  const endpoint = `${baseUrl}/${id}`;
  const headers = getAuthHeaders();
  return axios.get(endpoint, { headers });
};

// Update a user
export const updateUser = async (userId: string, userData: any) => {
  const endpoint = `${baseUrl}/${userId}`;
  const headers = getAuthHeaders();
  return axios.put(endpoint, userData, { headers });
};

// Change user status
export const changeUserStatus = async (userId: string, status: string) => {
  const endpoint = `${baseUrl}/${userId}`;
  const headers = getAuthHeaders();
  const body = { status };
  return axios.post(endpoint, body, { headers });
};
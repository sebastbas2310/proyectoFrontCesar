import axios from "axios";
import Swal from "sweetalert2";

const API_URL = "http://localhost:3000/auth";

export const authenticate = async (email: string, password: string) => {
  const endpoint = `${API_URL}/login`;
  const body = { email, password };
  return axios.post(endpoint, body);
};

const setupAxiosInterceptors = (navigate: (path: string) => void) => {
  axios.interceptors.response.use(
    response => response,
    error => {
      if (error.response && error.response.status === 401) {
        Swal.fire({
          title: 'Sesión Expirada',
          text: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
          icon: 'warning',
          confirmButtonText: 'Aceptar'
        }).then(() => {
          navigate("/login");
        });
      }
      return Promise.reject(error);
    }
  );
};

export default setupAxiosInterceptors;
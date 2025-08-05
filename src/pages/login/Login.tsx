// src/Login.jsx
import '@fortawesome/fontawesome-free/css/all.min.css';
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import Swal from "sweetalert2";
import { authenticate } from "../../services/auth.service";
import { registerUser } from "../../services/register.service";
import { useState } from "react";
import bcrypt from "bcryptjs";
import { User } from 'lucide-react';

interface LoginForm {
  email: string;
  password: string;
  phone?: string;
}

const Login = () => {
  const [isLogin, setIsLogin] = useState(true); // Nuevo estado
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>();
  const navigate = useNavigate();

  const onLogin = async (data: LoginForm) => {
    try {
      const response = await authenticate(data.email, data.password);

      if (response.data.token) {
        localStorage.setItem("AuthToken", response.data.token);
        Swal.fire({
          title: "¡Inicio de sesión exitoso!",
          text: "Bienvenido de nuevo.",
          icon: "success",
        });
        navigate("/dashboard");
        return;
      }

      Swal.fire({
        title: "Error!",
        text: "Error al iniciar sesión, verifica tus credenciales.",
        icon: "error",
      });
    } catch (error) {
      Swal.fire({
        title: "Error!",
        text: "Error al iniciar sesión, verifica tus credenciales.",
        icon: "error",
      });
      console.error(error);
    }
  };

  const onRegister = async (data: LoginForm) => {
    try {
      // Envía los datos al backend (el backend se encarga de encriptar la contraseña)
      await registerUser({
        user_name: data.email.split("@")[0], // O pide un campo nombre si lo necesitas
        email: data.email,
        password: data.password,
        phone_number: data.phone || undefined,
        user_status: "Activo", // O lo que corresponda
      });

      Swal.fire({
        title: "Cuenta creada",
        text: "Ahora puedes iniciar sesión.",
        icon: "success",
      });
      setIsLogin(true); // Volver a login
    } catch (error: any) {
      Swal.fire("Error", error?.response?.data?.error || "No se pudo crear la cuenta", "error");
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-sm bg-white p-8 rounded-2xl shadow-xl">
        <h2 className="text-2xl font-bold text-blue-600 text-center">
          {isLogin ? "Monedero Digital" : "Crear Cuenta"}
        </h2>
        <p className="text-center text-gray-500 mb-6">
          {isLogin ? "Ingresa para controlar tus finanzas." : "Regístrate para comenzar."}
        </p>

        {/* Botones sociales */}
        {isLogin && (
          <>
            <div className="space-y-3">
              <button className="w-full flex items-center justify-center gap-2 border border-gray-300 rounded-md py-2 hover:bg-gray-50">
                <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
                Continuar con Google
              </button>
              <button className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white rounded-md py-2 hover:bg-blue-700">
                <i className="fab fa-facebook-f" />
                Continuar con Facebook
              </button>
              <button className="w-full flex items-center justify-center gap-2 bg-black text-white rounded-md py-2 hover:opacity-90">
                <i className="fab fa-apple" />
                Continuar con Apple
              </button>
            </div>

            <div className="flex items-center my-6">
              <hr className="flex-grow border-gray-300" />
              <span className="mx-2 text-gray-400">o</span>
              <hr className="flex-grow border-gray-300" />
            </div>
          </>
        )}

        {/* Formulario compartido */}
        <form className="space-y-4" onSubmit={handleSubmit(isLogin ? onLogin : onRegister)}>
          <div>
            <label className="block text-sm font-medium text-gray-700">Correo Electrónico</label>
            <input
              type="email"
              placeholder="tu@correo.com"
              {...register("email", { required: true })}
              className="w-full mt-1 border rounded-md px-3 py-2 text-sm outline-blue-500"
            />
            {errors.email && <span className="text-xs text-red-500">El correo es obligatorio</span>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Contraseña</label>
            <input
              type="password"
              placeholder="••••••••"
              {...register("password", { required: true })}
              className="w-full mt-1 border rounded-md px-3 py-2 text-sm outline-blue-500"
            />
            {errors.password && <span className="text-xs text-red-500">La contraseña es obligatoria</span>}
          </div>

          {/* Campo opcional solo si es registro */}
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Teléfono (opcional)</label>
              <input
                type="tel"
                placeholder="Ej. 3001234567"
                {...register("phone")}
                className="w-full mt-1 border rounded-md px-3 py-2 text-sm outline-blue-500"
              />
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700"
          >
            {isLogin ? "Iniciar Sesión" : "Registrarme"}
          </button>
        </form>

        {/* Cambiar entre login y registro */}
        <p className="text-center text-sm text-gray-600 mt-4">
          {isLogin ? (
            <>
              ¿No tienes cuenta?{" "}
              <button className="text-blue-600 font-medium hover:underline" onClick={() => setIsLogin(false)}>
                Crea una
              </button>
            </>
          ) : (
            <>
              ¿Ya tienes cuenta?{" "}
              <button className="text-blue-600 font-medium hover:underline" onClick={() => setIsLogin(true)}>
                Inicia sesión
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
};

export default Login;

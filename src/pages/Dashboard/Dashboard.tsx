import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import {
  getCategoriesByUser,
  createCategory,
  updateCategoryById,
  deleteCategoryById,
} from "../../services/category.service";
import { getUserById } from "../../services/user.service";
import { getExpensesByCategoryId } from "../../services/expense.service";
import { useNavigate } from "react-router-dom";

interface Category {
  id: string;
  name: string;
  icono?: string;
}

interface User {
  id: string;
  name?: string;
  email?: string;
}

export default function Dashboard() {
  const navigate = useNavigate();

  const [categories, setCategories] = useState<Category[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Obtener el email del usuario autenticado
  useEffect(() => {
    const fetchUserEmail = async () => {
      const token = localStorage.getItem("AuthToken");
      if (!token) {
        navigate("/");
        return;
      }

      try {
        const res = await fetch("http://localhost:3000/user/me", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (res.ok) {
          const data = await res.json();
          setUserEmail(data.email);
          console.log("Email del usuario autenticado:", data.email);
        } else {
          console.error("Error obteniendo usuario desde token");
        }
      } catch (error) {
        console.error("Error en fetchUserEmail:", error);
      }
    };

    fetchUserEmail();
  }, [navigate]);

  // Obtener usuario y categorías cuando ya tenemos el email
  useEffect(() => {
    if (!userEmail) return;

    const fetchAllData = async () => {
      try {
        const resUser = await getUserById(userEmail);
        const resCat = await getCategoriesByUser(userEmail);

        const categoriesFromAPI: Category[] = Array.isArray(resCat.data)
          ? resCat.data.map(cat => ({
              ...cat,
              id: cat.category_id // agrega el campo id para el frontend
            }))
          : [];
        console.log("Respuesta del backend (categorías):", resCat.data);

        setUser(resUser.data);
        setCategories(categoriesFromAPI);
        console.log("Categorías válidas cargadas:", categoriesFromAPI);
      } catch (error) {
        console.error("Error al cargar datos:", error);
      }
    };

    fetchAllData();
    // eslint-disable-next-line
  }, [userEmail]);

  // Obtener e imprimir expenses de cada categoría
  useEffect(() => {
    if (!categories.length) return;

    const fetchExpensesForAllCategories = async () => {
      for (const category of categories) {
        try {
          const res = await getExpensesByCategoryId(category.id);
          console.log(
            `Expenses para la categoría "${category.name}" (${category.id}):`,
            res.data
          );
        } catch (error) {
          console.error(
            `Error obteniendo expenses para la categoría "${category.name}" (${category.id}):`,
            error
          );
        }
      }
    };

    fetchExpensesForAllCategories();
  }, [categories]);

  // Agregar categoría
  const handleAddCategory = async () => {
    const { value: name } = await Swal.fire({
      title: "Nueva Categoría",
      input: "text",
      inputLabel: "Nombre de la categoría",
      inputPlaceholder: "Ejemplo: Entretenimiento",
      showCancelButton: true,
      confirmButtonText: "Agregar",
      confirmButtonColor: "#2563eb",
    });

    if (name) {
      try {
        await createCategory({ email: userEmail!, name });
        const res = await getCategoriesByUser(userEmail!);

        const categoriesFromAPI: Category[] = Array.isArray(res.data)
          ? res.data
          : [];

        setCategories(categoriesFromAPI);
        console.log("Categoría agregada. Lista actualizada:", categoriesFromAPI);
        Swal.fire("¡Categoría agregada!", "", "success");
      } catch (error) {
        Swal.fire("Error", "No se pudo agregar la categoría", "error");
      }
    }
  };

  // Editar categoría
  const handleEditCategory = async (category: Category) => {
    const { value: newName } = await Swal.fire({
      title: "Editar Categoría",
      input: "text",
      inputLabel: "Nuevo nombre",
      inputValue: category.name,
      showCancelButton: true,
      confirmButtonText: "Guardar",
      confirmButtonColor: "#2563eb",
    });

    if (newName && newName !== category.name) {
      try {
        await updateCategoryById(category.id, { name: newName });
        const res = await getCategoriesByUser(userEmail!);

        const categoriesFromAPI: Category[] = Array.isArray(res.data)
          ? res.data
          : [];

        setCategories(categoriesFromAPI);
        console.log("Categoría editada. Lista actualizada:", categoriesFromAPI);
        Swal.fire("¡Categoría actualizada!", "", "success");
      } catch (error) {
        Swal.fire("Error", "No se pudo actualizar la categoría", "error");
      }
    }
  };

  // Eliminar categoría
  const handleDeleteCategory = async (category: Category) => {
    const result = await Swal.fire({
      title: `¿Eliminar "${category.name}"?`,
      text: "Esta acción no se puede deshacer",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      confirmButtonColor: "#dc2626",
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
      try {
        await deleteCategoryById(category.id);
        const res = await getCategoriesByUser(userEmail!);

        const categoriesFromAPI: Category[] = Array.isArray(res.data)
          ? res.data
          : [];

        setCategories(categoriesFromAPI);
        console.log("Categoría eliminada. Lista actualizada:", categoriesFromAPI);
        Swal.fire("¡Categoría eliminada!", "", "success");
      } catch (error) {
        Swal.fire("Error", "No se pudo eliminar la categoría", "error");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-blue-600">Monedero Digital</h1>
        <button
          className="bg-gray-200 px-4 py-2 rounded shadow"
          onClick={() => {
            localStorage.removeItem("AuthToken");
            navigate("/");
          }}
        >
          Cerrar Sesión
        </button>
      </header>

      <main className="max-w-3xl mx-auto py-6 px-4">
        <h2 className="text-2xl font-bold text-center mb-4">Categorías</h2>
        <section className="bg-white p-4 rounded shadow mb-4">
          <ul className="space-y-4">
            {categories.map((category) => {
              console.log("Renderizando categoría:", category);
              return (
                <li
                  key={category.id}
                  className="bg-gray-50 p-4 rounded-lg shadow-inner flex items-center justify-between"
                >
                  <span className="text-blue-600 font-semibold text-lg">
                    {category.name}
                  </span>
                  <button
                    onClick={async () => {
                      const result = await Swal.fire({
                        title: "Ajustes de Categoría",
                        showCancelButton: true,
                        confirmButtonText: "Editar nombre",
                        cancelButtonText: "Eliminar",
                        confirmButtonColor: "#2563eb",
                        cancelButtonColor: "#dc2626",
                        reverseButtons: true,
                      });

                      if (result.isConfirmed) {
                        handleEditCategory(category);
                      } else if (
                        result.dismiss === Swal.DismissReason.cancel
                      ) {
                        handleDeleteCategory(category);
                      }
                    }}
                    className="text-gray-500 hover:text-gray-700"
                    title="Ajustes"
                  >
                    ⚙️
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
        <section className="bg-white p-4 rounded shadow mb-4">
          <button
            className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md font-semibold"
            onClick={handleAddCategory}
          >
            Agregar Categoría
          </button>
        </section>
      </main>
    </div>
  );
}

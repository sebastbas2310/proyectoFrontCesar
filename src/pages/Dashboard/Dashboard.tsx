import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import {
  getCategoriesByUser,
  createCategory,
  updateCategoryById,
  deleteCategoryById,
} from "../../services/category.service";
import { getUserById } from "../../services/user.service";
import { getExpensesByCategoryId, createExpense, updateExpense, deleteExpense } from "../../services/expense.service";
import { useNavigate } from "react-router-dom";

// Añadir función para crear gasto dentro del componente (más abajo)

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
  const [expensesByCategory, setExpensesByCategory] = useState<{
    [key: string]: any[];
  }>({});

  // Totales en tiempo real
  const [totalIncome, setTotalIncome] = useState<number>(0);
  const [totalExpenses, setTotalExpenses] = useState<number>(0);

  // Leer usuario desde localStorage para mostrar la info inmediatamente tras login/registro
  React.useEffect(() => {
    const stored = localStorage.getItem('AuthUser');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUser(parsed);
        if (parsed.email) setUserEmail(parsed.email);
        console.log('AuthUser desde localStorage:', parsed);
      } catch (err) {
        console.error('Error parseando AuthUser:', err);
      }
    }
  }, []);

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
      const allExpenses: { [key: string]: any[] } = {};

      for (const category of categories) {
        try {
          const res = await getExpensesByCategoryId(category.id);
          allExpenses[category.id] = res.data || [];
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

      setExpensesByCategory(allExpenses);
    };

    fetchExpensesForAllCategories();
  }, [categories]);

  // Calcular totales en tiempo real (se ejecuta cuando cambian gastos o categorías)
  useEffect(() => {
    let incomes = 0;
    let expensesTotal = 0;

    const isIncomeCategory = (name: string) => /ganancia|ganancias|ingreso|ingresos/i.test(name);

    for (const cat of categories) {
      const catExpenses = expensesByCategory[cat.id] || [];
      const sum = catExpenses.reduce((s: number, e: any) => s + Number(e.amount || 0), 0);
      if (isIncomeCategory(cat.name)) incomes += sum;
      else expensesTotal += sum;
    }

    setTotalIncome(incomes);
    setTotalExpenses(expensesTotal);
  }, [expensesByCategory, categories]);

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
        <div>
          <h1 className="text-xl font-bold text-blue-600">Monedero Digital</h1>
          {user && (
            <p className="text-sm text-gray-500">Bienvenido, {user.user_name || user.email}</p>
          )}
        </div>
        <button
          className="bg-gray-200 px-4 py-2 rounded shadow"
          onClick={() => {
            localStorage.removeItem("AuthToken");
            localStorage.removeItem("AuthUser");
            navigate("/");
          }}
        >
          Cerrar Sesión
        </button>
      </header>

      <main className="max-w-3xl mx-auto py-6 px-4">
        <h2 className="text-2xl font-bold text-center mb-4">Categorías</h2>

        {/* Línea de Gastos / Ganancias */}
        <section className="mb-4">
          <div className="flex items-center justify-center gap-6">
            <div className="flex items-center gap-3 bg-white p-3 rounded shadow w-48 justify-between">
              <div className="text-sm text-red-600 font-medium">Gastos</div>
              <div className="text-lg font-bold text-red-700">${totalExpenses.toLocaleString()}</div>
            </div>
            <div className="flex items-center gap-3 bg-white p-3 rounded shadow w-48 justify-between">
              <div className="text-sm text-green-600 font-medium">Ganancias</div>
              <div className="text-lg font-bold text-green-700">${totalIncome.toLocaleString()}</div>
            </div>
            <div className="flex items-center gap-3 bg-white p-3 rounded shadow w-48 justify-between">
              <div className="text-sm text-gray-500 font-medium">Balance</div>
              <div className={`text-lg font-bold ${ (totalIncome - totalExpenses) >= 0 ? 'text-green-700' : 'text-red-700' }`}>${(totalIncome - totalExpenses).toLocaleString()}</div>
            </div>
          </div>
        </section>

        <section className="bg-white p-4 rounded shadow mb-4">
          {/* Grid de tarjetas por categoría */}
          {/* Lista vertical: tarjetas apiladas de arriba a abajo */}
          <div className="flex flex-col gap-4">
            { // Asegurar que la categoría 'Ganancias' esté arriba del todo si existe
              [...categories].sort((a,b) => {
                const aIsIncome = /ganancia|ganancias|ingreso|ingresos/i.test(a.name);
                const bIsIncome = /ganancia|ganancias|ingreso|ingresos/i.test(b.name);
                if (aIsIncome && !bIsIncome) return -1;
                if (!aIsIncome && bIsIncome) return 1;
                return a.name.localeCompare(b.name);
              }).map((category) => {
              const expenses = expensesByCategory[category.id] || [];
              const total = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

              const handleAddExpense = async () => {
                const { value: formValues } = await Swal.fire({
                  title: `Agregar gasto - ${category.name}`,
                  html:
                    '<input id="swal-name" class="swal2-input" placeholder="Nombre">' +
                    '<input id="swal-amount" type="number" step="0.01" class="swal2-input" placeholder="Monto">' +
                    '<input id="swal-desc" class="swal2-input" placeholder="Descripción (opcional)">' +
                    '<input id="swal-date" type="date" class="swal2-input">',
                  focusConfirm: false,
                  preConfirm: () => {
                    const name = (document.getElementById('swal-name') as HTMLInputElement).value;
                    const amount = (document.getElementById('swal-amount') as HTMLInputElement).value;
                    const description = (document.getElementById('swal-desc') as HTMLInputElement).value;
                    const date = (document.getElementById('swal-date') as HTMLInputElement).value;

                    if (!name || !amount) {
                      Swal.showValidationMessage('Nombre y monto son obligatorios');
                      return null;
                    }

                    return { name, amount, description, date };
                  },
                });

                if (formValues) {
                  try {
                    await createExpense({
                      name: formValues.name,
                      category_id: category.id,
                      amount: Number(formValues.amount),
                      description: formValues.description || undefined,
                      date: formValues.date || undefined,
                    });

                    Swal.fire('Éxito', 'Gasto agregado', 'success');

                    // Refrescar gastos de esta categoría
                    try {
                      const res = await getExpensesByCategoryId(category.id);
                      setExpensesByCategory((prev) => ({ ...prev, [category.id]: res.data || [] }));
                    } catch (err) {
                      console.error('Error refrescando gastos tras crear:', err);
                    }
                  } catch (err) {
                    console.error('Error creando gasto:', err);
                    Swal.fire('Error', 'No se pudo agregar el gasto', 'error');
                  }
                }
              };

              return (
                <div
                  key={category.id}
                  className="bg-gray-50 p-4 rounded-lg shadow-inner w-full"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-blue-600 font-semibold text-lg">{category.name}</h3>
                      <p className="text-sm text-gray-500">{expenses.length} gasto{expenses.length !== 1 ? 's' : ''}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-800">${total.toLocaleString()}</p>
                      <p className="text-xs text-gray-400">Total</p>
                    </div>
                  </div>

                  {/* Lista pequeña de últimos gastos */}
                  {expenses.length > 0 && (
                    <ul className="mt-3 text-sm text-gray-700 space-y-1">
                      {expenses.slice(0, 5).map((expense) => {
                        const handleEditExpense = async (expenseToEdit: any) => {
                          const { value: updated } = await Swal.fire({
                            title: 'Editar gasto',
                            html:
                              `<input id="swal-name" class="swal2-input" value="${(expenseToEdit.name || '').replace(/"/g, '&quot;')}" placeholder="Nombre">` +
                              `<input id="swal-amount" type="number" step="0.01" class="swal2-input" value="${expenseToEdit.amount}" placeholder="Monto">` +
                              `<input id="swal-desc" class="swal2-input" value="${(expenseToEdit.description || '').replace(/"/g, '&quot;')}" placeholder="Descripción (opcional)">` +
                              `<input id="swal-date" type="date" class="swal2-input" value="${expenseToEdit.date ? expenseToEdit.date.split('T')[0] : ''}">`,
                            focusConfirm: false,
                            preConfirm: () => {
                              const name = (document.getElementById('swal-name') as HTMLInputElement).value;
                              const amount = (document.getElementById('swal-amount') as HTMLInputElement).value;
                              const description = (document.getElementById('swal-desc') as HTMLInputElement).value;
                              const date = (document.getElementById('swal-date') as HTMLInputElement).value;

                              if (!name || !amount) {
                                Swal.showValidationMessage('Nombre y monto son obligatorios');
                                return null;
                              }

                              return { name, amount, description, date };
                            },
                          });

                          if (updated) {
                            try {
                              await updateExpense(expenseToEdit.expense_id, {
                                name: updated.name,
                                amount: Number(updated.amount),
                                description: updated.description || undefined,
                                date: updated.date || undefined,
                              });

                              Swal.fire('Éxito', 'Gasto actualizado', 'success');

                              // Refrescar gastos de esta categoría
                              try {
                                const res = await getExpensesByCategoryId(category.id);
                                setExpensesByCategory((prev) => ({ ...prev, [category.id]: res.data || [] }));
                              } catch (err) {
                                console.error('Error refrescando gastos tras editar:', err);
                              }
                            } catch (err) {
                              console.error('Error actualizando gasto:', err);
                              Swal.fire('Error', 'No se pudo actualizar el gasto', 'error');
                            }
                          }
                        };

                        const handleDeleteExpense = async (expenseToDelete: any) => {
                          const confirm = await Swal.fire({
                            title: `Eliminar gasto \'${expenseToDelete.name}\'?`,
                            text: 'Esta acción no se puede deshacer',
                            icon: 'warning',
                            showCancelButton: true,
                            confirmButtonText: 'Sí, eliminar',
                            confirmButtonColor: '#dc2626',
                          });

                          if (confirm.isConfirmed) {
                            try {
                              await deleteExpense(expenseToDelete.expense_id);
                              Swal.fire('Eliminado', 'Gasto eliminado', 'success');

                              // Refrescar gastos de esta categoría
                              try {
                                const res = await getExpensesByCategoryId(category.id);
                                setExpensesByCategory((prev) => ({ ...prev, [category.id]: res.data || [] }));
                              } catch (err) {
                                console.error('Error refrescando gastos tras eliminar:', err);
                              }
                            } catch (err) {
                              console.error('Error eliminando gasto:', err);
                              Swal.fire('Error', 'No se pudo eliminar el gasto', 'error');
                            }
                          }
                        };

                        return (
                          <li key={expense.expense_id} className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">{expense.name}</div>
                              {expense.description && (
                                <div className="text-xs text-gray-400">{expense.description}</div>
                              )}
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-semibold">${Number(expense.amount).toLocaleString()}</span>
                              <button className="text-sm text-blue-600 hover:underline" onClick={() => handleEditExpense(expense)}>Editar</button>
                              <button className="text-sm text-red-600 hover:underline" onClick={() => handleDeleteExpense(expense)}>Eliminar</button>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}

                  <div className="mt-4 flex items-center gap-2">
                    <button
                      onClick={handleAddExpense}
                      className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-700"
                    >
                      Agregar Gasto
                    </button>

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
                        } else if (result.dismiss === Swal.DismissReason.cancel) {
                          handleDeleteCategory(category);
                        }
                      }}
                      className="text-gray-500 hover:text-gray-700 text-sm"
                      title="Ajustes"
                    >
                      ⚙️
                    </button>

                    <button
                      className="text-sm text-blue-600 hover:underline"
                      onClick={() => {
                        // Ir a detalles o filtrar por esta categoría
                        setUserEmail(userEmail); // no-op para forzar render si necesitas
                      }}
                    >
                      Ver más
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
        <section className="bg-white p-4 rounded shadow mb-4">
          {/* Crear Ganancias si no existe */}
          {!categories.some(c => /ganancia|ganancias|ingreso|ingresos/i.test(c.name)) && (
            <div className="mb-3">
              <button
                className="bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700"
                onClick={async () => {
                  try {
                    await createCategory({ email: userEmail!, name: 'Ganancias' });
                    const res = await getCategoriesByUser(userEmail!);
                    const categoriesFromAPI: Category[] = Array.isArray(res.data)
                      ? res.data.map(cat => ({ ...cat, id: cat.category_id }))
                      : [];
                    setCategories(categoriesFromAPI);
                    Swal.fire('¡Listo!', 'La categoría "Ganancias" fue creada.', 'success');
                  } catch (err) {
                    console.error('Error creando Ganancias:', err);
                    Swal.fire('Error', 'No se pudo crear la categoría Ganancias', 'error');
                  }
                }}
              >
                Crear categoría Ganancias
              </button>
            </div>
          )}

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

<script setup>
import { onMounted } from "vue";
import { useUsers } from "../../composables/useUsers";

const { users, loading, fetchUsers, deleteUser, updateUser } = useUsers();

onMounted(fetchUsers);

// Fonction pour changer le rôle d'un utilisateur
const toggleAdmin = async (u) => {
    try {
        const newRoles = u.roles.includes("ROLE_ADMIN") 
            ? u.roles.filter(r => r !== "ROLE_ADMIN") 
            : [...u.roles, "ROLE_ADMIN"];
        await updateUser(u.id, { roles: newRoles });
    } catch (err) {
        console.error(err);
    }
};
</script>

<template>
    <div class="max-w-4xl mx-auto mt-10 p-6 bg-black rounded-lg shadow-xl">
        <div class="flex justify-between items-center mb-6">
            <h1 class="text-3xl font-bold text-red-600">Utilisateurs</h1>
        </div>

        <div v-if="loading" class="flex justify-center items-center py-20">
            <div class="animate-spin rounded-full h-12 w-12 border-4 border-red-600 border-t-transparent"></div>
        </div>

        <div v-else class="overflow-x-auto">
            <table class="min-w-full border border-red-600">
                <thead class="bg-red-600 text-white rounded-lg">
                    <tr>
                        <th class="px-4 py-3 text-left">ID</th>
                        <th class="px-4 py-3 text-left">Email</th>
                        <th class="px-4 py-3 text-left">Rôles</th>
                        <th class="px-4 py-3 text-center w-48">Actions</th>
                    </tr>
                </thead>

                <tbody>
                    <tr v-for="u in users" :key="u.id" class="border-b border-red-600 hover:bg-red-900/20 transition">
                        <td class="px-4 py-3 text-white">{{ u.id }}</td>
                        <td class="px-4 py-3 text-white">{{ u.email }}</td>
                        <td class="px-4 py-3 text-white">{{ u.roles.join(", ") }}</td>
                        <td class="px-4 py-3 flex justify-center gap-3">
                            <button @click="toggleAdmin(u)"
                                class="text-yellow-400 hover:text-yellow-300 font-semibold cursor-pointer">
                                {{ u.roles.includes("ROLE_ADMIN") ? "Retirer admin" : "Rendre admin" }}
                            </button>

                            <button @click="deleteUser(u.id)"
                                class="text-red-500 cursor-pointer hover:text-red-400 font-semibold">
                                Supprimer
                            </button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>

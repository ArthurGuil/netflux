<script setup>
import { useAuthStore } from "@/stores/auth";
import { useGenres } from "../../composables/useGenres";
import { onMounted } from "vue";

const { genres, loading, fetchGenres, deleteGenre } = useGenres();
const auth = useAuthStore();

onMounted(fetchGenres);
</script>

<template>
    <div class="max-w-4xl mx-auto mt-10 p-6 bg-black rounded-lg shadow-xl">
        <div class="flex justify-between items-center mb-6">
            <h1 class="text-3xl font-bold text-red-600">Genres</h1>

            <router-link v-if="auth.isAdmin" to="/genres/create"
                class="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded font-semibold transition">
                + Ajouter un genre
            </router-link>
        </div>

        <div v-if="loading" class="flex justify-center items-center py-20">
            <div class="animate-spin rounded-full h-12 w-12 border-4 border-red-600 border-t-transparent"></div>
        </div>

        <div class="overflow-x-auto">
            <table class="min-w-full border border-red-600">
                <thead class="bg-red-600 text-white rounded-lg">
                    <tr>
                        <th class="px-4 py-3 text-left">ID</th>
                        <th class="px-4 py-3 text-left">Nom</th>
                        <th v-if="auth.isAdmin" class="px-4 py-3 text-center w-40">Actions</th>
                    </tr>
                </thead>

                <tbody>
                    <tr v-for="g in genres" :key="g.id" class="border-b border-red-600 hover:bg-red-900/20 transition">
                        <td class="px-4 py-3 text-white">{{ g.id }}</td>
                        <td class="px-4 py-3 text-white">{{ g.name }}</td>
                        <td v-if="auth.isAdmin" class="px-4 py-3 flex justify-center gap-3">
                            <router-link :to="`/genres/${g.id}/edit`"
                                class="text-yellow-400 hover:text-yellow-300 font-semibold">
                                Modifier
                            </router-link>

                            <button @click="deleteGenre(g.id)"
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

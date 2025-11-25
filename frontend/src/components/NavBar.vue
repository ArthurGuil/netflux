<script setup>
import { ref } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useRouter } from "vue-router";
import { storeToRefs } from "pinia";

const auth = useAuthStore();
const { user, isLoggedIn, error } = storeToRefs(auth)
const router = useRouter();

const isOpen = ref(false);


const handleLogout = () => {
    auth.logout();
    router.push("/login");
};

const toggleMenu = () => {
    isOpen.value = !isOpen.value;
};

</script>

<template>
    <nav class="bg-black text-red-600 shadow-md border-b-2 border-red-600">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between h-16 items-center">

                <!-- Logo -->
                <router-link to="/" class="text-2xl font-bold tracking-wider hover:text-red-400">
                    Netflux
                </router-link>

                <!-- Desktop Menu -->
                <div class="hidden md:flex space-x-6 items-center">
                    <router-link v-if="auth.isAdmin" to="/users"
                        class="hover:text-red-400 text-white transition">Utilisateurs</router-link>
                    <router-link v-if="isLoggedIn" to="/genres"
                        class="hover:text-red-400 text-white transition">Genres</router-link>
                    <router-link v-if="isLoggedIn" to="/movies"
                        class="hover:text-red-400 text-white transition">Films</router-link>
                    <router-link v-if="isLoggedIn" to="/favorites"
                        class="hover:text-red-400 text-white transition">Favoris</router-link>
                    <span v-if="isLoggedIn" class="text-red-500 font-bold">
                        {{ auth.user?.email }}
                    </span>
                    <button v-if="!isLoggedIn" @click="router.push('/login')"
                        class="cursor-pointer bg-red-600 text-white font-semibold px-4 py-2 rounded hover:bg-red-500 transition">
                        Se connecter
                    </button>

                    <button v-if="!isLoggedIn" @click="router.push('/register')"
                        class="cursor-pointer bg-red-600 text-white font-semibold px-4 py-2 rounded hover:bg-red-500 transition">
                        S'enregister
                    </button>

                    <button v-if="isLoggedIn" @click="handleLogout"
                        class="cursor-pointer bg-red-600 text-white font-semibold px-4 py-2 rounded hover:bg-red-500 transition">
                        Se déconnecter
                    </button>
                </div>

                <!-- Mobile Button -->
                <div class="md:hidden flex items-center">
                    <button @click="toggleMenu" class="focus:outline-none">
                        <svg v-if="!isOpen" class="h-6 w-6 text-red-600" fill="none" stroke="currentColor"
                            viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                        <svg v-else class="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

            </div>
        </div>

        <!-- Mobile Menu -->
        <div v-show="isOpen" class="md:hidden bg-black border-t border-red-600 text-white">
            <div class="px-2 pt-2 pb-3 space-y-1">

                <router-link @click="isOpen = false" to="/genres"
                    class="block px-3 py-2 hover:bg-red-900 rounded">Genres</router-link>

                <router-link @click="isOpen = false" to="/movies"
                    class="block px-3 py-2 hover:bg-red-900 rounded">Films</router-link>

                <router-link v-if="!isLoggedIn" @click="isOpen = false" to="/login"
                    class="block px-3 py-2 hover:bg-red-900 rounded">
                    Se connecter
                </router-link>

                <router-link v-if="!isLoggedIn" @click="isOpen = false" to="/register"
                    class="block px-3 py-2 hover:bg-red-900 rounded">
                    S'enregistrer
                </router-link>

                <button v-if="isLoggedIn" @click="() => { handleLogout(); isOpen = false }"
                    class="w-full text-left px-3 py-2 hover:bg-red-900 rounded font-semibold">
                    Se déconnecter
                </button>

            </div>
        </div>
    </nav>
</template>

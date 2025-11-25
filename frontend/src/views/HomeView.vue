<script setup>
</script>

<template>
    <div class="flex flex-col items-center justify-center min-h-screen bg-black text-white px-4">
        <h1 class="text-5xl font-bold mb-6 text-red-600">Netflux</h1>
        <p class="text-lg mb-8 text-gray-300 text-center max-w-xl">
            Une plateforme de streaming faite avec Vue et Symfony.
        </p>

        <div class="flex gap-4">
            <router-link
                to="/movies"
                class="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded transition"
            >
                Voir les films
            </router-link>
            <router-link
                to="/login"
                class="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded transition"
            >
                Se Connecter
            </router-link>
            <router-link
                to="/register"
                class="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded transition"
            >
                Créer un compte
            </router-link>
        </div>
    </div>
</template>

<style scoped>
</style>

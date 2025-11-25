<script setup>
import { onUnmounted, ref } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useRouter } from "vue-router";
import { storeToRefs } from "pinia";

const email = ref("");
const password = ref("");
const auth = useAuthStore();
const { user, isLoggedIn, error } = storeToRefs(auth)
const router = useRouter();

const submit = async () => {
    const ok = await auth.login(email.value, password.value);
    if (ok) {
        router.push("/movies");
    }
};
onUnmounted(() => {
    auth.error = null;
});
</script>

<template>
    <div class="max-w-md mx-auto p-6 bg-black rounded-lg shadow-xl mt-12">
        <h1 class="text-3xl font-bold text-red-600 mb-6 text-center">Connexion</h1>

        <form @submit.prevent="submit" class="space-y-4">

            <div>
                <label for="email" class="block text-white font-semibold mb-1">Email</label>
                <input id="email" v-model="email" type="email" class="w-full px-4 py-2 rounded bg-black text-white border border-red-600
                       focus:outline-none focus:ring-2 focus:ring-red-600" />
            </div>

            <div>
                <label for="password" class="block text-white font-semibold mb-1">Mot de passe</label>
                <input id="password" v-model="password" type="password" class="w-full px-4 py-2 rounded bg-black text-white border border-red-600
                       focus:outline-none focus:ring-2 focus:ring-red-600" />
            </div>

            <button type="submit"
                class="cursor-pointer w-full bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 rounded transition">
                Se connecter
            </button>
        </form>

        <p v-if="auth.error" class="mt-4 text-red-600">{{ auth.error }}</p>
    </div>
</template>

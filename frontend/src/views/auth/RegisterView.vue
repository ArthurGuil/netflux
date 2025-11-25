<script setup>
import { ref, onUnmounted } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useRouter } from "vue-router";

const email = ref("");
const password = ref("");
const router = useRouter();
const auth = useAuthStore();

const submit = async () => {
    const ok = await auth.register(email.value, password.value);
    if (ok) router.push("/login");
};

onUnmounted(() => {
    auth.error = null;
    auth.fieldErrors = {};
});
</script>

<template>
    <div class="max-w-md mx-auto p-6 bg-black rounded-lg shadow-xl mt-12">
        <h1 class="text-3xl font-bold text-red-600 mb-6 text-center">Créer un compte</h1>

        <div class="mb-4 p-3 bg-gray-900 border-l-4 border-red-600 text-white text-sm rounded">
            <p>Les champs marqués d'un <span class="text-red-600 font-bold">*</span> sont obligatoires.</p>
        </div>

        <form @submit.prevent="submit" class="space-y-4">
            <div>
                <label for="email" class="block text-white font-semibold mb-1">Email <span
                        class="text-red-600">*</span></label>
                <input id="email" v-model="email" type="email" class="w-full px-4 py-2 rounded bg-black text-white border border-red-600
                      focus:outline-none focus:ring-2 focus:ring-red-600" />
                <p v-if="auth.fieldErrors.email" class="text-red-600 text-sm mt-1">{{ auth.fieldErrors['email'] }}</p>
            </div>

            <div>
                <label for="password" class="block text-white font-semibold mb-1">Mot de passe <span
                        class="text-red-600">*</span></label>
                <input id="password" v-model="password" type="password" class="w-full px-4 py-2 rounded bg-black text-white border border-red-600
                      focus:outline-none focus:ring-2 focus:ring-red-600" />
                <p v-if="auth.fieldErrors.password" class="text-red-600 text-sm mt-1">{{ auth.fieldErrors['password'] }}
                </p>
            </div>

            <button type="submit"
                class="cursor-pointer w-full bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 rounded transition">
                S'inscrire
            </button>
        </form>

        <p v-if="auth.error" class="mt-4 text-red-600">{{ auth.error }}</p>
    </div>
</template>

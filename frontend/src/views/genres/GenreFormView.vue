<script setup>
import { ref, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useGenres } from "@/composables/useGenres";

const router = useRouter();
const route = useRoute();

const { genre, createGenre, fetchGenre, updateGenre, error } = useGenres();

const name = ref("");
const isEdit = ref(false);
const genreId = route.params.id || null;

onMounted(async () => {
    if (genreId) {
        isEdit.value = true;

        await fetchGenre(genreId);
        if (genre) {
            name.value = genre.value.name;
        }
    }
});

const submit = async () => {
    if (isEdit.value) {
        await updateGenre(genreId, { name: name.value });
    } else {
        await createGenre({ name: name.value });
    }
    if (!error) {
        router.push("/genres");
    }
};
</script>

<template>
    <div class="max-w-xl mx-auto p-6 bg-black rounded-lg shadow-xl mt-8">
        <button @click="router.push('/genres')"
            class="mb-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-500 transition cursor-pointer">
            ← Retour
        </button>
        <h1 class="text-3xl font-bold text-red-600 mb-6">
            {{ isEdit ? "Modifier un genre" : "Créer un genre" }}
        </h1>

        <form @submit.prevent="submit" class="space-y-4">

            <div>
                <label for="name" class="block text-white font-semibold mb-1">Nom du genre</label>

                <input id="name" v-model="name" type="text" class="w-full px-4 py-2 rounded bg-black text-white border border-red-600
                              focus:outline-none focus:ring-2 focus:ring-red-600" />
            </div>

            <button type="submit"
                class="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 rounded transition cursor-pointer">
                {{ isEdit ? "Mettre à jour" : "Créer" }}
            </button>
        </form>

        <div v-if="error">
            <p v-for="err in error.response.data.violations" class="mt-4 text-red-600">{{ err.message }}</p>
        </div>
    </div>
</template>

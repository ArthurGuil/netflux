<script setup>
import { computed, onMounted } from "vue";
import NavBar from "./components/NavBar.vue";
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from "vue-router";

const auth = useAuthStore()
const router = useRouter();

onMounted(async () => {
  if (auth.token && !auth.user) {
    try {
      await auth.fetchUser(auth.decoded.id)
    } catch (err) {
      auth.logout()
      router.push('/login')
    }
  }
})

const route = useRoute()
const showNav = computed(() => route.path !== '/')
</script>

<template>
  <div id="app" class="min-h-screen bg-black">
    <NavBar v-if="showNav" />
    <main class="relative">
      <router-view v-slot="{ Component, route }">
        <transition name="page" mode="out-in">
          <div :key="route.path" class="page-wrapper">
            <component :is="Component" />
          </div>
        </transition>
      </router-view>
    </main>
  </div>
</template>

<style>
.page-wrapper {
  min-height: 100vh;
}

.page-enter-active {
  animation: pageEnter 0.3s ease-out;
}

.page-leave-active {
  animation: pageLeave 0.25s ease-in;
  position: absolute;
  width: 100%;
  top: 0;
  left: 0;
}

@keyframes pageEnter {
  0% {
    opacity: 0;
    transform: translateY(20px);
  }

  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pageLeave {
  0% {
    opacity: 1;
    transform: translateY(0);
  }

  100% {
    opacity: 0;
    transform: translateY(-10px);
  }
}
</style>
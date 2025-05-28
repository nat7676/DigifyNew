<template>
  <v-container
    fluid
    class="fill-height"
  >
    <v-row
      align="center"
      justify="center"
      class="fill-height"
    >
      <v-col
        cols="12"
        sm="8"
        md="6"
        class="text-center"
      >
        <v-icon
          size="120"
          color="primary"
          class="mb-6"
        >
          mdi-alert-circle-outline
        </v-icon>
        
        <h1 class="text-h2 mb-4">404</h1>
        <h2 class="text-h5 mb-6">Page Not Found</h2>
        
        <p class="text-body-1 mb-8">
          The page you are looking for doesn't exist or has been moved.
        </p>
        
        <v-btn
          color="primary"
          size="large"
          @click="goHome"
        >
          Go to Dashboard
        </v-btn>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const goHome = () => {
  router.push('/dashboard')
}
</script>

<style scoped>
.fill-height {
  min-height: calc(100vh - 64px);
}
</style>
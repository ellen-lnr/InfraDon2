<script setup>
import { RouterView } from 'vue-router';


</script>

<template>
  <div>
    <nav>
      <RouterLink to="/">Go to Home</RouterLink>
    <br>
      <RouterLink to="/about">Create post</RouterLink>
    </nav>
    <RouterView/>
  </div>
</template>
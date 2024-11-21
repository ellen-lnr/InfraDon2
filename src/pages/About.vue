<script setup>
import { ref } from 'vue';

// Déclaration des variables liées au formulaire
const title = ref('');
const author = ref('');
const publishDate = ref('');  // La date sera définie automatiquement
const extract = ref('');
const fullText = ref('');
const comments = ref([]); // Tu peux commencer avec un tableau vide de commentaires

// Référence à l'élément pour afficher les erreurs
const error = ref('');
const successMessage = ref('');

// Fonction pour soumettre le formulaire
const submitForm = async () => {
  // On réinitialise le message d'erreur à chaque soumission
  error.value = '';
  successMessage.value = '';

  // On assigne la date de publication à la date actuelle
  publishDate.value = new Date().toISOString().split('T')[0]; // Format YYYY-MM-DD

  // Création de l'objet du post
  const newPost = {
    content: {
      title: title.value,
      extract: extract.value,
      full_text: fullText.value
    },
    author: author.value,
    publish_date: publishDate.value,  // Utilisation de la date actuelle
    comments: comments.value,
  };

  try {
    const response = await fetch('http://127.0.0.1:5984/infra-don', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newPost),
    });

    if (response.ok) {
      successMessage.value = 'Le post a été ajouté avec succès !';
      // Réinitialiser le formulaire après soumission réussie
      title.value = '';
      author.value = '';
      publishDate.value = '';
      extract.value = '';
      fullText.value = '';
      comments.value = [];
    } else {
      throw new Error('Échec de l\'ajout du post');
    }
  } catch (err) {
    error.value = err.message;
  }
};
</script>

<template>
  <div>
    <h1>Ajouter un Post</h1>
    <form @submit.prevent="submitForm">
      <div>
        <label for="title">Titre :</label>
        <input v-model="title" id="title" type="text" required />
      </div>

      <div>
        <label for="author">Auteur :</label>
        <input v-model="author" id="author" type="text" required />
      </div>

      <!-- Suppression du champ de la date, car elle est définie automatiquement -->
      <!-- <div>
        <label for="publishDate">Date de publication :</label>
        <input v-model="publishDate" id="publishDate" type="date" required />
      </div> -->

      <div>
        <label for="extract">Extrait :</label>
        <textarea v-model="extract" id="extract" required></textarea>
      </div>

      <div>
        <label for="fullText">Texte complet :</label>
        <textarea v-model="fullText" id="fullText" required></textarea>
      </div>

      <div>
        <button type="submit">Ajouter le Post</button>
      </div>
    </form>

    <div v-if="error" class="error">{{ error }}</div>
    <div v-if="successMessage" class="success">{{ successMessage }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import PouchDB from 'pouchdb'

declare interface Post {
  _id?: string
  _rev?: string
  doc: {
    post_name: string
    post_content: string
    attributes: {
      creation_date: string
    }
  }
}

// Variables et fonctions pour CRUD
const postsData = ref<Post[]>([])
const newPostName = ref('')
const newPostContent = ref('')
const storage = ref<PouchDB.Database | null>(null)

// Connexion à la base de données distante
function initDatabase() {
  const db = new PouchDB('http://admin:M3w24@localhost:5984/post')
  storage.value = db
  console.log("Connected to CouchDB collection 'post'")
}

// Récupérer les documents
function fetchData() {
  if (storage.value) {
    storage.value
      .allDocs({ include_docs: true, attachments: true })
      .then((result: any) => {
        postsData.value = result.rows.map((row: any) => row.doc)
      })
      .catch((error: any) => {
        // Spécification du type pour "error"
        console.error('Erreur lors de la récupération des données:', error)
      })
  }
}

// Ajouter un document de démonstration
function addFakeDocument() {
  const newDocument = {
    doc: {
      post_name: 'Fake Post',
      post_content: 'This is a fake post for testing',
      attributes: {
        creation_date: new Date().toISOString()
      }
    }
  }
  addDocument(newDocument)
}

// Ajouter un document
function addDocument(document: Post) {
  if (storage.value) {
    storage.value
      .post(document)
      .then(() => {
        console.log('Document ajouté dans la base de données')
        fetchData() // Actualiser les données
      })
      .catch((error: any) => {
        // Spécification du type pour "error"
        console.error("Erreur lors de l'ajout:", error)
      })
  }
}

// Modifier un document
function updateDocument(post: Post) {
  if (storage.value && post._id && post._rev) {
    post.doc.post_content = 'Updated content' // Contenu modifié en exemple
    storage.value
      .put(post)
      .then(() => {
        console.log('Document mis à jour')
        fetchData()
      })
      .catch((error: any) => {
        // Spécification du type pour "error"
        console.error('Erreur lors de la mise à jour:', error)
      })
  }
}

// Supprimer un document
function deleteDocument(post: Post) {
  if (storage.value && post._id && post._rev) {
    storage.value
      .remove(post._id, post._rev)
      .then(() => {
        console.log('Document supprimé')
        fetchData()
      })
      .catch((error: any) => {
        // Spécification du type pour "error"
        console.error('Erreur lors de la suppression:', error)
      })
  }
}

// Initialisation de la base de données et chargement des données
onMounted(() => {
  initDatabase()
  fetchData()
})
</script>

<template>
  <header>
    <img alt="Vue logo" class="logo" src="@/assets/logo.svg" width="125" height="125" />

    <div class="wrapper">
      <h1>Nombre de posts: {{ postsData.length }}</h1>

      <!-- Bouton pour ajouter un document de démonstration -->
      <button @click="addFakeDocument">Ajouter un document fake</button>

      <!-- Formulaire pour ajouter un nouveau post -->
      <form
        @submit.prevent="
          addDocument({
            doc: {
              post_name: newPostName,
              post_content: newPostContent,
              attributes: { creation_date: new Date().toISOString() }
            }
          })
        "
      >
        <label for="postName">Nom du post:</label>
        <input v-model="newPostName" id="postName" placeholder="Nom du post" />

        <label for="postContent">Contenu du post:</label>
        <textarea
          v-model="newPostContent"
          id="postContent"
          placeholder="Contenu du post"
        ></textarea>

        <button type="submit">Ajouter le post</button>
      </form>

      <!-- Liste des posts avec options de modification et suppression -->
      <ul>
        <li v-for="post in postsData" :key="post._id">
          <div>
            <strong>{{ post.doc.post_name }}</strong>
            <em v-if="post.doc.attributes?.creation_date">
              - {{ post.doc.attributes.creation_date }}
            </em>
            <p>{{ post.doc.post_content }}</p>

            <button @click="updateDocument(post)">Modifier</button>
            <button @click="deleteDocument(post)">Supprimer</button>
          </div>
        </li>
      </ul>
    </div>
  </header>
</template>

<style scoped>
/* Style identique */
header {
  line-height: 1.5;
  max-height: 100vh;
}

.logo {
  display: block;
  margin: 0 auto 2rem;
}

.wrapper {
  text-align: center;
}

ul {
  list-style-type: none;
  padding: 0;
}

li {
  border-bottom: 1px solid #ddd;
  padding: 1rem 0;
}
</style>

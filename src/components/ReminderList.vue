<!-- eslint-disable prettier/prettier -->
<template>
  <div class="todo-list-container">
    <!-- Section Ajouter une To-Do -->
    <div class="create-todo">
      <h2>Ajouter une To-Do</h2>
      <input
        v-model="newTodoName"
        type="text"
        placeholder="Entrez une tâche"
        class="todo-input"
      />
      <div class="button-group">
        <button @click="addTodo" class="btn-add">+</button>
        <button @click="populateDatabase" class="btn-populate">Factory</button>
        <button @click="updateLocalDatabase" class="btn-update">Actualiser</button>
      </div>
    </div>

    <!-- Section Recherche -->
    <div class="search-section">
      <input
        v-model="searchTerm"
        type="text"
        placeholder="Rechercher une tâche"
        class="search-input"
      />
      <div class="button-group">
        <button @click="searchTask" class="btn-search">Chercher</button>
        <button @click="resetSearch" class="btn-reset">Réinitialiser</button>
      </div>
    </div>

    <!-- Liste des To-Do -->
    <div class="todos-display">
      <h2>Ma To-Do List</h2>
      <ul>
        <li
          v-for="todo in todos"
          :key="todo._id"
          :class="{ 'todo-completed': todo.completed }"
          class="todo-item"
        >
          <div class="todo-title">{{ todo.name }}</div>

          <!-- Médias associés -->
          <div class="media-management">
            <h4>Médias associés</h4>
            <input
              type="file"
              @change="uploadMedia($event, todo._id)"
              class="file-input"
            />
            <ul>
              <li
                v-for="media in todo.media"
                :key="media.name"
                class="media-item"
              >
                <a :href="media.url" target="_blank">{{ media.name }}</a>
                <button
                  @click="deleteMedia(todo._id, media.name)"
                  class="btn-delete-media"
                >
                  Supprimer
                </button>
              </li>
            </ul>
          </div>

          <!-- Boutons Terminé / Supprimer -->
          <div class="todo-actions">
            <button
              v-if="!todo.completed"
              @click="completeTodo(todo._id)"
              class="btn-complete"
            >
              ✓
            </button>
            <button @click="deleteTodo(todo._id)" class="btn-delete">✖</button>
          </div>
        </li>
        <li v-if="todos.length === 0" class="empty-list">
          Aucune tâche à afficher pour le moment.
        </li>
      </ul>
      <button @click="fetchTodos" class="btn-refresh">Rafraîchir</button>
    </div>
  </div>
</template>

<script>
import PouchDB from "pouchdb";
import PouchDBFind from "pouchdb-find";

PouchDB.plugin(PouchDBFind);

export default {
  data() {
    return {
      newTodoName: "",
      todos: [],
      searchTerm: "",
      db: null,
    };
  },
  mounted() {
    console.log("Composant monté, initialisation...");
    this.initDatabase();
    this.fetchTodos();
  },
  methods: {
    // Initialisation de la base de données
    async initDatabase() {
      this.db = new PouchDB("todos");
      this.remoteDB = new PouchDB("http://admin:admin@localhost:5984/todos", {
        auth: {
          username: "admin",
          password: "admin",
        },
      });
      console.log("Base de données initialisée.");
    },

    // Ajouter une To-Do
    async addTodo() {
      if (this.newTodoName.trim() === "") {
        alert("Veuillez entrer une tâche.");
        return;
      }
      const newTodo = {
        _id: new Date().toISOString(),
        name: this.newTodoName,
        completed: false,
        media: [], // Initialise le tableau de médias
      };
      await this.db.put(newTodo);
      this.newTodoName = "";
      console.log("Nouvelle tâche ajoutée :", newTodo);
      this.fetchTodos();
    },

    // Charger les To-Do
    async fetchTodos() {
      try {
        const result = await this.db.allDocs({ include_docs: true });
        console.log("Tâches récupérées :", result);
        this.todos = result.rows.map((row) => ({
          ...row.doc,
          completed: row.doc.completed || false,
          media: row.doc.media || [],
        }));
      } catch (error) {
        console.error("Erreur lors du chargement des tâches : ", error);
      }
    },

    async updateLocalDatabase() {
      try {
        await this.db.sync("http://localhost:5984/todos");
        console.log("Base de données synchronisée avec succès !");
        this.fetchTodos();
      } catch (error) {
        console.error("Erreur lors de la synchronisation de la base de données : ", error);
      }
    },

    // Générer des tâches via la Factory
    async populateDatabase() {
      try {
        for (let i = 1; i <= 20; i++) {
          const newTodo = {
            _id: new Date().toISOString() + `-${i}`,
            name: `Tâche ${i}`,
            completed: false,
            media: [],
          };
          await this.db.put(newTodo);
        }
        alert("20 tâches ont été générées avec succès !");
        console.log("Tâches générées via la Factory.");
        this.fetchTodos();
      } catch (error) {
        console.error("Erreur lors de la génération des tâches : ", error);
      }
    },

    // Rechercher une tâche
    searchTask() {
      if (!this.searchTerm.trim()) {
        alert("Veuillez entrer un terme de recherche.");
        return;
      }
      this.todos = this.todos.filter((todo) =>
        todo.name.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    },

    // Réinitialiser la recherche
    resetSearch() {
      this.searchTerm = "";
      this.fetchTodos();
    },

    // Associer un média à une tâche
    async uploadMedia(event, todoId) {
      const file = event.target.files[0];
      if (!file) return;

      try {
        const todo = await this.db.get(todoId);
        const mediaUrl = URL.createObjectURL(file);

        todo.media.push({ name: file.name, url: mediaUrl });
        await this.db.put(todo);
        this.fetchTodos();
      } catch (error) {
        console.error("Erreur lors de l'ajout du média : ", error);
      }
    },

    // Supprimer un média d'une tâche
    async deleteMedia(todoId, mediaName) {
      try {
        const todo = await this.db.get(todoId);
        todo.media = todo.media.filter((media) => media.name !== mediaName);
        await this.db.put(todo);
        this.fetchTodos();
      } catch (error) {
        console.error("Erreur lors de la suppression du média : ", error);
      }
    },

    // Marquer une tâche comme terminée
    async completeTodo(id) {
      try {
        const doc = await this.db.get(id);
        doc.completed = true;
        await this.db.put(doc);
        this.fetchTodos();
      } catch (error) {
        console.error("Erreur lors de la mise à jour de la tâche : ", error);
      }
    },

    // Supprimer une To-Do
    async deleteTodo(id) {
      try {
        const doc = await this.db.get(id);
        await this.db.remove(doc._id, doc._rev);
        this.fetchTodos();
      } catch (error) {
        console.error("Erreur lors de la suppression de la tâche : ", error);
      }
    },
  },
};
</script>

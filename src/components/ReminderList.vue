<template>
  <div class="todo-list-container">
    <!-- Formulaire de création des To-Do -->
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
        <button @click="updateLocalDatabase" class="btn-update">✔</button>
        <button @click="toggleInfoMessage" class="btn-display">🛈</button>
      </div>
      <!-- Message d'information -->
      <p v-if="showInfoMessage" class="info-message">
        Une fois une tâche ajoutée, cliquez sur le bouton "✔" pour synchroniser avec la base de données.
      </p>
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
          <span>{{ todo.name }}</span>
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
      </ul>
    </div>
  </div>
</template>

<script>
import PouchDB from "pouchdb";

export default {
  data() {
    return {
      newTodoName: "",
      todos: [],
      db: null,
      remoteDB: null,
      showInfoMessage: false,
    };
  },
  mounted() {
    this.initDatabase();
    this.fetchTodos();
  },
  methods: {
    async initDatabase() {
      this.db = new PouchDB("http://admin:admin@localhost:5984/todos");
      this.remoteDB = new PouchDB(
        "http://admin:admin@localhost:5984/todos_remote"
      );
    },
    async addTodo() {
      if (this.newTodoName.trim() === "") {
        alert("Veuillez entrer une tâche.");
        return;
      }
      const newTodo = {
        _id: new Date().toISOString(),
        name: this.newTodoName,
        completed: false, // Nouvelle tâche par défaut non terminée
      };
      try {
        await this.db.put(newTodo);
        this.newTodoName = "";
        this.fetchTodos();
      } catch (error) {
        console.error("Erreur lors de l'ajout de la tâche", error);
      }
    },
    async deleteTodo(id) {
      try {
        const doc = await this.db.get(id);
        await this.db.remove(doc._id, doc._rev);
        this.fetchTodos();
      } catch (error) {
        console.error("Erreur lors de la suppression de la tâche", error);
      }
    },
    async completeTodo(id) {
      try {
        const doc = await this.db.get(id);
        doc.completed = true; // Marquer la tâche comme terminée
        await this.db.put(doc);
        this.fetchTodos(); // Recharger la liste
      } catch (error) {
        console.error("Erreur lors de la mise à jour de la tâche", error);
      }
    },
    async fetchTodos() {
      try {
        const result = await this.db.allDocs({ include_docs: true });
        this.todos = result.rows.map((row) => row.doc);
      } catch (error) {
        console.error("Erreur lors du chargement des tâches", error);
      }
    },
    async updateLocalDatabase() {
      try {
        console.log("Démarrage de la synchronisation...");
        await this.db.replicate.to(this.remoteDB);
        await this.db.replicate.from(this.remoteDB);
        this.fetchTodos();
        console.log("Synchronisation réussie !");
      } catch (error) {
        console.error("Erreur lors de la synchronisation", error);
      }
    },
    toggleInfoMessage() {
      this.showInfoMessage = !this.showInfoMessage;
    },
  },
};
</script>

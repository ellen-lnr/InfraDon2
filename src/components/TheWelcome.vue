<script lang="ts">
import { ref } from "vue";
import PouchDB from "pouchdb";
import pouchdbFind from "pouchdb-find";

PouchDB.plugin(pouchdbFind);

declare interface Post {
  _id: string;
  _rev?: string;
  doc: {
    post_name: string;
    post_content: string;
    attributes: {
      creation_date: string;
      modified: string;
    };
  };
}

export default {
  data() {
    return {
      total: 0,
      postsData: [] as Post[],
      document: null as Post | null,
      storage: null as PouchDB.Database | null,
      remoteDB: null as PouchDB.Database | null, // Ajouter la référence à la DB distante
    };
  },

  mounted() {
    this.initDatabase();
    this.fetchData();
    this.setupReplication(); // Configuration de la réplication
  },

  methods: {
    async updateData(document: Post) {
      const db = this.storage;
      if (!db) {
        console.error("Le stockage n'est pas défini.");
        return;
      }

      try {
        const existingDoc = await db.get(document._id);
        document._rev = existingDoc._rev; // Assigner _rev pour la mise à jour
        await db.put(document);
        console.log("Mise à jour réussie");
      } catch (error) {
        console.error("Erreur lors de la mise à jour", error);
      }
    },

    async deleteData(document: Post) {
      const db = this.storage;
      if (!db) {
        console.error("Le stockage n'est pas défini.");
        return;
      }

      try {
        const existingDoc = await db.get(document._id);
        await db.remove(existingDoc._id, existingDoc._rev);
        console.log("Suppression réussie");
      } catch (error) {
        console.error("Erreur lors de la suppression", error);
      }
    },

    async deletePost(post: Post) {
      if (!this.storage) {
        console.error("Base de données non initialisée");
        return;
      }

      try {
        const response = await this.storage.remove(post);
        console.log("Post supprimé avec succès :", response);
        this.fetchData();
      } catch (error) {
        console.error("Erreur lors de la suppression du post :", error);
      }
    },

    async createIndex() {
  console.log("Création de l'index...");
  try {
    const result = await this.storage.createIndex({
      index: {
        fields: ['doc.post_name', 'doc.attributes.creation_date']
      }
    });
    console.log("Résultat de la création de l'index :", result);  // Affiche le résultat de la création de l'index
    this.listIndexes(); // Vérifie les indices après la création
  } catch (err) {
    console.error("Erreur lors de la création de l'index :", err);
  }
},

async listIndexes() {
  const db = this.storage;
  if (db) {
    try {
      const indexes = await db.listIndexes();
      console.log("Liste des index : ", indexes);
      this.indexes = indexes;
    } catch (error) {
      console.error("Erreur lors de la récupération des index :", error);
    }
  }
},


    fetchData() {
      const storage = ref(this.storage);
      if (storage.value) {
        storage.value
          .allDocs({ include_docs: true, attachments: true })
          .then((result) => {
            console.log("fetchData success", result);
            this.postsData = result.rows;
          })
          .catch((error) => {
            console.error("fetchData error", error);
          });
      }
    },

    createData(document: Post) {
      const db = ref(this.storage);
      try {
        if (document) {
          db.value?.post(document);
        }
      } catch (e) {
        console.error("Impossible de modifier le document", e);
      }
    },

    async initDatabase() {
      const db = new PouchDB("http://admin:admin@localhost:5984/database");
      this.storage = db;
      this.remoteDB = new PouchDB(
        "http://admin:admin@localhost:5984/database_remote",
      );
      
      // Création d'un index sur les champs 'post_name' et 'creation_date'
      try {
        await db.createIndex({
          index: {
            fields: ['doc.post_name', 'doc.attributes.creation_date'],
          },
        });
        console.log("Index créé sur 'post_name' et 'creation_date'");
      } catch (err) {
        console.error("Erreur lors de la création de l'index", err);
      }

      console.log("Connected to local and remote databases");
    },

    getFakePost() {
      return {
        post_name: "post_name" + new Date().toISOString(),
        post_content: "post_content",
        attributes: { creation_date: new Date().toISOString() },
      };
    },

    postDocument() {
      const document = this.getFakePost();
      const db = ref(this.storage).value;
      if (db) {
        db.post(document)
          .then(() => {
            console.log("Add ok");
            this.fetchData();
          })
          .catch((error) => {
            console.error("Add ko", error);
          });
      }
    },

    // Nouvelle méthode pour configurer la réplication
    setupReplication() {
      const db = this.storage;
      const remoteDb = this.remoteDB;

      if (db && remoteDb) {
        // Réplication bidirectionnelle avec gestion des erreurs
        db.replicate
          .to(remoteDb)
          .on("complete", () => {
            console.log(
              "Réplication vers la base distante terminée avec succès.",
            );
          })
          .on("error", (err) => {
            console.error("Erreur de réplication vers la base distante", err);
          });

        remoteDb.replicate
          .to(db)
          .on("complete", () => {
            console.log(
              "Réplication depuis la base distante terminée avec succès.",
            );
          })
          .on("error", (err) => {
            console.error("Erreur de réplication depuis la base distante", err);
          });
      }
    },

    updateLocalDatabase() {
      const db = ref(this.storage).value;
      if (db) {
        db.replicate
          .from(this.remoteDB)
          .on("complete", () => {
            console.log("Réplication complète depuis la base distante.");
            this.fetchData();
          })
          .on("error", (error) => {
            console.error(
              "Erreur lors de la réplication depuis la base distante",
              error,
            );
          });
      }
    },
  },
};
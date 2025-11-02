# 📝 RxJS Todo App - Démonstration des Concepts RxJS

Application Angular moderne démontrant les concepts avancés de **RxJS** en utilisant l'API publique **JSONPlaceholder**.

![Angular](https://img.shields.io/badge/Angular-20.0.0-red)
![RxJS](https://img.shields.io/badge/RxJS-7.8.0-purple)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8.2-blue)
![Standalone](https://img.shields.io/badge/Architecture-Standalone-green)

---

## 🎯 Objectif du Projet

Ce projet est une **application pédagogique** qui illustre :
- ✅ **12+ opérateurs RxJS** en action
- ✅ **Architecture Standalone Components** (Angular moderne)
- ✅ **Gestion d'état réactive** avec BehaviorSubject
- ✅ **Filtrage complexe** avec combineLatest
- ✅ **Optimisations de performance** (debounce, shareReplay)
- ✅ **Intégration API REST** avec JSONPlaceholder

---

## 🚀 Démarrage Rapide

### Installation
```bash
npm install
```

### Lancer le serveur de développement
```bash
npm start
# ou
ng serve
```

L'application sera accessible sur **http://localhost:4200**

---

## 🎓 Concepts RxJS Démontrés

### Opérateurs Utilisés

| Opérateur | Utilisation | Fichier |
|-----------|-------------|---------|
| `BehaviorSubject` | Gestion d'état réactive | `todo-service.ts` |
| `forkJoin` | Requêtes parallèles | `todo-list.ts` |
| `combineLatest` | Combinaison de filtres multiples | `todo-list.ts` |
| `debounceTime` | Anti-rebond pour la recherche | `todo-list.ts` |
| `distinctUntilChanged` | Ignorer les changements identiques | `todo-list.ts` |
| `map` | Transformation des données | `todo-service.ts`, `todo-list.ts` |
| `filter` | Filtrage des données | `todo-list.ts` |
| `tap` | Mise à jour optimiste & logging | `todo-service.ts` |
| `retry` | Réessai automatique en cas d'erreur | `todo-service.ts` |
| `catchError` | Gestion des erreurs | `todo-service.ts`, `todo-list.ts` |
| `takeUntil` | Nettoyage des ressources | `todo-list.ts` |
| `shareReplay` | Mise en cache des requêtes | `todo-service.ts` |
| `startWith` | Valeur initiale | `todo-list.ts` |

---

## 📋 Opérations CRUD Complètes

### ✅ CREATE - Ajouter un Todo
```typescript
onAddTodo(): void {
  const title = this.newTodoControl.value?.trim();
  if (!title) return alert('Titre vide');
  
  this.todoService.addTodo(title).pipe(
    tap(() => this.newTodoControl.reset()),
    catchError(err => of(null)),
    takeUntil(this.destroy$)
  ).subscribe();
}
```

### ✅ READ - Afficher et Filtrer
```typescript
private setupFilters(): void {
  this.filteredTodos$ = combineLatest([
    this.searchControl.valueChanges.pipe(
      startWith(''), debounceTime(300), distinctUntilChanged()
    ),
    this.statusControl.valueChanges.pipe(startWith('all')),
    this.userControl.valueChanges.pipe(startWith('all')),
    this.todos$
  ]).pipe(
    map(([search, status, user, todos]) => {
      // Appliquer les filtres
    })
  );
}
```

### ✅ UPDATE - Modifier un Todo
```typescript
onUpdateTodo(id: number): void {
  const newTitle = this.editTodoControl.value?.trim();
  if (!newTitle) return alert('Titre vide');
  
  this.todoService.updateTodo(id, { title: newTitle }).pipe(
    tap(() => this.cancelEdit()),
    catchError(err => of(null)),
    takeUntil(this.destroy$)
  ).subscribe();
}
```

### ✅ DELETE - Supprimer un Todo
```typescript
onDeleteTodo(id: number, title: string): void {
  if (!confirm(`Supprimer "${title}" ?`)) return;
  
  this.todoService.deleteTodo(id).pipe(
    tap(() => console.log('Supprimé')),
    catchError(err => of(null)),
    takeUntil(this.destroy$)
  ).subscribe();
}
```

---

## 📚 Documentation Complète

### 🎯 Guide Rapide (5-10 min)
- 📄 **[QUICK-START-CRUD.md](./QUICK-START-CRUD.md)** - Résumé ultra-rapide avec exemples

### 📋 Guide Détaillé CRUD (20-30 min)
- 📄 **[GUIDE-CRUD.md](./GUIDE-CRUD.md)** - Chaque opération CRUD expliquée en détail
- 🔄 **[DIAGRAMMES-FLUX-CRUD.md](./DIAGRAMMES-FLUX-CRUD.md)** - Visualisation du flux d'exécution

### 📚 Guide Complet RxJS (45-60 min)
- 📄 **[EXPLAINATION-RXJS.md](./EXPLAINATION-RXJS.md)** - Concepts, opérateurs, architecture, exemples

### 🗺️ Navigation et Index
- 📄 **[INDEX-DOCUMENTATION.md](./INDEX-DOCUMENTATION.md)** - Guide de navigation de la documentation
- 📄 **[RESUME-COMPLETION.md](./RESUME-COMPLETION.md)** - Résumé des tâches complétées

---

## 📖 Par Où Commencer ?

### 🟢 Débutant
1. Lire **[QUICK-START-CRUD.md](./QUICK-START-CRUD.md)** (5 min)
2. Lire **[GUIDE-CRUD.md](./GUIDE-CRUD.md)** - CREATE section (15 min)
3. Expérimenter avec le code source

### 🟡 Intermédiaire
1. Lire **[GUIDE-CRUD.md](./GUIDE-CRUD.md)** - Complet (30 min)
2. Lire **[DIAGRAMMES-FLUX-CRUD.md](./DIAGRAMMES-FLUX-CRUD.md)** (20 min)
3. Étudier le code source en détail

### 🔴 Avancé
1. Lire **[EXPLAINATION-RXJS.md](./EXPLAINATION-RXJS.md)** - Complet (60 min)
2. Expérimenter avec les opérateurs
3. Créer vos propres Observables

---

## 🏗️ Architecture du Projet

```
src/
├── app/
│   ├── services/
│   │   └── todo-service.ts              ← CRUD HTTP + State Management
│   ├── components/
│   │   └── todo-list/
│   │       ├── todo-list.ts             ← Logique du composant
│   │       ├── todo-list.html           ← Template avec CRUD UI
│   │       └── todo-list.css            ← Styles
│   └── models/
│       ├── todo.model.ts                ← Interface Todo
│       └── user.model.ts                ← Interface User
│
├── Documentation/ (NOUVEAU)
│   ├── QUICK-START-CRUD.md              ⚡ Résumé 5 min
│   ├── GUIDE-CRUD.md                    📋 Guide détaillé CRUD
│   ├── DIAGRAMMES-FLUX-CRUD.md          🔄 Visualisations
│   ├── EXPLAINATION-RXJS.md             📚 Concepts RxJS
│   ├── INDEX-DOCUMENTATION.md           🗺️ Navigation
│   └── RESUME-COMPLETION.md             ✅ Tâches complétées
│
└── index.html
```

---

## 💡 Points Clés

### ✅ CRUD Complet
- CREATE avec validation et mise à jour optimiste
- READ avec chargement parallèle (forkJoin)
- UPDATE avec interface d'édition inline
- DELETE avec confirmation
- TOGGLE pour changer le statut

### ✅ Mise à Jour Optimiste
- L'interface se met à jour **immédiatement**
- Requête HTTP en arrière-plan
- Restauration en cas d'erreur
- Meilleure UX (pas de délai)

### ✅ Réactivité
- BehaviorSubject pour l'état
- combineLatest pour combiner plusieurs sources
- debounceTime pour optimiser les recherches
- distinctUntilChanged pour ignorer les doublons

### ✅ Nettoyage des Ressources
- takeUntil(destroy$) sur tous les Observables
- ngOnDestroy() pour nettoyer
- Prévient les fuites mémoire

### ✅ Gestion d'Erreurs
- retry() pour réessayer automatiquement
- catchError() pour gérer les erreurs gracieusement
- Messages d'erreur à l'utilisateur

---

## 🛠️ Technologies Utilisées

- **Angular 20.0.0** - Framework
- **RxJS 7.8.0** - Programmation réactive
- **TypeScript 5.8.2** - Typage statique
- **Standalone Components** - Architecture moderne
- **Reactive Forms** - Gestion des formulaires
- **HttpClientModule** - Requêtes HTTP
- **JSONPlaceholder** - API de démonstration

---

## 📊 Ce Que Vous Allez Apprendre

✅ Comprendre les **Observables** et les **Subjects**  
✅ Utiliser les **opérateurs RxJS** (15+ opérateurs)  
✅ Implémenter le **pattern BehaviorSubject** pour l'état  
✅ Créer des **Observables réactifs** avec combineLatest  
✅ Gérer les **erreurs** avec catchError et retry  
✅ Implémenter la **mise à jour optimiste**  
✅ Effectuer les **opérations CRUD** complètes  
✅ **Nettoyer les ressources** avec takeUntil  
✅ Optimiser avec **debounceTime** et **shareReplay**  
✅ **Architecturer une application réactive** en Angular  

---

## ⚙️ Configuration Requise

- Node.js 16+
- npm 8+
- Angular CLI 20.0.0+
- Navigateur moderne

---

## 📝 Notes Importantes

### JSONPlaceholder
⚠️ JSONPlaceholder est une API de **démonstration** :
- ✅ Accepte les requêtes POST/PUT/PATCH/DELETE
- ✅ Retourne des réponses réalistes
- ❌ **N'enregistre pas les données** (pas de persistance)
- ✅ **Parfait pour apprendre RxJS**

### Conventions de Nommage
- Tous les Observables se terminent par `$` : `todos$`, `loading$`
- Les méthodes de composant commencent par `on` : `onAddTodo()`
- Les Subjects privés sont préfixés par `private` : `destroy$`

---

## 🚀 Prochaines Étapes

Pour améliorer l'application :
1. **Backend réel** - Remplacer JSONPlaceholder
2. **Base de données** - Persistance réelle
3. **Pagination** - Charger plus de todos
4. **Catégories** - Organiser les todos
5. **Tests** - Tests unitaires avec RxJS
6. **Déploiement** - Hébergement production

---

## 📞 Support

- 📚 Consultez la documentation (`*.md`)
- 🔗 Ressources officielles : [RxJS Docs](https://rxjs.dev)
- 🏃 Tutoriels : [Angular Guide](https://angular.io/guide/rx-library)

---

## 📜 Licence

MIT - Libre d'utilisation pour l'apprentissage et les projets commerciaux.

---

## 🎉 À Propos

Cette application est une **démonstration pédagogique** complète de RxJS avec :
- ✅ Code bien structuré et commenté
- ✅ 5 fichiers de documentation détaillée
- ✅ 30+ exemples de code
- ✅ Parcours d'apprentissage progressif
- ✅ Concepts du débutant à l'avancé

**Prêt à maîtriser RxJS ? Commencez par [QUICK-START-CRUD.md](./QUICK-START-CRUD.md) ! 🚀**

---

*Créée en Novembre 2024 | Documentation Complète | CRUD Fonctionnel | RxJS Avancé*
| `distinctUntilChanged` | Élimination des doublons | `todo-list.ts` |
| `switchMap` | Toggle des todos | `todo-list.ts` |
| `map` | Transformation des données | Partout |
| `tap` | Logs et effets de bord | Partout |
| `retry` | Résilience réseau | `todo-service.ts` |
| `catchError` | Gestion d'erreurs | Partout |
| `shareReplay` | Cache des requêtes HTTP | `todo-service.ts` |
| `startWith` | Valeurs initiales | `todo-list.ts` |
| `takeUntil` | Désabonnement automatique | `todo-list.ts` |

---

## 📁 Structure du Projet

```
src/app/
├── app.ts                      # Root component (standalone)
├── app.config.ts               # Configuration de l'application
├── app.spec.ts                 # Tests unitaires
├── components/
│   └── todo-list/
│       ├── todo-list.ts        # Composant principal (standalone)
│       ├── todo-list.html      # Template
│       └── todo-list.css       # Styles
├── services/
│   └── todo-service.ts         # Service de gestion des todos
└── models/
    ├── todo.model.ts           # Interface Todo
    └── user.model.ts           # Interface User
```

---

## 🏗️ Architecture

### Standalone Components
Ce projet utilise **exclusivement des standalone components** (pas de NgModule) :

```typescript
// main.ts
bootstrapApplication(AppComponent, appConfig);

// app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideHttpClient(withFetch())
  ]
};

// app.ts
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [TodoList],
  template: '<app-todo-list></app-todo-list>'
})
export class AppComponent {}
```

---

## 🌐 API Utilisée

**JSONPlaceholder** - API REST factice gratuite
- Base URL : `https://jsonplaceholder.typicode.com`
- GET `/todos` : Liste de 200 todos (limité à 50 dans l'app)
- GET `/users` : Liste de 10 utilisateurs
- PATCH `/todos/:id` : Mise à jour d'un todo (simulation)

---

## ✨ Fonctionnalités

### 1. Chargement Parallèle (forkJoin)
- Charge todos et users simultanément
- Affiche un spinner pendant le chargement
- Gère les erreurs réseau avec retry(2)

### 2. Recherche Réactive (debounceTime)
- Anti-rebond de 300ms
- Recherche insensible à la casse
- Ouvrez la console pour voir les logs

### 3. Filtres Multiples (combineLatest)
- Par statut : Tous / Actifs / Complétés
- Par utilisateur : Sélection dans un dropdown
- Combinaison automatique des filtres

### 4. Statistiques en Temps Réel
- Nombre total de todos
- Todos complétés / actifs
- Mise à jour automatique

### 5. Toggle de Todo (switchMap)
- Clic pour changer le statut
- Mise à jour optimiste
- Synchronisation avec l'API

---

## 🔍 Observer RxJS en Action

### Console du Navigateur (F12)

Observez les logs pour comprendre le flux :

```
📦 Todos chargés: 50
👥 Users chargés: 10
✅ Données chargées: {todos: 50, users: 10}
🔍 Recherche: "delectus"
📊 Filtre statut: "completed"
👤 Filtre user: "2"
✨ Résultats filtrés: 8
📈 Stats: {total: 8, completed: 8, active: 0}
```

---

## 🧪 Tests

```bash
ng test
```

---

## 🏗️ Build

```bash
ng build
```

Les fichiers de production seront dans `dist/`

---

## 📚 Documentation Complète

Le projet inclut plusieurs documents détaillés :

- **`ANALYSE_PROJET.md`** - Analyse approfondie des concepts RxJS
- **`ARCHITECTURE_VISUELLE.md`** - Diagrammes et flux de données
- **`MODIFICATIONS_ET_UTILISATION.md`** - Guide d'utilisation
- **`NETTOYAGE_PROJET.md`** - Rapport du nettoyage effectué

---

## 🎨 Concepts Avancés Illustrés

### Gestion d'État
```typescript
private todosSubject = new BehaviorSubject<Todo[]>([]);
public todos$ = this.todosSubject.asObservable();
```

### Filtrage Complexe
```typescript
combineLatest([search$, status$, user$, todos$]).pipe(
  map(([search, status, user, todos]) => {
    // Logique de filtrage
  })
)
```

### Optimisation Performance
```typescript
this.searchControl.valueChanges.pipe(
  debounceTime(300),
  distinctUntilChanged(),
  shareReplay(1)
)
```

### Désabonnement Automatique
```typescript
private destroy$ = new Subject<void>();

ngOnInit() {
  this.data$.pipe(
    takeUntil(this.destroy$)
  ).subscribe();
}

ngOnDestroy() {
  this.destroy$.next();
  this.destroy$.complete();
}
```

---

## 🛠️ Technologies

- **Angular 20.0.0** - Framework
- **RxJS 7.8.0** - Programmation réactive
- **TypeScript 5.8.2** - Langage
- **Angular CLI 20.0.1** - Outillage

---

## 📖 Ressources

- [RxJS Documentation](https://rxjs.dev/)
- [Angular Standalone Components](https://angular.dev/guide/components)
- [JSONPlaceholder API](https://jsonplaceholder.typicode.com/)
- [RxJS Marbles](https://rxmarbles.com/) - Visualiseur d'opérateurs

---

## ✅ Checklist des Bonnes Pratiques

- ✅ Standalone Components (pas de NgModule)
- ✅ Typage fort avec TypeScript
- ✅ Gestion d'erreurs robuste (retry + catchError)
- ✅ Performance optimisée (debounce + shareReplay)
- ✅ Pas de fuites mémoire (takeUntil pattern)
- ✅ Code lisible avec logs et emojis
- ✅ Architecture claire et maintenable
- ✅ Reactive Forms pour les contrôles
- ✅ Async Pipe pour les subscriptions auto
- ✅ HttpClient avec Fetch API moderne

---

## 📝 Licence

Ce projet est un exemple pédagogique libre d'utilisation.

---

## 👨‍💻 Auteur

Projet de démonstration des concepts RxJS avec Angular Standalone Components.

**Date de création :** 2025-11-02  
**Version Angular :** 20.0.0  
**Version RxJS :** 7.8.0

---

## 🚀 Prochaines Étapes

1. Explorez le code et modifiez les opérateurs
2. Consultez la documentation dans les fichiers `.md`
3. Observez les logs dans la console
4. Expérimentez avec les filtres
5. Ajoutez vos propres fonctionnalités

**Bon apprentissage avec RxJS ! 🎓**
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

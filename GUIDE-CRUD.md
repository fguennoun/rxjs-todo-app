# 📋 GUIDE : Utilisation du CRUD RxJS dans l'Application Todo

## 📚 Table des Matières
1. [Aperçu du CRUD](#aperçu-du-crud)
2. [CREATE - Créer un Todo](#create---créer-un-todo)
3. [READ - Lire les Todos](#read---lire-les-todos)
4. [UPDATE - Modifier un Todo](#update---modifier-un-todo)
5. [DELETE - Supprimer un Todo](#delete---supprimer-un-todo)
6. [Architecture du Flux de Données](#architecture-du-flux-de-données)
7. [Concepts RxJS Utilisés](#concepts-rxjs-utilisés)

---

## Aperçu du CRUD

L'application Todo démontre les 4 opérations CRUD fondamentales :

```
┌─────────────────────────────────────────┐
│         OPÉRATIONS CRUD                 │
├─────────────────────────────────────────┤
│ CREATE : Ajouter un nouveau todo        │
│ READ   : Afficher tous les todos        │
│ UPDATE : Modifier le titre ou le statut │
│ DELETE : Supprimer un todo              │
└─────────────────────────────────────────┘
```

> ⚠️ **Important** : JSONPlaceholder est une API de démonstration qui simule les opérations CRUD. Les données ne sont pas persistées réellement, mais l'API répond comme si c'était le cas. C'est parfait pour apprendre RxJS !

---

## CREATE - Créer un Todo

### Flux d'Exécution

```
Utilisateur tape dans l'input
          ↓
  (keyup.enter) déclenche onAddTodo()
          ↓
  Valider que le titre n'est pas vide
          ↓
  Appeler todoService.addTodo(title)
          ↓
  HTTP POST vers /todos
          ↓
  Mise à jour optimiste (ajout local immédiat)
          ↓
  BehaviorSubject émet les nouveaux todos
          ↓
  Template affiche le nouveau todo
          ↓
  Input se vide automatiquement
```

### Code dans le Composant

```typescript
// Dans todo-list.ts
onAddTodo(): void {
  // 1. Récupérer la valeur de l'input
  const title = this.newTodoControl.value?.trim();
  
  // 2. Validation
  if (!title) {
    alert('Le titre ne peut pas etre vide');
    return;
  }
  
  // 3. Appeler le service
  this.todoService.addTodo(title).pipe(
    tap(() => {
      console.log('✅ Todo créé avec succès:', title);
      // 4. Vider l'input
      this.newTodoControl.reset();
    }),
    catchError(error => {
      console.error('❌ Erreur:', error);
      alert('Erreur lors de la création du todo');
      return of(null);
    }),
    takeUntil(this.destroy$)
  ).subscribe();
}
```

### Code dans le Service

```typescript
// Dans todo-service.ts
addTodo(title: string, userId: number = 1): Observable<Todo> {
  const newTodo: Partial<Todo> = {
    title,
    userId,
    completed: false
  };

  return this.http.post<Todo>(`${this.API_URL}/todos`, newTodo).pipe(
    tap(todo => {
      console.log('✅ Todo créé:', todo);
      
      // MISE À JOUR OPTIMISTE
      const todos = this.todosSubject.value;
      // L'API retourne id=201, on utilise un id local
      const localTodo = { ...todo, id: todos.length + 1 };
      
      // Émettre immédiatement l'état mis à jour
      this.todosSubject.next([localTodo, ...todos]);
    }),
    retry(1),  // Réessayer une fois si erreur
    catchError(error => {
      console.error('❌ Erreur création todo:', error);
      return throwError(() => new Error('Impossible de créer le todo'));
    })
  );
}
```

### HTML

```html
<!-- Formulaire d'ajout -->
<div class="add-todo-form">
  <h3>➕ Ajouter un nouveau todo</h3>
  <div class="add-todo-input-group">
    <!-- Input avec deux déclencheurs -->
    <input
      type="text"
      [formControl]="newTodoControl"
      placeholder="Titre du nouveau todo..."
      (keyup.enter)="onAddTodo()"  <!-- Entrée déclencheur -->
    />
    <!-- Bouton comme alternative -->
    <button (click)="onAddTodo()" class="btn-add">Ajouter</button>
  </div>
</div>
```

### Concepts RxJS Utilisés

| Concept | Rôle |
|---------|------|
| `post()` | Observable HTTP POST |
| `tap()` | Effectuer la mise à jour optimiste |
| `retry()` | Réessayer automatiquement |
| `catchError` | Gérer les erreurs |
| `BehaviorSubject` | Émettre l'état mis à jour |

---

## READ - Lire les Todos

### Flux d'Exécution

```
ngOnInit du composant
      ↓
forkJoin([getTodos(), getUsers()])
      ↓
HTTP GET /todos et /users (parallèle)
      ↓
Résultats reçus
      ↓
Mise à jour de todosSubject
      ↓
Observable todos$ émet
      ↓
combineLatest combine todos$ avec les filtres
      ↓
Template affiche via async pipe
```

### Code dans le Composant

```typescript
// Dans todo-list.ts
private loadInitialData(): void {
  this.todoService.setLoading(true);
  
  // 1. Utiliser forkJoin pour charger en parallèle
  forkJoin({
    todos: this.todoService.getTodos(),
    users: this.todoService.getUsers()
  }).pipe(
    // 2. Quand les deux requêtes sont terminées
    tap(({ todos, users }) => {
      console.log('📦 Données chargées:', {
        todos: todos.length,
        users: users.length
      });
      // 3. Mettre à jour le state
      this.todoService.updateTodosState(todos);
    }),
    // 4. Arrêter le loading
    tap(() => this.todoService.setLoading(false)),
    // 5. Gérer les erreurs
    catchError(error => {
      console.error('❌ Erreur:', error);
      this.todoService.setLoading(false);
      return of({ todos: [], users: [] });
    }),
    // 6. Nettoyer automatiquement
    takeUntil(this.destroy$)
  ).subscribe();
  
  // 7. Exposer les todos aux templates
  this.todos$ = this.todoService.todos$;
  this.users$ = this.todoService.getUsers();
}

// Filtrage réactif
private setupFilters(): void {
  this.filteredTodos$ = combineLatest([
    // Champ de recherche
    this.searchControl.valueChanges.pipe(
      startWith(''),           // Valeur initiale
      debounceTime(300),       // Attendre 300ms
      distinctUntilChanged()   // Ignorer les doublons
    ),
    // Filtre par statut
    this.statusControl.valueChanges.pipe(
      startWith('all')
    ),
    // Filtre par utilisateur
    this.userControl.valueChanges.pipe(
      startWith('all')
    ),
    // Les todos eux-mêmes
    this.todos$
  ]).pipe(
    map(([search, status, user, todos]) => {
      let filtered = [...todos];
      
      // Appliquer les filtres
      if (search && search.trim()) {
        filtered = filtered.filter(todo =>
          todo.title.toLowerCase().includes(search.toLowerCase())
        );
      }
      
      if (status === 'completed') {
        filtered = filtered.filter(todo => todo.completed);
      } else if (status === 'active') {
        filtered = filtered.filter(todo => !todo.completed);
      }
      
      if (user && user !== 'all') {
        filtered = filtered.filter(todo => 
          todo.userId === parseInt(user)
        );
      }
      
      return filtered;
    })
  );
}
```

### HTML

```html
<!-- Affichage avec async pipe (gestion automatique) -->
<div *ngIf="!(loading$ | async)" class="todo-list">
  <div *ngFor="let todo of filteredTodos$ | async" class="todo-item">
    {{ todo.title }}
  </div>
</div>

<!-- État vide -->
<div *ngIf="(filteredTodos$ | async)?.length === 0">
  Aucun todo trouvé
</div>
```

### Service

```typescript
// Dans todo-service.ts
getTodos(): Observable<Todo[]> {
  return this.http.get<Todo[]>(`${this.API_URL}/todos`).pipe(
    map(todos => todos.slice(0, 50)), // Limiter pour la démo
    tap(todos => console.log('📦 Todos chargés:', todos.length)),
    retry(2),  // Réessayer 2 fois
    catchError(error => {
      console.error('❌ Erreur:', error);
      return throwError(() => new Error('Impossible de charger'));
    }),
    shareReplay(1)  // Mettre en cache
  );
}
```

### Concepts RxJS Utilisés

| Concept | Rôle |
|---------|------|
| `forkJoin` | Combiner plusieurs requêtes en parallèle |
| `combineLatest` | Réagir quand n'importe quel filtre change |
| `map` | Transformer les données (filtrage) |
| `debounceTime` | Attendre 300ms avant de filtrer |
| `distinctUntilChanged` | Ignorer les changements identiques |
| `shareReplay` | Mettre en cache et partager |
| `async` pipe | S'abonner automatiquement dans le template |

---

## UPDATE - Modifier un Todo

### Flux d'Exécution

```
Utilisateur clique sur le bouton ✏️ (modifier)
          ↓
startEdit(todo) rempli l'input d'édition
          ↓
Interface passe en mode édition
          ↓
Utilisateur peut modifier le texte
          ↓
Appuyer sur Entrée ou cliquer sur "Sauver"
          ↓
onUpdateTodo(id) déclenché
          ↓
Valider le nouveau titre
          ↓
HTTP PUT vers /todos/:id
          ↓
Mise à jour optimiste (état local mis à jour)
          ↓
BehaviorSubject émet les todos modifiés
          ↓
Template affiche la modification
          ↓
Mode édition fermé
```

### Code dans le Composant

```typescript
// Démarrer l'édition
startEdit(todo: Todo): void {
  this.editingTodoId = todo.id;  // Activer le mode édition
  this.editTodoControl.setValue(todo.title);  // Remplir l'input
}

// Enregistrer la modification
onUpdateTodo(id: number): void {
  // 1. Récupérer le nouveau titre
  const newTitle = this.editTodoControl.value?.trim();
  
  // 2. Valider
  if (!newTitle) {
    alert('Le titre ne peut pas etre vide');
    return;
  }
  
  // 3. Appeler le service
  this.todoService.updateTodo(id, { title: newTitle }).pipe(
    tap(() => {
      console.log('✅ Todo mis à jour:', id);
      this.cancelEdit();  // Fermer le mode édition
    }),
    catchError(error => {
      console.error('❌ Erreur:', error);
      alert('Erreur lors de la modification');
      return of(null);
    }),
    takeUntil(this.destroy$)
  ).subscribe();
}

// Annuler l'édition
cancelEdit(): void {
  this.editingTodoId = null;
  this.editTodoControl.reset();
}
```

### Code dans le Service

```typescript
// Dans todo-service.ts
updateTodo(id: number, updates: Partial<Todo>): Observable<Todo> {
  return this.http.put<Todo>(
    `${this.API_URL}/todos/${id}`,
    updates
  ).pipe(
    tap(updatedTodo => {
      console.log('✅ Todo modifié:', updatedTodo);
      
      // MISE À JOUR OPTIMISTE
      const todos = this.todosSubject.value;
      const updated = todos.map(t =>
        t.id === id ? { ...t, ...updates } : t
      );
      
      this.todosSubject.next(updated);
    }),
    retry(1),
    catchError(error => {
      console.error('❌ Erreur modification:', error);
      return throwError(() => new Error('Impossible de modifier'));
    })
  );
}
```

### HTML

```html
<!-- Mode édition -->
<div *ngIf="editingTodoId === todo.id" class="edit-mode">
  <!-- Input d'édition -->
  <input
    type="text"
    [formControl]="editTodoControl"
    class="edit-input"
    (keyup.enter)="onUpdateTodo(todo.id)"
    (keyup.escape)="cancelEdit()"
  />
  
  <!-- Actions -->
  <div class="edit-actions">
    <button (click)="onUpdateTodo(todo.id)" class="btn-save">
      💾 Sauver
    </button>
    <button (click)="cancelEdit()" class="btn-cancel">
      ❌ Annuler
    </button>
  </div>
</div>

<!-- Mode normal -->
<div *ngIf="editingTodoId !== todo.id" class="normal-mode">
  {{ todo.title }}
  <button (click)="startEdit(todo)" class="btn-edit">
    ✏️
  </button>
</div>
```

### Concepts RxJS Utilisés

| Concept | Rôle |
|---------|------|
| `put()` | Observable HTTP PUT |
| `tap()` | Mise à jour optimiste |
| `map()` | Transformer le tableau de todos |
| `retry()` | Réessayer automatiquement |
| `catchError` | Gestion d'erreur |

---

## DELETE - Supprimer un Todo

### Flux d'Exécution

```
Utilisateur clique sur le bouton 🗑️ (supprimer)
          ↓
onDeleteTodo(id) déclenché
          ↓
Confirmation de suppression
          ↓
HTTP DELETE vers /todos/:id
          ↓
Suppression optimiste (retrait local immédiat)
          ↓
BehaviorSubject émet l'état mis à jour
          ↓
Template affiche la suppression
```

### Code dans le Composant

```typescript
// Dans todo-list.ts
onDeleteTodo(id: number, title: string): void {
  // 1. Demander une confirmation
  if (!confirm('Voulez-vous vraiment supprimer "' + title + '" ?')) {
    return;
  }
  
  // 2. Appeler le service
  this.todoService.deleteTodo(id).pipe(
    tap(() => {
      console.log('✅ Todo supprimé:', id);
    }),
    catchError(error => {
      console.error('❌ Erreur:', error);
      alert('Erreur lors de la suppression');
      return of(null);
    }),
    takeUntil(this.destroy$)
  ).subscribe();
}
```

### Code dans le Service

```typescript
// Dans todo-service.ts
deleteTodo(id: number): Observable<void> {
  return this.http.delete<void>(`${this.API_URL}/todos/${id}`).pipe(
    tap(() => {
      console.log('🗑️ Todo supprimé:', id);
      
      // SUPPRESSION OPTIMISTE
      const todos = this.todosSubject.value;
      const filtered = todos.filter(t => t.id !== id);
      
      // Émettre l'état sans le todo supprimé
      this.todosSubject.next(filtered);
    }),
    retry(1),
    catchError(error => {
      console.error('❌ Erreur suppression:', error);
      return throwError(() => new Error('Impossible de supprimer'));
    })
  );
}
```

### HTML

```html
<!-- Bouton supprimer -->
<button 
  (click)="onDeleteTodo(todo.id, todo.title)" 
  class="btn-delete"
  title="Supprimer"
>
  🗑️
</button>
```

### Concepts RxJS Utilisés

| Concept | Rôle |
|---------|------|
| `delete()` | Observable HTTP DELETE |
| `tap()` | Suppression optimiste |
| `filter()` | Retirer l'élément du tableau |
| `retry()` | Réessayer automatiquement |
| `catchError` | Gestion d'erreur |

---

## Architecture du Flux de Données

### Flux Global CRUD

```
┌────────────────────────────────────────────────��────────────┐
│                   Angular Component                         │
│                   (todo-list.ts)                            │
├─────────────────────────────────────────────────────────────┤
│  - FormControl pour input                                  │
│  - Observable todos$, users$, filteredTodos$              │
│  - Méthodes CRUD : onCreate, onRead, onUpdate, onDelete  │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    TodoService                              │
│                 (todo-service.ts)                           │
├─────────────────────────────────────────────────────────────┤
│  - BehaviorSubject todosSubject$                           │
│  - addTodo(title)        → POST /todos                     │
│  - updateTodo(id, data)  → PUT /todos/:id                 │
│  - deleteTodo(id)        → DELETE /todos/:id              │
│  - toggleTodo(id)        → PATCH /todos/:id               │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              HttpClient + RxJS Operators                    │
├─────────────────────────────────────────────────────────────┤
│  - HTTP request vers JSONPlaceholder                        │
│  - tap() : mise à jour optimiste                           │
│  - retry() : réessayer en cas d'erreur                     │
│  - catchError() : gérer les erreurs                        │
│  - shareReplay() : mettre en cache                         │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│          JSONPlaceholder API (Simulation)                   │
├─────────────────────────────────────────────────────────────┤
│  ✓ Accepte les POST, PUT, PATCH, DELETE                   │
│  ✗ Ne persiste pas les données                            │
│  ✓ Parfait pour apprendre RxJS                           │
└─────────────────────────────────────────────────────────────┘
```

### État Réactif

```typescript
// Au démarrage
todos$ emit []

// Après chargement
todos$ emit [todo1, todo2, todo3, ...]

// Après ajout
todos$ emit [newTodo, todo1, todo2, ...]

// Après modification
todos$ emit [todo1Modified, todo2, todo3, ...]

// Après suppression
todos$ emit [todo1, todo3, ...] // todo2 disparu

// Les Observables dépendants se recalculent automatiquement
filteredTodos$ react au changement
stats$ react au changement
```

---

## Concepts RxJS Utilisés

### Résumé Complet

| Opérateur | Utilité | Exemple |
|-----------|---------|---------|
| `Observable` | Flux de données | `this.todos$` |
| `BehaviorSubject` | Observable + État | `todosSubject` |
| `next()` | Émettre une valeur | `todosSubject.next(todos)` |
| `asObservable()` | Exposer comme Observable | `todosSubject.asObservable()` |
| `post()` | HTTP POST (CREATE) | `http.post(url, data)` |
| `put()` | HTTP PUT (UPDATE) | `http.put(url, data)` |
| `delete()` | HTTP DELETE (DELETE) | `http.delete(url)` |
| `patch()` | HTTP PATCH (TOGGLE) | `http.patch(url, data)` |
| `get()` | HTTP GET (READ) | `http.get(url)` |
| `forkJoin` | Attendre tous | `forkJoin({...})` |
| `combineLatest` | Réagir à tous | `combineLatest([...])` |
| `map()` | Transformer | `map(todos => ...)` |
| `filter()` | Filtrer | `filter(todo => ...)` |
| `tap()` | Effet de bord | `tap(x => console.log(x))` |
| `retry()` | Réessayer | `retry(2)` |
| `catchError` | Gérer erreur | `catchError(err => ...)` |
| `debounceTime` | Attendre ms | `debounceTime(300)` |
| `distinctUntilChanged` | Ignorer doublons | `distinctUntilChanged()` |
| `startWith` | Valeur initiale | `startWith('')` |
| `takeUntil` | Arrêter quand | `takeUntil(destroy$)` |
| `shareReplay` | Mettre en cache | `shareReplay(1)` |

---

## Mise à Jour Optimiste

### Concept

La "mise à jour optimiste" signifie que l'interface utilisateur est mise à jour **AVANT** que le serveur confirme l'opération.

### Avantages

✅ Interface rapide et réactive  
✅ Meilleure UX (pas de délai d'attente)  
✅ Fonctionne si le réseau est lent

### Comment ?

```typescript
// 1. Mettre à jour immédiatement (optimiste)
const todos = this.todosSubject.value;
const updated = [newTodo, ...todos];
this.todosSubject.next(updated);  // L'UI se met à jour MAINTENANT

// 2. Faire la requête HTTP en arrière-plan
return this.http.post(url, newTodo).pipe(
  // 3. Si succès, l'état est déjà bon
  tap(serverResponse => {
    console.log('✅ Serveur confirmé');
  }),
  // 4. Si erreur, annuler et restaurer
  catchError(error => {
    const todos = this.todosSubject.value;
    const restored = todos.filter(t => t.id !== newTodo.id);
    this.todosSubject.next(restored);  // Retirer le todo
    return throwError(() => error);
  })
);
```

---

## Conclusion

L'application Todo démontre complètement les opérations CRUD avec RxJS :

✅ **CREATE** : Ajouter avec POST + mise à jour optimiste  
✅ **READ** : Charger avec forkJoin + filtrer avec combineLatest  
✅ **UPDATE** : Modifier avec PUT + interface d'édition  
✅ **DELETE** : Supprimer avec DELETE + confirmation  

Tous les concepts RxJS importants sont utilisés pour créer une application réactive, performante et maintenable ! 🚀


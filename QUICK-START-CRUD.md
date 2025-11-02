# ⚡ Quick Start - CRUD RxJS en 5 Minutes

## 🎯 Résumé Ultra-Rapide

| Opération | Code | Résultat |
|-----------|------|----------|
| **CREATE** | `todoService.addTodo(title)` | POST + mise à jour locale |
| **READ** | `this.todos$` / `this.filteredTodos$` | Observables en temps réel |
| **UPDATE** | `todoService.updateTodo(id, data)` | PUT + mise à jour locale |
| **DELETE** | `todoService.deleteTodo(id)` | DELETE + suppression locale |

---

## 📝 Les 5 Fichiers Clés

### 1. TodoService (`src/app/services/todo-service.ts`)
```typescript
// State Management avec BehaviorSubject
private todosSubject = new BehaviorSubject<Todo[]>([]);
public todos$ = this.todosSubject.asObservable();

// CRUD Operations
addTodo(title) → Observable<Todo>      // POST
getTodos() → Observable<Todo[]>        // GET
updateTodo(id, data) → Observable<Todo> // PUT
deleteTodo(id) → Observable<void>      // DELETE
```

### 2. TodoList Component (`src/app/components/todo-list/todo-list.ts`)
```typescript
// Lifecycle
ngOnInit() → loadInitialData() + setupFilters()
ngOnDestroy() → this.destroy$.next()

// Methods
onAddTodo() → appelle service.addTodo()
onUpdateTodo(id) → appelle service.updateTodo()
onDeleteTodo(id) → appelle service.deleteTodo()
onToggleTodo(id) → appelle service.toggleTodo()
```

### 3. HTML Template (`src/app/components/todo-list/todo-list.html`)
```html
<!-- Affichage -->
<div *ngFor="let todo of filteredTodos$ | async">
  {{ todo.title }}
</div>

<!-- Interactions -->
<button (click)="onAddTodo()">Ajouter</button>
<button (click)="startEdit(todo)">✏️</button>
<button (click)="onDeleteTodo(todo.id, todo.title)">🗑️</button>
```

---

## 🔥 Les 3 Patterns RxJS Essentiels

### 1. BehaviorSubject pour l'État
```typescript
// Initialiser l'état
private todosSubject = new BehaviorSubject<Todo[]>([]);
public todos$ = this.todosSubject.asObservable();

// Mettre à jour l'état
this.todosSubject.next(newTodos);

// S'abonner (les abonnés reçoivent la dernière valeur)
this.todos$.subscribe(todos => console.log(todos));
```

### 2. tap() pour les Effets de Bord
```typescript
// Mettre à jour l'état LOCAL AVANT la confirmation serveur
this.http.post(url, data).pipe(
  tap(response => {
    // Mise à jour optimiste
    this.todosSubject.next([...updatedState]);
  }),
  catchError(error => {
    // Restaurer si erreur
    this.todosSubject.next([...previousState]);
  })
).subscribe();
```

### 3. combineLatest pour la Réactivité
```typescript
// Quand N'IMPORTE QUEL Observable change, recalculer
combineLatest([
  this.searchControl.valueChanges.pipe(startWith('')),
  this.statusControl.valueChanges.pipe(startWith('all')),
  this.todos$
]).pipe(
  map(([search, status, todos]) => {
    // Filtrer en fonction des 3 sources
    return this.applyFilters(todos, search, status);
  })
).subscribe(filtered => {
  // Afficher les résultats filtrés
});
```

---

## 💻 Exemples Code

### CREATE - Ajouter un Todo

**Composant** :
```typescript
onAddTodo(): void {
  const title = this.newTodoControl.value?.trim();
  if (!title) return alert('Titre vide');
  
  this.todoService.addTodo(title).pipe(
    tap(() => this.newTodoControl.reset()),
    catchError(err => (alert('Erreur'), of(null))),
    takeUntil(this.destroy$)
  ).subscribe();
}
```

**Service** :
```typescript
addTodo(title: string): Observable<Todo> {
  const newTodo = { title, userId: 1, completed: false };
  
  return this.http.post<Todo>(`${API}/todos`, newTodo).pipe(
    tap(todo => {
      // Mise à jour optimiste
      this.todosSubject.next([
        { ...todo, id: newId },
        ...this.todosSubject.value
      ]);
    }),
    retry(1),
    catchError(err => throwError(() => err))
  );
}
```

**HTML** :
```html
<input [formControl]="newTodoControl" (keyup.enter)="onAddTodo()" />
<button (click)="onAddTodo()">Ajouter</button>
```

---

### READ - Afficher les Todos

**Composant** :
```typescript
ngOnInit(): void {
  this.loadInitialData();
  this.setupFilters();
  this.setupStats();
}

loadInitialData(): void {
  forkJoin({
    todos: this.todoService.getTodos(),
    users: this.todoService.getUsers()
  }).pipe(
    tap(({ todos }) => this.todoService.updateTodosState(todos)),
    catchError(err => (console.error(err), of(null))),
    takeUntil(this.destroy$)
  ).subscribe();
  
  this.todos$ = this.todoService.todos$;
}

setupFilters(): void {
  this.filteredTodos$ = combineLatest([
    this.searchControl.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      distinctUntilChanged()
    ),
    this.statusControl.valueChanges.pipe(startWith('all')),
    this.userControl.valueChanges.pipe(startWith('all')),
    this.todos$
  ]).pipe(
    map(([search, status, user, todos]) => {
      return todos.filter(t => 
        (search === '' || t.title.includes(search)) &&
        (status === 'all' || (status === 'completed') === t.completed) &&
        (user === 'all' || t.userId === +user)
      );
    })
  );
}
```

**Service** :
```typescript
getTodos(): Observable<Todo[]> {
  return this.http.get<Todo[]>(`${API}/todos`).pipe(
    map(todos => todos.slice(0, 50)),
    retry(2),
    catchError(err => throwError(() => err)),
    shareReplay(1)  // Cache
  );
}
```

**HTML** :
```html
<!-- Chargement -->
<div *ngIf="loading$ | async">Chargement...</div>

<!-- Filtres -->
<input [formControl]="searchControl" />
<select [formControl]="statusControl">
  <option value="all">Tous</option>
  <option value="active">Actifs</option>
  <option value="completed">Complétés</option>
</select>

<!-- Résultats -->
<div *ngFor="let todo of filteredTodos$ | async">
  {{ todo.title }}
</div>
```

---

### UPDATE - Modifier un Todo

**Composant** :
```typescript
startEdit(todo: Todo): void {
  this.editingTodoId = todo.id;
  this.editTodoControl.setValue(todo.title);
}

onUpdateTodo(id: number): void {
  const newTitle = this.editTodoControl.value?.trim();
  if (!newTitle) return alert('Titre vide');
  
  this.todoService.updateTodo(id, { title: newTitle }).pipe(
    tap(() => this.cancelEdit()),
    catchError(err => (alert('Erreur'), of(null))),
    takeUntil(this.destroy$)
  ).subscribe();
}

cancelEdit(): void {
  this.editingTodoId = null;
  this.editTodoControl.reset();
}
```

**Service** :
```typescript
updateTodo(id: number, updates: Partial<Todo>): Observable<Todo> {
  return this.http.put<Todo>(`${API}/todos/${id}`, updates).pipe(
    tap(updated => {
      // Mise à jour optimiste
      const todos = this.todosSubject.value.map(t =>
        t.id === id ? { ...t, ...updates } : t
      );
      this.todosSubject.next(todos);
    }),
    retry(1),
    catchError(err => throwError(() => err))
  );
}
```

**HTML** :
```html
<!-- Mode édition -->
<div *ngIf="editingTodoId === todo.id">
  <input [formControl]="editTodoControl" (keyup.enter)="onUpdateTodo(todo.id)" />
  <button (click)="onUpdateTodo(todo.id)">💾 Sauver</button>
  <button (click)="cancelEdit()">❌ Annuler</button>
</div>

<!-- Mode normal -->
<div *ngIf="editingTodoId !== todo.id">
  {{ todo.title }}
  <button (click)="startEdit(todo)">✏️</button>
</div>
```

---

### DELETE - Supprimer un Todo

**Composant** :
```typescript
onDeleteTodo(id: number, title: string): void {
  if (!confirm(`Supprimer "${title}" ?`)) return;
  
  this.todoService.deleteTodo(id).pipe(
    tap(() => console.log('Supprimé')),
    catchError(err => (alert('Erreur'), of(null))),
    takeUntil(this.destroy$)
  ).subscribe();
}
```

**Service** :
```typescript
deleteTodo(id: number): Observable<void> {
  return this.http.delete<void>(`${API}/todos/${id}`).pipe(
    tap(() => {
      // Suppression optimiste
      const todos = this.todosSubject.value.filter(t => t.id !== id);
      this.todosSubject.next(todos);
    }),
    retry(1),
    catchError(err => throwError(() => err))
  );
}
```

**HTML** :
```html
<button (click)="onDeleteTodo(todo.id, todo.title)">🗑️</button>
```

---

## 🧹 Nettoyage des Ressources (IMPORTANT!)

```typescript
// 1. Créer un Subject de destruction
private destroy$ = new Subject<void>();

// 2. L'utiliser sur TOUS les Observables
observable$.pipe(
  takeUntil(this.destroy$)
).subscribe();

// 3. Nettoyer à la destruction du composant
ngOnDestroy(): void {
  this.destroy$.next();
  this.destroy$.complete();
}
```

**Pourquoi ?** Éviter les fuites mémoire (Memory Leaks)

---

## 📊 Statistiques

**Composant** :
```typescript
setupStats(): void {
  this.stats$ = this.filteredTodos$.pipe(
    map(todos => ({
      total: todos.length,
      completed: todos.filter(t => t.completed).length,
      active: todos.filter(t => !t.completed).length
    }))
  );
}
```

**HTML** :
```html
<div *ngIf="stats$ | async as stats">
  <span>✓ {{ stats.completed }}</span>
  <span>○ {{ stats.active }}</span>
</div>
```

---

## 🎓 Concepts RxJS Utilisés

```
Observable  = Flux de données
Subject     = Observable + Émetteur
BehaviorSubject = Subject + Mémorisation
pipe()      = Appliquer des opérateurs
map()       = Transformer
filter()    = Filtrer
tap()       = Effet de bord
retry()     = Réessayer
catchError  = Gérer les erreurs
forkJoin    = Combiner plusieurs (parallèle)
combineLatest = Réagir à tous les changements
debounceTime = Attendre avant d'émettre
distinctUntilChanged = Ignorer les doublons
startWith   = Valeur initiale
takeUntil   = Se désabonner quand...
shareReplay = Mettre en cache
async pipe  = Abonnement auto dans template
```

---

## ⚠️ Points d'Attention

### 1. Toujours nettoyer
```typescript
// ❌ MAUVAIS - Fuite mémoire
observable$.subscribe();

// ✅ BON - Nettoyage automatique
observable$.pipe(
  takeUntil(this.destroy$)
).subscribe();
```

### 2. Valider avant d'utiliser
```typescript
// ❌ MAUVAIS
const title = this.newTodoControl.value;
this.todoService.addTodo(title);

// ✅ BON
const title = this.newTodoControl.value?.trim();
if (!title) {
  alert('Titre vide');
  return;
}
this.todoService.addTodo(title);
```

### 3. Utiliser async pipe dans le template
```typescript
// ❌ MAUVAIS - Manuel, oubli possible
ngOnInit() {
  this.todos$ = this.service.getTodos();
  this.todos$.subscribe(todos => {
    this.todosArray = todos;  // Oubli facile d'unsubscribe
  });
}

// ✅ BON - Automatique avec async pipe
<div *ngFor="let todo of todos$ | async">
  {{ todo.title }}
</div>
```

### 4. Mise à jour optimiste avec restauration
```typescript
// ❌ MAUVAIS - Pas de restauration en cas d'erreur
addTodo() {
  this.todosSubject.next([newTodo, ...todos]);
  this.service.addTodo(title).subscribe();
}

// ✅ BON - Restauration en cas d'erreur
addTodo() {
  const previous = this.todosSubject.value;
  this.todosSubject.next([newTodo, ...previous]);
  
  this.service.addTodo(title).pipe(
    catchError(err => {
      this.todosSubject.next(previous);  // Restaurer
      return throwError(() => err);
    })
  ).subscribe();
}
```

---

## 🚀 Résumé Exécution

1. **Utilisateur interagit** (clique, tape)
2. **Événement déclenche une méthode** (onAddTodo, etc.)
3. **Méthode appelle le service** (todoService.addTodo, etc.)
4. **Service appelle l'API HTTP** (POST, GET, PUT, DELETE)
5. **Service émet les données** (todosSubject.next())
6. **Observables dépendants réagissent** (combineLatest, etc.)
7. **Template se met à jour** (via async pipe)
8. **Utilisateur voit le changement** ✅

Tout cela grâce à **RxJS** ! 🎉


# 🔄 Diagrammes Flux CRUD - Visualisation Complète

## 1️⃣ CREATE - Créer un Todo

### Diagramme Chronologique

```
┌─ Utilisateur ─────────────────────────────────────────────┐
│                                                            │
│  1. Tape un titre : "Apprendre RxJS"                    │
│     ↓                                                     │
│  2. Appuie sur Entrée ou clique "Ajouter"              │
│     ↓ (Déclenche onAddTodo())                           │
│                                                            │
└────────────────────────────────────────────────────────────┘
                         ↓
┌─ Composant (todo-list.ts) ────────────────────────────────┐
│                                                            │
│  3. onAddTodo()                                           │
│     ├─ Récupère la valeur : "Apprendre RxJS"           │
│     ├─ Valide (non vide)                                │
│     └─ Appelle todoService.addTodo()                    │
│                                                            │
└────────────────────────────────────────────────────────────┘
                         ↓
┌─ Service (todo-service.ts) ───────────────────────────────┐
│                                                            │
│  4. addTodo(title)                                        │
│     ├─ Crée l'objet : { title, userId: 1, completed: false }
│     ├─ tap() : Mise à jour OPTIMISTE                    │
│     │  └─ Ajoute le todo localement immédiatement       │
│     │     todosSubject.next([newTodo, ...todos])        │
│     ├─ Envoie HTTP POST                                 │
│     └─ retry(1) : Réessaye si erreur                    │
│                                                            │
└────────────────────────────────────────────────────────────┘
                         ↓
┌─ BehaviorSubject ────────────────────────────────────────┐
│                                                            │
│  5. todos$ émet : [newTodo, todo2, todo3, ...]         │
│                                                            │
└────────────────────────────────────────────────────────────┘
                         ↓
┌─ Observable Dépendants ──────────────────────────────────┐
│                                                            │
│  6. filteredTodos$ réagit au changement                  │
│     ├─ combineLatest([search$, status$, user$, todos$]) │
│     └─ Applique les filtres                             ���
│                                                            │
│  7. stats$ réagit au changement                          │
│     └─ Recalcule : { total, active, completed }        │
│                                                            │
└────────────────────────────────────────────────────────────┘
                         ↓
┌─ Template HTML ──────────────────────────────────────────┐
│                                                            │
│  8. *ngFor="let todo of filteredTodos$ | async"         │
│     ├─ Affiche le nouveau todo                          │
│     ├─ Input se vide (newTodoControl.reset())           │
│     └─ Animation d'ajout (optionnel CSS)               │
│                                                            │
└────────────────────────────────────────────────────────────┘
                         ↓
┌─ Utilisateur ────────────────────────────────────────────┐
│                                                            │
│  ✅ Voit immédiatement le nouveau todo à l'écran         │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### Code RxJS

```typescript
// Mise à jour optimiste + Requête HTTP
addTodo(title: string): Observable<Todo> {
  return this.http.post<Todo>(`${API}/todos`, { title }).pipe(
    //  ↓ MISE À JOUR OPTIMISTE (avant confirmation serveur)
    tap(todo => {
      const todos = this.todosSubject.value;
      const localTodo = { ...todo, id: todos.length + 1 };
      // 🔥 Le UI se met à jour MAINTENANT
      this.todosSubject.next([localTodo, ...todos]);
    }),
    //  ↓ Réessayer si erreur
    retry(1),
    //  ��� Gérer les erreurs
    catchError(error => {
      console.error('❌ Erreur création');
      return throwError(() => error);
    })
  );
}
```

---

## 2️⃣ READ - Lire les Todos

### Diagramme Chronologique

```
┌─ ngOnInit du Composant ───────────────────────────────────┐
│                                                            │
│  1. loadInitialData()                                    │
│                                                            │
└────────────────────────────────────────────────────────────┘
                         ↓
┌─ forkJoin ────────────────────────────────────────────────┐
│                                                            │
│  2. Combiner 2 requêtes HTTP en PARALLÈLE               │
│     ├─ todoService.getTodos()  ──┐                      │
│     │  ↓                         │                      │
│     │  HTTP GET /todos          │                      │
│     │  (500ms)                  │                      │
│     │                           ├─ forkJoin attend     │
│     │                           │  les deux             │
│     └─ todoService.getUsers() ──┤  (700ms)             │
│        ↓                        │                      │
│        HTTP GET /users         │                      │
│        (700ms)                 │                      │
│                                └─ Réponses reçues    │
│                                                            │
│  3. Résultats : { todos: [...], users: [...] }         │
│                                                            │
└────────────────────────────────────────────────────────────┘
                         ↓
┌─ tap() - Mise à jour du State ────────────────────────────┐
│                                                            │
│  4. todoService.updateTodosState(todos)                 │
│     └─ todosSubject.next(todos)                         │
│        🔥 Émission : todos$ émet les données           │
│                                                            │
└────────────────────────────────────────────────────────────┘
                         ↓
┌─ combineLatest ────────────��──────────────────────────────┐
│                                                            │
│  5. Filtrage Réactif                                     │
│     Combine les sources :                               │
│     ├─ searchControl.valueChanges$ (debounceTime 300ms) │
│     ├─ statusControl.valueChanges$                      │
│     ├─ userControl.valueChanges$                        │
│     └─ todos$                                            │
│                                                            │
│  6. Map : Appliquer les filtres                         │
│     ├─ Filtrer par titre                                │
│     ├─ Filtrer par statut (active/completed)           │
│     ├─ Filtrer par utilisateur                          │
│     └─ Retourner la liste filtrée                       │
│                                                            │
│  7. filteredTodos$ émet la liste filtrée                │
│                                                            │
└────────────────────────────────────────────────────────────┘
                         ↓
┌─ Map Stats ──────────────────────────────────────────────┐
│                                                            │
│  8. stats$ = filteredTodos$ | map()                     │
│     ├─ Compter : total, active, completed              │
│     └─ stats$ émet { total: 10, active: 3, completed: 7 }
│                                                            │
└───────────────��────────────────────────────────────────────┘
                         ↓
┌─ Template ────────────────────────────────────────────────┐
│                                                            │
│  9. *ngFor="let todo of filteredTodos$ | async"         │
│     ├─ Affiche chaque todo filtré                       │
│     ├─ Met à jour en temps réel quand filtres changent │
│     └─ Gère automatiquement l'abonnement (async pipe)  │
│                                                            │
│ 10. stats$ | async dans les statistiques                │
│     ├─ Affiche "✓ 7" (complétés)                       │
│     └─ Affiche "○ 3" (actifs)                          │
│                                                            │
└────────────────────────────────────────────────────────────┘
                         ↓
┌─ Utilisateur ────────────────────────────────────────────┐
│                                                            │
│  ✅ Voit les todos filtrés                               │
│  ✅ Les filtres réagissent en temps réel                │
│  ✅ Les statistiques se mettent à jour                  │
│                                                            ��
└────────────────────────────────────────────────────────────┘
```

### Code RxJS

```typescript
// READ avec forkJoin et combineLatest
loadInitialData() {
  forkJoin({
    todos: this.todoService.getTodos(),      // Parallèle
    users: this.todoService.getUsers()       // Parallèle
  }).pipe(
    tap(({ todos, users }) => {
      this.todoService.updateTodosState(todos);
    }),
    catchError(error => {
      console.error('Erreur chargement');
      return of({ todos: [], users: [] });
    }),
    takeUntil(this.destroy$)
  ).subscribe();
}

// Filtrage réactif
setupFilters() {
  this.filteredTodos$ = combineLatest([
    this.searchControl.valueChanges.pipe(
      startWith(''),
      debounceTime(300),           // Optimisation
      distinctUntilChanged()
    ),
    this.statusControl.valueChanges.pipe(startWith('all')),
    this.userControl.valueChanges.pipe(startWith('all')),
    this.todos$                    // Source de données
  ]).pipe(
    map(([search, status, user, todos]) => {
      // Appliquer les filtres
      return todos.filter(t => 
        (search === '' || t.title.includes(search)) &&
        (status === 'all' || (status === 'completed' ? t.completed : !t.completed)) &&
        (user === 'all' || t.userId === parseInt(user))
      );
    })
  );
}
```

---

## 3️⃣ UPDATE - Modifier un Todo

### Diagramme Chronologique

```
┌─ Utilisateur ────────────────────────────────────────────┐
│                                                            │
│  1. Clique sur le bouton ✏️ (Modifier)                  │
│                                                            │
└────────────────────────────────────────────────────────────┘
                         ↓
┌─ Composant ──────────────────────────────────────────────┐
│                                                            │
│  2. startEdit(todo)                                      │
│     ├─ editingTodoId = todo.id          (Active l'édition)
│     ├─ Classe CSS .editing s'ajoute                     │
│     ├─ Input d'édition remplace le texte                │
│     └─ Interface passe en mode édition                  │
│                                                            │
│  3. Utilisateur modifie le titre                         │
│     └─ "Apprendre RxJS" → "Maîtriser RxJS"            │
│                                                            │
│  4. Utilisateur appuie sur Entrée ou clique "Sauver"   │
│     └─ onUpdateTodo(id) déclenché                       │
│                                                            │
└────────────────────────────────────────────────────────────┘
                         ↓
┌─ Service ────────────────────────────────────────────────┐
│                                                            │
│  5. updateTodo(id, { title: "Maîtriser RxJS" })        │
│     ├─ tap() : Mise à jour OPTIMISTE                    │
│     │  └─ Modifie immédiatement dans l'état local       │
│     │     todos.map(t => t.id === id ? {...t, title} : t)
│     │     todosSubject.next(updated)                    │
│     │     🔥 L'UI se met à jour MAINTENANT              │
│     ├─ HTTP PUT /todos/:id                             │
│     │  └─ Envoie { title: "Maîtriser RxJS" }          │
│     └─ retry(1) : Réessaye si erreur                    │
│                                                            │
└────────────────────────────────────────────────────────────┘
                         ↓
┌─ BehaviorSubject ────────────────────────────────────────┐
│                                                            │
│  6. todos$ émet : [...modifiedTodo, todo2, ...]        │
│     avec le titre modifié                               │
│                                                            │
└────────────────────────────────────────────────────────────┘
                         ↓
┌─ Observable Dépendants ──────────────────────────────────┐
│                                                            │
│  7. filteredTodos$ réagit                                │
│     └─ Applique les filtres sur les données mises à jour
│                                                            │
│  8. stats$ réagit                                        │
│     └─ Recalcule les statistiques si nécessaire         │
│                                                            │
└────────────────────────────────────────────────────────────┘
                         ↓
┌─ Template ────────────────────────────────────────────────┐
│                                                            │
│  9. *ngIf="editingTodoId !== todo.id" = true           │
│     ├─ L'interface repasse en mode normal               │
│     ├─ Affiche le titre modifié                         │
│     ├─ Boutons d'action réapparaissent                  │
│     └─ cancelEdit() réinitialise l'état                 │
│                                                            │
│ 10. Mode édition fermé                                   │
│                                                            │
└───────────────────────────────���────────────────────────────┘
                         ↓
┌─ Utilisateur ────────────────────────────────────────────┐
│                                                            │
│  ✅ Voit le titre modifié immédiatement                  │
│  ✅ Interface revient au mode normal                    │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### Code RxJS

```typescript
// UPDATE avec mise à jour optimiste
startEdit(todo: Todo): void {
  this.editingTodoId = todo.id;
  this.editTodoControl.setValue(todo.title);
}

onUpdateTodo(id: number): void {
  const newTitle = this.editTodoControl.value?.trim();
  if (!newTitle) {
    alert('Le titre ne peut pas etre vide');
    return;
  }

  this.todoService.updateTodo(id, { title: newTitle }).pipe(
    tap(() => {
      console.log('✅ Todo modifié');
      this.cancelEdit();  // Fermer l'édition
    }),
    catchError(error => {
      alert('Erreur lors de la modification');
      return of(null);
    }),
    takeUntil(this.destroy$)
  ).subscribe();
}

cancelEdit(): void {
  this.editingTodoId = null;
  this.editTodoControl.reset();
}
```

---

## 4️⃣ DELETE - Supprimer un Todo

### Diagramme Chronologique

```
┌─ Utilisateur ────────────────────────────────────────────┐
│                                                            │
│  1. Clique sur le bouton 🗑️ (Supprimer)               │
│     └─ pour le todo : "Apprendre RxJS"                 │
│                                                            │
└────────────────────────────────────────────────────────────┘
                         ↓
┌─ Composant ────────────────────────────────────────────���─┐
│                                                            │
│  2. onDeleteTodo(id, title)                              │
│     └─ Confirmation : "Voulez-vous supprimer ... ?"      │
│                                                            │
│  3. Utilisateur clique "OK"                              │
│     └─ Appelle todoService.deleteTodo(id)              │
│                                                            │
└────────────────────────────────────────────────────────────┘
                         ↓
┌─ Service ────────���───────────────────────────────────────┐
│                                                            │
│  4. deleteTodo(id)                                       │
│     ├─ tap() : Suppression OPTIMISTE                     │
│     │  └─ Retire immédiatement du state local            │
│     │     todos.filter(t => t.id !== id)               │
│     │     todosSubject.next(filtered)                   │
│     │     🔥 Le todo disparaît MAINTENANT du UI         │
│     ├─ HTTP DELETE /todos/:id                          │
│     │  └─ Confirme la suppression avec le serveur      │
│     └─ retry(1) : Réessaye si erreur                    │
│                                                            │
└────────────────────────────────────────────────────────────┘
                         ↓
┌─ BehaviorSubject ────────────────────────────────────────┐
│                                                            │
│  5. todos$ émet : [todo1, todo3, ...] (sans todo2)     │
│                                                            │
└────────────────────────────────────────────────────────────┘
                         ↓
┌─ Observable Dépendants ──────────────────────────────────┐
│                                                            │
│  6. filteredTodos$ réagit                                │
│     └─ Le todo supprimé disparaît de la liste filtrée   │
│                                                            │
│  7. stats$ réagit                                        │
│     └─ total-- (passe de 10 à 9)                        │
│                                                            │
└────────────────────────────────────────────────────────────┘
                         ↓
┌─ Template ────────────────────────────────────────────────┐
│                                                            │
│  8. *ngFor="let todo of filteredTodos$ | async"         │
│     ├─ L'élément correspondant est supprimé du DOM      │
│     ├─ Peut avoir une animation de suppression (CSS)   │
│     └─ La liste se réorganise                           │
│                                                            │
│  9. Statistiques mises à jour                            │
│     └─ "📊 9 résultat(s)"                              │
│                                                            │
└────────────────────────────────────────────────────────────┘
                         ↓
┌─ Utilisateur ────────────────────────────────────────────┐
│                                                            │
│  ✅ Voit le todo disparaître immédiatement              │
│  ✅ Les statistiques se mettent à jour                  │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### Code RxJS

```typescript
// DELETE avec suppression optimiste
onDeleteTodo(id: number, title: string): void {
  if (!confirm(`Voulez-vous vraiment supprimer "${title}" ?`)) {
    return;
  }

  this.todoService.deleteTodo(id).pipe(
    tap(() => {
      console.log('✅ Todo supprimé');
    }),
    catchError(error => {
      alert('Erreur lors de la suppression');
      return of(null);
    }),
    takeUntil(this.destroy$)
  ).subscribe();
}

// Dans le service
deleteTodo(id: number): Observable<void> {
  return this.http.delete<void>(`${API}/todos/${id}`).pipe(
    tap(() => {
      // SUPPRESSION OPTIMISTE
      const todos = this.todosSubject.value;
      const filtered = todos.filter(t => t.id !== id);
      // 🔥 Le todo disparaît immédiatement
      this.todosSubject.next(filtered);
    }),
    retry(1),
    catchError(error => {
      console.error('❌ Erreur suppression');
      return throwError(() => error);
    })
  );
}
```

---

## 📊 Comparaison des 4 Opérations

```
┌──��──────────┬──────────────┬─────────┬─────────────────────────┐
│ Opération   │ Méthode HTTP │ Endpoint│ État Local              │
├─────────────┼──────────────┼─────────┼─────────────────────────┤
│ CREATE      │ POST         │ /todos  │ [NEW, ...old]           │
│ READ        │ GET          │ /todos  │ [...data]               │
│ UPDATE      │ PUT/PATCH    │ /todos/:id│ [modified, ...old]     │
│ DELETE      │ DELETE       │ /todos/:id│ [old - deleted, ...]   │
└─────────────┴──────────────┴─────────┴─────────────────────────┘
```

---

## 🔄 Réactivité Cascade

### Quand todos$ émet

```
todos$ émet
  ↓
combineLatest détecte le changement
  ↓
map() recalcule le filtrage
  ↓
filteredTodos$ émet
  ↓
*ngFor recharge la liste
  ↓
UI se met à jour

ET en parallèle:

todos$ émet
  ↓
map() recalcule les stats
  ↓
stats$ émet
  ↓
Statistiques se mettent à jour
```

---

## 💡 Points Clés

### Mise à Jour Optimiste

✅ **Avantage** : L'UI est instantanément à jour  
✅ **Risque** : Si la requête échoue, il faut restaurer  
✅ **Solution** : `catchError()` pour restaurer l'état

### Réactivité

✅ `BehaviorSubject.next()` déclenche les Observables dépendants  
✅ `combineLatest` combine plusieurs sources  
✅ `map()` transforme les données  
✅ `async` pipe gère l'abonnement automatiquement  

### Nettoyage

✅ `takeUntil(destroy$)` sur chaque Observables  
✅ `destroy$.next()` et `destroy$.complete()` en `ngOnDestroy`  
✅ Évite les fuites mémoire et comportements inattendus

---

## 🎯 Résumé RxJS par Opération

| Opération | Pattern RxJS | Opérateurs Clés |
|-----------|---------|-----------------|
| CREATE | POST + tap() + BehaviorSubject | tap, retry, catchError |
| READ | GET + forkJoin + combineLatest | forkJoin, map, shareReplay |
| UPDATE | PUT + tap() + map() | tap, map, retry, catchError |
| DELETE | DELETE + tap() + filter() | tap, filter, retry, catchError |

Tous avec `takeUntil` pour le nettoyage ! 🧹


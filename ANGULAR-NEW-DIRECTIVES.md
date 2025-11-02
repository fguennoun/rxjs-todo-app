# 🆕 Nouvelles Directives Angular - @if et @for

## 📋 Qu'est-ce que Changé ?

Angular 20 introduit les **nouvelles directives de flux de contrôle** :
- ✅ `@if` remplace `*ngIf`
- ✅ `@for` remplace `*ngFor`
- ✅ `@else` remplace `*ngIf else`
- ✅ `@switch` remplace `*ngSwitch` (bonus)

Ces directives sont **plus performantes** et plus lisibles ! 🚀

---

## 🔄 Avant vs Après

### `*ngIf` → `@if`

**Avant (Ancienne syntaxe)** ❌
```html
<div *ngIf="isLoading">Chargement...</div>
<div *ngIf="!isLoading">Contenu chargé</div>
```

**Après (Nouvelle syntaxe)** ✅
```html
@if (isLoading) {
  <div>Chargement...</div>
}
@if (!isLoading) {
  <div>Contenu chargé</div>
}
```

---

### `*ngFor` → `@for`

**Avant (Ancienne syntaxe)** ❌
```html
<div *ngFor="let item of items">
  {{ item.name }}
</div>
```

**Après (Nouvelle syntaxe)** ✅
```html
@for (let item of items; track item.id) {
  <div>{{ item.name }}</div>
}
```

---

## ✨ Avantages des Nouvelles Directives

### 1. **Syntaxe Plus Claire**
```html
<!-- Ancienne : directive sur l'élément -->
<div *ngIf="condition">Contenu</div>

<!-- Nouvelle : bloc de contrôle -->
@if (condition) {
  <div>Contenu</div>
}
```

### 2. **Meilleure Performance** 🚀
- ✅ Compilation optimisée
- ✅ Moins de surcharge DOM
- ✅ Détection de changement plus efficace

### 3. **Meilleure Lisibilité**
```html
<!-- Ancienne : complexe avec le "else" -->
<div *ngIf="user; else noUser">
  {{ user.name }}
</div>
<ng-template #noUser>
  Pas d'utilisateur
</ng-template>

<!-- Nouvelle : simple et directe -->
@if (user) {
  <div>{{ user.name }}</div>
} @else {
  <div>Pas d'utilisateur</div>
}
```

### 4. **Meilleur Contrôle du Flux**
```html
<!-- @if / @else if / @else -->
@if (status === 'loading') {
  <div>Chargement...</div>
} @else if (status === 'error') {
  <div>Erreur !</div>
} @else {
  <div>Succès</div>
}
```

---

## 📖 Guide Complet

### @if

#### Syntaxe Basique
```html
@if (condition) {
  <!-- Contenu affiché si true -->
}
```

#### Avec @else
```html
@if (isLoading) {
  <div>Chargement...</div>
} @else {
  <div>Contenu</div>
}
```

#### Avec @else if
```html
@if (status === 'loading') {
  <div>Chargement...</div>
} @else if (status === 'error') {
  <div>Erreur</div>
} @else if (status === 'success') {
  <div>Succès</div>
} @else {
  <div>État inconnu</div>
}
```

#### Avec Assignation de Variable
```html
@if (users$ | async; as users) {
  <div>{{ users.length }} utilisateurs</div>
}
```

**Exemple dans notre app** :
```html
@if (!(loading$ | async)) {
  <div class="add-todo-form">
    <!-- Formulaire d'ajout -->
  </div>
}
```

---

### @for

#### Syntaxe Basique
```html
@for (let item of items; track item.id) {
  <div>{{ item.name }}</div>
}
```

#### Paramètres

| Paramètre | Description | Exemple |
|-----------|-------------|---------|
| `let item` | Variable d'itération | `let todo` |
| `of items` | Source d'itération | `of todos$ \| async` |
| `track item.id` | **Obligatoire** - Clé de suivi | `track todo.id` |

#### Contexte Implicite

```html
@for (let todo of todos; track todo.id) {
  <!-- Variables implicites disponibles -->
  <div>
    Index: {{ $index }}          <!-- Position actuelle (0-based) -->
    Est premier: {{ $first }}    <!-- true si premier élément -->
    Est dernier: {{ $last }}     <!-- true si dernier élément -->
    Est pair: {{ $even }}        <!-- true si index pair -->
    Est impair: {{ $odd }}       <!-- true si index impair -->
    Compteur: {{ $count }}       <!-- Nombre total d'éléments -->
  </div>
</div>
```

#### Avec Filtre
```html
@for (let item of items | async; track item.id) {
  {{ item.name }}
}
```

**Exemple dans notre app** :
```html
@for (let todo of filteredTodos$ | async; track todo.id) {
  <div class="todo-item">
    {{ todo.title }}
  </div>
}
```

---

### @switch (Bonus)

Remplace `*ngSwitch` / `*ngSwitchCase` / `*ngSwitchDefault`

#### Ancienne Syntaxe ❌
```html
<div [ngSwitch]="status">
  <div *ngSwitchCase="'loading'">Chargement...</div>
  <div *ngSwitchCase="'error'">Erreur</div>
  <div *ngSwitchDefault>Succès</div>
</div>
```

#### Nouvelle Syntaxe ✅
```html
@switch (status) {
  @case ('loading') {
    <div>Chargement...</div>
  }
  @case ('error') {
    <div>Erreur</div>
  }
  @default {
    <div>Succès</div>
  }
}
```

---

## 🔧 Application dans Notre Projet

### ✅ Avant (Ancienne Syntaxe)

```html
<!-- Formulaire d'ajout -->
<div *ngIf="!(loading$ | async)" class="add-todo-form">
  ...
</div>

<!-- Loading -->
<div *ngIf="loading$ | async" class="loading">
  ...
</div>

<!-- Liste des todos -->
<div *ngIf="!(loading$ | async)" class="todo-list">
  <div
    *ngFor="let todo of filteredTodos$ | async"
    class="todo-item"
  >
    <!-- Mode édition -->
    <div *ngIf="editingTodoId === todo.id" class="edit-mode">
      ...
    </div>

    <!-- Mode normal -->
    <div *ngIf="editingTodoId !== todo.id" class="normal-mode">
      <!-- Checkbox -->
      <span *ngIf="todo.completed" class="checked">✓</span>
      <span *ngIf="!todo.completed" class="unchecked">○</span>

      <!-- Statut -->
      <span *ngIf="todo.completed" class="badge-completed">Complété</span>
      <span *ngIf="!todo.completed" class="badge-active">En cours</span>
    </div>
  </div>

  <!-- État vide -->
  <div *ngIf="(filteredTodos$ | async)?.length === 0" class="empty-state">
    Aucun todo trouvé
  </div>
</div>
```

### ✅ Après (Nouvelle Syntaxe)

```html
<!-- Formulaire d'ajout -->
@if (!(loading$ | async)) {
  <div class="add-todo-form">
    ...
  </div>
}

<!-- Loading -->
@if (loading$ | async) {
  <div class="loading">
    ...
  </div>
}

<!-- Liste des todos -->
@if (!(loading$ | async)) {
  <div class="todo-list">
    @for (let todo of filteredTodos$ | async; track todo.id) {
      <div class="todo-item" [class.editing]="editingTodoId === todo.id">
        <!-- Mode édition -->
        @if (editingTodoId === todo.id) {
          <div class="edit-mode">
            ...
          </div>
        }

        <!-- Mode normal -->
        @if (editingTodoId !== todo.id) {
          <div class="normal-mode">
            <!-- Checkbox -->
            @if (todo.completed) {
              <span class="checked">✓</span>
            } @else {
              <span class="unchecked">○</span>
            }

            <!-- Statut -->
            @if (todo.completed) {
              <span class="badge-completed">Complété</span>
            } @else {
              <span class="badge-active">En cours</span>
            }
          </div>
        }
      </div>
    }

    <!-- État vide -->
    @if ((filteredTodos$ | async)?.length === 0) {
      <div class="empty-state">
        Aucun todo trouvé
      </div>
    }
  </div>
}
```

---

## 📊 Comparaison Complète

| Aspect | `*ngIf` | `@if` |
|--------|---------|-------|
| **Syntaxe** | Directive d'attribut | Bloc de flux |
| **Lisibilité** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Performance** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **@else** | Complexe (ng-template) | Simple (@else) |
| **@else if** | Pas possible | Possible (@else if) |
| **Compréhension** | Intermédiaire | Débutant-friendly |

| Aspect | `*ngFor` | `@for` |
|--------|----------|-------|
| **Syntaxe** | Directive d'attribut | Bloc de flux |
| **Lisibilité** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Performance** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Track** | `trackBy` (méthode) | `track` (expression) |
| **Contexte** | Variables implicites | Variables implicites ($index, etc.) |
| **Compréhension** | Intermédiaire | Débutant-friendly |

---

## 🎯 Points Clés à Retenir

### ✅ @if
- ✅ Plus lisible que `*ngIf`
- ✅ Support natif de `@else` et `@else if`
- ✅ Plus performant
- ✅ Syntaxe de bloc (ressemble à du TypeScript)

### ✅ @for
- ✅ Plus lisible que `*ngFor`
- ✅ `track` est obligatoire (meilleure performance)
- ✅ Variables implicites : `$index`, `$first`, `$last`, etc.
- ✅ Filtre directement dans l'expression

### ✅ @switch
- ✅ Plus lisible que `[ngSwitch]`
- ✅ Support natif des `@case` et `@default`
- ✅ Structure plus claire

---

## ⚙️ Configuration Requise

- ✅ Angular 17+ (les directives de contrôle de flux)
- ✅ Angular 20+ (hautement recommandé, avec optimisations)
- ✅ TypeScript 5.0+

**Note** : Le projet utilise Angular 20.0.0 ✓

---

## 🔗 Ressources Officielles

- [Angular Control Flow](https://angular.io/guide/control-flow)
- [Angular @if directive](https://angular.io/guide/control-flow#if-statement)
- [Angular @for directive](https://angular.io/guide/control-flow#for-statement)
- [Angular @switch directive](https://angular.io/guide/control-flow#switch-statement)

---

## 📝 Migration depuis `*ngIf` et `*ngFor`

### Checklist de Migration

- ✅ Remplacer tous les `*ngIf` par `@if`
- ✅ Remplacer tous les `*ngFor` par `@for`
- ✅ Ajouter `track` sur tous les `@for`
- ✅ Simplifier les conditions avec `@else` / `@else if`
- ✅ Tester les rendus DOM
- ✅ Vérifier la performance
- ✅ Mettre à jour les tests

---

## 🚀 Avantages Pratiques

### Exemple : Condition Complexe

**Avant** ❌
```html
<div *ngIf="user">
  <div *ngIf="user.isAdmin">Admin Panel</div>
  <div *ngIf="!user.isAdmin">User Panel</div>
</div>
<div *ngIf="!user">No User</div>
```

**Après** ✅
```html
@if (user) {
  @if (user.isAdmin) {
    <div>Admin Panel</div>
  } @else {
    <div>User Panel</div>
  }
} @else {
  <div>No User</div>
}
```

### Exemple : Liste avec Fallback

**Avant** ❌
```html
<div *ngIf="(items$ | async)?.length">
  <div *ngFor="let item of items$ | async">
    {{ item.name }}
  </div>
</div>
<div *ngIf="!(items$ | async)?.length">
  Aucun élément
</div>
```

**Après** ✅
```html
@if ((items$ | async)?.length) {
  @for (let item of items$ | async; track item.id) {
    <div>{{ item.name }}</div>
  }
} @else {
  <div>Aucun élément</div>
}
```

---

## 💡 Conseils de Performance

1. **Toujours utiliser `track` dans `@for`**
   ```html
   ✅ @for (let todo of todos; track todo.id)
   ❌ @for (let todo of todos; track $index)  <!-- Mauvais, provoque un re-render -->
   ```

2. **Grouper les conditions liées**
   ```html
   ✅ @if (isReady && data) { ... }
   ❌ @if (isReady) { @if (data) { ... } }  <!-- Trop de niveaux -->
   ```

3. **Éviter les appels de fonctions dans les conditions**
   ```html
   ✅ @if (isValid)  <!-- Si c'est une propriété -->
   ❌ @if (isValid())  <!-- Si c'est une méthode, utiliser un pipe ou Observable -->
   ```

---

## 🎓 Apprentissage

Ces nouvelles directives rendent Angular **plus accessible** pour :
- ✅ Les débutants (syntaxe plus claire)
- ✅ Les développeurs d'autres langages (ressemble à TypeScript)
- ✅ Les développeurs React (JSX-like)

---

## 🎉 Résumé

| Ancienne | Nouvelle | Avantage |
|----------|----------|----------|
| `*ngIf` | `@if` | Plus lisible, @else support |
| `*ngFor` | `@for` | Plus lisible, track requis |
| `*ngSwitch` | `@switch` | Plus lisible, @case support |

**Utilisez les nouvelles directives dans vos nouveaux projets ! 🚀**

---

*Documentation mise à jour : Novembre 2025*  
*Couverture : Angular 17+, 20 (recommandé)*  
*Migration : Débutant-friendly*  


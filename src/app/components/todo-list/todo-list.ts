import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Observable, Subject, combineLatest, forkJoin, of } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  map,
  startWith,
  takeUntil,
  switchMap,
  tap,
  catchError,
  filter
} from 'rxjs/operators';
import { Todo } from '../../models/todo.model';
import { User } from '../../models/user.model';
import { TodoService } from '../../services/todo-service';


@Component({
  selector: 'app-todo-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './todo-list.html',
  styleUrls: ['./todo-list.css']
})
export class TodoList implements OnInit, OnDestroy {
  // FormControls pour les filtres
  searchControl = new FormControl('');
  statusControl = new FormControl('all');
  userControl = new FormControl('all');

  // Observables
  todos$!: Observable<Todo[]>;
  users$!: Observable<User[]>;
  filteredTodos$!: Observable<Todo[]>;
  loading$!: Observable<boolean>;
  stats$!: Observable<{ total: number; completed: number; active: number; }>;

  // Pour le unsubscribe
  private destroy$ = new Subject<void>();

  constructor(private todoService: TodoService) {}

  ngOnInit() {
    this.loading$ = this.todoService.loading$;
    this.loadInitialData();
    this.setupFilters();
    this.setupStats();
  }

  // forkJoin - Charger données en parallèle
  private loadInitialData(): void {
    this.todoService.setLoading(true);

    forkJoin({
      todos: this.todoService.getTodos(),
      users: this.todoService.getUsers()
    }).pipe(
      tap(({ todos, users }) => {
        console.log('✅ Données chargées:', {
          todos: todos.length,
          users: users.length
        });
        this.todoService.updateTodosState(todos);
      }),
      tap(() => this.todoService.setLoading(false)),
      catchError(error => {
        console.error('❌ Erreur:', error);
        this.todoService.setLoading(false);
        return of({ todos: [], users: [] });
      }),
      takeUntil(this.destroy$)
    ).subscribe();

    this.todos$ = this.todoService.todos$;
    this.users$ = this.todoService.getUsers();
  }

  // combineLatest + debounceTime + filter + map
  private setupFilters(): void {
    this.filteredTodos$ = combineLatest([
      this.searchControl.valueChanges.pipe(
        startWith(''),
        debounceTime(300), // Attendre 300ms
        distinctUntilChanged(), // Ignorer les doublons
        tap(query => console.log('🔍 Recherche:', query))
      ),
      this.statusControl.valueChanges.pipe(
        startWith('all'),
        tap(status => console.log('📊 Filtre statut:', status))
      ),
      this.userControl.valueChanges.pipe(
        startWith('all'),
        tap(user => console.log('👤 Filtre user:', user))
      ),
      this.todos$
    ]).pipe(
      map(([search, status, user, todos]) => {
        let filtered = [...todos];

        // Filtre recherche
        if (search && typeof search === 'string' && search.trim()) {
          filtered = filtered.filter(todo =>
            todo.title.toLowerCase().includes(search.toLowerCase())
          );
        }

        // Filtre statut
        if (status === 'completed') {
          filtered = filtered.filter(todo => todo.completed);
        } else if (status === 'active') {
          filtered = filtered.filter(todo => !todo.completed);
        }

        // Filtre utilisateur
        if (user && user !== 'all') {
          filtered = filtered.filter(todo => todo.userId === parseInt(user));
        }

        return filtered;
      }),
      tap(filtered => console.log('✨ Résultats filtrés:', filtered.length))
    );
  }

  // tap - Calculer les stats
  private setupStats(): void {
    this.stats$ = this.filteredTodos$.pipe(
      map(todos => ({
        total: todos.length,
        completed: todos.filter(t => t.completed).length,
        active: todos.filter(t => !t.completed).length
      })),
      tap(stats => console.log('📈 Stats:', stats))
    );
  }

  // switchMap - Toggle todo
  onToggleTodo(id: number): void {
    this.todoService.toggleTodo(id).pipe(
      tap(() => console.log('✅ Todo toggled:', id)),
      catchError(error => {
        alert('Erreur lors de la mise à jour');
        console.error(error);
        return of(null);
      }),
      takeUntil(this.destroy$)
    ).subscribe();
  }

  // Recharger les données
  onRefresh(): void {
    this.loadInitialData();
  }

  // Helper pour obtenir le nom de l'utilisateur
  getUserName(userId: number): Observable<string> {
    if (!this.users$) {
      return of(`User ${userId}`);
    }
    return this.users$.pipe(
      map(users => {
        const user = users.find(u => u.id === userId);
        return user ? user.name : `User ${userId}`;
      })
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

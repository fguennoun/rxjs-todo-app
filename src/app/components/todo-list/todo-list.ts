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
  tap,
  catchError
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
  searchControl = new FormControl('');
  statusControl = new FormControl('all');
  userControl = new FormControl('all');
  newTodoControl = new FormControl('');
  editTodoControl = new FormControl('');
  editingTodoId: number | null = null;
  todos$!: Observable<Todo[]>;
  users$!: Observable<User[]>;
  filteredTodos$!: Observable<Todo[]>;
  loading$!: Observable<boolean>;
  stats$!: Observable<{ total: number; completed: number; active: number; }>;
  private destroy$ = new Subject<void>();
  constructor(private todoService: TodoService) {}
  ngOnInit() {
    this.loading$ = this.todoService.loading$;
    this.loadInitialData();
    this.setupFilters();
    this.setupStats();
  }
  private loadInitialData(): void {
    this.todoService.setLoading(true);
    forkJoin({
      todos: this.todoService.getTodos(),
      users: this.todoService.getUsers()
    }).pipe(
      tap(({ todos, users }) => {
        console.log('Donnees chargees:', { todos: todos.length, users: users.length });
        this.todoService.updateTodosState(todos);
      }),
      tap(() => this.todoService.setLoading(false)),
      catchError(error => {
        console.error('Erreur:', error);
        this.todoService.setLoading(false);
        return of({ todos: [], users: [] });
      }),
      takeUntil(this.destroy$)
    ).subscribe();
    this.todos$ = this.todoService.todos$;
    this.users$ = this.todoService.getUsers();
  }
  private setupFilters(): void {
    this.filteredTodos$ = combineLatest([
      this.searchControl.valueChanges.pipe(
        startWith(''),
        debounceTime(300),
        distinctUntilChanged(),
        tap(query => console.log('Recherche:', query))
      ),
      this.statusControl.valueChanges.pipe(
        startWith('all'),
        tap(status => console.log('Filtre statut:', status))
      ),
      this.userControl.valueChanges.pipe(
        startWith('all'),
        tap(user => console.log('Filtre user:', user))
      ),
      this.todos$
    ]).pipe(
      map(([search, status, user, todos]) => {
        let filtered = [...todos];
        if (search && typeof search === 'string' && search.trim()) {
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
          filtered = filtered.filter(todo => todo.userId === parseInt(user));
        }
        return filtered;
      }),
      tap(filtered => console.log('Resultats filtres:', filtered.length))
    );
  }
  private setupStats(): void {
    this.stats$ = this.filteredTodos$.pipe(
      map(todos => ({
        total: todos.length,
        completed: todos.filter(t => t.completed).length,
        active: todos.filter(t => !t.completed).length
      })),
      tap(stats => console.log('Stats:', stats))
    );
  }
  onToggleTodo(id: number): void {
    this.todoService.toggleTodo(id).pipe(
      tap(() => console.log('Todo toggled:', id)),
      catchError(error => {
        alert('Erreur lors de la mise a jour');
        console.error(error);
        return of(null);
      }),
      takeUntil(this.destroy$)
    ).subscribe();
  }
  onAddTodo(): void {
    const title = this.newTodoControl.value?.trim();
    if (!title) {
      alert('Le titre ne peut pas etre vide');
      return;
    }
    this.todoService.addTodo(title).pipe(
      tap(() => {
        console.log('Todo ajoute:', title);
        this.newTodoControl.reset();
      }),
      catchError(error => {
        alert('Erreur lors de la creation du todo');
        console.error(error);
        return of(null);
      }),
      takeUntil(this.destroy$)
    ).subscribe();
  }
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
        console.log('Todo mis a jour:', id);
        this.cancelEdit();
      }),
      catchError(error => {
        alert('Erreur lors de la modification du todo');
        console.error(error);
        return of(null);
      }),
      takeUntil(this.destroy$)
    ).subscribe();
  }
  cancelEdit(): void {
    this.editingTodoId = null;
    this.editTodoControl.reset();
  }
  onDeleteTodo(id: number, title: string): void {
    if (!confirm('Voulez-vous vraiment supprimer "' + title + '" ?')) {
      return;
    }
    this.todoService.deleteTodo(id).pipe(
      tap(() => console.log('Todo supprime:', id)),
      catchError(error => {
        alert('Erreur lors de la suppression du todo');
        console.error(error);
        return of(null);
      }),
      takeUntil(this.destroy$)
    ).subscribe();
  }
  onRefresh(): void {
    this.loadInitialData();
  }
  getUserName(userId: number): Observable<string> {
    if (!this.users$) {
      return of('User ' + userId);
    }
    return this.users$.pipe(
      map(users => {
        const user = users.find(u => u.id === userId);
        return user ? user.name : 'User ' + userId;
      })
    );
  }
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

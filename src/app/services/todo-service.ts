import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map, tap, retry, catchError, throwError, shareReplay } from 'rxjs';
import { Todo } from '../models/todo.model';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class TodoService {

  private readonly API_URL = 'https://jsonplaceholder.typicode.com';

  // State management avec BehaviorSubject
  private todosSubject = new BehaviorSubject<Todo[]>([]);
  public todos$ = this.todosSubject.asObservable();

  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  constructor(private http: HttpClient) {}

  // Charger tous les todos - utilise shareReplay pour le cache
  getTodos(): Observable<Todo[]> {
    return this.http.get<Todo[]>(`${this.API_URL}/todos`).pipe(
      map(todos => todos.slice(0, 50)), // Limiter à 50 pour la démo
      tap(todos => console.log('📦 Todos chargés:', todos.length)),
      retry(2), // Réessayer 2 fois en cas d'erreur
      catchError(error => {
        console.error('❌ Erreur de chargement:', error);
        return throwError(() => new Error('Impossible de charger les todos'));
      }),
      shareReplay(1) // Cache le dernier résultat
    );
  }

  // Charger les utilisateurs
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.API_URL}/users`).pipe(
      tap(users => console.log('👥 Users chargés:', users.length)),
      retry(2),
      catchError(error => {
        console.error('❌ Erreur de chargement users:', error);
        return throwError(() => new Error('Impossible de charger les users'));
      }),
      shareReplay(1)
    );
  }

  // CREATE - Ajouter un nouveau todo
  addTodo(title: string, userId: number = 1): Observable<Todo> {
    const newTodo: Partial<Todo> = {
      title,
      userId,
      completed: false
    };

    return this.http.post<Todo>(`${this.API_URL}/todos`, newTodo).pipe(
      tap(todo => {
        console.log('✅ Todo créé:', todo);
        // Mise à jour optimiste du state local
        const todos = this.todosSubject.value;
        // JSONPlaceholder retourne id=201, on utilise un id local
        const localTodo = { ...todo, id: todos.length + 1 };
        this.todosSubject.next([localTodo, ...todos]);
      }),
      retry(1),
      catchError(error => {
        console.error('❌ Erreur création todo:', error);
        return throwError(() => new Error('Impossible de créer le todo'));
      })
    );
  }

  // UPDATE - Modifier un todo existant
  updateTodo(id: number, updates: Partial<Todo>): Observable<Todo> {
    return this.http.put<Todo>(
      `${this.API_URL}/todos/${id}`,
      updates
    ).pipe(
      tap(updatedTodo => {
        console.log('✅ Todo modifié:', updatedTodo);
        // Mise à jour optimiste du state
        const todos = this.todosSubject.value;
        const updated = todos.map(t =>
          t.id === id ? { ...t, ...updates } : t
        );
        this.todosSubject.next(updated);
      }),
      retry(1),
      catchError(error => {
        console.error('❌ Erreur modification todo:', error);
        return throwError(() => new Error('Impossible de modifier le todo'));
      })
    );
  }

  // DELETE - Supprimer un todo
  deleteTodo(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/todos/${id}`).pipe(
      tap(() => {
        console.log('🗑️ Todo supprimé:', id);
        // Mise à jour optimiste du state
        const todos = this.todosSubject.value;
        const filtered = todos.filter(t => t.id !== id);
        this.todosSubject.next(filtered);
      }),
      retry(1),
      catchError(error => {
        console.error('❌ Erreur suppression todo:', error);
        return throwError(() => new Error('Impossible de supprimer le todo'));
      })
    );
  }

  // Toggle le statut d'un todo (PATCH)
  toggleTodo(id: number): Observable<Todo> {
    const todos = this.todosSubject.value;
    const todo = todos.find(t => t.id === id);

    if (!todo) {
      return throwError(() => new Error('Todo non trouvé'));
    }

    return this.http.patch<Todo>(
      `${this.API_URL}/todos/${id}`,
      { completed: !todo.completed }
    ).pipe(
      tap(() => {
        console.log('✅ Todo toggled:', id);
        // Mise à jour optimiste du state
        const updated = todos.map(t =>
          t.id === id ? { ...t, completed: !t.completed } : t
        );
        this.todosSubject.next(updated);
      }),
      catchError(error => {
        console.error('❌ Erreur toggle:', error);
        return throwError(() => error);
      })
    );
  }

  // Mettre à jour le state local
  updateTodosState(todos: Todo[]): void {
    this.todosSubject.next(todos);
  }

  setLoading(loading: boolean): void {
    this.loadingSubject.next(loading);
  }

}

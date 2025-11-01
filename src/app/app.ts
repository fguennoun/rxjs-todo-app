import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TodoList } from "./components/todo-list/todo-list";

@Component({
  selector: 'app-root',
  template: '<app-todo-list></app-todo-list>',
  styles: [],
  imports: [TodoList]
})
export class AppComponent {
  title = 'rxjs-todo-app';
}

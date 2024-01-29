import { Component, computed, inject } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PostService } from './service/post.service';
import { patchState, signalState, signalStore, withComputed, withHooks, withMethods, withState } from '@ngrx/signals';
import { Post } from './types/post.type';
import { pipe, switchMap, tap } from 'rxjs';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { CommonModule } from '@angular/common';


export interface PostState {
  posts: Post[];
  isLoading: boolean;
  error: null | string;
}

export const postStore = signalStore(
  {providedIn: 'root'},
  withState<PostState>({
    posts: [],
    isLoading: false,
    error: null
  }),
  withComputed((store) => ({ // additional signal state that can be created based on our store's state
    postsCount: computed(() => store.posts().length)
  })),
  withMethods((store, postService = inject(PostService)) => ({ // Act like actions, effects and reducers
    addPost(title: string) {
      const newPost: Post = {id: crypto.randomUUID(), title};
      const updatedPosts = [...store.posts(), newPost];
      patchState(store, (store) => ({...store, posts: updatedPosts}));
    },
    updatePost(id: string, title: string) {
      const index = store.posts().findIndex(post => post.id === id);
      if (index !== -1) {
        store.posts()[index].title = title;
      }
    },
    removePost(id: string) {
      const updatedPosts = store.posts().filter(post => post.id !== id);
      patchState(store, (store) => ({posts: updatedPosts}));
    },
    loadPosts: rxMethod<void>(
      pipe(
        switchMap(() => {
          return postService.getAllPosts().pipe(
            tap(posts => {
              patchState(store, {posts});
            })
          )
        })
      )
    )
  })),
  withHooks({ // Act like component's lifecycles
    onInit(store) {
      store.loadPosts();
    }
  })
)

@Component({
  selector: 'app-posts',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, CommonModule],
  templateUrl: './posts.component.html',
  styleUrl: './posts.component.css'
})
export class PostsComponent {

  fb = inject(FormBuilder);
  postService = inject(PostService);

  addForm = this.fb.nonNullable.group({
    title: ''
  });

  store = inject(postStore)

  editingPostId: string | null = null;
  editingPostTitle: string = '';

  onAdd() {
    this.store.addPost(this.addForm.getRawValue().title);
    this.addForm.reset();
  }

  removePost(id: string): void {
    this.store.removePost(id);
  }

  editPost(id: string, title: string) {
    this.editingPostId = id;
    this.editingPostTitle = title;
  }

  saveEditedPost() {
    if (this.editingPostId !== null) {
      const newTitle = this.editingPostTitle.trim();
      if (newTitle !== '') {
        this.store.updatePost(this.editingPostId, newTitle);
      }
      this.cancelEdit();
    }
  }

  cancelEdit() {
    this.editingPostId = null;
    this.editingPostTitle = '';
  }

}

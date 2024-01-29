import { Component, computed, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { PostService } from './service/post.service';
import { patchState, signalState, signalStore, withComputed, withHooks, withMethods, withState } from '@ngrx/signals';
import { Post } from './types/post.type';
import { pipe, switchMap, tap } from 'rxjs';
import { rxMethod } from '@ngrx/signals/rxjs-interop';


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
  withComputed((store) => ({
    postsCount: computed(() => store.posts().length)
  })),
  withMethods((store, postService = inject(PostService)) => ({
    addPost(title: string) {
      const newPost: Post = {id: crypto.randomUUID(), title};
      const updatedPosts = [...store.posts(), newPost];
      patchState(store, (store) => ({...store, posts: updatedPosts}));
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
  withHooks({
    onInit(store) {
      store.loadPosts();
    }
  })
)

@Component({
  selector: 'app-posts',
  standalone: true,
  imports: [ReactiveFormsModule],
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

  onAdd() {
    this.store.addPost(this.addForm.getRawValue().title);
    this.addForm.reset();
  }

  removePost(id: string): void {
    this.store.removePost(id);
  }

}

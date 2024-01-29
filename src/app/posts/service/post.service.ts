import { Injectable } from "@angular/core";
import { Post } from "../types/post.type";
import { Observable, delay, of } from "rxjs";

@Injectable({
    providedIn: 'root'
})
export class PostService {

    posts: Post[] = [
        {id: '1', title: 'First Post'},
        {id: '2', title: 'Second Post'},
        {id: '3', title: 'Third Post'},
    ];

    getAllPosts(): Observable<Post[]> {
        return of(this.posts).pipe(delay(2000));
    }

}
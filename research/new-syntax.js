import { $, _ } from 'diamond';
import { from } from 'rxjs/observable';

const filter$ = getEventSubject();

const Search = () => _`
    <input onChange=@${filter$}>
`;


const Movies = (movies) => _`
    <h1>Movies</h1>
    <ul>
        <Search/>
        ${movies.map(from)
            .filterMap(filter$)
            .map(({ url, title, description, year }=$) => _`
                <li class="poster">
                    <img src=${url} alt=${title}>
                    <section>
                        <header>${title}</header>
                        <article>${description}</article>
                        <footer>${year}</footer>
                    </section>
                </li>
        `)}#;
    </ul>
`;

export { Movies };
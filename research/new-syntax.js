import { $, _ } from 'diamond';
import { from } from 'rxjs/observable';

const Search = () => _`
`;

let search = null;

const Movies = (movies) => _`
    <h1>Movies</h1>
    <ul>
        ${movies.map(from)
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
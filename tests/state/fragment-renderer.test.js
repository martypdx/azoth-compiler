import { assert } from 'chai';
import { InlineRenderer, ByIdRenderer } from '../../src/state/fragment-renderers';

describe('fragment renderers', () => {

    describe('InlineRenderer', () => {
        const renderer = InlineRenderer.create();
    
        const indexes = [
            renderer.add('some string'),
            renderer.add('another string')
        ];

        it('returns new index on add', () => {
            assert.equal(indexes[0], 0);
            assert.equal(indexes[1], 1);
        });
    
        it('returns index of previous string', () => {
            assert.equal(renderer.add('some string'), 0);
            assert.equal(renderer.add('another string'), 1);
        });
    
        it('and does new strings again', () => {
            indexes[2] = renderer.add('new one');
            assert.equal(indexes[2], 2);
        });
    
        it('returns unique as declaration', () => {
            it('returns declaration for each hash used', () => {
                assert.deepEqual([...renderer.map.entries()], [
                    [indexes[0], 'some string'],
                    [indexes[1], 'another string'],
                    [indexes[2], 'new one'],
                ]);
            });
        });
    });

    describe('ByIdRenderer', () => {
        const byIdRenderer = new ByIdRenderer();

        const module1Renderer = byIdRenderer.create();
        const module2Renderer = byIdRenderer.create();

        let hashes = [
            module1Renderer.add('some string'),
            module1Renderer.add('another string (module 1 only)')
        ];
    
        it('returns hashId on add', () => {
            assert.equal(hashes[0].length, 10);
            assert.equal(hashes[1].length, 10);
            assert.notEqual(hashes[0], hashes[1]);
        });
    
        it('returns same hashId as previous string', () => {
            assert.equal(module1Renderer.add('some string'), hashes[0]);
            assert.equal(module1Renderer.add('another string (module 1 only)'), hashes[1]);
        });
    
        it('still tracks new value', () => {
            hashes[2] = module1Renderer.add('module 1 only');
            assert.equal(hashes[2].length, 10);
        });

        it('module 1 has hash for each used', () => {
            assert.deepEqual([...module1Renderer.set.keys()], [
                hashes[0],
                hashes[1],
                hashes[2]
            ]);
        });

        it('returns same hashId as string from other module', () => {
            assert.equal(module2Renderer.add('some string'), hashes[0]);
        });

        it('new for just module 2', () => {
            hashes[3] = module2Renderer.add('module 2 only');
            assert.equal(hashes[3].length, 10);
        });

        it('module 1 has hash for each used', () => {
            assert.deepEqual([...module2Renderer.set.keys()], [
                hashes[0], hashes[3]
            ]);
        });

        it('has rollup of all modules', () => {
            assert.deepEqual([...byIdRenderer.map.entries()], [
                [hashes[0], 'some string'],
                [hashes[1], 'another string (module 1 only)'],
                [hashes[2], 'module 1 only'],
                [hashes[3], 'module 2 only'],
            ]);

        });
    });
});
import {nodeResolve} from '@rollup/plugin-node-resolve'
import {terser} from 'rollup-plugin-terser'
import babel from '@rollup/plugin-babel'
import pkg from './package.json'

const input = ['arion/arion.js']

export default [
    {
        // UMD
        input,
        plugins: [
            nodeResolve(),
            babel({
                babelHelpers: 'bundled'
            }),
            terser()
        ],
        output: {
            file: `dist/${pkg.name}.min.js`,
            format: 'umd',
            name: 'Arion',
            esModule: false,
            exports: 'named',
            sourcemap: true
        }
    },
    // {
    //     // I don't see how we can use ESM and CJS builds at this time, it would require some additional work
    //     input,
    //     plugins: [
    //         nodeResolve(),
    //         terser()
    //     ],
    //     output: [
    //         {
    //             dir: 'dist/esm',
    //             format: 'esm',
    //             exports: 'named',
    //             sourcemap: true
    //         },
    //         {
    //             dir: 'dist/cjs',
    //             format: 'cjs',
    //             exports: 'named',
    //             sourcemap: true
    //         }
    //     ]
    // }
]

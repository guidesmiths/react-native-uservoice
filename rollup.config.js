import nodeResolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import babel from 'rollup-plugin-babel';
import replace from 'rollup-plugin-replace';
import { uglify } from 'rollup-plugin-uglify';
import globals from 'rollup-plugin-node-globals';
import builtins from 'rollup-plugin-node-builtins';

const env = process.env.NODE_ENV;
const config = {
  input: 'src/index.js',
  plugins: []
};

if (env === 'es' || env === 'cjs') {
  config.output = { format: env, indent: false };
  config.external = ['symbol-observable', 'moment', 'query-string', 'url-parse', 'buffer', 'crypto-js' ];
  config.plugins.push(
    babel({
      exclude: ['node_modules/**', 'test']
    })
  )
}

if (env === 'development' || env === 'production') {
  config.output = { format: 'umd', name: 'react-native-uservoice', indent: false };
  config.plugins.push(
    nodeResolve({
      jsnext: true,
      browser: true,
      preferBuiltins: false
    }),
    replace({
      'process.env.NODE_ENV': JSON.stringify(env)
    }),
    babel({
      exclude: ['node_modules/**', 'test'],
      plugins: ['external-helpers'],
      externalHelpers: true
    }),
    commonjs()
  );
}

if (env === 'production') {
  config.plugins.push(
    uglify({
      compress: {
        pure_getters: true,
        unsafe: true,
        unsafe_comps: true,
        warnings: false
      }
    })
  );
}

export default config;

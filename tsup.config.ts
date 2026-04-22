import { defineConfig } from 'tsup';

export default defineConfig({
	entry: {
		index: 'index.ts',
		'components/content-picker/index': 'components/content-picker/index.ts',
	},
	format: ['esm', 'cjs'],
	dts: true,
	sourcemap: true,
	clean: true,
	splitting: false,
	treeshake: true,
	external: [/^@wordpress\//, 'react', 'react-dom', 'react/jsx-runtime'],
	outExtension({ format }) {
		return { js: format === 'esm' ? '.js' : '.cjs' };
	},
});

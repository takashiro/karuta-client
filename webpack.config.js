// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require('path');

module.exports = function config(env, argv) {
	const mode = (argv && argv.mode) || 'production';
	return {
		mode,
		entry: {
			index: './src/index.ts',
		},
		module: {
			rules: [
				{
					test: /\.ts$/,
					use: 'ts-loader',
				},
			],
		},
		resolve: {
			extensions: [
				'.ts',
				'.js',
			],
		},
		output: {
			filename: '[name].js',
			path: path.join(__dirname, 'dist'),
			library: {
				name: '@karuta/client',
				type: 'umd',
			},
			devtoolModuleFilenameTemplate: '[absolute-resource-path]',
		},
		externals: [
			'events',
		],
		devtool: mode !== 'production' ? 'inline-source-map' : undefined,
	};
};

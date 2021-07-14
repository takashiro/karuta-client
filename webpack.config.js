// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require('path');

module.exports = function config(env, argv) {
	const mode = (argv && argv.mode) || 'production';
	return {
		mode,
		target: 'node',
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
			libraryTarget: 'commonjs2',
			devtoolModuleFilenameTemplate: '[absolute-resource-path]',
		},
		devtool: mode !== 'production' ? 'inline-source-map' : undefined,
	};
};

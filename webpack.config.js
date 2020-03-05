const webpack = require("webpack");
const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

const webpackOption = {
    mode: "production",
    entry: {
        index: './src/livesearch.js',
    },
    output: {
        path: path.resolve(__dirname, "./dist"),
        filename: 'livesearch.js',
        library: "Livesearch",
        libraryTarget: "umd"
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /(node_modules|bower_components)/,
                use: {
                    loader: "babel-loader",
                    options: {
                        presets: ["@babel/preset-env"]
                    }
                }
            },
            {
                test: /\.scss$/,
                loader: ['style-loader', 'css-loader', 'sass-loader']
            }
        ]
    },
    optimization: {
        minimize: true,
        minimizer: [new TerserPlugin({
            terserOptions: {
                keep_classnames: true,
                keep_fnames: true,
                output: {
                    comments: false,
                },
            },
            extractComments: false
        })]
    }
};

let babelLoader = {
    test: /\.js$/,
    exclude: /(node_modules|bower_components)/,
    use: {
        loader: "babel-loader",
        options: {
            presets: ["@babel/preset-env"]
        }
    }
};

module.exports = webpackOption;
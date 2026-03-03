const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const isProd = process.env.NODE_ENV === 'production';

module.exports = {
    entry: {
        index: './src/index.js',
        page: './src/ios/page.js',
        qr_code: './src/ios/qr_code.js',
        qr_code_decode: './src/ios/qr_code_decode.js',
        focus2: './src/ios/focus2.js',
    },
    output: {
        filename: 'js/[name].bundle.js',
        path: path.resolve(__dirname, 'dist'),
        publicPath: '/',
        clean: true,
    },
    module: {
        rules: [
            {
                // CSS: style-loader di dev, MiniCssExtractPlugin di production
                test: /\.css$/,
                use: [
                    isProd ? MiniCssExtractPlugin.loader : 'style-loader',
                    'css-loader',
                ],
            },
            {
                // Images: diproses webpack, output ke dist/img/
                test: /\.(gif|png|jpg|jpeg|svg)$/,
                type: 'asset/resource',
                generator: {
                    filename: 'img/[name][ext]'
                }
            },
            {
                // HTML loader: proses src/href di template html
                test: /\.html$/,
                loader: 'html-loader',
                options: { minimize: isProd },
            },
        ],
    },
    devServer: {
        port: 8080,
        hot: true,
        historyApiFallback: true,
    },
    plugins: [
        ...(isProd ? [new MiniCssExtractPlugin({ filename: 'css/[name].css' })] : []),
        new CopyWebpackPlugin({
            patterns: [
                { from: 'src/img', to: 'img' },
            ],
        }),
        new HtmlWebpackPlugin({
            template: './src/index.html',
            filename: 'index.html',
            chunks: ['index'],
        }),
        new HtmlWebpackPlugin({
            template: './src/ios/page.html',
            filename: 'ios/page.html',
            chunks: ['page'],
        }),
        new HtmlWebpackPlugin({
            template: './src/ios/qr_code.html',
            filename: 'ios/qr_code.html',
            chunks: ['qr_code'],
        }),
        new HtmlWebpackPlugin({
            template: './src/ios/qr_code_decode.html',
            filename: 'ios/qr_code_decode.html',
            chunks: ['qr_code_decode'],
        }),
        new HtmlWebpackPlugin({
            template: './src/ios/focus2.html',
            filename: 'ios/focus2.html',
            chunks: ['focus2'],
        }),
    ],
    mode: isProd ? 'production' : 'development',
};
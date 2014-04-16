module.exports = {
    options: {
        banner: '<%= banner %>',
        report: 'min',
        compress: {
            drop_console: true
        }
    },
    src: {
        files: {
            '<%= distPath %>/<%= pkg.name %>.min.js': '<%= jsPath %>/*.js'
        }
    }
};

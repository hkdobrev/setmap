module.exports = {
    gruntfile: {
        files: '<%= gruntfilePath %>',
        tasks: [ 'jshint:gruntfile' ]
    },
    gruntTasks: {
        files: '<%= tasksPath %>/**/*.js',
        tasks: [ 'jshint:gruntTasks' ]
    },
    js: {
        files: '<%= jsPath %>/**/*.js',
        tasks: [ 'jshint:dev' ]
    }
};

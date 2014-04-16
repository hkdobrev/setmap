module.exports = {
    options: {
        config: '.jscs.json',
    },
    src: '<%= jsPath %>/**/*.js',
    gruntfile: '<%= gruntfilePath %>',
    gruntTasks: '<%= tasksPath %>/**/*.js'
};

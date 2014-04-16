var extend = require('underscore').extend,
    options = {
        boss: true,
        curly: true,
        eqeqeq: true,
        eqnull: true,
        forin: true,
        immed: true,
        indent: 4,
        jquery: true,
        latedef: true,
        maxdepth: 5,
        maxcomplexity: 9,
        maxlen: 100,
        maxparams: 3,
        maxstatements: 12,
        newcap: true,
        noarg: true,
        nonbsp: true,
        nonew: true,
        plusplus: true,
        quotmark: 'single',
        sub: true,
        trailing: true,
        undef: true,
        unused: true
    },
    gruntOptions = extend({}, options, {
        node: true
    }),
    distOptions = extend({}, options, {
        browser: true,
        camelcase: true
    }),
    devOptions = extend({}, distOptions, {
        devel: true
    }),
    sourcePath = [
        '<%= jsPath %>/**/*.js'
    ];

module.exports = {
    dev: {
        src: sourcePath,
        options: devOptions
    },
    dist: {
        src: sourcePath,
        options: distOptions
    },
    gruntfile: {
        src: '<%= gruntfilePath %>',
        options: gruntOptions
    },
    gruntTasks: {
        src: '<%= tasksPath %>/**/*.js',
        options: gruntOptions
    }
};

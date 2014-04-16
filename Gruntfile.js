/*global module:false*/
module.exports = function(grunt) {

    'use strict';

    var gruntConfig = {
        pkg: grunt.file.readJSON('package.json'),
        banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
         '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
         '<%= pkg.homepage ? "* " + pkg.homepage + "\\n" : "" %>' +
         '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
         ' Licensed <%= pkg.license %> */\n',
        env: process.env,
        jsPath: 'lib',
        distPath: 'dist',
        stagingPath: '.tmp',
        gruntfilePath: 'Gruntfile.js',
        tasksPath: 'grunt',
        taskOptionsPath: 'grunt/options'
    };

    require('load-grunt-config')(grunt, {
        configPath: require('path').join(
            process.cwd(),
            gruntConfig.taskOptionsPath
        ),
        data: gruntConfig
    });

    grunt.loadTasks(gruntConfig.tasksPath);
};

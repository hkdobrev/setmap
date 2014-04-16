module.exports = {
    'default': [
        'build'
    ],
    build: [
        'lint:dev',
        'style'
    ],
    'lint:dev': [
        'jshint:dev',
        'jshint:gruntfile',
        'jshint:gruntTasks'
    ],
    'lint:dist': [
        'jshint:dist',
        'jshint:gruntfile',
        'jshint:gruntTasks'
    ],
    style: [
        'jscs'
    ],
    dist: [
        'clean:pre-build',
        'lint:dist',
        'uglify',
        'clean:post-build'
    ]
};

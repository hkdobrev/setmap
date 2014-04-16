module.exports = {
    'pre-build': [ '<%= distPath %>/**/*' ],
    'post-build': [ '<%= stagingPath %>' ]
};

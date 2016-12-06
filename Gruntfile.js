module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    compress: {
        zip:{
            options: {
                archive: 'powell-developer-tools.zip'
            },
            files: [
                {src: ['./resources/**/*.min.*', './resources/html/*', './resources/img/*.png', './resources/img/*.gif', '*.html', 'manifest.json']}
            ]
        }
    }
  });

  // Load the plugin that provides the "compress" task.
  grunt.loadNpmTasks('grunt-contrib-compress');

  // Default task(s).
  grunt.registerTask('default', ['compress']);
};
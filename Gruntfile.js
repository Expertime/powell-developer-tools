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
    },
    webstore_upload: {
        "accounts": {
            "default": { //account under this section will be used by default 
                publish: true, //publish item right after uploading. default false 
                client_id: "1014026429557-ecgcr97v6vfd9lmajru2ad1hv73pu789.apps.googleusercontent.com",
                client_secret: "i3o_qSMd2jONnfbrbA-lhRxy",
                refresh_token: "4/oTxN6lGWtvvg4eOJrxtEOSxpjjEGf_ZcbiJmIZDTyAo"
            }
        },
        "extensions": {
            "powell-developer-tools": {
                //required 
                appID: "ipcafcbnkhgdaiefpfnmogkcnikmfifa",
                //required, we can use dir name and upload most recent zip file 
                zip: "powell-developer-tools.zip"      
            }
        }
    }
  });

  // Load the plugin that provides the "compress" task.
  grunt.loadNpmTasks('grunt-contrib-compress');
  
  grunt.loadNpmTasks('grunt-webstore-upload');

  // Default task(s).
  grunt.registerTask('default', ['compress', 'webstore_upload']);
};
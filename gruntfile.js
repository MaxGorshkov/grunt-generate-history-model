module.exports = function(grunt) {
    "use strict";
  
    grunt.initConfig({
      
      ts: {
        app: {
          files: [{
            src: [
              "./tasks/**/*.ts",
              "!./dist/**"
            ],
            dest: "./dist"
          },],
          tsconfig: true
        },
      },
      
      tslint: {
        options: {
          configuration: "tslint.json"
        },
        files: {
          src: [
            "./src/\*\*/\*.ts",
          ]
        }
      },

      copy: {
        template:{
          expand: true,
          cwd: './src/tasks',
          src: ['**/*.njk'],
          dest: './dist/tasks'
        },
        publish:{
          expand: true,
          cwd: './dist',
          src: ['**'],
          dest: './'
        }
      },

    });
  
    grunt.loadNpmTasks("grunt-ts");
    grunt.loadNpmTasks("grunt-tslint");
    grunt.loadNpmTasks('grunt-contrib-copy');

    grunt.registerTask("build", [
      "ts:app", "tslint", "copy"
    ]);

  };
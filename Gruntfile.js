/**
@toc
2. load grunt plugins
3. init
4. setup variables
5. grunt.initConfig
6. register grunt tasks

*/

'use strict';

module.exports = function(grunt) {

	/**
	Load grunt plugins
	@toc 2.
	*/
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-karma');
	grunt.loadNpmTasks('grunt-bump');

	/**
	Function that wraps everything to allow dynamically setting/changing grunt options and config later by grunt task. This init function is called once immediately (for using the default grunt options, config, and setup) and then may be called again AFTER updating grunt (command line) options.
	@toc 3.
	@method init
	*/
	function init(params) {
		/**
		Project configuration.
		@toc 5.
		*/
		grunt.initConfig({
			concat: {
				js:{
					options: {
						// Replace all 'use strict' statements in the code with a single one at the top
						banner: "'use strict';\n",
						process: function(src, filepath) {
							return '// Source: ' + filepath + '\n' +
								src.replace(/(^|\n)[ \t]*('use strict'|"use strict");?\s*/g, '$1');
						},
					},
					files:{
						'dist/angular-ui-access-control.js': ['src/**/*.js']
					}
				}
			},
			jshint: {
				options: {
					//force:          true,
					globalstrict:   true,
					//sub:            true,
					node: true,
					loopfunc: true,
					browser:        true,
					devel:          true,
					globals: {
						angular:    false,
						$:          false,
						moment:		false,
						Pikaday: false,
						module: false,
						forge: false
					}
				},
				beforeconcat:   {
					options: {
						force:	false,
						ignores: ['**.min.js', '*.conf.js']
					},
					files: {
						src: []
					}
				},
				//quick version - will not fail entire grunt process if there are lint errors
				beforeconcatQ:   {
					options: {
						force:	true,
						ignores: ['**.min.js', '*.conf.js']
					},
					files: {
						src: ['**.js']
					}
				}
			},
			uglify: {
				options: {
					mangle: false
				},
				build: {
					files:  {},
					src:    ['dist/angular-ui-access-control.js'],
					dest:   'dist/angular-ui-access-control.min.js'
				}
			},
			karma: {
				unit: {
					configFile: 'karma.conf.js',
					singleRun: true
				},
				e2e: {
					configFile: 'karma-e2e.conf.js',
					singleRun: true
				}
			},
			bump:{
				options:{
					files:['package.json', 'bower.json'],
					pushTo:'origin',
					commitFiles:['-a']
				}
			}
		});
		
		
		/**
		register/define grunt tasks
		@toc 6.
		*/
		// Default task(s).
		grunt.registerTask('default', ['jshint:beforeconcatQ', 'concat', 'uglify:build']);
	
	}
	init({});		//initialize here for defaults (init may be called again later within a task)

};
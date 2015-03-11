'use strict';

/* jshint unused: false */

angular.module('aomitayo.angular-ui-access-control')
.provider('sentinel', [ '$urlRouterProvider', function($urlRouterProvider){
	
	var defaultOptions = {
		whenDenied: 'denied',
		whenNoGrants: 'login',
		grants: null
	};

	function Sentinel(options, configs, permissionsConfig, $rootScope, $state, $location, $q){
		var self = this;

		self.options = angular.copy(options);
		self.configs = configs;
		self.$state = $state;
		self.$location = $location;
		self.$q = $q;

		$rootScope.$on('$stateChangeStart', function(evt, toState, toParams, fromState, fromParams){
			if(!self.active) return;
			
			var config = self.configs.states[toState.name];
			
			if(config){
				if(toState.sentinelAllow){
					toState.sentinelAllow = false;
					return;
				}

				evt.preventDefault();
				self.checkPermissions(toState.data, config, self.options.grants, permissionsConfig, $q)
				.then(function(allow){
					
					if(allow){	//permission granted
						toState.sentinelAllow = true;
						$state.go(toState.name, toParams);
					}
					else if(allow === null){	//no grants
						self.redirectTo(self.options.whenNoGrants);
						$rootScope.$broadcast('sentinel.nogrant', toState, toParams);
					}
					else{	//denied
						self.redirectTo(self.options.whenDenied);
						$rootScope.$broadcast('sentinel.denied', toState, toParams);
					}
				});
			}
		});
	}

	Sentinel.prototype = {
		constructor: Sentinel,
		activate: function(){
			this.active = true;
		},
		deactivate: function(){
			this.active = false;
		},
		redirectTo: function(path){
			var self = this;
			var r = new RegExp('^.\/|\/');
			if(r.test(path)){ //it is a url
				self.$location.path(path);
			}
			else{	//it is a state
				self.$state.go(path);
			}
		},
		checkPermissions: function(data, config, grants, permissionsConfig, $q){
			var self = this;
			data = data || {};
			
			return $q.all({
				all: $q.when(permissionsConfig.resolveInjectable(config.requireAll || data.requireAll || []) ),
				any: $q.when(permissionsConfig.resolveInjectable(config.requireAny || data.requireAny || []) )
			})
			.then(function(args){
				if(args.all.length === 0 && args.any.length === 0){return true;}

				if(args.all.length > 0){
					return permissionsConfig.checkForAll(args.all);
				}

				if(args.any.length > 0){
					return permissionsConfig.checkForAny(args.any, args.grants);
				}

				return false;
			});
		},
		intersection: function(arr1, arr2){
			var intersection = [];
			angular.forEach(arr1, function(v){
				if(arr2.indexOf(v) != -1){
					intersection.push(v);
				}
			});
			return intersection;
		}
	};

	return {
		options:{},
		configs:{
			states:{},
			routes:{}
		},
		sentinel: null,
		$get: ['permissionsConfig', '$rootScope', '$state', '$location', '$q', function(permissionsConfig, $rootScope, $state, $location, $q){
			this.sentinel = this.sentinel || new Sentinel(this.options, this.configs, permissionsConfig, $rootScope, $state, $location,  $q);
			return this.sentinel;
		}],
		setOptions: function(options){
			this.options = angular.extend(this.options, defaultOptions, options);
			return this;
		},
		watchState: function(name, config){
			this.configs.states[name] = config;
			return this;
		}
		/*watchRoute: function(route, config){
			this.configs.routes[route] = config;
			return this;
		}*/
	};	
}]);
'use strict';
// Source: src/angular-ui-access-control.js
angular.module('aomitayo.angular-ui-access-control', ['ui.router']);

// Source: src/directives/show-with-auth.js
angular.module('aomitayo.angular-ui-access-control')
.directive('showWithAuthAny', ['permissionsConfigs', function(permissionsConfigs){
	return {
		link: function postLink(scope, element, attrs){
			scope.watch(attrs.showWithAuthAny, function(newVal){
				element.toggle(permissionsConfigs.checkForAny(newVal));
			});
		}
	};
}])
.directive('showWithAuthAll', ['permissionsConfigs', function(permissionsConfigs){
	return {
		link: function postLink(scope, element, attrs){
			scope.watch(attrs.showWithAuthAll, function(newVal){
				element.toggle(permissionsConfigs.checkForAll(newVal, true));
			});
		}
	};
}]);
// Source: src/services/permissions-config.js
angular.module('aomitayo.angular-ui-access-control')
.provider('permissionsConfig', [ function(){
	var defaultOptions = {
		grantsFn: null
	};

	function PermissionsConfig(grantsFn, $injector, $q){
		var self = this;

		self.grantsFn = grantsFn;
		self.$injector = $injector;
		self.$q = $q;
	}

	PermissionsConfig.prototype = {
		constructor: PermissionsConfig,
		grants: function(){
			return this.$q.when(this.resolveInjectable(this.grantsFn));
		},
		checkForAll: function(required){
			//tristate return: null for no grants, true  when all permissions are granted, false otherwise
			var self = this;
			var $q = self.$q;
			return $q.when(self.resolveInjectable(self.grantsFn))
			.then(function(granted){
				if(granted === null || typeof granted === 'undefined'){return null;}

				var intersection = self.intersection(required, granted);
				return intersection.length == required.length;
			});
		},
		checkForAny: function(required){
			//tristate return: null for no grants, true  when any at least one permission is granted, false otherwise
			var self = this;
			var $q = self.$q;
			return $q.when(self.resolveInjectable(self.grantsFn))
			.then(function(granted){
				if(granted === null || typeof granted === 'undefined'){return null;}

				var intersection = self.intersection(required, granted);
				return intersection.length > 0;
			});
		},
		resolveInjectable: function(val, injectionContext, locals){
			var self = this;
			injectionContext = injectionContext || {};
			locals = locals || {};
			//check val
			if(val && !angular.isFunction(val) && !angular.isArray(val)){
				throw new Error('Invalid type:  Array, function or Injection Annotated function expected');
			}
			//resolve value
			val = angular.isFunction(val) || (angular.isArray(val) && angular.isFunction(val[val.length-1]))?
				self.$injector.invoke(val, injectionContext, locals) : val;
			return val;
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
		grantsFn: null,
		$get: ['$injector', '$q', function($injector, $q){
			this.permissionsConfig = this.permissionsConfig || new PermissionsConfig(this.grantsFn, $injector, $q);
			return this.permissionsConfig;
		}]
	};	
}]);

// Source: src/services/sentinel.js
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
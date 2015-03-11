'use strict';

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
			if(!angular.isFunction(val) && !angular.isArray(val)){
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
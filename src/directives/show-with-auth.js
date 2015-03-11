'use strict';

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
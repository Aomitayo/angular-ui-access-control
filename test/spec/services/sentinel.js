'use strict';
/* globals console, describe, beforeEach, module, inject, it, expect, browser, sinon */
/* jshint camelcase:false */

describe('Sentinel', function(){
	var sentinelProvider, sentinel, $state, $rootScope, $q;
	var granted, requiredForAll = ['permission1'], requiredForAny=['permission1', 'permission2'];

	beforeEach(function(){
		var context = this;
		context.noGrant = sinon.spy();
		context.denied = sinon.spy();
		module('aomitayo.angular-ui-access-control', function(permissionsConfigProvider, sentinelProvider, $stateProvider, $urlRouterProvider){
			$stateProvider
			.state('root', {
				url:'/',
				template:'<div class="root"></div>',
			})
			.state('requiringAll', {
				url:'/requiringAll',
				template:'<div class="requiringAll"></div>',
			})
			.state('requiringAny', {
				url:'/requiringAny',
				template:'<div class="requiringAny"></div>',
			})
			.state('login', {
				url:'/login',
				template:'<div class="login"></div>',
			})
			.state('home', {
				url:'/home',
				template:'<div class="home"></div>',
			})
			.state('otherstate', {
				url:'/otherstate',
				template:'<div class="otherstate"></div>',
			})
			.state('denied', {
				url:'/denied',
				template:'<div class="denied"></div>',
			});
			
			permissionsConfigProvider.grantsFn = function(){
				return granted;
			};

			sentinelProvider = sentinelProvider;
			sentinelProvider.setOptions({
				grants:function(){
					return granted;
				}
			})
			.watchState('home', {
				requireAll:['home']
			})
			.watchState('otherstate', {
				requireAll:['otherstate']
			})
			.watchState('requiringAll', {
				requireAll:requiredForAll
			})
			.watchState('requiringAny', {
				requireAny:requiredForAny
			});
			
		});

		inject(function(_sentinel_, _$state_, _$rootScope_, _$q_){
			sentinel = _sentinel_;
			$state = _$state_;
			$rootScope = _$rootScope_;
			$q = _$q_;

			$rootScope.$on('sentinel.nogrant', context.noGrant);
			$rootScope.$on('sentinel.denied', context.denied);
		});
	});

	it('Responds to activate', function(){
		expect(sentinel).to.respondTo('activate');
	});
	it('Responds to deactivate', function(){
		expect(sentinel).to.respondTo('deactivate');
	});

	describe('When Requiring All', function(){

		it('Does not protect when not active', function(){
			sentinel.deactivate();
			$state.go('requiringAll'); $rootScope.$digest();
			expect($state.current.name).to.equal('requiringAll');
		});

		it('Broadcasts \'sentinel.nogrant\' when there are no grants', function(){
			granted = null;
			$state.go('root');
			sentinel.activate();
			$rootScope.$digest();
			expect($state.current.name).to.equal('root');
			$state.go('requiringAll'); $rootScope.$digest();
			expect(this.noGrant).to.have.been.called;
			expect($state.current.name).to.equal('login');
		});

		it('Broadcasts \'sentinel.denied\' when denying access', function(){
			granted = [];
			$state.go('root');
			sentinel.activate();
			$rootScope.$digest();
			expect($state.current.name).to.equal('root');
			$state.go('requiringAll'); $rootScope.$digest();
			expect(this.denied).to.have.been.called;
			expect($state.current.name).to.equal('denied');
		});

		it('Prompts for login when there are no grants', function(){
			granted = null;
			$state.go('root');
			sentinel.activate();
			$rootScope.$digest();
			expect($state.current.name).to.equal('root');
			$state.go('requiringAll'); $rootScope.$digest();

			expect($state.current.name).to.equal('login');
		});

		it('Denies when grants are inadequate', function(){
			var permissions = [
				[[], ['permission1']],
				[['permission1'], ['permission2']],
				[[], ['permission1', 'permission2']],
				[['permission2'], ['permission1', 'permission2']],
			];
			permissions.forEach(function(v, k){
				granted = v[0];
				requiredForAll.splice.apply(requiredForAll, [0, requiredForAll.length].concat(v[1]));

				$state.go('root');
				sentinel.activate();
				$rootScope.$digest();
				expect($state.current.name).to.equal('root');
				$state.go('requiringAll'); $rootScope.$digest();

				expect($state.current.name).to.equal('denied');
			});
		});

		it('Allows when grants are adequate', function(){
			var permissions = [
				[['permission1'], ['permission1']],
				[['permission1', 'permission2'], ['permission1', 'permission2']],
				[['permission2', 'permission1'], ['permission1', 'permission2']],
			];
			permissions.forEach(function(v, k){
				granted = v[0];
				requiredForAll.splice.apply(requiredForAll, [0, requiredForAll.length].concat(v[1]));

				$state.go('root');
				sentinel.activate();
				$rootScope.$digest();
				expect($state.current.name).to.equal('root');
				$state.go('requiringAll'); $rootScope.$digest();

				expect($state.current.name).to.equal('requiringAll');
			});
		});
	});

	describe('When Requiring Any', function(){

		it('Does not protect when not active', function(){
			sentinel.deactivate();
			$state.go('requiringAny'); $rootScope.$digest();
			expect($state.current.name).to.equal('requiringAny');
		});

		it('Broadcasts \'sentinel.nogrant\' when there are no grants', function(){
			granted = null;
			$state.go('root');
			sentinel.activate();
			$rootScope.$digest();
			expect($state.current.name).to.equal('root');
			$state.go('requiringAny'); $rootScope.$digest();
			expect(this.noGrant).to.have.been.called;
			expect($state.current.name).to.equal('login');
		});

		it('Broadcasts \'sentinel.denied\' when denying access', function(){
			granted = [];
			$state.go('root');
			sentinel.activate();
			$rootScope.$digest();
			expect($state.current.name).to.equal('root');
			$state.go('requiringAny'); $rootScope.$digest();
			expect(this.denied).to.have.been.called;
			expect($state.current.name).to.equal('denied');
		});

		it('Prompts for login when there are no grants', function(){
			granted = null;
			$state.go('root');
			sentinel.activate();
			$rootScope.$digest();
			expect($state.current.name).to.equal('root');
			$state.go('requiringAny'); $rootScope.$digest();

			expect($state.current.name).to.equal('login');
		});

		it('Denies when grants are inadequate', function(){
			var permissions = [
				[[], ['permission1']],
				[['permission1'], ['permission2']],
				[[], ['permission1', 'permission2']],
				[['permission3'], ['permission1', 'permission2']],
			];
			permissions.forEach(function(v, k){
				granted = v[0];
				requiredForAny.splice.apply(requiredForAny, [0, requiredForAny.length].concat(v[1]));

				$state.go('root');
				sentinel.activate();
				$rootScope.$digest();
				expect($state.current.name).to.equal('root');
				$state.go('requiringAny'); $rootScope.$digest();

				expect($state.current.name).to.equal('denied');
			});
		});

		it('Allows when grants are adequate', function(){
			var permissions = [
				[['permission1'], ['permission1']],
				[['permission1'], ['permission1', 'permission2']],
				[['permission2'], ['permission1', 'permission2']],
				[['permission1', 'permission2'], ['permission1', 'permission2']],
				[['permission2', 'permission1'], ['permission1', 'permission2']],
			];
			permissions.forEach(function(v, k){
				granted = v[0];
				requiredForAny.splice.apply(requiredForAny, [0, requiredForAny.length].concat(v[1]));

				$state.go('root');
				sentinel.activate();
				$rootScope.$digest();
				expect($state.current.name).to.equal('root');
				$state.go('requiringAny'); $rootScope.$digest();

				expect($state.current.name).to.equal('requiringAny');
			});
		});
	});
});
'use strict';
/* globals console, describe, beforeEach, module, inject, it, expect, browser */
/* jshint camelcase:false */

describe('Sentinel', function(){
	var sentinelProvider, sentinel, $state, $rootScope, $q;
	var permissions;

	beforeEach(function(){
		module('aomitayo.angular-ui-access-control', function(sentinelProvider, $stateProvider, $urlRouterProvider){
			$stateProvider
			.state('root', {
				url:'/',
				template:'<div class="root"></div>',
			})
			.state('home', {
				url:'/home',
				template:'<div class="home"></div>',
			})
			.state('login', {
				url:'/login',
				template:'<div class="login"></div>',
			})
			.state('denied', {
				url:'/denied',
				template:'<div class="denied"></div>',
			});
			
			sentinelProvider = sentinelProvider;
			sentinelProvider.setOptions({
				grants:function(){
					return permissions;
				}
			})
			.watchState('home', {
				requireAll:['login']
			});

		});

		inject(function(_sentinel_, _$state_, _$rootScope_, _$q_){
			sentinel = _sentinel_;
			$state = _$state_;
			$rootScope = _$rootScope_;
			$q = _$q_;
		});
	});

	it('Responds to activate', function(){
		expect(sentinel).to.respondTo('activate');
	});
	it('Responds to deactivate', function(){
		expect(sentinel).to.respondTo('deactivate');
	});

	it('Does not protect when not active', function(){
		sentinel.deactivate();
		$state.go('home'); $rootScope.$digest();
		expect($state.current.name).to.equal('home');
	});

	it('Prompts for login when there are no grants', function(){
		permissions = null;
		$state.go('root');
		sentinel.activate();
		$rootScope.$digest();
		expect($state.current.name).to.equal('root');
		$state.go('home'); $rootScope.$digest();

		expect($state.current.name).to.equal('login');
	});

	it('Denies when grants are inadequate', function(){
		permissions = [];
		$state.go('root');
		sentinel.activate();
		$rootScope.$digest();
		expect($state.current.name).to.equal('root');
		$state.go('home'); $rootScope.$digest();

		expect($state.current.name).to.equal('denied');
	});

	it('Allows when grants are adequate', function(){
		permissions = ['login'];
		$state.go('root');
		sentinel.activate();
		$rootScope.$digest();
		expect($state.current.name).to.equal('root');
		$state.go('home'); $rootScope.$digest();

		expect($state.current.name).to.equal('home');
	});

});
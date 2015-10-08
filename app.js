﻿var appServices = angular.module('myAppServices', ['ngResource']);
var app = angular.module('myApp', [
	'webapiServices',
	'utilsService',
  'ngRoute',
	'ngCookies',
	'myAppServices',
	'ngMaterial',
	'ngAnimate',
	'satellizer',
]);
app.name = 'Couintdown';

/* --------------------- */

app.config(function ($routeProvider, $sceDelegateProvider, $locationProvider) {
	console.log('init routes');
	$routeProvider.
		when('/', {
			templateUrl: 'main.html',
			controller: 'MainPageCtrl'
		}).
		when('/confirmchallenge', {
			templateUrl: 'confirmchallenge.html',
			controller: 'ConfirmChallengeCtrl'
		}).
		when('/checkout', {
			templateUrl: 'checkout.html',
			controller: 'CheckoutCtrl'
		}).
		when('/test', {
			templateUrl: 'mainx.html',
			controller: 'MainPageCtrl'
		}).
		otherwise({
			redirectTo: '/'
		});
	//$locationProvider.html5Mode(true);

	$sceDelegateProvider.resourceUrlWhitelist(['self', new RegExp('.*')]);
	$locationProvider.hashPrefix('!');
	$locationProvider.html5Mode(false);
});

app.config(['$authProvider', 'webapiProvider', function ($authProvider, webapiProvider) {
	var webapi = webapiProvider.$get();
	console.log(webapi.getWebApiUrl() + 'mevtza/auth/facebook');

	$authProvider.facebook({
		clientId: '624547474274882'
	});

	$authProvider.google({
		clientId: '105823334340-ehlg1ml94k62j6nv2gr9e8a1qnaim6fd'
	});

	$authProvider.httpInterceptor = true;
	$authProvider.withCredentials = true;
	$authProvider.tokenRoot = null;
	$authProvider.cordova = false;
	$authProvider.baseUrl = '/';
	$authProvider.loginUrl = webapi.getWebApiUrl() + 'mevtza/auth/login';
	$authProvider.signupUrl = webapi.getWebApiUrl() + 'mevtza/auth/signup';
	$authProvider.unlinkUrl = webapi.getWebApiUrl() + 'mevtza/auth/unlink/';
	$authProvider.tokenName = 'token';
	$authProvider.tokenPrefix = 'satellizer';
	$authProvider.authHeader = 'Authorization';
	$authProvider.authToken = 'Bearer';
	$authProvider.storageType = 'localStorage';

	// Facebook
	$authProvider.facebook({
		url: webapi.getWebApiUrl() + '/mevtza/auth/facebook',
		authorizationEndpoint: 'https://www.facebook.com/v2.3/dialog/oauth',
		redirectUri: (window.location.origin || window.location.protocol + '//' + window.location.host) + '/',
		requ1iredUrlParams: ['display', 'scope'],
		scope: ['email'],
		scopeDelimiter: ',',
		display: 'popup',
		type: '2.0',
		popupOptions: { width: 580, height: 400 }
	});

	// Google
	$authProvider.google({
		url: webapi.getWebApiUrl() + '/mevtza/auth/google',
		authorizationEndpoint: 'https://accounts.google.com/o/oauth2/auth',
		redirectUri: window.location.origin || window.location.protocol + '//' + window.location.host,
		requiredUrlParams: ['scope'],
		optionalUrlParams: ['display'],
		scope: ['profile', 'email'],
		scopePrefix: 'openid',
		scopeDelimiter: ' ',
		display: 'popup',
		type: '2.0',
		popupOptions: { width: 452, height: 633 }
	});
}]);

app.config(function ($mdThemingProvider) {
	// Configure a dark theme with primary foreground yellow
	$mdThemingProvider.theme('default')
			.primaryPalette('blue');
});

/* --------------------- */

app.run(function ($rootScope, $location, $auth, $http, webapi, $cookies, $window, utils, page, $mdDialog, $route) {
	console.log('init');

	$rootScope.app = app;
	app.history = [];
	app.profile = {
		user: {
			userId: null,
			email: null,
			fullName: null,
			firstName: null,
			lastName: null,
			isConnected: false,
			favoriteAds: [],
		},
		goLogin: function() {
			console.log('goLogin');

			$mdDialog.show({
				controller: 'loginCtrl',
				templateUrl: 'login.html',
				parent: angular.element(document.body),
				clickOutsideToClose: true
			})
			.then(function (answer) {
				console.log('login successfull');
			}, function () {
				console.log('You cancelled the dialog');
			});

			//$location.path('signin');
		},
		goSignup: function () {
			console.log('goSignup');
			$location.path('signup');
		},
		reset: function() {
			this.user.email = null;
			this.user.fullName = null;
			this.user.firstName = null;
			this.user.lastName = null;
			this.user.name = null;
			this.user.isConnected = false;
			$cookies.remove('profile.user');
			$location.path('/');
		},
		refresh: function() {
			/*
			$facebook.api("/me").then(
				function (response) {
					console.log(response);
					app.profile.email = response.email;
					app.profile.name = response.name;
					app.profile.isConnected = true;
				},
				function (err) {
					app.profile.reset();
				}
			);
			*/
		},
		login: function (provider, loginData) {
			console.log('login', provider);

			var success = function (res) {
				console.log('login success.', res);

				app.profile.user.userId = res.user.userId;
				app.profile.user.email = res.user.email;
				app.profile.user.fullName = res.user.fullName;
				app.profile.user.firstName = res.user.firstName;
				app.profile.user.lastName = res.user.lastName;
				app.profile.user.isConnected = true;
				app.profile.user.favoriteAds = res.user.favoriteAds;

				app.profile.saveToCookie();

				app.profile.refresh();

				var lastRoute = app.history[app.history.length - 2];
				if ((lastRoute == '/signup' || lastRoute == '/signin') && app.history.length > 1) lastRoute = app.history[app.history.length - 3];
				if (lastRoute == '/signup' || lastRoute == '/signin') lastRoute = '/';
				if (lastRoute == undefined || lastRoute == '/signup' || lastRoute == '/signin') app.history = '/adRate';

				console.log('app.profile.login: Navigating to ' + lastRoute);

				$location.path(lastRoute);
			}
			var failure = function(res) {
				console.log('login failed!', res.user);
				displayToast('error', res.user);
			}

			var ret = null;
			if (provider == 'feedox') 
				ret = $http.post(webapi.getWebApiUrl() + "/mevtza/login", loginData).then(success, failure);
			else
				ret = $auth.authenticate(provider).then(success, failure);

			this.refresh();

			return ret;
		},
		logout: function() {
			console.log('logout');
			//$facebook.logout();
			this.reset();
			$route.reload();
		},
		saveToCookie: function() {
			$cookies.put('profile.user', angular.toJson(app.profile.user));
		}
	};

	page.setAppName(app.name, 'The ultimate countdown timer');

	var tempProfileData = $cookies.get('profile.user');
	if (tempProfileData != undefined && tempProfileData != null) {
		console.log('Profile loaded from cookies', tempProfileData);
		
		tempProfileData = angular.fromJson(tempProfileData);
		app.profile.user = tempProfileData;
	}

	$rootScope.profile = app.profile;

	var standalone = window.navigator.standalone,
    userAgent = window.navigator.userAgent.toLowerCase(),
    safari = /safari/.test(userAgent),
    ios = /iphone|ipod|ipad/.test(userAgent);

	if (ios) {
		if (!standalone && safari) {
			//browser
		} else if (standalone && !safari) {
			//standalone
		} else if (!standalone && !safari) {
			//uiwebview (Facebook in-app browser)
			alert('גולש יקר, זהינו שהתחברת דרך הדפדפן הפנימי של פייסבוק בiOS. זמנית זה לא ניתמך, אנא פתח את האתר בדפדפן רגיל של הנייד. עמך הסליחה.');
		};
	} else {
		//not iOS
	};
});

/* --------------------- */

app.controller('LayoutCtrl', function ($scope, $rootScope, $location, page, utils) {
	console.log('LayoutCtrl');

	$scope.utils = utils;
	$scope.page = page;

	app.profile.refresh();
});

app.controller('MainPageCtrl', function($scope) {
	$scope.myFbId = 123456;
    $scope.challnges = [{"ChallengedFullname":"Elad Avivi","Title":"Can you dance for an hour","Description":"Dancing for an whole hour in the streets of TLV","Prize":"50","Image":"https://33.media.tumblr.com/avatar_e2fbfbcbb52d_128.png","Fbid":123456,"Challengers":[{"Fullname":"Tom Kashti","Image":"https://33.media.tumblr.com/avatar_e2fbfbcbb52d_128.png"},{"Name":"Ram Mukmel","Image":"https://33.media.tumblr.com/avatar_e2fbfbcbb52d_128.png"},{"Name":"Moti Krisi","Image":"https://33.media.tumblr.com/avatar_e2fbfbcbb52d_128.png"}]},{"ChallengedFullname":"Yaniv Cohen","Title":"Stop Smoking for one month","Description":"You quit smoking starting TODAY","Prize":"300","Image":"http://www.frontieranimalsociety.com/images/Article_Images/11ec71f4b5adce762099c3c0e7d5489b.png","Fbid":654321,"Challengers":[{"Fullname":"Tom Kashti","Image":"https://33.media.tumblr.com/avatar_e2fbfbcbb52d_128.png"},{"Name":"Ram Mukmel","Image":"https://33.media.tumblr.com/avatar_e2fbfbcbb52d_128.png"}]}];
});

app.controller('ConfirmChallengeCtrl', function($scope) {

});

app.controller('CheckoutCtrl', function($scope) {
});

app.controller('loginCtrl', function ($scope, $mdDialog, $http, $route, $location, utils) {
	$scope.myForm = {};
	$scope.isSignup = false;

	$scope.hide = function () {
		$mdDialog.hide();
	};
	$scope.cancel = function () {
		console.log('cancel!');
		$mdDialog.cancel();
	};
	
	$scope.submit = function() {
		console.log('submit!');

		if ($scope.isSignup) {
			console.log('signup');

			if ($scope.myForm.password == undefined || $scope.myForm.password.trim() == '' || $scope.myForm.password != $scope.myForm.password2) {
				utils.toastError('Passwords does not match!');
				return false;
			}
		}

		var action = $scope.isSignup ? 'signup' : 'signin';

		$http.post(utils.getWebApiUrl() + "/countdown/" + action, { email: $scope.myForm.email, password: $scope.myForm.password })
				.success(function (data, status, headers, config) {
					data = JSON.parse(data);
					console.log('signup: Success', data);

					app.profile.user.email = data.email;
					app.profile.user.userId = data._id;
					app.profile.user.lastLogin = data.lastLogin;
					app.profile.user.isConnected = true;

					app.profile.saveToCookie();
					app.profile.refresh();

					utils.toastSuccess('Signed up successfully');
					$route.reload();
					$mdDialog.hide();
			})
				.error(function(data) {
					utils.toastError('Failed to signup: ' + data);
				}
		);

	}

});

/* --------------------- */


/* --------------------- */


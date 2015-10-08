var appServices = angular.module('myAppServices', ['ngResource']);
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

app.controller('MainPageCtrl', function ($scope, $http, webapi, $location, $interval, utils) {
	if (!app.profile.user.isConnected) return;

	app.countdownTimer = {
		statuses: { counting: 0, paused: 1, done: 2 },
		instance: function () {
			var that = {
				t: this,
				myInterval: null,
				isEnabled: true,
				secondsLeft: 0,
				timeLeft: '00:00:00',
				getTimeFormated: function () { return that.timeLeft.format('hh:mm:ss') },
				endTime: null,
				status: app.countdownTimer.statuses.done,
				duration: 60 * 60 * 1.5,

				updateEndTime: function () {
					that.endTime = moment().add(that.secondsLeft, 'seconds');
				},
				update: function() {
					that.timeLeft = moment(that.endTime).subtract(new Date());
					that.secondsLeft = moment.duration(that.timeLeft).asSeconds();
				},
				intervalTick: function () {
					//console.log('intervalTick');
					if (!that.isEnabled) return;
					if (that.secondsLeft == 0) {
						that.stop();
						return;
					}

					that.update();
				},
				setNewTime: function (newSecondsLeft) {
					console.log('setNewTime');
					that.secondsLeft = newSecondsLeft;
					that.updateEndTime();
					that.update();
				},
				resume: function (endTime, secondsLeft, status) {
					that.status = status;
					switch(status) {
						case app.countdownTimer.statuses.counting:
							that.timeLeft = moment(endTime).subtract(new Date());
							that.secondsLeft = moment.duration(that.timeLeft).asSeconds();
							$scope.timer.start();
							break;
						case app.countdownTimer.statuses.done:
							that.reset();
							break;
						case app.countdownTimer.statuses.paused:
							that.setNewTime(secondsLeft);
							break;
					}
				},
				stop: function () {
					console.log('timerStop');
					that.status = app.countdownTimer.statuses.paused;
					$interval.cancel(that.myInterval);
				},
				start: function () {
					that.updateEndTime();

					that.myInterval = $interval(that.intervalTick, 1000);
					that.status = app.countdownTimer.statuses.counting;
				},
				reset: function () {
					that.setNewTime(that.duration);
				},
			};
			return that;
		}
	}

	$scope.timer = new app.countdownTimer.instance();

	var userDataManager = function(userEmail) {
		var that = {
			data: {
				userEmail: userEmail,
			},
			save: function () {
				return $http.post(webapi.getWebApiUrl() + "/countdown/userdata/" + that.data.userEmail, that.data)
					.success(function (data, status, headers, config) {
						data = JSON.parse(data);
						console.log('save user data: Success', data);

						if (data != undefined && !jQuery.isEmptyObject(data)) {
							that.data = data;
						}
					});
			},
			load: function () {
				return $http.get(webapi.getWebApiUrl() + "/countdown/userdata/" + that.data.userEmail)
					.success(function (data, status, headers, config) {
						data = JSON.parse(data);
						console.log('load user data: Success', data);

						if (data != undefined && !jQuery.isEmptyObject(data)) {
							that.data = data;
						}
					});
			},
		};

		return that;
	};

	$scope.userDataManager = new userDataManager(app.profile.user.email);

	var tasksList = function (listName, userDataManager, timer) {
		var createNewListIfNotExist = function () {
			if (userDataManager.data.lists == undefined) userDataManager.data.lists = {};
			if (userDataManager.data.lists[listName] == undefined) {
				userDataManager.data.lists[listName] = {
					tasks: [],
					timerEndTime: 0,
					timerSecondsLeft: 0,
					timerStatus: 0,
				};
			}
		};
		createNewListIfNotExist();

		var that = {
			listName: listName,
			timer: timer,
			userDataManager: userDataManager,
			getCurrentList: function () { return userDataManager.data.lists[that.listName]; },
			item: function(_title) {
				return {
					title: _title,
					isDone: false,
					createDate: new Date(),
				};
			},
			add: function (title) {
				that.getCurrentList().tasks.push(new that.item(title));
			},
			save: function () {
				if (timer != null) {
					that.getCurrentList().timerEndTime = that.timer.endTime;
					that.getCurrentList().timerSecondsLeft = that.timer.secondsLeft;
					that.getCurrentList().timerStatus = that.timer.status;
				}

				that.userDataManager.save().then(function () {
					//utils.displayToast('success', 'data saved successfully');
				});
			},
			load: function () {
				that.userDataManager.load().then(function (res) {
					var data = JSON.parse(res.data);
					console.log('loadList: Success', data);

					createNewListIfNotExist();

					if (data != undefined && !jQuery.isEmptyObject(data)) {
						if (data.lists[that.listName] != null) {
							that.getCurrentList().tasks = data.lists[that.listName].tasks;

							if (timer != null) {
								timer.resume(
									data.lists[that.listName].timerEndTime,
									data.lists[that.listName].timerSecondsLeft,
									data.lists[that.listName].timerStatus);
							}
						}
					}

					utils.displayToast('success', 'data loaded successfully');
				});
			},
			autosaveInterval: null,
			startAutosave: function() {
				that.autosaveInterval = $interval(this.save, 1000 * 10);
			},
			stopAutosave : function() {
				$interval.cancel(that.autosaveInterval);
			},
			deleteTask: function (index) {
				console.log('deleteTask', index);
				that.getCurrentList().tasks.splice(index, 1);
			},
			moveToList: function(listName, index) {
				userDataManager.data.lists[listName].tasks.push(that.getCurrentList().tasks.splice(index, 1)[0]);
			},
		};
		
		return that;
	}

	$scope.currrentTasksList = new tasksList('current',$scope.userDataManager, $scope.timer);
	$scope.currrentTasksList.load();
	$scope.currrentTasksList.startAutosave();

	$scope.currrentTasksList_newTaskCandidate = '';
	$scope.currrentTasksList_newTaskSubmit = function () {
		console.log('newTaskSubmit');
		$scope.currrentTasksList.add($scope.currrentTasksList_newTaskCandidate);
		$scope.currrentTasksList_newTaskCandidate = '';
	}

	$scope.futureTasksList = new tasksList('future', $scope.userDataManager);
	$scope.futureTasksList.load();

	$scope.futureTasksList_newTaskCandidate = '';
	$scope.futureTasksList_newTaskSubmit = function () {
		console.log('futureTasksList newTaskSubmit');
		$scope.futureTasksList.add($scope.futureTasksList_newTaskCandidate);
		$scope.futureTasksList_newTaskCandidate = '';
	}

	$scope.$on("$destroy", function (event) {
		console.log('$destroy');
		$scope.timer.stop();
		$scope.currrentTasksList.stopAutosave();
	});
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


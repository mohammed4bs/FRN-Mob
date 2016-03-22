angular.module('imageID.controllers', [])
.controller('AppCtrl', function($scope, $ionicModal, $timeout, AuthService, $state, $ionicLoading, Restangular, PushNotificationsService) {

  // With the new view caching in Ionic, Controllers are only called
  // when they are recreated or on app start, instead of every page change.
  // To listen for when this page is active (for example, to refresh data),
  // listen for the $ionicView.enter event:
  //$scope.$on('$ionicView.enter', function(e) {
  //});

  // Form data for the login modal
  $scope.loginData = {};
  $scope.loggedIn = false;

  // Create the login modal that we will use later
  $ionicModal.fromTemplateUrl('templates/login.html', {
    scope: $scope
  }).then(function(modal) {
    $scope.modal = modal;
  });

  // Triggered in the login modal to close it
  $scope.closeLogin = function() {
    $scope.modal.hide();
  };

  // Open the login modal
  $scope.login = function() {
    $scope.modal.show();
  };
  
  $scope.logout = function() {
    AuthService.logOut();
    $scope.loginData = {};
    $scope.loggedIn = false;
    location.hash = "#/app/home";
    localStorage.removeItem("user");
  };
  
  $scope.forgetPassword = function() {
    $scope.loginData.error = "";
    if($scope.loginData.userName == null || $scope.loginData.userName.length < 1){
      $scope.loginData.error = "Please fill username";
      return;
    }
    $ionicLoading.show({
      template: 'Recovering password...'
    });

    AuthService.doForgotPassword($scope.loginData.userName).then(function(data){
      if(data.status == "error"){
        $scope.loginData.error = data.error;
      }else{
        $scope.loginData.error ="Link for password reset has been emailed to you. Please check your email.";
      }
      $ionicLoading.hide();
    });
  }

  // Perform the login action when the user submits the login form
  $scope.doLogin = function() {
    $ionicLoading.show({
      template: 'Loging in...'
    });
    AuthService.doLogin($scope.loginData)
    .then(function(user){
      //success
      // if($state.current.name != 'app.home'){
      //   $state.go('app.home');
      // }
      $scope.closeLogin();
      $ionicLoading.hide();
      $scope.loggedIn = true;
      
      localStorage.setItem("user", JSON.stringify({
        "userName" : $scope.loginData.userName,
        "password" : $scope.loginData.password
      }));
      
      var userID = AuthService.getUser().data.id;
      Restangular.all("user/" + userID + "/actions").getList().then(function(actions) {
        $scope.$root.favorties = [];
        $scope.rates = [];
        $scope.reserved = [];
        
        for(var i = 0; i < actions.length; i++){
          var row = actions[i];
          if(row.is_like == 1 && $scope.$root.favorties.indexOf(row.post_id) < 0){
            $scope.$root.favorties.push(row.post_id);
          }
          if(row.rating != null){
            $scope.rates.push({
              "post_id" : row.post_id,
              "rating" : row.rating
            });
          }
          if(row.reseve != null){
            $scope.reserved.push(row.post_id);
          }
        }
        
        $scope.$broadcast("profileUpdated", "");
        //console.log("broadcast sent");
        localStorage.setItem("favorties", JSON.stringify({
            "favorties" : $scope.$root.favorties
        }));
      }).catch(function(err) {
        $scope.$root.favorties = [];
      });
      
      $scope.loginData = {};
      
      PushNotificationsService.register(userID);
    },function(err){
      $scope.loginData.error = err;
      $scope.loggedIn = true;
      $ionicLoading.hide();
    });
  };
  
  
  if(localStorage.getItem("user") != null){
    $scope.loginData = JSON.parse(localStorage.getItem("user"));
    $scope.doLogin();
  }
});
angular.module('gitDepends.repos', [])

  .controller('ReposController', ['$scope', '$filter', 'Repos', 'SortLabel', function($scope, $filter, Repos, SortLabel) {

    $scope.data = [];
    $scope.search = '';
    $scope.predicate = 'name';
    $scope.toggleLabel = SortLabel.toggle;
    $scope.showLabel = SortLabel.showLabel;
    $scope.getRepos = function() {
      // Use Dependencies factory to get array of Dependeny objects from database
      // set $scope.dependencies to the array
      // in html file, use ng-repeat to iterate over array, display dependency name and length of repo array

     Repos.getRepos().then(function(data) {
      console.log('DATA',data);
        $scope.repos = data;
        for(var i = 0;i<$scope.repos.length;i++){
          $scope.repos[i].numberOfDeps = $scope.repos[i].dependencies.length+$scope.repos[i].devDependencies.length;
        }
      }).catch(function(error) {
        console.error(error);
      })
    };
    $scope.getRepos();
  }])
  .factory('Repos', function($http) {
    var getRepos = function() {
      console.log("Get Request Made!!!");
      return $http({
        method: 'GET',
        url: '/repos'
      }).then(function(res) {
        console.log("RES",res);
        return res.data;
      });
    };
    return {
      getRepos: getRepos
    };
  })
  .factory('SortLabel',function(){
    var labels = {"name":"A-Z","usage":"MostUsed-LeastUsed"};
    return {
      showLabel: function(labelKey){
        return labels[labelKey];
      },
      toggle: function(labelKey){
        var options = labels[labelKey].split("-");
        labels[labelKey] = options[1]+"-"+options[0];
      }
    }
  });
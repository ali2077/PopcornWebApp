(function() {
    'use strict';

    /**
     * @ngdoc function
     * @name app.controller:trendingCtrl
     * @description
     * # trendingCtrl
     * Controller of the app
     */

    angular
        .module('trending')
        .controller('TrendingCtrl', Trending);

    Trending.$inject = ['TrendingService', '$rootScope', 'MobileServiceClient', 'localStorageService'];

    /*
     * recommend
     * Using function declarations
     * and bindable members up top.
     */

    function Trending(TrendingService, $rootScope, MobileServiceClient, localStorageService) {
        /*jshint validthis: true */
        var vm = this;
        vm.page = 0;
        vm.movies = [];
        var azureClient = MobileServiceClient.getMobileService();
        var moviesInBdd;
        azureClient.invokeApi('Movie/GetMovies', { method: 'GET' }).then(function(data) {
            moviesInBdd = data.result;
        });

        var loadMovies = function(pageNumber) {
            TrendingService.getMovies(pageNumber).$promise.then(function(res) {
                if (vm.page === res.data.page_number)
                    return;
                vm.page = res.data.page_number;
                for (var i = 0; i < res.data.movies.length; i++) {
                    var movie = res.data.movies[i];
                    var match = _.findWhere(moviesInBdd, { TmdbId: movie.imdb_code });
                    if (match !== undefined) {
                        movie.like = match.Liked;
                    }
                    vm.movies.push(movie);
                }
                $rootScope.$broadcast('loaded');
            }).catch(function(err) {
                $rootScope.$broadcast('loaded');
            });
        };

        vm.paginate = function() {
            $rootScope.$broadcast('loading');
            loadMovies(vm.page + 1);
        };

        vm.toggleLike = function(movie) {
            if (movie.like === undefined) {
                movie.like = true;

            } else {
                movie.like = !movie.like;
            }

            var movieToPost = {
                UserProfileId: localStorageService.get('profileId'),
                TmdbId: movie.imdb_code,
                Liked: movie.like,
                Watched: false
            }
            azureClient.invokeApi('Movie/ToggleLike', { body: movieToPost });
        };
    }
})();

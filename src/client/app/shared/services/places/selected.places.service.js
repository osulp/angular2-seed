var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var core_1 = require('@angular/core');
var Subject_1 = require('rxjs/Subject');
var Rx_1 = require('rxjs/Rx');
var initialState = [];
var SelectedPlacesService = (function () {
    function SelectedPlacesService() {
        var _this = this;
        this.selectionChanged$ = new Rx_1.ReplaySubject(1);
        this.updates = new Subject_1.Subject();
        this.addPlace = new Subject_1.Subject();
        this.removePlace = new Subject_1.Subject();
        this._setAllByPlaceType = new Subject_1.Subject();
        this.getAll = new Subject_1.Subject();
        this.updates
            .scan(function (accumulator, operation) {
            return operation(accumulator);
        }, initialState)
            .subscribe(function (data) {
            _this.selectionChanged$.next(data);
        });
        this.addPlace
            .map(function (place) {
            return function (state) { return state.concat(place); };
        })
            .subscribe(this.updates);
        this.removePlace
            .map(function (place) {
            return function (state) {
                return state.filter(function (places) {
                    return places.Name.replace(' County', '') !== place.replace(' County', '');
                });
            };
        })
            .subscribe(this.updates);
        this.getAll
            .map(function () {
            return function (state) {
                return state.map(function (eachPlace) {
                    return eachPlace;
                });
            };
        })
            .subscribe(this.updates);
        this._setAllByPlaceType
            .map(function (args) {
            return function (state) {
                console.log(args);
                console.log('places from inside setAllPlaceMap');
                return state
                    .filter(function (places) {
                    return _this.translatePlaceTypes(places.TypeCategory) !== args[1];
                })
                    .concat(args[0]);
            };
        })
            .subscribe(this.updates);
    }
    SelectedPlacesService.prototype.load = function () {
    };
    SelectedPlacesService.prototype.add = function (place, source) {
        console.log('adding place to selectedPlaces');
        if (source) {
            place.Source = source;
        }
        this.addPlace.next(place);
    };
    SelectedPlacesService.prototype.remove = function (place) {
        console.log('removing place from selectedPlaces');
        console.log(place);
        this.removePlace.next(place.Name);
    };
    SelectedPlacesService.prototype.setAllbyPlaceType = function (places, placeType) {
        var translatedPlaceType = this.translatePlaceTypes(placeType);
        this._setAllByPlaceType.next([places, translatedPlaceType]);
    };
    SelectedPlacesService.prototype.translatePlaceTypes = function (placeType) {
        switch (placeType) {
            case 'County':
            case 'Counties':
                return 'Counties';
            case 'Census Designated Place':
            case 'Incorporated City':
            case 'Incorporated Town':
            case 'City':
            case 'Cities':
            case 'Places':
                return 'Places';
            case 'Census Tract':
            case 'Census Tracts':
            case 'Unicorporated Place':
                return 'Tracts';
            default:
                return placeType;
        }
    };
    SelectedPlacesService = __decorate([
        core_1.Injectable(), 
        __metadata('design:paramtypes', [])
    ], SelectedPlacesService);
    return SelectedPlacesService;
})();
exports.SelectedPlacesService = SelectedPlacesService;
//# sourceMappingURL=selected.places.service.js.map
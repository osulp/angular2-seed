import {Injectable} from '@angular/core';
//import {SearchResult} from '../../data_models/search-result';
import {Subject}    from 'rxjs/Subject';
import {ReplaySubject}    from 'rxjs/Rx';
//import 'rxjs/add/operator/share';
//import 'rxjs/add/operator/startWith';

let initialState: any[] = [];

@Injectable()
export class GeoJSONStoreService {
    selectionChanged$: ReplaySubject<any[]> = new ReplaySubject<any[]>(1);
    updates: Subject<any> = new Subject<any>();
    addLayer: Subject<any> = new Subject<any>();
    //removeData: Subject<any> = new Subject<any>();
    getAll: Subject<any> = new Subject<any>();
    //selectedPlaces = new Array<SearchResult>();

    constructor() {
        this.updates
            .scan((accumulator: Object[], operation: Function) => {
                return operation(accumulator);
            }, initialState)
            .subscribe(this.selectionChanged$);
        this.addLayer
            .map((layer: any) => {
                return (state: any) => {
                    //check for dupes
                    let hasLayer = state.filter((_layer: any) => _layer.layerId === layer.layerId);
                    if (hasLayer.length > 0) {
                        return state;
                    } else {
                        return state.concat(layer);
                    }
                };
            })
            .subscribe(this.updates);

        //this.removeData
        //    .map((place) => {
        //        return (state: any) => {
        //            return state.filter((places: any) => {
        //                return places.Name !== place;
        //            });
        //        };
        //    })
        //    .subscribe(this.updates);

        this.getAll
            .map(() => {
                return (state: any) => {
                    return state.map((eachPlace: any) => {
                        return eachPlace;
                    });
                };
            })
            .subscribe(this.updates);
    }

    load() {
        //intializes subscription?
    }


    add(layer: any): void {
        console.log('adding layer to geojsonstore', layer);
                //this.selectedPlaces.push(place);
        this.addLayer.next(layer);
    }

    //remove(layer: any): void {
    //    console.log('removing place from selectedPlaces');
    //    this.removePlace.next(layer.Name);
    //}
}




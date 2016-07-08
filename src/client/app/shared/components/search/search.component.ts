import {Component, Output, Input, EventEmitter} from '@angular/core';
import {Control, CORE_DIRECTIVES, NgClass} from '@angular/common';
import {JSONP_PROVIDERS}  from '@angular/http';
import {Router} from '@angular/router';
import {SearchTopicsPlacesService, SelectedPlacesService} from '../../../shared/services/index';
import {Observable} from 'rxjs/Observable';
import {SearchResult} from '../../../shared/data_models/index';
import {HelperFunctions} from '../../../shared/utilities/index';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/distinctUntilChanged';
import 'rxjs/add/operator/switchMap';
import 'rxjs/add/operator/share';

@Component({
    moduleId: module.id,
    selector: 'search',
    templateUrl: 'search.component.html',
    styleUrls: ['search.component.css'],
    providers: [JSONP_PROVIDERS, SearchTopicsPlacesService, HelperFunctions],
    directives: [CORE_DIRECTIVES, NgClass]
})

export class SearchComponent {
    @Input() viewType: any;
    @Input() filterType: any;
    @Output() selSearchResultEvt = new EventEmitter();
    term = new Control();
    filter: string = '%';
    searchTerms: string;
    selectedSearchResult: SearchResult;
    tempResults: any[];
    items: Observable<any[]>;

    constructor(
        private _searchService: SearchTopicsPlacesService,
        public _helperFuncs: HelperFunctions,
        private _router: Router,
        private _selectedPlacesService: SelectedPlacesService) {
        //console.log('searching for shit', this.filterType);
        this.filter = this.filterType !== undefined ? this.filterType : this.filter;
        //var searchScope = this;
        this.items = this.term.valueChanges
            .debounceTime(200)
            .distinctUntilChanged()
            .switchMap((term: any) => this._searchService.search(term !== undefined ? term.toString() : ''))
            .share();
        this.items.subscribe(value => this.tempResults = value);
    }
    eventHandler(event: any, searchItem: SearchResult) {
        this.selectResult(searchItem);
    }

    selectResult(searchItem: SearchResult) {
        //console.log('madeleine', searchItem);
        if (searchItem.Type === 'Place') {
            this._selectedPlacesService.add(searchItem, 'map');
        }
        this.selSearchResultEvt.emit(searchItem);
    }

    inputSearchClickHandler(event: any) {
        this.term.updateValue('', { emitEvent: true, emitModelToViewChange: true });
        this.searchTerms = '';
    }
    inputKeypressHandler(event: any) {
        if (event.keyCode === 13) {
            //get tempResult values
            if (this.tempResults.length > 0) {
                var firstItem: any = this.tempResults[0];
                var selected: SearchResult = {
                    Name: firstItem['Name'].replace(/\,/g, '%2C'),
                    ResID: firstItem['ResID'],
                    Type: firstItem['Type'],
                    TypeCategory: firstItem['TypeCategory'],
                    Desc: firstItem['Desc']
                };
                this.selectedSearchResult = selected;
                this.selectResult(selected);
            } else {
                alert('Please select a valid search term.');
            }
        }
    }
    blurHandler(event: any) {
        var searchScope = this;
        setTimeout(function () {
            //if tabbing on list result set input box to match the Name property, but don't clear.           
            if (document.activeElement.classList.toString() === 'list-group-item') {
                var attr: any = 'data-search-item';
                var listItem: any = JSON.parse(document.activeElement.attributes[attr].value);
                var selected: SearchResult = {
                    Name: listItem.Name.replace(/\,/g, '%2C'),
                    ResID: listItem.ResID,
                    Type: listItem.Type,
                    TypeCategory: listItem.TypeCategory,
                    Desc: listItem.Desc
                };
                searchScope.selectedSearchResult = selected;
                //if the Explore button then select the top result and go else put focus on the input
            } else if (document.activeElement.id === 'explore-btn') {
                //get tempResult values
                if (searchScope.tempResults.length > 0) {
                    var firstItem: any = searchScope.tempResults[0];
                    var selected: SearchResult = {
                        Name: firstItem['Name'].replace(/\,/g, '%2C'),
                        ResID: firstItem['ResID'],
                        Type: firstItem['Type'],
                        TypeCategory: firstItem['TypeCategory'],
                        Desc: firstItem['Desc']
                    };
                    searchScope.selectedSearchResult = selected;
                    searchScope.selectResult(selected);
                    alert(firstItem['Name']);
                } else {
                    alert('Please select a valid search term.');
                }
            } else {
                searchScope.term.updateValue('', { emitEvent: true, emitModelToViewChange: true });
                searchScope.searchTerms = '';
            }
        }, 1);
        //event.preventDefault();
    }
    //ngOnInit() {
    //    console.log('searching for shit', this.filterType);
    //    this.filter = this.filterType !== undefined ? this.filterType : this.filter;
    //    this.items = this.term.valueChanges
    //        .debounceTime(200)
    //        .distinctUntilChanged()
    //        .switchMap((term: any) => this._searchService.search(term !== undefined ? term.toString() : ''), (this.filter !== undefined ? this.filter : null))
    //        .share();
    //    this.items.subscribe(value => this.tempResults = value);
    //}
}

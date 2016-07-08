import {Component, OnInit, Input, Output, EventEmitter}   from '@angular/core';
import {JSONP_PROVIDERS}  from '@angular/http';
import {IndicatorsTopicListComponent}  from '../../shared/components/index';
import {Topic, Indicator} from '../../shared/data_models/index';
import {TopicsService, IndicatorsService} from '../../shared/services/index';
//import {Subscription}   from 'rxjs/Subscription';
import {SelectedTopicsPipe, IndicatorTopicFilterPipe,SelectedIndicatorByTopicsCountPipe} from './pipes/index';
//import {SelectedIndicatorsService} from '../../shared/services/indicators/selected-indicators.service';

import 'rxjs/add/operator/map';
import 'rxjs/add/operator/share';

@Component({
    moduleId: module.id,
    selector: 'topics',
    templateUrl: 'topics.select.component.html',
    styleUrls: ['topics.select.component.css'],
    directives: [IndicatorsTopicListComponent],
    pipes: [IndicatorTopicFilterPipe, SelectedTopicsPipe, SelectedIndicatorByTopicsCountPipe],
    providers: [JSONP_PROVIDERS, TopicsService, IndicatorsService]
})



export class TopicsComponent implements OnInit {
    @Output() selectedTopicsFromComp = new EventEmitter();
    @Output() selectedIndicatorsFromComp = new EventEmitter();
    @Output() allTopicsFromComp = new EventEmitter();
    @Output() allIndicatorsFromComp = new EventEmitter();
    @Input() inputTopics: string;
    @Input() inputIndicators: string;

    //selectedIndicators = new EventEmitter();    
    public Indicators: any;
    public Topics: any;
    public _selectedIndicators: any;
    public _selectedTopics: any;
    public _inputTopics: any;
    public _inputIndicators: any;

    visible: boolean;
    chkBoxVisibile: boolean;
    showAllSelected: boolean;
    selected: string[];
    initialLoad: boolean = true;
    //private subscription: Subscription;

    constructor(
        public _topicService: TopicsService,
        public _indicatorService: IndicatorsService
        //private _selectedIndicatorsService: SelectedIndicatorsService
    ) {
        this.visible = true;
        this.showAllSelected = false;
        this.chkBoxVisibile = false;
    }

    getClass() {
        return this.visible ? 'glyphicon glyphicon-menu-up' : 'glyphicon glyphicon-menu-down';
    }

    toggleTopicsWrapper() {
        this.visible = !this.visible;
    }

    toggleAllTopics(evt?: any) {
        this.showAllSelected = this.showAllSelected ? this.showAllSelected : !this.showAllSelected;
        if (this.showAllSelected) {
            //turn off any other selected topics and set selected to all
            console.log('show all selected');
            this.Topics.forEach((topic: Topic) => {
                if (topic.selected) {
                    this.toggleTopic(topic);
                }
            });
            this._selectedTopics = [];
            this.selectedTopicsFromComp.emit(this._selectedTopics);
            for (var i = 0; i < this.Indicators.length; i++) {
                this.toggleIndicator(this.Indicators[i], true);
                //this._selectedIndicatorsService.toggle(this.Indicators[i], true);
            }
            this.allTopicsFromComp.emit(this.Topics);
            this.allIndicatorsFromComp.emit(this.Indicators);
        }
    }

    getTopics() {
        this._topicService.getCRTTopics().subscribe(
            (data: any) => {
                this.Topics = data;
                this.allTopicsFromComp.emit(this.Topics);
                //console.log('input topics = ', this._inputTopics);                
                //console.log('all topics', this.Topics);
                this.getIndicators();
            },
            (err: any) => console.error(err),
            () => console.log('done loading topics'));
    }

    toggleTopic(topic: Topic) {
        //turn off all topics, if selected
        console.log('topic toggled', topic);
        this.showAllSelected = false;
        topic.toggleSelected();
        const idx = this.Topics.indexOf(topic);
        this.Topics = [
            ...this.Topics.slice(0, idx),
            topic,
            ...this.Topics.slice(idx + 1)
        ];
        if (!this.initialLoad) {
            this._selectedTopics = [];
            for (var x = 0; x < this.Topics.length; x++) {
                if (this.Topics[x].selected) {
                    this._selectedTopics.push(this.Topics[x].topic);
                }
            }
            if (this._selectedTopics.length === 0) {
                this.showAllSelected = true;
            }
            this.selectedTopicsFromComp.emit(this._selectedTopics);
        }
        //sync indicator selections
        for (var i = 0; i < this.Indicators.length; i++) {
            let assocTopics = this.Indicators[i].topics.split(', ');
            //console.log(assocTopics);
            for (let t of this._selectedTopics) {
                //console.log('checking t:', t);
                if (assocTopics.indexOf(t) !== -1) {
                    this.toggleIndicator(this.Indicators[i], true);
                }
            }
            //if (this._selectedTopics.indexOf(this.Indicators[i].topics) !== -1) {
            //    this.toggleIndicator(this.Indicators[i], true);
            //    //this._selectedIndicatorsService.toggle(this.Indicators[i], true);
            //}
        }
        this.allTopicsFromComp.emit(this.Topics);
        this.allIndicatorsFromComp.emit(this.Indicators);
    }

    onFilterIndicator(Indicators: Indicator[]) {
        this.Indicators = Indicators;
        this.allIndicatorsFromComp.emit(this.Indicators);
    }

    toggleIndicator(indicator: Indicator, value?: boolean) {
        if (value) {
            indicator.selected = value;
        } else {
            indicator.toggleSelected();
        }
        const i = this.Indicators.indexOf(indicator);
        this.Indicators = [
            ...this.Indicators.slice(0, i),
            indicator,
            ...this.Indicators.slice(i + 1)
        ];
        this._selectedIndicators = [];
        for (var x = 0; x < this.Indicators.length; x++) {
            if (this.Indicators[x].selected) {
                this._selectedIndicators.push(this.Indicators[x]);
            }
        }
        this.allIndicatorsFromComp.emit(this.Indicators);
    }

    getIndicators() {
        this._indicatorService.getIndicators().subscribe(
            (data: any) => {
                this.Indicators = data;
                console.log('got indicators', this.Indicators);
                console.log('selected topics?', this._selectedTopics);
                if (this.Indicators.length > 0) {
                    for (var x = 0; x < this.Indicators.length; x++) {
                        if (this._inputIndicators[0] !== '') {
                            //turn on individual indicator from input url/selection                              
                            if (this._inputIndicators.indexOf(this.Indicators[x].indicator) !== -1) {
                                this.toggleIndicator(this.Indicators[x]);
                            }
                        }
                    }
                    console.log(this.Topics);
                    if (this._selectedTopics.length > 0) {
                        console.log('jack has sause', this._selectedTopics, this._inputTopics);
                        this.showAllSelected = this._selectedTopics[0] !== 'undefined' ? false : true;
                        for (var x = 0; x < this.Topics.length; x++) {
                            if (this._selectedTopics.indexOf(this.Topics[x].topic) !== -1) {
                                this.toggleTopic(this.Topics[x]);
                            }
                        }
                        if (this.showAllSelected) {
                            for (var i = 0; i < this.Indicators.length; i++) {
                                this.toggleIndicator(this.Indicators[i], true);
                            }
                        }
                    }
                }
                this.initialLoad = false;
            },
            (err: any) => console.error(err),
            () => console.log('done loading indicators'));
    }

    ngOnInit() {
        //console.log('Input Topics: ' + this.inputTopics);
        this._inputTopics = this.inputTopics.replace(/\%20/g, ' ').replace(/\%26/g, '&').split(',');

        this._selectedTopics = this._inputTopics.length === 1 && (this._inputTopics[0] === '' || this.inputTopics[0] === 'All Topics') ? ['All Topics'] : this._inputTopics;
        console.log('input topics after replaces', this._inputTopics);
        console.log('seletected topics after assessment', this._selectedTopics);
        //console.log('Input Indicators: ' + this.inputIndicators);
        this._inputIndicators = this.inputIndicators.replace(/\%20/g, ' ').replace(/\%26/g, '&').split(';');
        this._selectedIndicators = this._inputIndicators;
        //console.log('Selected Indicators: ' + this._selectedIndicators);

        this.getTopics();
    }
}





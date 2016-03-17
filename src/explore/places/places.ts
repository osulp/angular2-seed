import {Component, OnInit, ElementRef} from 'angular2/core';

@Component({
    selector: 'places',
    templateUrl: './explore/places/places.html',
    styleUrls: ['./explore/places/places.css']
})

export class PlacesCmp implements OnInit {

    visible: boolean;

    constructor(private elementRef: ElementRef) {
        this.visible = true;
    }

    getClass() {
        return this.visible ? 'glyphicon glyphicon-menu-up' : 'glyphicon glyphicon-menu-down';
    }

    toggle() {
        this.visible = !this.visible;
    }

    ngOnInit() {
        console.log('loaded explore places component');
        //if (window['map']) {
            //var map = window['map'];
            //map.setVisibility(true);
            //map.resize(true);
            //map.reposition();
            //var h = window.innerHeight || document.documentElement.clientHeight || document.getElementsByTagName('body')[0].clientHeight;
            //var w = window.innerWidth || document.documentElement.clientWidth || document.getElementsByTagName('body')[0].clientWidth;

            //var mapH = h - 146; //substract height of the header and footer
            //var mapW = w;

            //jQuery('#map').css({ 'width': mapW + 'px', 'height': mapH + 'px' });
            //jQuery('#mapcontent').css({'width': mapW + 'px', 'height': mapH + 'px' });

            //map.setVisibility(true);
            //map.resize(true);
            //map.reposition();

        //}
    }
}

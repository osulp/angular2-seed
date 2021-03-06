import { APP_BASE_HREF } from '@angular/common';
import { enableProdMode, provide, ExceptionHandler, Injectable, Injector} from '@angular/core';
import { bootstrap } from '@angular/platform-browser-dynamic';
import { ROUTER_PROVIDERS } from '@angular/router';
//import { ROUTER_PROVIDERS } from '@angular/router-deprecated';
import {HTTP_PROVIDERS, JSONP_PROVIDERS} from '@angular/http';
//import {PlaceInfoService} from './shared/services/places/index';
//import { AppExceptionHandler} from './shared/error-handle/app.exception.handler';
//import {DND_PROVIDERS} from 'ng2-dnd/ng2-dnd';


import { AppComponent } from './app.component';

declare var toastr: any;

if ('<%= ENV %>' === 'prod') { enableProdMode(); }

export class ArrayLogger {
    res: any = [];
    log(s: any): void { this.res.push(s); }
    logError(s: any): void { this.res.push(s); }
    logGroup(s: any): void { this.res.push(s); }
    logGroupEnd() { ; };
}

@Injectable()
export class AppExceptionHandler extends ExceptionHandler {
    //private router: Router;
    //private toaster: ToastsManager;

    constructor(private injector: Injector) {
        super(new ArrayLogger(), true);
    }

    call(exception: any, stackTrace?: any, reason?: string): void {
        console.log(exception, stackTrace, reason);
        //window.setTimeout(location.reload(),100);
        ////check errorcount cookie
        //var errorcount = this.getCookie('errorcount');
        //let newerrorcount = errorcount === '' ? 1 : parseInt(errorcount) + 1;
        //if (newerrorcount < 5) {
        //    console.log('error handler', newerrorcount);
        //    this.setCookie('errorcount', (parseInt(errorcount) + 1).toString());
        //    window.setTimeout(location.reload(), 100);
        //} else {
        //    this.getDependencies();
        //    console.log('error handler', exception);
        //    if (window.location.href.match('communitiesreporter')) {
        //        window.location.href = window.location.href.replace('communitiesreporter', 'CommunitiesReporter');
        //    } else {
        //        // Display an info toast with no title
        //        //toastr['warning']('Error!<br /><br />', 'Sorry, there was a problem.  We are working through the glitches in this new tool, so you may need to refresh page.  If the problem continues, let us know so we can look into fixing it.' + ('<%= ENV %>' !== 'prod' ? '<br />Error details: <br />' + exception : ''));
        //        //toastr['warning']('Error!<br /><br />', 'Sorry, there was a problem.  We are working through the glitches in this new tool, so you may need to refresh page.  If the problem continues, let us know so we can look into fixing it.' + '<br />Error details: <br />' + exception);
        //        toastr.clear();
        //        toastr['warning']('Error!<br /><br />', 'Sorry, there was a problem.  We are working through the glitches in this new tool, so you may need to refresh page.  If the problem continues, let us know so we can look into fixing it.');
        //        //this.router.navigate(['Error', { error: exception }]);
        //        //if (exception.status === 401) {
        //        //    // Show login
        //        //    this.router.navigate(['/Error']);
        //        //}

        //        // Get error messages if http exception
        //        //let msgs = [];
        //        //if (exception instanceof Response) {
        //        //    msgs = this.getMessagesFromResponse(exception);
        //        //} else {

        //        //    // Otherwise show generic error
        //        //    msgs.push('Something went wrong');
        //        //}

        //        //// Show messages
        //        //msgs.forEach((msg) => this.toaster.error(msg));

        //        super.call(exception, stackTrace, reason);
        //    }
        //}
    }

    //setCookie(cname: any, cvalue: any) {
    //    var d = new Date();
    //    d.setTime(d.getTime() + (60 * 1000));
    //    var expires = 'expires=' + d.toUTCString();
    //    document.cookie = cname + '=' + cvalue + ';' + expires + ';path=/';
    //}

    //getCookie(cname: any) {
    //    var name = cname + '=';
    //    var ca = document.cookie.split(';');
    //    for (var i = 0; i < ca.length; i++) {
    //        var c = ca[i];
    //        while (c.charAt(0) === ' ') {
    //            c = c.substring(1);
    //        }
    //        if (c.indexOf(name) === 0) {
    //            return c.substring(name.length, c.length);
    //        }
    //    }
    //    return '';
    //}

    //private getDependencies() {
    //    if (!this.router) {
    //        this.router = this.injector.get(Router);
    //    }
    //    //if (!this.toaster) {
    //    //    this.toaster = this.injector.get(ToastsManager);
    //    //}
    //}

}

/**
 * Bootstraps the application and makes the ROUTER_PROVIDERS and the APP_BASE_HREF available to it.
 * @see https://angular.io/docs/ts/latest/api/platform-browser-dynamic/index/bootstrap-function.html
 */
bootstrap(AppComponent, [
    HTTP_PROVIDERS,
    JSONP_PROVIDERS,
    ROUTER_PROVIDERS,
    //PlaceInfoService,
    //DND_PROVIDERS,
    provide(APP_BASE_HREF, { useValue: '<%= ENV %>' === 'prod' ? '<%= APP_BASE %>' : '/' }),
    //provide(APP_BASE_HREF, { useValue: '/' }),
    //{ provide: ExceptionHandler, useClass: AppExceptionHandler }
    provide(ExceptionHandler, { useClass: AppExceptionHandler })
]);

// In order to start the Service Worker located at "./worker.js"
// uncomment this line. More about Service Workers here
// https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers
//
// if ('serviceWorker' in navigator) {
//   (<any>navigator).serviceWorker.register('./worker.js').then((registration: any) =>
//       console.log('ServiceWorker registration successful with scope: ', registration.scope))
//     .catch((err: any) =>
//       console.log('ServiceWorker registration failed: ', err));
// }

toastr.options = {
    'closeButton': true,
    'debug': false,
    'newestOnTop': false,
    'progressBar': false,
    'positionClass': 'toast-bottom-full-width',
    'preventDuplicates': false,
    'onclick': null,
    'showDuration': '300',
    'hideDuration': '1000',
    'timeOut': 0,
    'extendedTimeOut': 0,
    'showEasing': 'swing',
    'hideEasing': 'linear',
    'showMethod': 'fadeIn',
    'hideMethod': 'fadeOut'
};

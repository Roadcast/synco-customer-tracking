(self["webpackChunkcustomer_tracking"] = self["webpackChunkcustomer_tracking"] || []).push([["main"],{

/***/ 2654:
/*!*******************************************!*\
  !*** ./src/app/here-flexible-polyline.js ***!
  \*******************************************/
/***/ ((module) => {

"use strict";

/*
 * Copyright (C) 2019 HERE Europe B.V.
 * Licensed under MIT, see full license in LICENSE
 * SPDX-License-Identifier: MIT
 * License-Filename: LICENSE
 */
const DEFAULT_PRECISION = 5;
const ENCODING_TABLE = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
const DECODING_TABLE = [
    62, -1, -1, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, -1, -1, -1, -1, -1, -1, -1,
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21,
    22, 23, 24, 25, -1, -1, -1, -1, 63, -1, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35,
    36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51
];
const FORMAT_VERSION = 1;
const ABSENT = 0;
const LEVEL = 1;
const ALTITUDE = 2;
const ELEVATION = 3;
// Reserved values 4 and 5 should not be selectable
const CUSTOM1 = 6;
const CUSTOM2 = 7;
const Num = typeof BigInt !== "undefined" ? BigInt : Number;
function decode(encoded) {
    const decoder = decodeUnsignedValues(encoded);
    const header = decodeHeader(decoder[0], decoder[1]);
    const factorDegree = 10 ** header.precision;
    const factorZ = 10 ** header.thirdDimPrecision;
    const { thirdDim } = header;
    let lastLat = 0;
    let lastLng = 0;
    let lastZ = 0;
    const res = [];
    let i = 2;
    for (; i < decoder.length;) {
        const deltaLat = toSigned(decoder[i]) / factorDegree;
        const deltaLng = toSigned(decoder[i + 1]) / factorDegree;
        lastLat += deltaLat;
        lastLng += deltaLng;
        if (thirdDim) {
            const deltaZ = toSigned(decoder[i + 2]) / factorZ;
            lastZ += deltaZ;
            res.push([lastLat, lastLng, lastZ]);
            i += 3;
        }
        else {
            res.push([lastLat, lastLng]);
            i += 2;
        }
    }
    if (i !== decoder.length) {
        throw new Error('Invalid encoding. Premature ending reached');
    }
    return Object.assign(Object.assign({}, header), { polyline: res });
}
function decodeChar(char) {
    const charCode = char.charCodeAt(0);
    return DECODING_TABLE[charCode - 45];
}
function decodeUnsignedValues(encoded) {
    let result = Num(0);
    let shift = Num(0);
    const resList = [];
    encoded.split('').forEach((char) => {
        const value = Num(decodeChar(char));
        result |= (value & Num(0x1F)) << shift;
        if ((value & Num(0x20)) === Num(0)) {
            resList.push(result);
            result = Num(0);
            shift = Num(0);
        }
        else {
            shift += Num(5);
        }
    });
    if (shift > 0) {
        throw new Error('Invalid encoding');
    }
    return resList;
}
function decodeHeader(version, encodedHeader) {
    if (+version.toString() !== FORMAT_VERSION) {
        throw new Error('Invalid format version');
    }
    const headerNumber = +encodedHeader.toString();
    const precision = headerNumber & 15;
    const thirdDim = (headerNumber >> 4) & 7;
    const thirdDimPrecision = (headerNumber >> 7) & 15;
    return { precision, thirdDim, thirdDimPrecision };
}
function toSigned(val) {
    // Decode the sign from an unsigned value
    let res = val;
    if (res & Num(1)) {
        res = ~res;
    }
    res >>= Num(1);
    return +res.toString();
}
function encode({ precision = DEFAULT_PRECISION, thirdDim = ABSENT, thirdDimPrecision = 0, polyline }) {
    // Encode a sequence of lat,lng or lat,lng(,{third_dim}). Note that values should be of type BigNumber
    //   `precision`: how many decimal digits of precision to store the latitude and longitude.
    //   `third_dim`: type of the third dimension if present in the input.
    //   `third_dim_precision`: how many decimal digits of precision to store the third dimension.
    const multiplierDegree = 10 ** precision;
    const multiplierZ = 10 ** thirdDimPrecision;
    const encodedHeaderList = encodeHeader(precision, thirdDim, thirdDimPrecision);
    const encodedCoords = [];
    let lastLat = Num(0);
    let lastLng = Num(0);
    let lastZ = Num(0);
    polyline.forEach((location) => {
        const lat = Num(Math.round(location[0] * multiplierDegree));
        encodedCoords.push(encodeScaledValue(lat - lastLat));
        lastLat = lat;
        const lng = Num(Math.round(location[1] * multiplierDegree));
        encodedCoords.push(encodeScaledValue(lng - lastLng));
        lastLng = lng;
        if (thirdDim) {
            const z = Num(Math.round(location[2] * multiplierZ));
            encodedCoords.push(encodeScaledValue(z - lastZ));
            lastZ = z;
        }
    });
    return [...encodedHeaderList, ...encodedCoords].join('');
}
function encodeHeader(precision, thirdDim, thirdDimPrecision) {
    // Encode the `precision`, `third_dim` and `third_dim_precision` into one encoded char
    if (precision < 0 || precision > 15) {
        throw new Error('precision out of range. Should be between 0 and 15');
    }
    if (thirdDimPrecision < 0 || thirdDimPrecision > 15) {
        throw new Error('thirdDimPrecision out of range. Should be between 0 and 15');
    }
    if (thirdDim < 0 || thirdDim > 7 || thirdDim === 4 || thirdDim === 5) {
        throw new Error('thirdDim should be between 0, 1, 2, 3, 6 or 7');
    }
    const res = (thirdDimPrecision << 7) | (thirdDim << 4) | precision;
    return encodeUnsignedNumber(FORMAT_VERSION) + encodeUnsignedNumber(res);
}
function encodeUnsignedNumber(val) {
    // Uses variable integer encoding to encode an unsigned integer. Returns the encoded string.
    let res = '';
    let numVal = Num(val);
    while (numVal > 0x1F) {
        const pos = (numVal & Num(0x1F)) | Num(0x20);
        res += ENCODING_TABLE[pos];
        numVal >>= Num(5);
    }
    return res + ENCODING_TABLE[numVal];
}
function encodeScaledValue(value) {
    // Transform a integer `value` into a variable length sequence of characters.
    //   `appender` is a callable where the produced chars will land to
    let numVal = Num(value);
    const negative = numVal < 0;
    numVal <<= Num(1);
    if (negative) {
        numVal = ~numVal;
    }
    return encodeUnsignedNumber(numVal);
}
module.exports = {
    encode,
    decode,
    ABSENT,
    LEVEL,
    ALTITUDE,
    ELEVATION,
};


/***/ }),

/***/ 158:
/*!***************************************!*\
  !*** ./src/app/app-routing.module.ts ***!
  \***************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "AppRoutingModule": () => (/* binding */ AppRoutingModule)
/* harmony export */ });
/* harmony import */ var _angular_router__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @angular/router */ 3903);
/* harmony import */ var _customer_tracking_page_customer_tracking_page_component__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./customer-tracking-page/customer-tracking-page.component */ 6582);
/* harmony import */ var _errorpage_errorpage_component__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./errorpage/errorpage.component */ 1536);
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @angular/core */ 8259);





// import {FeedbackComponent} from "./feedback/feedback.component";
const routes = [
    { path: '', component: _customer_tracking_page_customer_tracking_page_component__WEBPACK_IMPORTED_MODULE_0__.CustomerTrackingPageComponent },
    { path: 'tracking_page', component: _customer_tracking_page_customer_tracking_page_component__WEBPACK_IMPORTED_MODULE_0__.CustomerTrackingPageComponent },
    { path: 'error', component: _errorpage_errorpage_component__WEBPACK_IMPORTED_MODULE_1__.ErrorpageComponent },
];
class AppRoutingModule {
}
AppRoutingModule.ɵfac = function AppRoutingModule_Factory(t) { return new (t || AppRoutingModule)(); };
AppRoutingModule.ɵmod = /*@__PURE__*/ _angular_core__WEBPACK_IMPORTED_MODULE_2__["ɵɵdefineNgModule"]({ type: AppRoutingModule });
AppRoutingModule.ɵinj = /*@__PURE__*/ _angular_core__WEBPACK_IMPORTED_MODULE_2__["ɵɵdefineInjector"]({ imports: [[_angular_router__WEBPACK_IMPORTED_MODULE_3__.RouterModule.forRoot(routes)], _angular_router__WEBPACK_IMPORTED_MODULE_3__.RouterModule] });
(function () { (typeof ngJitMode === "undefined" || ngJitMode) && _angular_core__WEBPACK_IMPORTED_MODULE_2__["ɵɵsetNgModuleScope"](AppRoutingModule, { imports: [_angular_router__WEBPACK_IMPORTED_MODULE_3__.RouterModule], exports: [_angular_router__WEBPACK_IMPORTED_MODULE_3__.RouterModule] }); })();


/***/ }),

/***/ 5041:
/*!**********************************!*\
  !*** ./src/app/app.component.ts ***!
  \**********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "AppComponent": () => (/* binding */ AppComponent)
/* harmony export */ });
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @angular/core */ 8259);
/* harmony import */ var _angular_router__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/router */ 3903);


class AppComponent {
    constructor() {
        this.title = 'customer_tracking';
    }
}
AppComponent.ɵfac = function AppComponent_Factory(t) { return new (t || AppComponent)(); };
AppComponent.ɵcmp = /*@__PURE__*/ _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵdefineComponent"]({ type: AppComponent, selectors: [["app-root"]], decls: 1, vars: 0, template: function AppComponent_Template(rf, ctx) { if (rf & 1) {
        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelement"](0, "router-outlet");
    } }, directives: [_angular_router__WEBPACK_IMPORTED_MODULE_1__.RouterOutlet], styles: ["\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IiIsImZpbGUiOiJhcHAuY29tcG9uZW50LmNzcyJ9 */"] });


/***/ }),

/***/ 6747:
/*!*******************************!*\
  !*** ./src/app/app.module.ts ***!
  \*******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "AppModule": () => (/* binding */ AppModule)
/* harmony export */ });
/* harmony import */ var _angular_platform_browser__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! @angular/platform-browser */ 7532);
/* harmony import */ var _app_routing_module__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./app-routing.module */ 158);
/* harmony import */ var _app_component__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./app.component */ 5041);
/* harmony import */ var _customer_tracking_page_customer_tracking_page_component__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./customer-tracking-page/customer-tracking-page.component */ 6582);
/* harmony import */ var _googlemap_googlemap_component__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./googlemap/googlemap.component */ 941);
/* harmony import */ var _angular_common_http__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! @angular/common/http */ 3690);
/* harmony import */ var _errorpage_errorpage_component__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./errorpage/errorpage.component */ 1536);
/* harmony import */ var _angular_forms__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! @angular/forms */ 6410);
/* harmony import */ var ngx_star_rating__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ngx-star-rating */ 7563);
/* harmony import */ var _test_map_test_map_component__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./test-map/test-map.component */ 1274);
/* harmony import */ var ng_circle_progress__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ng-circle-progress */ 1685);
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! @angular/core */ 8259);





// import {GoogleMapsModule} from "@angular/google-maps";








class AppModule {
}
AppModule.ɵfac = function AppModule_Factory(t) { return new (t || AppModule)(); };
AppModule.ɵmod = /*@__PURE__*/ _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵdefineNgModule"]({ type: AppModule, bootstrap: [_app_component__WEBPACK_IMPORTED_MODULE_1__.AppComponent] });
AppModule.ɵinj = /*@__PURE__*/ _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵdefineInjector"]({ providers: [], imports: [[
            _angular_platform_browser__WEBPACK_IMPORTED_MODULE_7__.BrowserModule,
            _app_routing_module__WEBPACK_IMPORTED_MODULE_0__.AppRoutingModule,
            _angular_common_http__WEBPACK_IMPORTED_MODULE_8__.HttpClientModule,
            _angular_forms__WEBPACK_IMPORTED_MODULE_9__.FormsModule,
            _angular_forms__WEBPACK_IMPORTED_MODULE_9__.ReactiveFormsModule,
            ngx_star_rating__WEBPACK_IMPORTED_MODULE_10__.NgxStarRatingModule,
            ng_circle_progress__WEBPACK_IMPORTED_MODULE_11__.NgCircleProgressModule.forRoot({
                "radius": 60,
                "space": -10,
                "outerStrokeGradient": true,
                "outerStrokeWidth": 10,
                "outerStrokeColor": "#4882c2",
                "outerStrokeGradientStopColor": "#53a9ff",
                "innerStrokeColor": "#e7e8ea",
                "innerStrokeWidth": 10,
                "title": "UI",
                "animateTitle": false,
                "animationDuration": 1000,
                "showUnits": false,
                "showSubtitle": true,
                "subtitle": "0",
                "maxPercent": 0,
                "subtitleFontSize": "12",
                "showBackground": false,
                "clockwise": false,
                "startFromZero": false,
                "lazy": true
            })
        ]] });
(function () { (typeof ngJitMode === "undefined" || ngJitMode) && _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵsetNgModuleScope"](AppModule, { declarations: [_app_component__WEBPACK_IMPORTED_MODULE_1__.AppComponent,
        _customer_tracking_page_customer_tracking_page_component__WEBPACK_IMPORTED_MODULE_2__.CustomerTrackingPageComponent,
        _googlemap_googlemap_component__WEBPACK_IMPORTED_MODULE_3__.GooglemapComponent,
        _errorpage_errorpage_component__WEBPACK_IMPORTED_MODULE_4__.ErrorpageComponent,
        _test_map_test_map_component__WEBPACK_IMPORTED_MODULE_5__.TestMapComponent], imports: [_angular_platform_browser__WEBPACK_IMPORTED_MODULE_7__.BrowserModule,
        _app_routing_module__WEBPACK_IMPORTED_MODULE_0__.AppRoutingModule,
        _angular_common_http__WEBPACK_IMPORTED_MODULE_8__.HttpClientModule,
        _angular_forms__WEBPACK_IMPORTED_MODULE_9__.FormsModule,
        _angular_forms__WEBPACK_IMPORTED_MODULE_9__.ReactiveFormsModule,
        ngx_star_rating__WEBPACK_IMPORTED_MODULE_10__.NgxStarRatingModule, ng_circle_progress__WEBPACK_IMPORTED_MODULE_11__.NgCircleProgressModule] }); })();


/***/ }),

/***/ 6582:
/*!****************************************************************************!*\
  !*** ./src/app/customer-tracking-page/customer-tracking-page.component.ts ***!
  \****************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "CustomerTrackingPageComponent": () => (/* binding */ CustomerTrackingPageComponent)
/* harmony export */ });
/* harmony import */ var C_Users_Digvijay_Pandey_WebstormProjects_synco_customer_tracking_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js */ 9369);
/* harmony import */ var _angular_forms__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! @angular/forms */ 6410);
/* harmony import */ var rxjs__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! rxjs */ 8922);
/* harmony import */ var moment__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! moment */ 2281);
/* harmony import */ var moment__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(moment__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _environments_environment__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../environments/environment */ 2340);
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @angular/core */ 8259);
/* harmony import */ var _order_service__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../order.service */ 6447);
/* harmony import */ var _angular_router__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! @angular/router */ 3903);
/* harmony import */ var _angular_common_http__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! @angular/common/http */ 3690);
/* harmony import */ var _test_map_test_map_component__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../test-map/test-map.component */ 1274);
/* harmony import */ var _angular_common__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! @angular/common */ 8750);
/* harmony import */ var ng_circle_progress__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ng-circle-progress */ 1685);














function CustomerTrackingPageComponent_div_49_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementStart"](0, "div", 39);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtext"](1, " Rider has picked up your order ");
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementEnd"]();
  }
}

function CustomerTrackingPageComponent_div_50_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementStart"](0, "div", 39);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtext"](1, " Rider has reached your gate ");
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementEnd"]();
  }
}

function CustomerTrackingPageComponent_div_51_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementStart"](0, "div", 39);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtext"](1, " Rider has delivered your order ");
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementEnd"]();
  }
}

function CustomerTrackingPageComponent_div_72_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementStart"](0, "div")(1, "div", 40)(2, "div", 41);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelement"](3, "img", 42);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtext"](4, "Order No: ");
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementStart"](5, "strong");
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtext"](6);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵpipe"](7, "uppercase");
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementEnd"]()();
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementStart"](8, "div", 43)(9, "div", 44)(10, "p");
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtext"](11, "Your order has been delivered successfully.");
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementEnd"]()()()()();
  }

  if (rf & 2) {
    const ctx_r3 = _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵnextContext"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵadvance"](6);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtextInterpolate1"]("#", _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵpipeBind1"](7, 1, ctx_r3.order.external_id), "");
  }
}

function CustomerTrackingPageComponent_div_73_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementStart"](0, "div")(1, "div", 40)(2, "div", 41);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelement"](3, "img", 45);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementStart"](4, "div", 46)(5, "p", 47);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtext"](6, "Order No: ");
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementStart"](7, "strong");
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtext"](8);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵpipe"](9, "uppercase");
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementEnd"]()()();
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementStart"](10, "p", 48);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtext"](11, "Your order has been Cancelled.");
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementEnd"]()()()();
  }

  if (rf & 2) {
    const ctx_r4 = _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵnextContext"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵadvance"](8);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtextInterpolate1"]("#", _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵpipeBind1"](9, 1, ctx_r4.order.external_id), "");
  }
}

function CustomerTrackingPageComponent_section_74_tr_46_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementStart"](0, "tr")(1, "td", 66);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtext"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementStart"](3, "td", 67);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtext"](4);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵpipe"](5, "currency");
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementEnd"]()();
  }

  if (rf & 2) {
    const item_r8 = ctx.$implicit;
    const ctx_r7 = _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵnextContext"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵadvance"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtextInterpolate2"]("", item_r8.notes, " X", item_r8 == null ? null : item_r8.quantity, "");
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵadvance"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵpipeBind2"](5, 3, item_r8 == null ? null : item_r8.amount, ctx_r7.currencyCode));
  }
}

function CustomerTrackingPageComponent_section_74_Template(rf, ctx) {
  if (rf & 1) {
    const _r10 = _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵgetCurrentView"]();

    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementStart"](0, "section", 49)(1, "div", 9)(2, "div", 10)(3, "div", 50);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtext"](4, "Order Info ");
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementStart"](5, "div", 51);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵlistener"]("click", function CustomerTrackingPageComponent_section_74_Template_div_click_5_listener() {
      _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵrestoreView"](_r10);
      const ctx_r9 = _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵnextContext"]();
      return ctx_r9.orderSummaryValueClose();
    });
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtext"](6, "x");
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementEnd"]()();
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementStart"](7, "div", 16)(8, "div", 52)(9, "div", 53)(10, "p", 54);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelement"](11, "img", 55);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtext"](12, " Order Number");
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementStart"](13, "p", 56);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtext"](14);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementEnd"]()();
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementStart"](15, "div", 57)(16, "p", 54);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelement"](17, "img", 58);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtext"](18, " Delivery Address");
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementStart"](19, "p", 59);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtext"](20);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementEnd"]()();
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementStart"](21, "div", 60)(22, "p", 54);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelement"](23, "img", 61);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtext"](24, " Payment Mode");
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementStart"](25, "p", 59);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtext"](26, "Paid: ");
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementStart"](27, "span", 62);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtext"](28);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementEnd"]()()();
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementStart"](29, "div", 63)(30, "p", 54);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelement"](31, "img", 64);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtext"](32, " Date and Time");
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementStart"](33, "p", 59);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtext"](34);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵpipe"](35, "date");
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementEnd"]()();
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementStart"](36, "div", 65)(37, "table")(38, "tbody")(39, "tr")(40, "td", 66)(41, "strong");
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtext"](42, "Items");
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementEnd"]()();
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementStart"](43, "td", 67)(44, "strong");
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtext"](45, "Amount");
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementEnd"]()()();
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtemplate"](46, CustomerTrackingPageComponent_section_74_tr_46_Template, 6, 6, "tr", 68);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementStart"](47, "tr")(48, "td", 66)(49, "strong");
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtext"](50, "Grand Total");
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementEnd"]()();
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementStart"](51, "td", 67)(52, "strong");
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtext"](53);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵpipe"](54, "currency");
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementEnd"]()()()()()()()()()()();
  }

  if (rf & 2) {
    const ctx_r5 = _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵnextContext"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵadvance"](14);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtextInterpolate"](ctx_r5.order.external_id);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵadvance"](6);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtextInterpolate"](ctx_r5.order.delivery_address.google_address);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵadvance"](8);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtextInterpolate"](ctx_r5.order.payment_type);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵadvance"](6);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵpipeBind2"](35, 6, ctx_r5.order.created_on, "medium"));
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵadvance"](12);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵproperty"]("ngForOf", ctx_r5.order.order_items);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵadvance"](7);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵpipeBind2"](54, 9, ctx_r5.order.sub_total, ctx_r5.currencyCode));
  }
}

function CustomerTrackingPageComponent_section_75_Template(rf, ctx) {
  if (rf & 1) {
    const _r12 = _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵgetCurrentView"]();

    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementStart"](0, "section", 69)(1, "div", 70)(2, "div", 71);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵlistener"]("click", function CustomerTrackingPageComponent_section_75_Template_div_click_2_listener() {
      _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵrestoreView"](_r12);
      const ctx_r11 = _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵnextContext"]();
      return ctx_r11.infoModelClose();
    });
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtext"](3, "x");
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementStart"](4, "div", 10)(5, "div", 72);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelement"](6, "img", 73);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementEnd"]()();
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementStart"](7, "div", 74)(8, "div", 75);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelement"](9, "img", 76);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementStart"](10, "div", 77)(11, "p")(12, "strong");
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtext"](13, "Contact-less Delivery");
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtext"](14, " On your request for contactless delivery, our delivery executive will leave your order at your doorstep after calling you, once he has reached your location. Please remember to collect the order.");
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementEnd"]()();
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementStart"](15, "div", 75);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelement"](16, "img", 76);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementStart"](17, "div", 77)(18, "p")(19, "strong");
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtext"](20, "Daily Body Temperature Check");
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtext"](21, " Our store employees temperature are screened everyday and it is ensured their body temperature is always less than 99.4F/37.4C");
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementEnd"]()()();
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementStart"](22, "div", 78)(23, "div", 16)(24, "p")(25, "strong");
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtext"](26);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelement"](27, "br");
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementStart"](28, "strong");
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtext"](29, "Vaccinated against Covid-19");
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementStart"](30, "span", 79);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtext"](31, "View Certificate");
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementEnd"]()();
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementStart"](32, "p", 80);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtext"](33, "Body Temperature ");
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementStart"](34, "span", 81);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtext"](35);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementEnd"]()()()()()();
  }

  if (rf & 2) {
    const ctx_r6 = _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵnextContext"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵadvance"](26);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtextInterpolate"](ctx_r6.order.rider.name);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵadvance"](9);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtextInterpolate1"]("", ctx_r6.body_temp, "\u2109");
  }
}

class CustomerTrackingPageComponent {
  constructor(orderService, router, fb, http) {
    this.orderService = orderService;
    this.router = router;
    this.fb = fb;
    this.http = http;
    this.order = {
      id: '',
      rider: {
        name: ''
      },
      delivery_address: {
        google_address: ''
      }
    };
    this.feedbackorder = '';
    this.rating = {};
    this.rating3 = 0;
    this.orderStatusDist = {
      50: null,
      200: null,
      300: null,
      400: null,
      500: null,
      600: null
    };
    this.orderStatusDate = {
      50: '',
      200: '',
      300: '',
      400: '',
      500: '',
      600: ''
    };
    this.feedbackPolling = false;
    this.notes = 'Delivery in';
    this.orderSummaryValue = false;
    this.updatedTime = 0;
    this.infoModelValue = false;
    this.currentApplicationVersion = _environments_environment__WEBPACK_IMPORTED_MODULE_2__.environment.appVersion;
    this.resData = {};
    this.form = this.fb.group({
      rating1: ['', _angular_forms__WEBPACK_IMPORTED_MODULE_6__.Validators.required],
      rating2: [4]
    });
  }

  ngOnInit() {
    var _this = this;

    return (0,C_Users_Digvijay_Pandey_WebstormProjects_synco_customer_tracking_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])(function* () {
      var _a;

      yield _this.orderService.init().then();
      _this.order = _this.orderService.order;
      _this.rating = _this.orderService.rating;
      _this.order_status = _this.orderService.order_status;
      _this.order_Payment = _this.orderService.orderPayment;
      yield _this.orderService.companyData().then();
      _this.currencyCode = _this.orderService.currencyCode;
      const bodytemp = _this.orderService.body_temp;
      _this.body_temp = (_a = bodytemp.body_temp_vaccination_status) === null || _a === void 0 ? void 0 : _a.EmployeeBodyTemp;

      _this.order_status.forEach(row => {
        // @ts-ignore
        _this.orderStatusDist[row.status_code] = row.status_code; // @ts-ignore

        _this.orderStatusDate[row.status_code] = row.created_on;
      });

      _this.pollingData();

      _this.numberMasking();
    })();
  } // deg2rad1(deg: any) {
  //   return deg * (Math.PI / 180)
  // }


  pollingData() {
    this.sub = (0,rxjs__WEBPACK_IMPORTED_MODULE_7__.interval)(4000).subscribe(() => {
      this.orderService.init().then();
      this.order = this.orderService.order;
      this.order_status = this.orderService.order_status;
      this.order_status.forEach(row => {
        // @ts-ignore
        this.orderStatusDist[row.status_code] = row.status_code; // @ts-ignore

        this.orderStatusDate[row.status_code] = row.created_on;
      });
      this.getTimeBtwTwoLatLng(this.order);
    });

    if (this.order.status_name === 'delivered' || this.order.status_name === 'cancelled') {
      this.sub.unsubscribe();
    }
  }

  getTimeBtwTwoLatLng(order) {
    const lat1 = order.rider_position.latitude;
    const lng1 = order.rider_position.longitude;
    const lat2 = order.delivery_location.latitude;
    const lng2 = order.delivery_location.longitude;

    try {
      this.http.get('https://route.ls.hereapi.com/routing/7.2/calculateroute.json', {
        params: {
          apikey: _environments_environment__WEBPACK_IMPORTED_MODULE_2__.environment.hereApiKey,
          waypoint0: `geo!${lat1},${lng1}`,
          waypoint1: `geo!${lat2},${lng2}`,
          mode: 'fastest;car;'
        }
      }).subscribe(res => {
        this.resData = res;
        this.time = this.resData.response.route[0].summary.travelTime;
      });
    } catch (e) {
      console.log(e);
    }

    console.log(this.time);
    this.updatedTime = Number(this.time / 60);
    this.subTitleTime = this.updatedTime.toFixed(0) + ' min';
    this.firstLocationTime = this.order.drop_off_eta / 60;
    const firstPerValue = 100 / this.firstLocationTime;
    this.currentUpdateTime = (this.firstLocationTime - this.updatedTime) * firstPerValue;
  }

  deg2rad(deg) {
    return deg * (Math.PI / 180);
  }

  feedback() {
    var _this2 = this;

    const api_url = _environments_environment__WEBPACK_IMPORTED_MODULE_2__.environment.apiUrl;
    fetch(api_url + 'order/order_feedback/' + `${this.order.id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        stars: this.rating3,
        feedback: this.feedbackorder,
        customer_id: this.order.customer_id,
        rider_id: this.order.rider_id
      })
    }).then( /*#__PURE__*/function () {
      var _ref = (0,C_Users_Digvijay_Pandey_WebstormProjects_synco_customer_tracking_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])(function* (res) {
        const resData = yield res.json();
        _this2.feedbackStatus = resData.status;
        yield _this2.orderService.init();
        _this2.order = _this2.orderService.order;
        _this2.rating = _this2.orderService.rating;
      });

      return function (_x) {
        return _ref.apply(this, arguments);
      };
    }());
  }

  numberMasking() {
    var _this3 = this;

    const date = this.order.created_on;
    console.log('date ', moment__WEBPACK_IMPORTED_MODULE_1__(date).format('YYYY-MM-DD'));
    const api_url = _environments_environment__WEBPACK_IMPORTED_MODULE_2__.environment.apiUrl;
    fetch(api_url + 'order/virtual_number', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        order_number: this.order.external_id,
        order_date: moment__WEBPACK_IMPORTED_MODULE_1__(date).format('YYYY-MM-DD'),
        location_code: "DPI66683",
        employee_code: this.order.rider_id
      })
    }).then( /*#__PURE__*/function () {
      var _ref2 = (0,C_Users_Digvijay_Pandey_WebstormProjects_synco_customer_tracking_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])(function* (res) {
        const riderData = yield res.json();
        _this3.riderNumber = riderData.virtualNumber; // console.log('vvvvvvvvvvvvvvvvvv', this.riderNumber)
      });

      return function (_x2) {
        return _ref2.apply(this, arguments);
      };
    }());
  }

  orderSummary() {
    this.orderSummaryValue = true;
  }

  orderSummaryValueClose() {
    this.orderSummaryValue = false;
  }

  getRating(event, value) {
    this.rating3 = value;
  }

  riderPan() {
    this.orderService.riderPosition.next({
      lat: this.order.rider_position.latitude,
      lng: this.order.rider_position.longitude
    });
  }

  infoModel() {
    this.infoModelValue = true;
  }

  infoModelClose() {
    this.infoModelValue = false;
  }

}

CustomerTrackingPageComponent.ɵfac = function CustomerTrackingPageComponent_Factory(t) {
  return new (t || CustomerTrackingPageComponent)(_angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵdirectiveInject"](_order_service__WEBPACK_IMPORTED_MODULE_3__.OrderService), _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵdirectiveInject"](_angular_router__WEBPACK_IMPORTED_MODULE_8__.Router), _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵdirectiveInject"](_angular_forms__WEBPACK_IMPORTED_MODULE_6__.FormBuilder), _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵdirectiveInject"](_angular_common_http__WEBPACK_IMPORTED_MODULE_9__.HttpClient));
};

CustomerTrackingPageComponent.ɵcmp = /*@__PURE__*/_angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵdefineComponent"]({
  type: CustomerTrackingPageComponent,
  selectors: [["app-customer-tracking-page"]],
  decls: 76,
  vars: 34,
  consts: [[1, "logo"], ["src", "assets/images/logo.jpg", "alt", ""], [1, "gmap"], [1, "powered"], ["src", "assets/images/rc_ic.svg", "alt", "map"], [1, "recenter", 3, "click"], ["id", "Layer_1", "data-name", "Layer 1", "xmlns", "http://www.w3.org/2000/svg", "viewBox", "0 0 121.64 122.86"], ["d", "M59,1.24.2,120.08a1.92,1.92,0,0,0,.88,2.58,1.89,1.89,0,0,0,1.76,0h0l58-30.87,58,30.87h0a1.89,\n      1.89,0,0,0,1.76,0,1.92,1.92,0,0,0,.88-2.58L62.64,1.24a2,2,0,0,0-3.64,0Z", "fill", "#0074ad"], [1, "ordercont"], [1, "container"], [1, "row"], [1, "col"], [1, "row", "orderstatus"], [1, "col-6"], [1, "col-6", "txt-right"], [1, "w-100"], [1, "col-12"], [1, "col-7"], [1, "timeline"], [3, "ngClass"], ["src", "assets/images/tick-w.png"], [1, "col-5", "txt-right"], [3, "percent", "radius", "titleFontSize", "title", "subtitle", "maxPercent"], ["class", "col-12 rider", 4, "ngIf"], [1, "row", "user"], [1, "col-2", "u-pic"], ["src", "assets/images/user.jpg", "alt", ""], [1, "col-6", "u-name"], [1, "col-4", "callbtn", "txtright"], ["src", "assets/images/info_ic.svg", "alt", "", 3, "click"], [2, "text-decoration", "none", 3, "href"], ["src", "assets/images/call_ic.svg", "alt", "", 1, "ml-6"], [1, "row", "bottombtn"], ["type", "button", 1, "btn", "btn-primary", "w-100", 3, "click"], [1, "col-12", "poweredbot"], [2, "float", "right"], [4, "ngIf"], ["class", "order-summary-cont", 4, "ngIf"], ["class", "info-window", 4, "ngIf"], [1, "col-12", "rider"], [1, "feedback-popup"], [1, "s-message"], ["src", "assets/images/successful.gif", "alt", ""], [1, "botcont"], [2, "text-align", "center", "font-size", "14px", "padding", "10px", "position", "relative", "font-weight", "bold"], ["src", "assets/images/cancel.svg", "alt", "", 2, "width", "35%", "/* margin-top", "50%", "*/\n    margin", "16% 0% 15% 0%"], [1, "txts", 2, "margin-bottom", "4%"], [1, "order-id"], [2, "color", "red", "font-weight", "bold"], [1, "order-summary-cont"], [1, "col-12", "info"], [1, "close-btn", 3, "click"], [1, "summary"], [1, "order-number"], [1, "head"], ["src", "assets/images/order_number.svg", "alt", ""], [1, "txt", "blue"], [1, "address"], ["src", "assets/images/location.svg", "alt", ""], [1, "txt"], [1, "mode"], ["src", "assets/images/payment.svg", "alt", ""], [1, "blue"], [1, "date"], ["src", "assets/images/date_time.svg", "alt", ""], [1, "items-details"], ["colspan", "2"], ["colspan", "2", 1, "text-right"], [4, "ngFor", "ngForOf"], [1, "info-window"], [1, "container", "info-popup"], [1, "close-btn", 2, "top", "10px", "right", "30px", 3, "click"], [1, "col-12", "topimg"], ["src", "assets/images/info-pic.svg", "alt", ""], [1, "row", "infotext"], [1, "col-1"], ["src", "assets/images/tick-g.svg", "alt", ""], [1, "col-11"], [1, "row", "driverdet"], [1, "vc"], [1, "bt"], [1, "tempr"]],
  template: function CustomerTrackingPageComponent_Template(rf, ctx) {
    if (rf & 1) {
      _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementStart"](0, "header")(1, "div", 0);
      _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelement"](2, "img", 1);
      _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementEnd"]()();
      _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementStart"](3, "section", 2)(4, "div", 3);
      _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelement"](5, "img", 4);
      _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementEnd"]();
      _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementStart"](6, "div", 5);
      _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵlistener"]("click", function CustomerTrackingPageComponent_Template_div_click_6_listener() {
        return ctx.riderPan();
      });
      _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵnamespaceSVG"]();
      _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementStart"](7, "svg", 6)(8, "title");
      _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtext"](9, "direction-top");
      _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementEnd"]();
      _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelement"](10, "path", 7);
      _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementEnd"]()();
      _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵnamespaceHTML"]();
      _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelement"](11, "app-test-map");
      _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementEnd"]();
      _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementStart"](12, "section", 8)(13, "div", 9)(14, "div", 10)(15, "div", 11)(16, "div", 12)(17, "div", 13)(18, "h2");
      _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtext"](19, "Order No");
      _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementEnd"]()();
      _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementStart"](20, "div", 14)(21, "h2");
      _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtext"](22);
      _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵpipe"](23, "uppercase");
      _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementEnd"]()();
      _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelement"](24, "div", 15);
      _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementStart"](25, "div", 16)(26, "div", 10)(27, "div", 17)(28, "ol", 18)(29, "li", 19);
      _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelement"](30, "img", 20);
      _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtext"](31, "Start Bike");
      _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementStart"](32, "span");
      _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtext"](33);
      _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵpipe"](34, "date");
      _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementEnd"]()();
      _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementStart"](35, "li", 19);
      _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelement"](36, "img", 20);
      _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtext"](37, "Reached Customer Parking");
      _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementStart"](38, "span");
      _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtext"](39);
      _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵpipe"](40, "date");
      _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementEnd"]()();
      _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementStart"](41, "li", 19);
      _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelement"](42, "img", 20);
      _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtext"](43, "Delivered");
      _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementStart"](44, "span");
      _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtext"](45);
      _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵpipe"](46, "date");
      _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementEnd"]()()()();
      _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementStart"](47, "div", 21);
      _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelement"](48, "circle-progress", 22);
      _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementEnd"]()()();
      _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtemplate"](49, CustomerTrackingPageComponent_div_49_Template, 2, 0, "div", 23);
      _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtemplate"](50, CustomerTrackingPageComponent_div_50_Template, 2, 0, "div", 23);
      _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtemplate"](51, CustomerTrackingPageComponent_div_51_Template, 2, 0, "div", 23);
      _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementEnd"]()()();
      _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementStart"](52, "div", 24)(53, "div", 11)(54, "div", 10)(55, "div", 25);
      _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelement"](56, "img", 26);
      _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementEnd"]();
      _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementStart"](57, "div", 27)(58, "strong");
      _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtext"](59);
      _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementEnd"]()();
      _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementStart"](60, "div", 28)(61, "img", 29);
      _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵlistener"]("click", function CustomerTrackingPageComponent_Template_img_click_61_listener() {
        return ctx.infoModel();
      });
      _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementEnd"]();
      _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementStart"](62, "a", 30);
      _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelement"](63, "img", 31);
      _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementEnd"]()()()()();
      _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementStart"](64, "div", 32)(65, "div", 16)(66, "button", 33);
      _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵlistener"]("click", function CustomerTrackingPageComponent_Template_button_click_66_listener() {
        return ctx.orderSummary();
      });
      _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtext"](67, "VIEW ORDER INFO");
      _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementEnd"]()();
      _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementStart"](68, "div", 34);
      _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtext"](69, " Powered by RoadCast ");
      _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementStart"](70, "span", 35);
      _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtext"](71);
      _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementEnd"]()()()()();
      _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtemplate"](72, CustomerTrackingPageComponent_div_72_Template, 12, 3, "div", 36);
      _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtemplate"](73, CustomerTrackingPageComponent_div_73_Template, 12, 3, "div", 36);
      _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtemplate"](74, CustomerTrackingPageComponent_section_74_Template, 55, 12, "section", 37);
      _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtemplate"](75, CustomerTrackingPageComponent_section_75_Template, 36, 2, "section", 38);
    }

    if (rf & 2) {
      _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵadvance"](22);
      _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtextInterpolate1"]("#", _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵpipeBind1"](23, 23, ctx.order.external_id), "");
      _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵadvance"](7);
      _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵproperty"]("ngClass", ctx.orderStatusDist["400"] === 400 ? "active" : "");
      _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵadvance"](4);
      _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtextInterpolate1"]("at ", _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵpipeBind2"](34, 25, ctx.orderStatusDate["400"], "hh:mm a"), "");
      _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵadvance"](2);
      _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵproperty"]("ngClass", ctx.orderStatusDist["500"] === 500 ? "active" : "");
      _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵadvance"](4);
      _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtextInterpolate1"]("at ", _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵpipeBind2"](40, 28, ctx.orderStatusDate["500"], "hh:mm a"), "");
      _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵadvance"](2);
      _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵproperty"]("ngClass", ctx.orderStatusDist["600"] === 600 ? "active" : "");
      _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵadvance"](4);
      _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtextInterpolate1"]("at ", _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵpipeBind2"](46, 31, ctx.orderStatusDate["600"], "hh:mm a"), "");
      _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵadvance"](3);
      _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵproperty"]("percent", ctx.currentUpdateTime)("radius", 55)("titleFontSize", "12")("title", ctx.notes)("subtitle", ctx.subTitleTime)("maxPercent", ctx.firstLocationTime);
      _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵadvance"](1);
      _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵproperty"]("ngIf", ctx.order.status_code === 400);
      _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵadvance"](1);
      _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵproperty"]("ngIf", ctx.order.status_code === 500);
      _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵadvance"](1);
      _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵproperty"]("ngIf", ctx.order.status_code === 600);
      _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵadvance"](8);
      _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtextInterpolate"](ctx.order.rider.name);
      _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵadvance"](3);
      _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵpropertyInterpolate1"]("href", "tel: ", ctx.order.rider ? ctx.riderNumber : "", "", _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵsanitizeUrl"]);
      _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵadvance"](9);
      _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtextInterpolate"](ctx.currentApplicationVersion);
      _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵadvance"](1);
      _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵproperty"]("ngIf", ctx.order.status_name === "delivered" || ctx.order.status_name === "reached_store");
      _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵadvance"](1);
      _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵproperty"]("ngIf", ctx.order.status_name === "cancelled");
      _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵadvance"](1);
      _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵproperty"]("ngIf", ctx.orderSummaryValue);
      _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵadvance"](1);
      _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵproperty"]("ngIf", ctx.infoModelValue);
    }
  },
  directives: [_test_map_test_map_component__WEBPACK_IMPORTED_MODULE_4__.TestMapComponent, _angular_common__WEBPACK_IMPORTED_MODULE_10__.NgClass, ng_circle_progress__WEBPACK_IMPORTED_MODULE_11__.CircleProgressComponent, _angular_common__WEBPACK_IMPORTED_MODULE_10__.NgIf, _angular_common__WEBPACK_IMPORTED_MODULE_10__.NgForOf],
  pipes: [_angular_common__WEBPACK_IMPORTED_MODULE_10__.UpperCasePipe, _angular_common__WEBPACK_IMPORTED_MODULE_10__.DatePipe, _angular_common__WEBPACK_IMPORTED_MODULE_10__.CurrencyPipe],
  styles: [".cont[_ngcontent-%COMP%] {width: 100%;max-width: 350px;text-align: center;color: #EEE;overflow: hidden;}\r\n.stars[_ngcontent-%COMP%] {padding:20px 0;}\r\n.star-rating[_ngcontent-%COMP%] {display: inline-block; margin:0 5px;}\r\n.star-rating[_ngcontent-%COMP%]   img[_ngcontent-%COMP%] {width:38px;}\r\n.containerr[_ngcontent-%COMP%] {margin: 0 auto;}\r\n.roundd[_ngcontent-%COMP%] {position: relative;}\r\n.roundd[_ngcontent-%COMP%]   label[_ngcontent-%COMP%] {background-color: #fff;border: 1px solid #ccc;border-radius: 50%;cursor: pointer;height: 28px;left: 0;position: absolute;top: 0;width: 28px;}\r\n.roundd[_ngcontent-%COMP%]   label[_ngcontent-%COMP%]:after {border: 2px solid #fff;border-top: none;border-right: none;content: \"\";height: 6px;left: 7px;opacity: 0;position: absolute;top: 8px;transform: rotate(-45deg);width: 12px;}\r\n.roundd[_ngcontent-%COMP%]   input[type=\"checkbox\"][_ngcontent-%COMP%] {visibility: hidden;}\r\n.roundd[_ngcontent-%COMP%]   input[type=\"checkbox\"][_ngcontent-%COMP%]:checked    + label[_ngcontent-%COMP%] {background-color: #66bb6a;border-color: #66bb6a;}\r\n.roundd[_ngcontent-%COMP%]   input[type=\"checkbox\"][_ngcontent-%COMP%]:checked    + label[_ngcontent-%COMP%]:after {opacity: 1;}\r\n\r\n\r\nhtml[_ngcontent-%COMP%] {scroll-behavior: smooth;}\r\nbody[_ngcontent-%COMP%] {font-family: Roboto;font-size: 14px;font-weight: 400;color: #36454f;position: relative;overflow-x: hidden;background: #f8f8f8;}\r\n*[_ngcontent-%COMP%] {margin: 0;padding: 0;transition: all .5s;}\r\na[_ngcontent-%COMP%] {text-decoration: none;color: #34b8c0;transition: all .5s;}\r\na[_ngcontent-%COMP%]:hover {color: #e54e35;text-decoration: none;}\r\nb[_ngcontent-%COMP%], strong[_ngcontent-%COMP%] {font-weight: 700;}\r\nul[_ngcontent-%COMP%], ol[_ngcontent-%COMP%] {list-style: none;margin: 0;}\r\nimg[_ngcontent-%COMP%] {height: auto;width: auto;max-width: 100%;}\r\nimg[_ngcontent-%COMP%], a[_ngcontent-%COMP%] {outline: none;box-shadow: none;border: 0;}\r\nheader[_ngcontent-%COMP%] {width: 100%;height: 49px; background: #fff;position: fixed; top:0; z-index: 100;  padding: 10px;}\r\nheader[_ngcontent-%COMP%]   .backarrow[_ngcontent-%COMP%] {position: absolute;left: 0;top: 0;width: 49px;height: 49px;padding: 10px;}\r\nheader[_ngcontent-%COMP%]   .logo[_ngcontent-%COMP%] {position: absolute;left: 50%;top: 0;width: 200px;height: 49px;margin-left: -100px;text-align: center}\r\nheader[_ngcontent-%COMP%]   .alert[_ngcontent-%COMP%] {position: absolute;right: 0;top: 0;width: 49px;height: 49px;padding: 10px;}\r\n.gmap[_ngcontent-%COMP%] {height: 50vh;background: #eee;position: relative; margin-top:49px;}\r\n.gmap[_ngcontent-%COMP%]   img[_ngcontent-%COMP%] {width: 100%;height: 100%;}\r\n.gmap[_ngcontent-%COMP%]   .powered[_ngcontent-%COMP%] {border: 1px solid #ccc;background: #fff;padding: 3px;border-radius: 6px;font-size: 11px;line-height: 16px;position: absolute;right: 15px;top: 15px;z-index: 8;}\r\n.gmap[_ngcontent-%COMP%]   .powered[_ngcontent-%COMP%]   img[_ngcontent-%COMP%] {float: right;width: 20px;margin: 0;}\r\n.gmap[_ngcontent-%COMP%]   .recenter[_ngcontent-%COMP%] {background: #f5f5f5;border-radius: 50%;line-height: 36px;position: absolute; width: 42px; height: 42px;right: 15px;bottom: 45px;z-index: 8; text-align: center;}\r\n.gmap[_ngcontent-%COMP%]   .recenter[_ngcontent-%COMP%]   svg[_ngcontent-%COMP%] {width:16px; height: 16px;}\r\n.ordercont[_ngcontent-%COMP%] {background: #f5f5f5;border-radius: 30px 30px 0 0;padding: 10px 8px 16px 8px;position: relative;margin-top: -30px;}\r\n.ordercont[_ngcontent-%COMP%]   .container[_ngcontent-%COMP%] {max-width: 100%;padding: 0 10px;margin: 0 auto;position: relative;}\r\n.ordercont[_ngcontent-%COMP%]   .container[_ngcontent-%COMP%]   h2[_ngcontent-%COMP%] {font-size: 1rem;color: #1d1d1d; margin-bottom: 10px;}\r\n.ordercont[_ngcontent-%COMP%]   .container[_ngcontent-%COMP%]   h2[_ngcontent-%COMP%]   span[_ngcontent-%COMP%] {float: right;color: #1d1d1d;}\r\n.ordercont[_ngcontent-%COMP%]   .container[_ngcontent-%COMP%]   .address[_ngcontent-%COMP%] {align-items: center;background: #f5f5f5;border-radius: 15px;padding: 8px 12px;font-size: .8rem;line-height: 1.2;margin: 0 0 10px 0;}\r\n.ordercont[_ngcontent-%COMP%]   .container[_ngcontent-%COMP%]   .address[_ngcontent-%COMP%]   img[_ngcontent-%COMP%] {max-width: 30px;}\r\n.ordercont[_ngcontent-%COMP%]   .container[_ngcontent-%COMP%]   .address[_ngcontent-%COMP%]   strong[_ngcontent-%COMP%] {font-weight: 600;display: block;margin-bottom: 4px;}\r\n.ordercont[_ngcontent-%COMP%]   .container[_ngcontent-%COMP%]   .address[_ngcontent-%COMP%]   .c-address[_ngcontent-%COMP%] {font-weight: 400; padding-left: 6px; font-size: 0.75rem; line-height: 1.3;}\r\n.ordercont[_ngcontent-%COMP%]   .container[_ngcontent-%COMP%]   .orderstatus[_ngcontent-%COMP%] {align-items: center;background: #fff;border-radius: 15px;padding: 10px 15px 2px 15px;margin: 10px 0 10px 0;font-size: .75rem;line-height: 1.5;}\r\n.ordercont[_ngcontent-%COMP%]   .container[_ngcontent-%COMP%]   .orderstatus[_ngcontent-%COMP%]   .orderstatus-itms[_ngcontent-%COMP%] {text-align: center;padding:4px 0!important;font-size: .75rem;line-height: 1.5;}\r\n.ordercont[_ngcontent-%COMP%]   .container[_ngcontent-%COMP%]   .orderstatus[_ngcontent-%COMP%]   .orderstatus-itms[_ngcontent-%COMP%]   img[_ngcontent-%COMP%] {width:22px; height:22px; display: inline-block; margin-bottom: 5px;}\r\n.ordercont[_ngcontent-%COMP%]   .container[_ngcontent-%COMP%]   .orderstatus[_ngcontent-%COMP%]   .grey[_ngcontent-%COMP%]{opacity: 0.5;}\r\n.ordercont[_ngcontent-%COMP%]   .container[_ngcontent-%COMP%]   .orderstatus[_ngcontent-%COMP%]   .orderstatus-itms[_ngcontent-%COMP%]   .grey[_ngcontent-%COMP%]   p[_ngcontent-%COMP%] {color:#ccc}\r\n.ordercont[_ngcontent-%COMP%]   .container[_ngcontent-%COMP%]   .orderstatus[_ngcontent-%COMP%]   .orderstatus-itms[_ngcontent-%COMP%]   p[_ngcontent-%COMP%] {font-weight: 700;}\r\n.ordercont[_ngcontent-%COMP%]   .container[_ngcontent-%COMP%]   .orderstatus[_ngcontent-%COMP%]   h3[_ngcontent-%COMP%] {margin-top: 10px;font-size: 0.9rem;}\r\n.ordercont[_ngcontent-%COMP%]   .container[_ngcontent-%COMP%]   .orderstatus[_ngcontent-%COMP%]   .rider[_ngcontent-%COMP%] {text-align: center;color: #707070; margin-bottom: 8px;}\r\n.ordercont[_ngcontent-%COMP%]   .container[_ngcontent-%COMP%]   .user[_ngcontent-%COMP%] {background: #fff;border-radius: 15px;padding:6px 10px;margin: 0 0 10px 0;}\r\n.ordercont[_ngcontent-%COMP%]   .container[_ngcontent-%COMP%]   .user[_ngcontent-%COMP%]   .row[_ngcontent-%COMP%] {align-items: center;}\r\n.ordercont[_ngcontent-%COMP%]   .container[_ngcontent-%COMP%]   .user[_ngcontent-%COMP%]   .u-pic[_ngcontent-%COMP%] {padding-left: 6px;padding-right: 0;}\r\n.ordercont[_ngcontent-%COMP%]   .container[_ngcontent-%COMP%]   .user[_ngcontent-%COMP%]   .u-pic[_ngcontent-%COMP%]   img[_ngcontent-%COMP%] {border-radius: 50%;max-width: 48px;}\r\n.ordercont[_ngcontent-%COMP%]   .container[_ngcontent-%COMP%]   .user[_ngcontent-%COMP%]   .u-name[_ngcontent-%COMP%] {font-size: .75rem;line-height: 1.3;padding-left: 10px;}\r\n.ordercont[_ngcontent-%COMP%]   .container[_ngcontent-%COMP%]   .user[_ngcontent-%COMP%]   .u-name[_ngcontent-%COMP%]   strong[_ngcontent-%COMP%] {font-weight: 600;display: block;margin-bottom: 4px;}\r\n.ordercont[_ngcontent-%COMP%]   .container[_ngcontent-%COMP%]   .user[_ngcontent-%COMP%]   .u-name[_ngcontent-%COMP%]   img[_ngcontent-%COMP%] {width: 16px;margin: -2px 0 0 6px;}\r\n.ordercont[_ngcontent-%COMP%]   .container[_ngcontent-%COMP%]   .user[_ngcontent-%COMP%]   .callbtn[_ngcontent-%COMP%] {padding-right: 0;}\r\n.ordercont[_ngcontent-%COMP%]   .container[_ngcontent-%COMP%]   .user[_ngcontent-%COMP%]   .callbtn[_ngcontent-%COMP%]   img[_ngcontent-%COMP%] {max-width: 42px;}\r\n.ml-6[_ngcontent-%COMP%] {margin-left:6px;}\r\n.issue[_ngcontent-%COMP%] {text-align: center;margin-top: 12px;color: #707070;font-size: .82rem;line-height: 1.3;}\r\n.issue[_ngcontent-%COMP%]   a[_ngcontent-%COMP%] {color: #000;font-weight: 700;}\r\n.issue[_ngcontent-%COMP%]   a[_ngcontent-%COMP%]:hover {color: #0074ad;}\r\n.poweredbot[_ngcontent-%COMP%] {position:fixed; left:0; bottom:0; width:100%; background:#fff; z-index: 99; padding:6px 0;text-align: center;color: #000;font-size: .6rem;}\r\n.bottombtn[_ngcontent-%COMP%] {padding-bottom: 15px;}\r\n.btn[_ngcontent-%COMP%] {border-radius: 6px; font-size: 14px;background: #0074ad; line-height: 42px; height: 42px; border:1px solid #0074ad;}\r\n.b-color[_ngcontent-%COMP%] {color: #0074ad;}\r\n.gr-color[_ngcontent-%COMP%] {color: #707070}\r\n.pl-0[_ngcontent-%COMP%] {padding-left: 0 !important;}\r\nfooter[_ngcontent-%COMP%] {padding: 60px 0 30px 0;background: #36454f;}\r\nfooter[_ngcontent-%COMP%]   .container[_ngcontent-%COMP%] {max-width: 1140px;padding: 0;}\r\nfooter[_ngcontent-%COMP%]   h4[_ngcontent-%COMP%] {line-height: 1.2;font-size: 18px;font-weight: 700;color: #fff;margin-bottom: 20px;}\r\nselect.form-control[_ngcontent-%COMP%], select.input-field[_ngcontent-%COMP%] {-webkit-appearance: none;appearance: none;}\r\nselect[_ngcontent-%COMP%] {background: transparent;}\r\nselect.form-control[multiple][_ngcontent-%COMP%] {background-image: none !important;}\r\n.input-field[_ngcontent-%COMP%] {outline: none;border: 0 solid #eee;width: 100%;font-size: 14px;font-weight: normal;padding: 16px 15px;}\r\nlabel[_ngcontent-%COMP%] {font-size: 14px;font-weight: 700;color: #36454f;margin-bottom: 1rem}\r\ntable[_ngcontent-%COMP%] {border-collapse: collapse;border-spacing: 0;}\r\n.txtright[_ngcontent-%COMP%] {text-align: right !important;}\r\n.txtcenter[_ngcontent-%COMP%] {text-align: center !important;}\r\n@media (max-width: 374px) {  .homebanner[_ngcontent-%COMP%]   .owl-theme[_ngcontent-%COMP%]   .owl-nav.disabled[_ngcontent-%COMP%]    + .owl-dots[_ngcontent-%COMP%] {bottom: 48.8%;}  }\r\n.overlay-b[_ngcontent-%COMP%] {background: rgba(0, 0, 0, 0.6);position: fixed;left: 0;top: 0;width: 100%;height: 100%;z-index: 99999;}\r\n.feedback-popup[_ngcontent-%COMP%] {background: #fff;position: absolute;left:0;top:49px;width:100vw;height:110%;z-index: 99;margin:0;}\r\n.feedback-popup[_ngcontent-%COMP%]   .s-message[_ngcontent-%COMP%] {text-align: center;font-size: 14px;padding: 10px; position: relative;}\r\n.message[_ngcontent-%COMP%] {display: none;}\r\n.feedback-popup[_ngcontent-%COMP%]   .s-message[_ngcontent-%COMP%]   .txts[_ngcontent-%COMP%] {position:absolute; width: 100%; bottom: 10%; left: 0; text-align: center;}\r\n.feedback-popup[_ngcontent-%COMP%]   .s-message[_ngcontent-%COMP%]   .txts[_ngcontent-%COMP%]   .success-text[_ngcontent-%COMP%] {color: #000; font-size: 18px; font-weight: 700; margin-bottom:10px;}\r\n.feedback-popup[_ngcontent-%COMP%]   .s-message[_ngcontent-%COMP%]   .txts[_ngcontent-%COMP%]   .order-id[_ngcontent-%COMP%] {color: #000; font-size: 16px;}\r\n.botcont[_ngcontent-%COMP%] {padding:30px}\r\n.feedback-form[_ngcontent-%COMP%] {background:#f3f3f3; border-radius: 30px; padding: 30px;}\r\n.feedback-form[_ngcontent-%COMP%]   .head[_ngcontent-%COMP%] {font-size:14px; color:#333; font-weight: 600;}\r\n.feedback-popup[_ngcontent-%COMP%]   textarea.form-control[_ngcontent-%COMP%] {margin-bottom: 10px;padding: 10px; border-radius: 16px;font-size: 14px;}\r\n.feedback-popup[_ngcontent-%COMP%]   .btn[_ngcontent-%COMP%] {padding-left: 10px;padding-right: 10px;}\r\n.feedback-popup[_ngcontent-%COMP%]   .btn[_ngcontent-%COMP%]   i[_ngcontent-%COMP%] {color: #fff;}\r\n.success[_ngcontent-%COMP%] {position: absolute;left:0;top:0;width:100vw;height:100vh;z-index: 9999999;margin:0; background:url('/assets/images/success.gif') no-repeat top center #fff; display: none;}\r\n.txt-right[_ngcontent-%COMP%] {text-align:right;}\r\n.timeline[_ngcontent-%COMP%]{position: relative;}\r\n\r\n.timeline[_ngcontent-%COMP%] > li[_ngcontent-%COMP%]::before{content:'';position: absolute;width: 2px;background-color: #eee;top: -32px;bottom: 0;left:10px;}\r\n\r\n.timeline[_ngcontent-%COMP%] > li[_ngcontent-%COMP%]::after{text-align: center;z-index: 10;content:'';position: absolute;width: 22px;height: 22px;background-color: #fff;border-radius: 50%;top:0;left:0; border: 3px solid #eee;}\r\n.timeline[_ngcontent-%COMP%] > li.active[_ngcontent-%COMP%]::before{background-color: #0074ad;}\r\n.timeline[_ngcontent-%COMP%] > li.active1[_ngcontent-%COMP%]::before{background-color: #0074ad; display: none;}\r\n.timeline[_ngcontent-%COMP%] > li.active1[_ngcontent-%COMP%]::after{background-color: #0074ad;left:0; border: 3px solid #0074ad;}\r\n.timeline[_ngcontent-%COMP%] > li.active[_ngcontent-%COMP%]::after{background-color: #0074ad;left:0; border: 3px solid #0074ad;}\r\n.timeline[_ngcontent-%COMP%] > li.active[_ngcontent-%COMP%], .timeline[_ngcontent-%COMP%] > li.active1[_ngcontent-%COMP%]{color:#0074ad;}\r\n.timeline[_ngcontent-%COMP%] > li[_ngcontent-%COMP%]   img[_ngcontent-%COMP%]{display:none;}\r\n.timeline[_ngcontent-%COMP%] > li.active[_ngcontent-%COMP%]   img[_ngcontent-%COMP%]{position:absolute; left:6px; top:7px; z-index: 99; display: inline-block;}\r\n.timeline[_ngcontent-%COMP%] > li.active1[_ngcontent-%COMP%]   img[_ngcontent-%COMP%]{position:absolute; left:6px; top:7px; z-index: 99; display: inline-block;}\r\n.timeline[_ngcontent-%COMP%] > li[_ngcontent-%COMP%]{color: #666;}\r\n\r\n.timeline[_ngcontent-%COMP%] > li[_ngcontent-%COMP%]{counter-increment: item;padding: 1px 0 0 30px;margin-left: 0;min-height:44px;position: relative;background-color: white;list-style: none; font-weight: 700; line-height: 1.2;}\r\n.timeline[_ngcontent-%COMP%] > li[_ngcontent-%COMP%]:nth-last-child(1)::before{width: 0;}\r\n.timeline[_ngcontent-%COMP%] > li[_ngcontent-%COMP%]:first-child::before {width: 0 !important;}\r\n.timeline[_ngcontent-%COMP%] > li[_ngcontent-%COMP%]   span[_ngcontent-%COMP%] {display:block; font-weight: 400; padding-top: 4px; color: #666 !important;}\r\n.pl-10[_ngcontent-%COMP%] {padding-left:10px;}\r\n.order-summary-cont[_ngcontent-%COMP%] {background:#f9f9f9; position: absolute; z-index: 14; left: 0; top: 0; width: 100%; height:120%; padding: 49px 15px 15px 15px;}\r\n.order-summary-cont[_ngcontent-%COMP%]   .info[_ngcontent-%COMP%] {color:#0074AD; font-weight: 500; font-size:1rem; line-height: 49px; position: relative;}\r\n.order-summary-cont[_ngcontent-%COMP%]   .summary[_ngcontent-%COMP%] {background: #fff; border-radius: 12px; padding:10px 15px; margin:0 0 50px 0;}\r\n.order-summary-cont[_ngcontent-%COMP%]   .summary[_ngcontent-%COMP%]   .txt[_ngcontent-%COMP%] {font-weight: 400; color:#555; font-size:0.8rem; line-height: 1.4; margin:0 0 10px 30px; padding-right: 30px;}\r\n.order-summary-cont[_ngcontent-%COMP%]   .summary[_ngcontent-%COMP%]   .head[_ngcontent-%COMP%] {display:block; font-weight: 500; color:#333; font-size:0.9rem; line-height: 24px; margin:0 0 2px 0;}\r\n.order-summary-cont[_ngcontent-%COMP%]   .summary[_ngcontent-%COMP%]   .head[_ngcontent-%COMP%]   img[_ngcontent-%COMP%] {float:left; width:20px; height: 20px; margin:3px 8px 0 0;}\r\n.order-summary-cont[_ngcontent-%COMP%]   .summary[_ngcontent-%COMP%]   .items-details[_ngcontent-%COMP%] {margin-top: 20px;}\r\n.order-summary-cont[_ngcontent-%COMP%]   .summary[_ngcontent-%COMP%]   .items-details[_ngcontent-%COMP%]   table[_ngcontent-%COMP%] {width:100%;}\r\n.order-summary-cont[_ngcontent-%COMP%]   .summary[_ngcontent-%COMP%]   .items-details[_ngcontent-%COMP%]   table[_ngcontent-%COMP%]   tr[_ngcontent-%COMP%]   td[_ngcontent-%COMP%] {font-weight: 400; color:#333; font-size:0.77rem; padding:5px 0; vertical-align: top;}\r\n.order-summary-cont[_ngcontent-%COMP%]   .summary[_ngcontent-%COMP%]   .items-details[_ngcontent-%COMP%]   table[_ngcontent-%COMP%]   tr[_ngcontent-%COMP%]   td[_ngcontent-%COMP%]   strong[_ngcontent-%COMP%] {font-weight: 700; font-size:0.9rem;}\r\n.discount[_ngcontent-%COMP%] {color:#0074AD !important;}\r\n.btn[_ngcontent-%COMP%] {border-radius: 14px; font-size: 14px;background: #0074ad;  height: 42px; border:1px solid #0074ad;}\r\n.text-right[_ngcontent-%COMP%] {text-align: right;}\r\n.text-center[_ngcontent-%COMP%] {text-align: center !important;}\r\n.f-cat[_ngcontent-%COMP%] {margin-top:4px; width: 12px; height: 12px; border:1px solid #F55F4B; border-radius:3px; background:#fff; text-align: center;}\r\n.f-cat[_ngcontent-%COMP%]   span[_ngcontent-%COMP%] {display:inline-block; width: 6px; height: 6px; border-radius: 50%; background:#F55F4B; margin:0 0 6px 0;}\r\n.non-veg[_ngcontent-%COMP%] {border-color:#F55F4B !important;}\r\n.non-veg[_ngcontent-%COMP%]   span[_ngcontent-%COMP%] {background:#F55F4B !important;}\r\n.veg[_ngcontent-%COMP%] {border-color:#57F18C !important;}\r\n.veg[_ngcontent-%COMP%]   span[_ngcontent-%COMP%] {background:#57F18C !important;}\r\n.semibold[_ngcontent-%COMP%] {font-weight:600 !important;}\r\n.bold[_ngcontent-%COMP%] {font-weight:700 !important;}\r\n.blue[_ngcontent-%COMP%] {color:#0074AD !important;}\r\n.close-btn[_ngcontent-%COMP%] {position: absolute;top: 12px;right: 0;background: #0074AD;color: #fff;width: 26px;height: 26px;line-height: 21px;border-radius: 50%;text-align: center;font-weight: 400;}\r\n.info-window[_ngcontent-%COMP%] {background:#f9f9f9; position: fixed; z-index: 14; left: 0; bottom: 0; width: 100%; height:calc(100vh - 49px); padding: 30px 15px 50px 15px;}\r\n.info-popup[_ngcontent-%COMP%] {margin:20px 0 0 0; padding: 0 8px;}\r\n.info-popup[_ngcontent-%COMP%]   .topimg[_ngcontent-%COMP%] {background: #fff; border-radius: 20px; text-align: center; margin-bottom: 20px;}\r\n.info-popup[_ngcontent-%COMP%]   .infotext[_ngcontent-%COMP%]   p[_ngcontent-%COMP%] {font-weight: 400; font-size: 12px; line-height: 1.3; margin:6px 0 10px 0;}\r\n.info-popup[_ngcontent-%COMP%]   .infotext[_ngcontent-%COMP%]   p[_ngcontent-%COMP%]   strong[_ngcontent-%COMP%] {font-weight: 700; font-size: 13px; display: block; margin-bottom: 5px;}\r\n.driverdet[_ngcontent-%COMP%] {background: #fff; padding:15px; border-radius: 10px; font-weight: 400; font-size: 13px;}\r\n.driverdet[_ngcontent-%COMP%]   strong[_ngcontent-%COMP%] {font-weight: 700;}\r\n.driverdet[_ngcontent-%COMP%]   .vc[_ngcontent-%COMP%] {color:#0074ad; float: right;}\r\n.driverdet[_ngcontent-%COMP%]   .bt[_ngcontent-%COMP%] {font-weight: 400; font-size: 12px;}\r\n.driverdet[_ngcontent-%COMP%]   .bt[_ngcontent-%COMP%]   .tempr[_ngcontent-%COMP%] {float: right;}\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImN1c3RvbWVyLXRyYWNraW5nLXBhZ2UuY29tcG9uZW50LmNzcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLFdBQVcsQ0FBQyxnQkFBZ0IsQ0FBQyxrQkFBa0IsQ0FBQyxXQUFXLENBQUMsZ0JBQWdCLENBQUM7QUFDcEYsUUFBUSxjQUFjLENBQUM7QUFDdkIsY0FBYyxxQkFBcUIsRUFBRSxZQUFZLENBQUM7QUFDbEQsa0JBQWtCLFVBQVUsQ0FBQztBQUM3QixhQUFhLGNBQWMsQ0FBQztBQUM1QixTQUFTLGtCQUFrQixDQUFDO0FBQzVCLGVBQWUsc0JBQXNCLENBQUMsc0JBQXNCLENBQUMsa0JBQWtCLENBQUMsZUFBZSxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsa0JBQWtCLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQztBQUMzSixxQkFBcUIsc0JBQXNCLENBQUMsZ0JBQWdCLENBQUMsa0JBQWtCLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLGtCQUFrQixDQUFDLFFBQVEsQ0FBQyx5QkFBeUIsQ0FBQyxXQUFXLENBQUM7QUFDL0wsZ0NBQWdDLGtCQUFrQixDQUFDO0FBQ25ELGdEQUFnRCx5QkFBeUIsQ0FBQyxxQkFBcUIsQ0FBQztBQUNoRyxzREFBc0QsVUFBVSxDQUFDO0FBQ2pFLDhFQUE4RTtBQUU5RSxpQkFBaUI7QUFDakIsTUFBTSx1QkFBdUIsQ0FBQztBQUM5QixNQUFNLG1CQUFtQixDQUFDLGVBQWUsQ0FBQyxnQkFBZ0IsQ0FBQyxjQUFjLENBQUMsa0JBQWtCLENBQUMsa0JBQWtCLENBQUMsbUJBQW1CLENBQUM7QUFDcEksR0FBRyxTQUFTLENBQUMsVUFBVSxDQUFDLG1CQUFtQixDQUFDO0FBQzVDLEdBQUcscUJBQXFCLENBQUMsY0FBYyxDQUFDLG1CQUFtQixDQUFDO0FBQzVELFNBQVMsY0FBYyxDQUFDLHFCQUFxQixDQUFDO0FBQzlDLFdBQVcsZ0JBQWdCLENBQUM7QUFDNUIsUUFBUSxnQkFB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QUFDO0FBQ3JILFVBQVUsK0JBQStCLENBQUM7QUFDMUMsZUFBZSw2QkFBNkIsQ0FBQztBQUM3QyxNQUFNLCtCQUErQixDQUFDO0FBQ3RDLFdBQVcsNkJBQTZCLENBQUM7QUFDekMsV0FBVywwQkFBMEIsQ0FBQztBQUN0QyxPQUFPLDBCQUEwQixDQUFDO0FBQ2xDLE9BQU8sd0JBQXdCLENBQUM7QUFDaEMsWUFBWSxrQkFBa0IsQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLG1CQUFtQixDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsWUFBWSxDQUFDLGlCQUFpQixDQUFDLGtCQUFrQixDQUFDLGtCQUFrQixDQUFDLGdCQUFnQixDQUFDO0FBRXBMLGNBQWMsa0JBQWtCLEVBQUUsZUFBZSxFQUFFLFdBQVcsRUFBRSxPQUFPLEVBQUUsU0FBUyxFQUFFLFdBQVcsRUFBRSx5QkFBeUIsRUFBRSw0QkFBNEIsQ0FBQztBQUV6SixhQUFhLGlCQUFpQixFQUFFLGNBQWMsQ0FBQztBQUMvQyxxQkFBcUIsZ0JBQWdCLEVBQUUsbUJBQW1CLEVBQUUsa0JBQWtCLEVBQUUsbUJBQW1CLENBQUM7QUFFcEcseUJBQXlCLGdCQUFnQixFQUFFLGVBQWUsRUFBRSxnQkFBZ0IsRUFBRSxtQkFBbUIsQ0FBQztBQUNsRyxnQ0FBZ0MsZ0JBQWdCLEVBQUUsZUFBZSxFQUFFLGNBQWMsRUFBRSxrQkFBa0IsQ0FBQztBQUV0RyxZQUFZLGdCQUFnQixFQUFFLFlBQVksRUFBRSxtQkFBbUIsRUFBRSxnQkFBZ0IsRUFBRSxlQUFlLENBQUM7QUFDbkcsbUJBQW1CLGdCQUFnQixDQUFDO0FBQ3BDLGdCQUFnQixhQUFhLEVBQUUsWUFBWSxDQUFDO0FBQzVDLGdCQUFnQixnQkFBZ0IsRUFBRSxlQUFlLENBQUM7QUFDbEQsdUJBQXVCLFlBQVksQ0FBQyIsImZpbGUiOiJjdXN0b21lci10cmFja2luZy1wYWdlLmNvbXBvbmVudC5jc3MiLCJzb3VyY2VzQ29udGVudCI6WyIuY29udCB7d2lkdGg6IDEwMCU7bWF4LXdpZHRoOiAzNTBweDt0ZXh0LWFsaWduOiBjZW50ZXI7Y29sb3I6ICNFRUU7b3ZlcmZsb3c6IGhpZGRlbjt9XHJcbi5zdGFycyB7cGFkZGluZzoyMHB4IDA7fVxyXG4uc3Rhci1yYXRpbmcge2Rpc3BsYXk6IGlubGluZS1ibG9jazsgbWFyZ2luOjAgNXB4O31cclxuLnN0YXItcmF0aW5nIGltZyB7d2lkdGg6MzhweDt9XHJcbi5jb250YWluZXJyIHttYXJnaW46IDAgYXV0bzt9XHJcbi5yb3VuZGQge3Bvc2l0aW9uOiByZWxhdGl2ZTt9XHJcbi5yb3VuZGQgbGFiZWwge2JhY2tncm91bmQtY29sb3I6ICNmZmY7Ym9yZGVyOiAxcHggc29saWQgI2NjYztib3JkZXItcmFkaXVzOiA1MCU7Y3Vyc29yOiBwb2ludGVyO2hlaWdodDogMjhweDtsZWZ0OiAwO3Bvc2l0aW9uOiBhYnNvbHV0ZTt0b3A6IDA7d2lkdGg6IDI4cHg7fVxyXG4ucm91bmRkIGxhYmVsOmFmdGVyIHtib3JkZXI6IDJweCBzb2xpZCAjZmZmO2JvcmRlci10b3A6IG5vbmU7Ym9yZGVyLXJpZ2h0OiBub25lO2NvbnRlbnQ6IFwiXCI7aGVpZ2h0OiA2cHg7bGVmdDogN3B4O29wYWNpdHk6IDA7cG9zaXRpb246IGFic29sdXRlO3RvcDogOHB4O3RyYW5zZm9ybTogcm90YXRlKC00NWRlZyk7d2lkdGg6IDEycHg7fVxyXG4ucm91bmRkIGlucHV0W3R5cGU9XCJjaGVja2JveFwiXSB7dmlzaWJpbGl0eTogaGlkZGVuO31cclxuLnJvdW5kZCBpbnB1dFt0eXBlPVwiY2hlY2tib3hcIl06Y2hlY2tlZCArIGxhYmVsIHtiYWNrZ3JvdW5kLWNvbG9yOiAjNjZiYjZhO2JvcmRlci1jb2xvcjogIzY2YmI2YTt9XHJcbi5yb3VuZGQgaW5wdXRbdHlwZT1cImNoZWNrYm94XCJdOmNoZWNrZWQgKyBsYWJlbDphZnRlciB7b3BhY2l0eTogMTt9XHJcbi8qIFlvdSBjYW4gYWRkIGdsb2JhbCBzdHlsZXMgdG8gdGhpcyBmaWxlLCBhbmQgYWxzbyBpbXBvcnQgb3RoZXIgc3R5bGUgZmlsZXMgKi9cclxuQGNoYXJzZXQgXCJ1dGYtOFwiO1xyXG4vKiBDU1MgRG9jdW1lbnQgKi9cclxuaHRtbCB7c2Nyb2xsLWJlaGF2aW9yOiBzbW9vdGg7fVxyXG5ib2R5IHtmb250LWZhbWlseTogUm9ib3RvO2ZvbnQtc2l6ZTogMTRweDtmb250LXdlaWdodDogNDAwO2NvbG9yOiAjMzY0NTRmO3Bvc2l0aW9uOiByZWxhdGl2ZTtvdmVyZmxvdy14OiBoaWRkZW47YmFja2dyb3VuZDogI2Y4ZjhmODt9XHJcbioge21hcmdpbjogMDtwYWRkaW5nOiAwO3RyYW5zaXRpb246IGFsbCAuNXM7fVxyXG5hIHt0ZXh0LWRlY29yYXRpb246IG5vbmU7Y29sb3I6ICMzNGI4YzA7dHJhbnNpdGlvbjogYWxsIC41czt9XHJcbmE6aG92ZXIge2NvbG9yOiAjZTU0ZTM1O3RleHQtZGVjb3JhdGlvbjogbm9uZTt9XHJcbmIsIHN0cm9uZyB7Zm9udC13ZWlnaHQ6IDcwMDt9XHJcbnVsLCBvbCB7bGlzdC1zdHlsZTogbm9uZTttYXJnaW46IDA7fVxyXG5pbWcge2hlaWdodDogYXV0bzt3aWR0aDogYXV0bzttYXgtd2lkdGg6IDEwMCU7fVxyXG5pbWcsIGEge291dGxpbmU6IG5vbmU7Ym94LXNoYWRvdzogbm9uZTtib3JkZXI6IDA7fVxyXG5oZWFkZXIge3dpZHRoOiAxMDAlO2hlaWdodDogNDlweDsgYmFja2dyb3VuZDogI2ZmZjtwb3NpdGlvbjogZml4ZWQ7IHRvcDowOyB6LWluZGV4OiAxMDA7IC8qYm94LXNoYWRvdzogMCAwIDZweCAwIHJnYmEoMCwgMCwgMCwgLjE1KTsqLyBwYWRkaW5nOiAxMHB4O31cclxuaGVhZGVyIC5iYWNrYXJyb3cge3Bvc2l0aW9uOiBhYnNvbHV0ZTtsZWZ0OiAwO3RvcDogMDt3aWR0aDogNDlweDtoZWlnaHQ6IDQ5cHg7cGFkZGluZzogMTBweDt9XHJcbmhlYWRlciAubG9nbyB7cG9zaXRpb246IGFic29sdXRlO2xlZnQ6IDUwJTt0b3A6IDA7d2lkdGg6IDIwMHB4O2hlaWdodDogNDlweDttYXJnaW4tbGVmdDogLTEwMHB4O3RleHQtYWxpZ246IGNlbnRlcn1cclxuaGVhZGVyIC5hbGVydCB7cG9zaXRpb246IGFic29sdXRlO3JpZ2h0OiAwO3RvcDogMDt3aWR0aDogNDlweDtoZWlnaHQ6IDQ5cHg7cGFkZGluZzogMTBweDt9XHJcbi5nbWFwIHtoZWlnaHQ6IDUwdmg7YmFja2dyb3VuZDogI2VlZTtwb3NpdGlvbjogcmVsYXRpdmU7IG1hcmdpbi10b3A6NDlweDt9XHJcbi5nbWFwIGltZyB7d2lkdGg6IDEwMCU7aGVpZ2h0OiAxMDAlO31cclxuLmdtYXAgLnBvd2VyZWQge2JvcmRlcjogMXB4IHNvbGlkICNjY2M7YmFja2dyb3VuZDogI2ZmZjtwYWRkaW5nOiAzcHg7Ym9yZGVyLXJhZGl1czogNnB4O2ZvbnQtc2l6ZTogMTFweDtsaW5lLWhlaWdodDogMTZweDtwb3NpdGlvbjogYWJzb2x1dGU7cmlnaHQ6IDE1cHg7dG9wOiAxNXB4O3otaW5kZXg6IDg7fVxyXG4uZ21hcCAucG93ZXJlZCBpbWcge2Zsb2F0OiByaWdodDt3aWR0aDogMjBweDttYXJnaW46IDA7fVxyXG4uZ21hcCAucmVjZW50ZXIge2JhY2tncm91bmQ6ICNmNWY1ZjU7Ym9yZGVyLXJhZGl1czogNTAlO2xpbmUtaGVpZ2h0OiAzNnB4O3Bvc2l0aW9uOiBhYnNvbHV0ZTsgd2lkdGg6IDQycHg7IGhlaWdodDogNDJweDtyaWdodDogMTVweDtib3R0b206IDQ1cHg7ei1pbmRleDogODsgdGV4dC1hbGlnbjogY2VudGVyO31cclxuLmdtYXAgLnJlY2VudGVyIHN2ZyB7d2lkdGg6MTZweDsgaGVpZ2h0OiAxNnB4O31cclxuLm9yZGVyY29udCB7YmFja2dyb3VuZDogI2Y1ZjVmNTtib3JkZXItcmFkaXVzOiAzMHB4IDMwcHggMCAwO3BhZGRpbmc6IDEwcHggOHB4IDE2cHggOHB4O3Bvc2l0aW9uOiByZWxhdGl2ZTttYXJnaW4tdG9wOiAtMzBweDt9XHJcbi5vcmRlcmNvbnQgLmNvbnRhaW5lciB7bWF4LXdpZHRoOiAxMDAlO3BhZGRpbmc6IDAgMTBweDttYXJnaW46IDAgYXV0bztwb3NpdGlvbjogcmVsYXRpdmU7fVxyXG4ub3JkZXJjb250IC5jb250YWluZXIgaDIge2ZvbnQtc2l6ZTogMXJlbTtjb2xvcjogIzFkMWQxZDsgbWFyZ2luLWJvdHRvbTogMTBweDt9XHJcbi5vcmRlcmNvbnQgLmNvbnRhaW5lciBoMiBzcGFuIHtmbG9hdDogcmlnaHQ7Y29sb3I6ICMxZDFkMWQ7fVxyXG4ub3JkZXJjb250IC5jb250YWluZXIgLmFkZHJlc3Mge2FsaWduLWl0ZW1zOiBjZW50ZXI7YmFja2dyb3VuZDogI2Y1ZjVmNTtib3JkZXItcmFkaXVzOiAxNXB4O3BhZGRpbmc6IDhweCAxMnB4O2ZvbnQtc2l6ZTogLjhyZW07bGluZS1oZWlnaHQ6IDEuMjttYXJnaW46IDAgMCAxMHB4IDA7fVxyXG4ub3JkZXJjb250IC5jb250YWluZXIgLmFkZHJlc3MgaW1nIHttYXgtd2lkdGg6IDMwcHg7fVxyXG4ub3JkZXJjb250IC5jb250YWluZXIgLmFkZHJlc3Mgc3Ryb25nIHtmb250LXdlaWdodDogNjAwO2Rpc3BsYXk6IGJsb2NrO21hcmdpbi1ib3R0b206IDRweDt9XHJcbi5vcmRlcmNvbnQgLmNvbnRhaW5lciAuYWRkcmVzcyAuYy1hZGRyZXNzIHtmb250LXdlaWdodDogNDAwOyBwYWRkaW5nLWxlZnQ6IDZweDsgZm9udC1zaXplOiAwLjc1cmVtOyBsaW5lLWhlaWdodDogMS4zO31cclxuLm9yZGVyY29udCAuY29udGFpbmVyIC5vcmRlcnN0YXR1cyB7YWxpZ24taXRlbXM6IGNlbnRlcjtiYWNrZ3JvdW5kOiAjZmZmO2JvcmRlci1yYWRpdXM6IDE1cHg7cGFkZGluZzogMTBweCAxNXB4IDJweCAxNXB4O21hcmdpbjogMTBweCAwIDEwcHggMDtmb250LXNpemU6IC43NXJlbTtsaW5lLWhlaWdodDogMS41O31cclxuLm9yZGVyY29udCAuY29udGFpbmVyIC5vcmRlcnN0YXR1cyAgLm9yZGVyc3RhdHVzLWl0bXMge3RleHQtYWxpZ246IGNlbnRlcjtwYWRkaW5nOjRweCAwIWltcG9ydGFudDtmb250LXNpemU6IC43NXJlbTtsaW5lLWhlaWdodDogMS41O31cclxuLm9yZGVyY29udCAuY29udGFpbmVyIC5vcmRlcnN0YXR1cyAgLm9yZGVyc3RhdHVzLWl0bXMgaW1nIHt3aWR0aDoyMnB4OyBoZWlnaHQ6MjJweDsgZGlzcGxheTogaW5saW5lLWJsb2NrOyBtYXJnaW4tYm90dG9tOiA1cHg7fVxyXG4ub3JkZXJjb250IC5jb250YWluZXIgLm9yZGVyc3RhdHVzIC5ncmV5e29wYWNpdHk6IDAuNTt9XHJcbi5vcmRlcmNvbnQgLmNvbnRhaW5lciAub3JkZXJzdGF0dXMgIC5vcmRlcnN0YXR1cy1pdG1zIC5ncmV5IHAge2NvbG9yOiNjY2N9XHJcbiAgLm9yZGVyY29udCAuY29udGFpbmVyIC5vcmRlcnN0YXR1cyAgLm9yZGVyc3RhdHVzLWl0bXMgcCB7Zm9udC13ZWlnaHQ6IDcwMDt9XHJcbi5vcmRlcmNvbnQgLmNvbnRhaW5lciAub3JkZXJzdGF0dXMgaDMge21hcmdpbi10b3A6IDEwcHg7Zm9udC1zaXplOiAwLjlyZW07fVxyXG4ub3JkZXJjb250IC5jb250YWluZXIgLm9yZGVyc3RhdHVzIC5yaWRlciB7dGV4dC1hbGlnbjogY2VudGVyO2NvbG9yOiAjNzA3MDcwOyBtYXJnaW4tYm90dG9tOiA4cHg7fVxyXG4ub3JkZXJjb250IC5jb250YWluZXIgLnVzZXIge2JhY2tncm91bmQ6ICNmZmY7Ym9yZGVyLXJhZGl1czogMTVweDtwYWRkaW5nOjZweCAxMHB4O21hcmdpbjogMCAwIDEwcHggMDt9XHJcbi5vcmRlcmNvbnQgLmNvbnRhaW5lciAudXNlciAucm93IHthbGlnbi1pdGVtczogY2VudGVyO31cclxuLm9yZGVyY29udCAuY29udGFpbmVyIC51c2VyIC51LXBpYyB7cGFkZGluZy1sZWZ0OiA2cHg7cGFkZGluZy1yaWdodDogMDt9XHJcbi5vcmRlcmNvbnQgLmNvbnRhaW5lciAudXNlciAudS1waWMgaW1nIHtib3JkZXItcmFkaXVzOiA1MCU7bWF4LXdpZHRoOiA0OHB4O31cclxuLm9yZGVyY29udCAuY29udGFpbmVyIC51c2VyIC51LW5hbWUge2ZvbnQtc2l6ZTogLjc1cmVtO2xpbmUtaGVpZ2h0OiAxLjM7cGFkZGluZy1sZWZ0OiAxMHB4O31cclxuLm9yZGVyY29udCAuY29udGFpbmVyIC51c2VyIC51LW5hbWUgc3Ryb25nIHtmb250LXdlaWdodDogNjAwO2Rpc3BsYXk6IGJsb2NrO21hcmdpbi1ib3R0b206IDRweDt9XHJcbi5vcmRlcmNvbnQgLmNvbnRhaW5lciAudXNlciAudS1uYW1lIGltZyB7d2lkdGg6IDE2cHg7bWFyZ2luOiAtMnB4IDAgMCA2cHg7fVxyXG4ub3JkZXJjb250IC5jb250YWluZXIgLnVzZXIgLmNhbGxidG4ge3BhZGRpbmctcmlnaHQ6IDA7fVxyXG4ub3JkZXJjb250IC5jb250YWluZXIgLnVzZXIgLmNhbGxidG4gaW1nIHttYXgtd2lkdGg6IDQycHg7fVxyXG4ubWwtNiB7bWFyZ2luLWxlZnQ6NnB4O31cclxuLmlzc3VlIHt0ZXh0LWFsaWduOiBjZW50ZXI7bWFyZ2luLXRvcDogMTJweDtjb2xvcjogIzcwNzA3MDtmb250LXNpemU6IC44MnJlbTtsaW5lLWhlaWdodDogMS4zO31cclxuLmlzc3VlIGEge2NvbG9yOiAjMDAwO2ZvbnQtd2VpZ2h0OiA3MDA7fVxyXG4uaXNzdWUgYTpob3ZlciB7Y29sb3I6ICMwMDc0YWQ7fVxyXG4ucG93ZXJlZGJvdCB7cG9zaXRpb246Zml4ZWQ7IGxlZnQ6MDsgYm90dG9tOjA7IHdpZHRoOjEwMCU7IGJhY2tncm91bmQ6I2ZmZjsgei1pbmRleDogOTk7IHBhZGRpbmc6NnB4IDA7dGV4dC1hbGlnbjogY2VudGVyO2NvbG9yOiAjMDAwO2ZvbnQtc2l6ZTogLjZyZW07fVxyXG4uYm90dG9tYnRuIHtwYWRkaW5nLWJvdHRvbTogMTVweDt9XHJcbi5idG4ge2JvcmRlci1yYWRpdXM6IDZweDsgZm9udC1zaXplOiAxNHB4O2JhY2tncm91bmQ6ICMwMDc0YWQ7IGxpbmUtaGVpZ2h0OiA0MnB4OyBoZWlnaHQ6IDQycHg7IGJvcmRlcjoxcHggc29saWQgIzAwNzRhZDt9XHJcbi5iLWNvbG9yIHtjb2xvcjogIzAwNzRhZDt9XHJcbi5nci1jb2xvciB7Y29sb3I6ICM3MDcwNzB9XHJcbi5wbC0wIHtwYWRkaW5nLWxlZnQ6IDAgIWltcG9ydGFudDt9XHJcbmZvb3RlciB7cGFkZGluZzogNjBweCAwIDMwcHggMDtiYWNrZ3JvdW5kOiAjMzY0NTRmO31cclxuZm9vdGVyIC5jb250YWluZXIge21heC13aWR0aDogMTE0MHB4O3BhZGRpbmc6IDA7fVxyXG5mb290ZXIgaDQge2xpbmUtaGVpZ2h0OiAxLjI7Zm9udC1zaXplOiAxOHB4O2ZvbnQtd2VpZ2h0OiA3MDA7Y29sb3I6ICNmZmY7bWFyZ2luLWJvdHRvbTogMjBweDt9XHJcbnNlbGVjdC5mb3JtLWNvbnRyb2wsIHNlbGVjdC5pbnB1dC1maWVsZCB7LW1vei1hcHBlYXJhbmNlOiBub25lOy13ZWJraXQtYXBwZWFyYW5jZTogbm9uZTthcHBlYXJhbmNlOiBub25lO31cclxuc2VsZWN0IHtiYWNrZ3JvdW5kOiB0cmFuc3BhcmVudDt9XHJcbnNlbGVjdC5mb3JtLWNvbnRyb2xbbXVsdGlwbGVdIHtiYWNrZ3JvdW5kLWltYWdlOiBub25lICFpbXBvcnRhbnQ7fVxyXG4uaW5wdXQtZmllbGQge291dGxpbmU6IG5vbmU7Ym9yZGVyOiAwIHNvbGlkICNlZWU7d2lkdGg6IDEwMCU7Zm9udC1zaXplOiAxNHB4O2ZvbnQtd2VpZ2h0OiBub3JtYWw7cGFkZGluZzogMTZweCAxNXB4O31cclxubGFiZWwge2ZvbnQtc2l6ZTogMTRweDtmb250LXdlaWdodDogNzAwO2NvbG9yOiAjMzY0NTRmO21hcmdpbi1ib3R0b206IDFyZW19XHJcbnRhYmxlIHtib3JkZXItY29sbGFwc2U6IGNvbGxhcHNlO2JvcmRlci1zcGFjaW5nOiAwO31cclxuLnR4dHJpZ2h0IHt0ZXh0LWFsaWduOiByaWdodCAhaW1wb3J0YW50O31cclxuLnR4dGNlbnRlciB7dGV4dC1hbGlnbjogY2VudGVyICFpbXBvcnRhbnQ7fVxyXG5AbWVkaWEgKG1heC13aWR0aDogMzc0cHgpIHsgIC5ob21lYmFubmVyIC5vd2wtdGhlbWUgLm93bC1uYXYuZGlzYWJsZWQgKyAub3dsLWRvdHMge2JvdHRvbTogNDguOCU7fSAgfVxyXG4ub3ZlcmxheS1iIHtiYWNrZ3JvdW5kOiByZ2JhKDAsIDAsIDAsIDAuNik7cG9zaXRpb246IGZpeGVkO2xlZnQ6IDA7dG9wOiAwO3dpZHRoOiAxMDAlO2hlaWdodDogMTAwJTt6LWluZGV4OiA5OTk5OTt9XHJcbi5mZWVkYmFjay1wb3B1cCB7YmFja2dyb3VuZDogI2ZmZjtwb3NpdGlvbjogYWJzb2x1dGU7bGVmdDowO3RvcDo0OXB4O3dpZHRoOjEwMHZ3O2hlaWdodDoxMTAlO3otaW5kZXg6IDk5O21hcmdpbjowO31cclxuLmZlZWRiYWNrLXBvcHVwIC5zLW1lc3NhZ2Uge3RleHQtYWxpZ246IGNlbnRlcjtmb250LXNpemU6IDE0cHg7cGFkZGluZzogMTBweDsgcG9zaXRpb246IHJlbGF0aXZlO31cclxuLm1lc3NhZ2Uge2Rpc3BsYXk6IG5vbmU7fVxyXG4uZmVlZGJhY2stcG9wdXAgLnMtbWVzc2FnZSAudHh0cyB7cG9zaXRpb246YWJzb2x1dGU7IHdpZHRoOiAxMDAlOyBib3R0b206IDEwJTsgbGVmdDogMDsgdGV4dC1hbGlnbjogY2VudGVyO31cclxuLmZlZWRiYWNrLXBvcHVwIC5zLW1lc3NhZ2UgLnR4dHMgLnN1Y2Nlc3MtdGV4dCB7Y29sb3I6ICMwMDA7IGZvbnQtc2l6ZTogMThweDsgZm9udC13ZWlnaHQ6IDcwMDsgbWFyZ2luLWJvdHRvbToxMHB4O31cclxuLmZlZWRiYWNrLXBvcHVwIC5zLW1lc3NhZ2UgLnR4dHMgLm9yZGVyLWlkIHtjb2xvcjogIzAwMDsgZm9udC1zaXplOiAxNnB4O31cclxuLmJvdGNvbnQge3BhZGRpbmc6MzBweH1cclxuLmZlZWRiYWNrLWZvcm0ge2JhY2tncm91bmQ6I2YzZjNmMzsgYm9yZGVyLXJhZGl1czogMzBweDsgcGFkZGluZzogMzBweDt9XHJcbi5mZWVkYmFjay1mb3JtIC5oZWFkIHtmb250LXNpemU6MTRweDsgY29sb3I6IzMzMzsgZm9udC13ZWlnaHQ6IDYwMDt9XHJcbi5mZWVkYmFjay1wb3B1cCB0ZXh0YXJlYS5mb3JtLWNvbnRyb2wge21hcmdpbi1ib3R0b206IDEwcHg7cGFkZGluZzogMTBweDsgYm9yZGVyLXJhZGl1czogMTZweDtmb250LXNpemU6IDE0cHg7fVxyXG4uZmVlZGJhY2stcG9wdXAgLmJ0biB7cGFkZGluZy1sZWZ0OiAxMHB4O3BhZGRpbmctcmlnaHQ6IDEwcHg7fVxyXG4uZmVlZGJhY2stcG9wdXAgLmJ0biBpIHtjb2xvcjogI2ZmZjt9XHJcbi5zdWNjZXNzIHtwb3NpdGlvbjogYWJzb2x1dGU7bGVmdDowO3RvcDowO3dpZHRoOjEwMHZ3O2hlaWdodDoxMDB2aDt6LWluZGV4OiA5OTk5OTk5O21hcmdpbjowOyBiYWNrZ3JvdW5kOnVybCgnL2Fzc2V0cy9pbWFnZXMvc3VjY2Vzcy5naWYnKSBuby1yZXBlYXQgdG9wIGNlbnRlciAjZmZmOyBkaXNwbGF5OiBub25lO31cclxuLnR4dC1yaWdodCB7dGV4dC1hbGlnbjpyaWdodDt9XHJcbi50aW1lbGluZXtwb3NpdGlvbjogcmVsYXRpdmU7fVxyXG4vKkxpbmUqL1xyXG4udGltZWxpbmU+bGk6OmJlZm9yZXtjb250ZW50OicnO3Bvc2l0aW9uOiBhYnNvbHV0ZTt3aWR0aDogMnB4O2JhY2tncm91bmQtY29sb3I6ICNlZWU7dG9wOiAtMzJweDtib3R0b206IDA7bGVmdDoxMHB4O31cclxuLypDaXJjbGUqL1xyXG4udGltZWxpbmU+bGk6OmFmdGVye3RleHQtYWxpZ246IGNlbnRlcjt6LWluZGV4OiAxMDtjb250ZW50OicnO3Bvc2l0aW9uOiBhYnNvbHV0ZTt3aWR0aDogMjJweDtoZWlnaHQ6IDIycHg7YmFja2dyb3VuZC1jb2xvcjogI2ZmZjtib3JkZXItcmFkaXVzOiA1MCU7dG9wOjA7bGVmdDowOyBib3JkZXI6IDNweCBzb2xpZCAjZWVlO31cclxuLnRpbWVsaW5lPmxpLmFjdGl2ZTo6YmVmb3Jle2JhY2tncm91bmQtY29sb3I6ICMwMDc0YWQ7fVxyXG4udGltZWxpbmU+bGkuYWN0aXZlMTo6YmVmb3Jle2JhY2tncm91bmQtY29sb3I6ICMwMDc0YWQ7IGRpc3BsYXk6IG5vbmU7fVxyXG4udGltZWxpbmU+bGkuYWN0aXZlMTo6YWZ0ZXJ7YmFja2dyb3VuZC1jb2xvcjogIzAwNzRhZDtsZWZ0OjA7IGJvcmRlcjogM3B4IHNvbGlkICMwMDc0YWQ7fVxyXG4udGltZWxpbmU+bGkuYWN0aXZlOjphZnRlcntiYWNrZ3JvdW5kLWNvbG9yOiAjMDA3NGFkO2xlZnQ6MDsgYm9yZGVyOiAzcHggc29saWQgIzAwNzRhZDt9XHJcbi50aW1lbGluZT5saS5hY3RpdmUsIC50aW1lbGluZT5saS5hY3RpdmUxe2NvbG9yOiMwMDc0YWQ7fVxyXG4udGltZWxpbmU+bGkgaW1ne2Rpc3BsYXk6bm9uZTt9XHJcbi50aW1lbGluZT5saS5hY3RpdmUgaW1ne3Bvc2l0aW9uOmFic29sdXRlOyBsZWZ0OjZweDsgdG9wOjdweDsgei1pbmRleDogOTk7IGRpc3BsYXk6IGlubGluZS1ibG9jazt9XHJcbi50aW1lbGluZT5saS5hY3RpdmUxIGltZ3twb3NpdGlvbjphYnNvbHV0ZTsgbGVmdDo2cHg7IHRvcDo3cHg7IHotaW5kZXg6IDk5OyBkaXNwbGF5OiBpbmxpbmUtYmxvY2s7fVxyXG4udGltZWxpbmU+bGl7Y29sb3I6ICM2NjY7fVxyXG4vKkNvbnRlbnQqL1xyXG4udGltZWxpbmU+bGl7Y291bnRlci1pbmNyZW1lbnQ6IGl0ZW07cGFkZGluZzogMXB4IDAgMCAzMHB4O21hcmdpbi1sZWZ0OiAwO21pbi1oZWlnaHQ6NDRweDtwb3NpdGlvbjogcmVsYXRpdmU7YmFja2dyb3VuZC1jb2xvcjogd2hpdGU7bGlzdC1zdHlsZTogbm9uZTsgZm9udC13ZWlnaHQ6IDcwMDsgbGluZS1oZWlnaHQ6IDEuMjt9XHJcbi50aW1lbGluZT5saTpudGgtbGFzdC1jaGlsZCgxKTo6YmVmb3Jle3dpZHRoOiAwO31cclxuLnRpbWVsaW5lPmxpOmZpcnN0LWNoaWxkOjpiZWZvcmUge3dpZHRoOiAwICFpbXBvcnRhbnQ7fVxyXG4udGltZWxpbmU+bGkgc3BhbiB7ZGlzcGxheTpibG9jazsgZm9udC13ZWlnaHQ6IDQwMDsgcGFkZGluZy10b3A6IDRweDsgY29sb3I6ICM2NjYgIWltcG9ydGFudDt9XHJcbi5wbC0xMCB7cGFkZGluZy1sZWZ0OjEwcHg7fVxyXG4ub3JkZXItc3VtbWFyeS1jb250IHtiYWNrZ3JvdW5kOiNmOWY5Zjk7IHBvc2l0aW9uOiBhYnNvbHV0ZTsgei1pbmRleDogMTQ7IGxlZnQ6IDA7IHRvcDogMDsgd2lkdGg6IDEwMCU7IGhlaWdodDoxMjAlOyBwYWRkaW5nOiA0OXB4IDE1cHggMTVweCAxNXB4O31cclxuLm9yZGVyLXN1bW1hcnktY29udCAuaW5mbyB7Y29sb3I6IzAwNzRBRDsgZm9udC13ZWlnaHQ6IDUwMDsgZm9udC1zaXplOjFyZW07IGxpbmUtaGVpZ2h0OiA0OXB4OyBwb3NpdGlvbjogcmVsYXRpdmU7fVxyXG4ub3JkZXItc3VtbWFyeS1jb250IC5zdW1tYXJ5IHtiYWNrZ3JvdW5kOiAjZmZmOyBib3JkZXItcmFkaXVzOiAxMnB4OyBwYWRkaW5nOjEwcHggMTVweDsgbWFyZ2luOjAgMCA1MHB4IDA7fVxyXG4ub3JkZXItc3VtbWFyeS1jb250IC5zdW1tYXJ5IC50eHQge2ZvbnQtd2VpZ2h0OiA0MDA7IGNvbG9yOiM1NTU7IGZvbnQtc2l6ZTowLjhyZW07IGxpbmUtaGVpZ2h0OiAxLjQ7IG1hcmdpbjowIDAgMTBweCAzMHB4OyBwYWRkaW5nLXJpZ2h0OiAzMHB4O31cclxuLm9yZGVyLXN1bW1hcnktY29udCAuc3VtbWFyeSAuaGVhZCB7ZGlzcGxheTpibG9jazsgZm9udC13ZWlnaHQ6IDUwMDsgY29sb3I6IzMzMzsgZm9udC1zaXplOjAuOXJlbTsgbGluZS1oZWlnaHQ6IDI0cHg7IG1hcmdpbjowIDAgMnB4IDA7fVxyXG4ub3JkZXItc3VtbWFyeS1jb250IC5zdW1tYXJ5IC5oZWFkIGltZyB7ZmxvYXQ6bGVmdDsgd2lkdGg6MjBweDsgaGVpZ2h0OiAyMHB4OyBtYXJnaW46M3B4IDhweCAwIDA7fVxyXG4ub3JkZXItc3VtbWFyeS1jb250IC5zdW1tYXJ5IC5pdGVtcy1kZXRhaWxzIHttYXJnaW4tdG9wOiAyMHB4O31cclxuLm9yZGVyLXN1bW1hcnktY29udCAuc3VtbWFyeSAuaXRlbXMtZGV0YWlscyB0YWJsZSB7d2lkdGg6MTAwJTt9XHJcbi5vcmRlci1zdW1tYXJ5LWNvbnQgLnN1bW1hcnkgLml0ZW1zLWRldGFpbHMgdGFibGUgdHIgdGQge2ZvbnQtd2VpZ2h0OiA0MDA7IGNvbG9yOiMzMzM7IGZvbnQtc2l6ZTowLjc3cmVtOyBwYWRkaW5nOjVweCAwOyB2ZXJ0aWNhbC1hbGlnbjogdG9wO31cclxuLm9yZGVyLXN1bW1hcnktY29udCAuc3VtbWFyeSAuaXRlbXMtZGV0YWlscyB0YWJsZSB0ciB0ZCBzdHJvbmcge2ZvbnQtd2VpZ2h0OiA3MDA7IGZvbnQtc2l6ZTowLjlyZW07fVxyXG4uZGlzY291bnQge2NvbG9yOiMwMDc0QUQgIWltcG9ydGFudDt9XHJcbi5idG4ge2JvcmRlci1yYWRpdXM6IDE0cHg7IGZvbnQtc2l6ZTogMTRweDtiYWNrZ3JvdW5kOiAjMDA3NGFkOyAgaGVpZ2h0OiA0MnB4OyBib3JkZXI6MXB4IHNvbGlkICMwMDc0YWQ7fVxyXG4udGV4dC1yaWdodCB7dGV4dC1hbGlnbjogcmlnaHQ7fVxyXG4udGV4dC1jZW50ZXIge3RleHQtYWxpZ246IGNlbnRlciAhaW1wb3J0YW50O31cclxuLmYtY2F0IHttYXJnaW4tdG9wOjRweDsgd2lkdGg6IDEycHg7IGhlaWdodDogMTJweDsgYm9yZGVyOjFweCBzb2xpZCAjRjU1RjRCOyBib3JkZXItcmFkaXVzOjNweDsgYmFja2dyb3VuZDojZmZmOyB0ZXh0LWFsaWduOiBjZW50ZXI7fVxyXG4uZi1jYXQgc3BhbiB7ZGlzcGxheTppbmxpbmUtYmxvY2s7IHdpZHRoOiA2cHg7IGhlaWdodDogNnB4OyBib3JkZXItcmFkaXVzOiA1MCU7IGJhY2tncm91bmQ6I0Y1NUY0QjsgbWFyZ2luOjAgMCA2cHggMDt9XHJcbi5ub24tdmVnIHtib3JkZXItY29sb3I6I0Y1NUY0QiAhaW1wb3J0YW50O31cclxuLm5vbi12ZWcgc3BhbiB7YmFja2dyb3VuZDojRjU1RjRCICFpbXBvcnRhbnQ7fVxyXG4udmVnIHtib3JkZXItY29sb3I6IzU3RjE4QyAhaW1wb3J0YW50O31cclxuLnZlZyBzcGFuIHtiYWNrZ3JvdW5kOiM1N0YxOEMgIWltcG9ydGFudDt9XHJcbi5zZW1pYm9sZCB7Zm9udC13ZWlnaHQ6NjAwICFpbXBvcnRhbnQ7fVxyXG4uYm9sZCB7Zm9udC13ZWlnaHQ6NzAwICFpbXBvcnRhbnQ7fVxyXG4uYmx1ZSB7Y29sb3I6IzAwNzRBRCAhaW1wb3J0YW50O31cclxuLmNsb3NlLWJ0biB7cG9zaXRpb246IGFic29sdXRlO3RvcDogMTJweDtyaWdodDogMDtiYWNrZ3JvdW5kOiAjMDA3NEFEO2NvbG9yOiAjZmZmO3dpZHRoOiAyNnB4O2hlaWdodDogMjZweDtsaW5lLWhlaWdodDogMjFweDtib3JkZXItcmFkaXVzOiA1MCU7dGV4dC1hbGlnbjogY2VudGVyO2ZvbnQtd2VpZ2h0OiA0MDA7fVxyXG5cclxuLmluZm8td2luZG93IHtiYWNrZ3JvdW5kOiNmOWY5Zjk7IHBvc2l0aW9uOiBmaXhlZDsgei1pbmRleDogMTQ7IGxlZnQ6IDA7IGJvdHRvbTogMDsgd2lkdGg6IDEwMCU7IGhlaWdodDpjYWxjKDEwMHZoIC0gNDlweCk7IHBhZGRpbmc6IDMwcHggMTVweCA1MHB4IDE1cHg7fVxyXG5cclxuLmluZm8tcG9wdXAge21hcmdpbjoyMHB4IDAgMCAwOyBwYWRkaW5nOiAwIDhweDt9XHJcbi5pbmZvLXBvcHVwIC50b3BpbWcge2JhY2tncm91bmQ6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDIwcHg7IHRleHQtYWxpZ246IGNlbnRlcjsgbWFyZ2luLWJvdHRvbTogMjBweDt9XHJcblxyXG4uaW5mby1wb3B1cCAuaW5mb3RleHQgcCB7Zm9udC13ZWlnaHQ6IDQwMDsgZm9udC1zaXplOiAxMnB4OyBsaW5lLWhlaWdodDogMS4zOyBtYXJnaW46NnB4IDAgMTBweCAwO31cclxuLmluZm8tcG9wdXAgLmluZm90ZXh0IHAgc3Ryb25nIHtmb250LXdlaWdodDogNzAwOyBmb250LXNpemU6IDEzcHg7IGRpc3BsYXk6IGJsb2NrOyBtYXJnaW4tYm90dG9tOiA1cHg7fVxyXG5cclxuLmRyaXZlcmRldCB7YmFja2dyb3VuZDogI2ZmZjsgcGFkZGluZzoxNXB4OyBib3JkZXItcmFkaXVzOiAxMHB4OyBmb250LXdlaWdodDogNDAwOyBmb250LXNpemU6IDEzcHg7fVxyXG4uZHJpdmVyZGV0IHN0cm9uZyB7Zm9udC13ZWlnaHQ6IDcwMDt9XHJcbi5kcml2ZXJkZXQgLnZjIHtjb2xvcjojMDA3NGFkOyBmbG9hdDogcmlnaHQ7fVxyXG4uZHJpdmVyZGV0IC5idCB7Zm9udC13ZWlnaHQ6IDQwMDsgZm9udC1zaXplOiAxMnB4O31cclxuLmRyaXZlcmRldCAuYnQgLnRlbXByIHtmbG9hdDogcmlnaHQ7fVxyXG4iXX0= */"]
});

/***/ }),

/***/ 1536:
/*!**************************************************!*\
  !*** ./src/app/errorpage/errorpage.component.ts ***!
  \**************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "ErrorpageComponent": () => (/* binding */ ErrorpageComponent)
/* harmony export */ });
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @angular/core */ 8259);

class ErrorpageComponent {
    constructor() { }
    ngOnInit() {
    }
}
ErrorpageComponent.ɵfac = function ErrorpageComponent_Factory(t) { return new (t || ErrorpageComponent)(); };
ErrorpageComponent.ɵcmp = /*@__PURE__*/ _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵdefineComponent"]({ type: ErrorpageComponent, selectors: [["app-errorpage"]], decls: 17, vars: 0, consts: [["id", "message"]], template: function ErrorpageComponent_Template(rf, ctx) { if (rf & 1) {
        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](0, "div", 0)(1, "h2");
        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](2, "404");
        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](3, "h1");
        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](4, "Page Not Found");
        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](5, "p");
        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](6, "The specified file was not found on this website. Please check the URL for mistakes and try again.");
        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](7, "h3");
        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](8, "Why am I seeing this?");
        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](9, "p");
        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](10, "This page was generated by the Firebase Command-Line Interface. To modify it, edit the ");
        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](11, "code");
        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](12, "404.html");
        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](13, " file in your project's configured ");
        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](14, "code");
        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](15, "public");
        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](16, " directory.");
        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]()();
    } }, styles: ["body[_ngcontent-%COMP%] { background: #ECEFF1; color: rgba(0,0,0,0.87); font-family: Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; }\r\n#message[_ngcontent-%COMP%] { background: white; max-width: 360px; margin: 100px auto 16px; padding: 32px 24px 16px; border-radius: 3px; }\r\n#message[_ngcontent-%COMP%]   h3[_ngcontent-%COMP%] { color: #888; font-weight: normal; font-size: 16px; margin: 16px 0 12px; }\r\n#message[_ngcontent-%COMP%]   h2[_ngcontent-%COMP%] { color: #ffa100; font-weight: bold; font-size: 16px; margin: 0 0 8px; }\r\n#message[_ngcontent-%COMP%]   h1[_ngcontent-%COMP%] { font-size: 22px; font-weight: 300; color: rgba(0,0,0,0.6); margin: 0 0 16px;}\r\n#message[_ngcontent-%COMP%]   p[_ngcontent-%COMP%] { line-height: 140%; margin: 16px 0 24px; font-size: 14px; }\r\n#message[_ngcontent-%COMP%]   a[_ngcontent-%COMP%] { display: block; text-align: center; background: #039be5; text-transform: uppercase; text-decoration: none; color: white; padding: 16px; border-radius: 4px; }\r\n#message[_ngcontent-%COMP%], #message[_ngcontent-%COMP%]   a[_ngcontent-%COMP%] { box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24); }\r\n#load[_ngcontent-%COMP%] { color: rgba(0,0,0,0.4); text-align: center; font-size: 13px; }\r\n@media (max-width: 600px) {\r\n    body[_ngcontent-%COMP%], #message[_ngcontent-%COMP%] { margin-top: 0; background: white; box-shadow: none; }\r\n    body[_ngcontent-%COMP%] { border-top: 16px solid #ffa100; }\r\n}\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImVycm9ycGFnZS5jb21wb25lbnQuY3NzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sbUJBQW1CLEVBQUUsdUJBQXVCLEVBQUUsaURBQWlELEVBQUUsU0FBUyxFQUFFLFVBQVUsRUFBRTtBQUMvSCxXQUFXLGlCQUFpQixFQUFFLGdCQUFnQixFQUFFLHVCQUF1QixFQUFFLHVCQUF1QixFQUFFLGtCQUFrQixFQUFFO0FBQ3RILGNBQWMsV0FBVyxFQUFFLG1CQUFtQixFQUFFLGVBQWUsRUFBRSxtQkFBbUIsRUFBRTtBQUN0RixjQUFjLGNBQWMsRUFBRSxpQkFBaUIsRUFBRSxlQUFlLEVBQUUsZUFBZSxFQUFFO0FBQ25GLGNBQWMsZUFBZSxFQUFFLGdCQUFnQixFQUFFLHNCQUFzQixFQUFFLGdCQUFnQixDQUFDO0FBQzFGLGFBQWEsaUJBQWlCLEVBQUUsbUJBQW1CLEVBQUUsZUFBZSxFQUFFO0FBQ3RFLGFBQWEsY0FBYyxFQUFFLGtCQUFrQixFQUFFLG1CQUFtQixFQUFFLHlCQUF5QixFQUFFLHFCQUFxQixFQUFFLFlBQVksRUFBRSxhQUFhLEVBQUUsa0JBQWtCLEVBQUU7QUFDekssdUJBQXVCLGtFQUFrRSxFQUFFO0FBQzNGLFFBQVEsc0JBQXNCLEVBQUUsa0JBQWtCLEVBQUUsZUFBZSxFQUFFO0FBQ3JFO0lBQ0ksaUJBQWlCLGFBQWEsRUFBRSxpQkFBaUIsRUFBRSxnQkFBZ0IsRUFBRTtJQUNyRSxPQUFPLDhCQUE4QixFQUFFO0FBQzNDIiwiZmlsZSI6ImVycm9ycGFnZS5jb21wb25lbnQuY3NzIiwic291cmNlc0NvbnRlbnQiOlsiYm9keSB7IGJhY2tncm91bmQ6ICNFQ0VGRjE7IGNvbG9yOiByZ2JhKDAsMCwwLDAuODcpOyBmb250LWZhbWlseTogUm9ib3RvLCBIZWx2ZXRpY2EsIEFyaWFsLCBzYW5zLXNlcmlmOyBtYXJnaW46IDA7IHBhZGRpbmc6IDA7IH1cclxuI21lc3NhZ2UgeyBiYWNrZ3JvdW5kOiB3aGl0ZTsgbWF4LXdpZHRoOiAzNjBweDsgbWFyZ2luOiAxMDBweCBhdXRvIDE2cHg7IHBhZGRpbmc6IDMycHggMjRweCAxNnB4OyBib3JkZXItcmFkaXVzOiAzcHg7IH1cclxuI21lc3NhZ2UgaDMgeyBjb2xvcjogIzg4ODsgZm9udC13ZWlnaHQ6IG5vcm1hbDsgZm9udC1zaXplOiAxNnB4OyBtYXJnaW46IDE2cHggMCAxMnB4OyB9XHJcbiNtZXNzYWdlIGgyIHsgY29sb3I6ICNmZmExMDA7IGZvbnQtd2VpZ2h0OiBib2xkOyBmb250LXNpemU6IDE2cHg7IG1hcmdpbjogMCAwIDhweDsgfVxyXG4jbWVzc2FnZSBoMSB7IGZvbnQtc2l6ZTogMjJweDsgZm9udC13ZWlnaHQ6IDMwMDsgY29sb3I6IHJnYmEoMCwwLDAsMC42KTsgbWFyZ2luOiAwIDAgMTZweDt9XHJcbiNtZXNzYWdlIHAgeyBsaW5lLWhlaWdodDogMTQwJTsgbWFyZ2luOiAxNnB4IDAgMjRweDsgZm9udC1zaXplOiAxNHB4OyB9XHJcbiNtZXNzYWdlIGEgeyBkaXNwbGF5OiBibG9jazsgdGV4dC1hbGlnbjogY2VudGVyOyBiYWNrZ3JvdW5kOiAjMDM5YmU1OyB0ZXh0LXRyYW5zZm9ybTogdXBwZXJjYXNlOyB0ZXh0LWRlY29yYXRpb246IG5vbmU7IGNvbG9yOiB3aGl0ZTsgcGFkZGluZzogMTZweDsgYm9yZGVyLXJhZGl1czogNHB4OyB9XHJcbiNtZXNzYWdlLCAjbWVzc2FnZSBhIHsgYm94LXNoYWRvdzogMCAxcHggM3B4IHJnYmEoMCwwLDAsMC4xMiksIDAgMXB4IDJweCByZ2JhKDAsMCwwLDAuMjQpOyB9XHJcbiNsb2FkIHsgY29sb3I6IHJnYmEoMCwwLDAsMC40KTsgdGV4dC1hbGlnbjogY2VudGVyOyBmb250LXNpemU6IDEzcHg7IH1cclxuQG1lZGlhIChtYXgtd2lkdGg6IDYwMHB4KSB7XHJcbiAgICBib2R5LCAjbWVzc2FnZSB7IG1hcmdpbi10b3A6IDA7IGJhY2tncm91bmQ6IHdoaXRlOyBib3gtc2hhZG93OiBub25lOyB9XHJcbiAgICBib2R5IHsgYm9yZGVyLXRvcDogMTZweCBzb2xpZCAjZmZhMTAwOyB9XHJcbn1cclxuIl19 */"] });


/***/ }),

/***/ 941:
/*!**************************************************!*\
  !*** ./src/app/googlemap/googlemap.component.ts ***!
  \**************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "GooglemapComponent": () => (/* binding */ GooglemapComponent)
/* harmony export */ });
/* harmony import */ var C_Users_Digvijay_Pandey_WebstormProjects_synco_customer_tracking_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js */ 9369);
/* harmony import */ var rxjs__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! rxjs */ 9329);
/* harmony import */ var rxjs__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! rxjs */ 8922);
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @angular/core */ 8259);
/* harmony import */ var _order_service__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../order.service */ 6447);
/* harmony import */ var _angular_common_http__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @angular/common/http */ 3690);


var Marker = google.maps.Marker;
var Polyline = google.maps.Polyline;



const _c0 = ["map"];
class GooglemapComponent {
  constructor(orderService, http) {
    this.orderService = orderService;
    this.http = http;
    this.options = {// zoomControl: true,
      //  gestureHandling: 'greedy',
    };
    this.coordinates = [];
    this.markers = [];
    this.order = {};
    this.orderHereMapRoutePath = {};
    this.marker = [];
    this.sub = new rxjs__WEBPACK_IMPORTED_MODULE_2__.Subscription();
    this.getData = [];
  }

  ngOnInit() {
    var _this = this;

    return (0,C_Users_Digvijay_Pandey_WebstormProjects_synco_customer_tracking_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])(function* () {
      yield _this.orderService.init().then();
      _this.order = _this.orderService.order; //  this.mapReady();
      // this.dataFirstCall();
    })();
  }

  mapReady() {
    const mapOptions = {
      center: {
        lat: this.order.delivery_location.latitude,
        lng: this.order.delivery_location.longitude
      } // zoom: 14,
      // mapTypeId: google.maps.MapTypeId.ROADMAP,
      // disableDefaultUI: true,

    };
    this.polyline = new Polyline();
    this.map = new google.maps.Map(this.mapElement.nativeElement, mapOptions);
    this.pickupLatLng = {
      lat: this.order.pick_up_location.latitude,
      lng: this.order.pick_up_location.longitude
    };
    this.markers.push(this.pickupLatLng);
    const pickupMarker = new google.maps.Marker({
      position: new google.maps.LatLng(this.pickupLatLng.lat, this.pickupLatLng.lng),
      icon: {
        url: 'assets/images/store.svg',
        scaledSize: new google.maps.Size(35, 35) // size

      },
      title: ''
    });
    pickupMarker.setMap(this.map);
    google.maps.event.addListener(pickupMarker, 'click', () => {
      const infowindow = new google.maps.InfoWindow({
        content: 'Pickup'
      });
      infowindow.open(this.map, pickupMarker);
    });
    this.dropLatLng = {
      lat: this.order.delivery_location.latitude,
      lng: this.order.delivery_location.longitude
    };
    this.markers.push(this.dropLatLng);
    const dropMarker = new google.maps.Marker({
      position: new google.maps.LatLng(this.dropLatLng.lat, this.dropLatLng.lng),
      icon: {
        url: 'assets/images/home.svg',
        scaledSize: new google.maps.Size(35, 35) // size

      },
      title: ''
    });
    dropMarker.setMap(this.map);
    google.maps.event.addListener(dropMarker, 'click', () => {
      const infowindow = new google.maps.InfoWindow({
        content: 'Drop'
      });
      infowindow.open(this.map, dropMarker);
    });
    this.getRiderPathFromHerePathThenCacheLocally(this.order).then();
    this.riderLatLng = {
      lat: this.order.rider_position.latitude,
      lng: this.order.rider_position.longitude
    };
    this.oldRiderLatLng = this.riderLatLng;
    const riderIcon = {
      url: 'assets/images/bike.svg',
      scaledSize: new google.maps.Size(40, 40),
      rotation: 0
    };
    const marker1 = new Marker({
      map: this.map,
      icon: riderIcon,
      title: '',
      position: new google.maps.LatLng(this.order.rider_position.latitude, this.order.rider_position.longitude)
    });
    setTimeout(() => {
      this.map.panTo(new google.maps.LatLng(this.order.rider_position.latitude, this.order.rider_position.longitude));
    }, 200);
    this.sub = (0,rxjs__WEBPACK_IMPORTED_MODULE_3__.interval)(4000).subscribe(() => {
      this.orderService.init().then();
      this.order = this.orderService.order;
      this.riderLatLng = {
        lat: this.order.rider_position.latitude,
        lng: this.order.rider_position.longitude
      };
      const bearing = this.getBearing(this.oldRiderLatLng.lat, this.oldRiderLatLng.lng, this.riderLatLng.lat, this.riderLatLng.lng);
      const bearingData = Number(bearing.toFixed(0));
      console.log('old bearing', this.oldBearingData);

      if (bearingData === 0) {
        this.bikeSvg = this.oldBearingData - this.oldBearingData % 15;
      } else {
        this.bikeSvg = bearingData - bearingData % 15;
        this.oldBearingData = bearingData;
      }

      marker1.setIcon({
        url: 'assets/images/svg/' + this.bikeSvg + '.svg',
        scaledSize: new google.maps.Size(40, 40),
        rotation: bearing
      });
      const newPosition = new google.maps.LatLng(this.order.rider_position.latitude, this.order.rider_position.longitude);
      const deliveryPosition = new google.maps.LatLng(this.order.delivery_location.latitude, this.order.delivery_location.longitude);
      console.log(newPosition.lat() + " lat : " + newPosition.lng());
      this.getRiderPathFromHerePathThenCacheLocally(this.order).then();
      moveMarker(newPosition);
      this.map.panTo(newPosition);
      this.oldRiderLatLng = this.riderLatLng;
    });

    if (this.order.status_name === 'delivered' || this.order.status_name === 'cancelled') {
      this.sub.unsubscribe();
    }

    const numDeltas = 1000;
    const delay = 20;
    let i = 0;

    function moveMarker(linepos) {
      marker1.setPosition(linepos);

      if (i != numDeltas) {
        i++;
        setTimeout(moveMarker, delay);
      }
    }
  }

  panMap(newPosition) {
    setTimeout(() => {
      this.map.panTo(newPosition);
    }, 100);
  }

  radians(n) {
    return n * (Math.PI / 180);
  }

  degrees(n) {
    return n * (180 / Math.PI);
  }

  getBearing(startLat, startLong, endLat, endLong) {
    startLat = this.radians(startLat);
    startLong = this.radians(startLong);
    endLat = this.radians(endLat);
    endLong = this.radians(endLong);
    var dLong = endLong - startLong;
    var dPhi = Math.log(Math.tan(endLat / 2.0 + Math.PI / 4.0) / Math.tan(startLat / 2.0 + Math.PI / 4.0));

    if (Math.abs(dLong) > Math.PI) {
      if (dLong > 0.0) dLong = -(2.0 * Math.PI - dLong);else dLong = 2.0 * Math.PI + dLong;
    }

    return (this.degrees(Math.atan2(dLong, dPhi)) + 360.0) % 360.0;
  }

  getRiderPathFromHerePathThenCacheLocally(order) {
    var _this2 = this;

    return (0,C_Users_Digvijay_Pandey_WebstormProjects_synco_customer_tracking_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])(function* () {
      let origin, destination;

      if (order.rider_position && order.rider_position.latitude && order.rider_position.longitude) {
        origin = [order.rider_position.longitude, order.rider_position.latitude];
      }

      if (order.delivery_location && order.delivery_location.latitude && order.delivery_location.longitude) {
        destination = [order.delivery_location.longitude, order.delivery_location.latitude];
      }

      if (origin && destination) {
        const request = _this2.http.post('https://routing.roadcast.co.in/ors/v2/directions/driving-car/geojson', {
          coordinates: [origin, destination]
        }).subscribe(res => {
          _this2.coordinates = res.features[0].geometry.coordinates;

          const coordsClean = _this2.coordinates.map(x => {
            const dataArray = x.slice();
            return {
              lat: x[1],
              lng: x[0]
            };
          });

          _this2.polyline.setMap(null);

          _this2.polyline = new google.maps.Polyline({
            strokeColor: 'blue',
            map: _this2.map,
            path: coordsClean,
            geodesic: true,
            visible: true
          });
          console.log('polylines created');
        });
      }
    })();
  }

}

GooglemapComponent.ɵfac = function GooglemapComponent_Factory(t) {
  return new (t || GooglemapComponent)(_angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵdirectiveInject"](_order_service__WEBPACK_IMPORTED_MODULE_1__.OrderService), _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵdirectiveInject"](_angular_common_http__WEBPACK_IMPORTED_MODULE_5__.HttpClient));
};

GooglemapComponent.ɵcmp = /*@__PURE__*/_angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵdefineComponent"]({
  type: GooglemapComponent,
  selectors: [["app-googlemap"]],
  viewQuery: function GooglemapComponent_Query(rf, ctx) {
    if (rf & 1) {
      _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵviewQuery"](_c0, 5);
    }

    if (rf & 2) {
      let _t;

      _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵqueryRefresh"](_t = _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵloadQuery"]()) && (ctx.mapElement = _t.first);
    }
  },
  decls: 2,
  vars: 0,
  consts: [["id", "map", 2, "border", "1px solid #35b0e3", "height", "50vh", "max-width", "100%"], ["map", ""]],
  template: function GooglemapComponent_Template(rf, ctx) {
    if (rf & 1) {
      _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelement"](0, "div", 0, 1);
    }
  },
  styles: ["\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IiIsImZpbGUiOiJnb29nbGVtYXAuY29tcG9uZW50LmNzcyJ9 */"]
});

/***/ }),

/***/ 6447:
/*!**********************************!*\
  !*** ./src/app/order.service.ts ***!
  \**********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "OrderService": () => (/* binding */ OrderService)
/* harmony export */ });
/* harmony import */ var C_Users_Digvijay_Pandey_WebstormProjects_synco_customer_tracking_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js */ 9369);
/* harmony import */ var _angular_common_http__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @angular/common/http */ 3690);
/* harmony import */ var rxjs__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! rxjs */ 7554);
/* harmony import */ var _environments_environment__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../environments/environment */ 2340);
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @angular/core */ 8259);
/* harmony import */ var _angular_router__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @angular/router */ 3903);







class OrderService {
  constructor(router, httpDirect, handler) {
    this.router = router;
    this.httpDirect = httpDirect;
    this.riderPosition = new rxjs__WEBPACK_IMPORTED_MODULE_2__.BehaviorSubject({
      lat: 0,
      lng: 0
    });
    this.httpDirect = new _angular_common_http__WEBPACK_IMPORTED_MODULE_3__.HttpClient(handler);
  }

  init() {
    var _this = this;

    return (0,C_Users_Digvijay_Pandey_WebstormProjects_synco_customer_tracking_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])(function* () {
      const urlParams = new URLSearchParams(window.location.search);
      const myParam = urlParams.get('order_id');

      if (!myParam) {
        yield _this.router.navigateByUrl('error');
      }

      const api_url = _environments_environment__WEBPACK_IMPORTED_MODULE_1__.environment.apiUrl;
      const response = yield fetch(api_url + 'order/order_tracking/' + myParam, {
        method: "GET"
      });
      const data = yield response.json();
      _this.order = data.data;
      _this.rating = data.rating;
      _this.order_status = data.order_status;
      _this.orderPayment = data.order_payment[0];
      _this.body_temp = data.rider_avail;
    })();
  }

  companyData() {
    var _this2 = this;

    return (0,C_Users_Digvijay_Pandey_WebstormProjects_synco_customer_tracking_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])(function* () {
      const urlParams = new URLSearchParams(window.location.search);
      const myParam = urlParams.get('order_id');

      if (!myParam) {
        yield _this2.router.navigateByUrl('error');
      }

      const api_url = _environments_environment__WEBPACK_IMPORTED_MODULE_1__.environment.apiUrl;
      const company = yield fetch(api_url + 'order/get_redis_company/' + myParam, {
        method: "GET"
      });
      const companyData = yield company.json();
      _this2.currencyCode = companyData.data.currencyCode;
    })();
  }

}

OrderService.ɵfac = function OrderService_Factory(t) {
  return new (t || OrderService)(_angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵinject"](_angular_router__WEBPACK_IMPORTED_MODULE_5__.Router), _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵinject"](_angular_common_http__WEBPACK_IMPORTED_MODULE_3__.HttpClient), _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵinject"](_angular_common_http__WEBPACK_IMPORTED_MODULE_3__.HttpBackend));
};

OrderService.ɵprov = /*@__PURE__*/_angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵdefineInjectable"]({
  token: OrderService,
  factory: OrderService.ɵfac,
  providedIn: 'root'
});

/***/ }),

/***/ 6296:
/*!******************************!*\
  !*** ./src/app/riderIcon.ts ***!
  \******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "getRiderIconFace": () => (/* binding */ getRiderIconFace),
/* harmony export */   "getRiderIconBike": () => (/* binding */ getRiderIconBike)
/* harmony export */ });
/* tslint:disable:max-line-length*/
const getRiderIconFace = () => {
    return [{
            icon: {
                path: `M11,0C4.9,0,0,4.9,0,11c0,2.9,1.1,5.5,2.9,7.4c0,0,0.1,
0.1,0.1,0.1c2,2.1,4.8,3.4,8,3.4c3.1,0,6-1.3,8-3.4
c0,0,0.1-0.1,0.1-0.1c1.8-2,2.9-4.6,2.9-7.4C22,4.9,17.1,0,11,0z`,
                scale: 1,
                fillColor: '#ffffff',
                fillOpacity: 1,
                rotation: 0,
                anchor: new google.maps.Point(11, 11),
                strokeOpacity: 0,
            },
            offset: '100%',
            fixedRotation: true,
        },
        {
            icon: {
                path: `M11,0C4.9,0,0,4.9,0,11c0,2.9,1.1,5.5,2.9,7.4c0,0,0.1,0.1,0.1,
0.1c2,2.1,4.8,3.4,8,3.4c3.1,0,6-1.3,8-3.4
c0,0,0.1-0.1,0.1-0.1c1.8-2,2.9-4.6,2.9-7.4C22,
4.9,17.1,0,11,0z M11,4.4c1.7,0,3.1,1.4,3.1,3.1s-1.4,3.1-3.1,3.1c-1.7,
0-3.1-1.4-3.1-3.1S9.3,4.4,11,4.4z M11,
20.6c-2.6,0-5-1.1-6.8-2.8C4.7,14.5,7.6,12,11,12c3.4,0,6.3,2.5,6.8,5.8
C16,19.6,13.6,20.6,11,20.6z`,
                scale: 1,
                fillColor: '#0D237D',
                fillOpacity: 1,
                rotation: 0,
                anchor: new google.maps.Point(11, 11),
                strokeOpacity: 0,
            },
            offset: '100%',
            fixedRotation: true,
        }];
};
const getRiderIconBike = () => {
    const anchorPoint = new google.maps.Point(480, 480);
    const boxColor = '#006491';
    const shirtColor = '#00ddff';
    const capColor = '#c9171d';
    const bikeColor = '#ED3823';
    const iconScale = 0.050;
    const iconList = [
        {
            icon: {
                path: `M496.7,130.7c-12.3-8.9-24.6-8.9-36.9,0c-0.1-8.6-0.3-17.3-0.1-25.9c0.3-10,8.5-17.7,18.6-17.7
	s18.3,7.6,18.5,17.7C497.1,113.5,496.8,122.1,496.7,130.7z`,
                scale: iconScale,
                fillColor: '#282425',
                fillOpacity: 1,
                rotation: 0,
                anchor: anchorPoint,
                strokeOpacity: 0,
            },
            offset: '100%',
            fixedRotation: false,
        },
        {
            icon: {
                path: `M382.5,270.6c-3.9,0.6-7.9,1.2-11.9,1.8l-0.1,0c-5,5.6-12.3,5.5-18.9,7.3l-47,10.6c-2.9,0.6-5.8,1.3-8.7,1.9
	c-5.2,1-10-1.9-11.2-6.6c-1.4-5.1,1.3-10,6.6-11.6c3.4-0.9,6.8-1.4,10.2-2.2l44.3-10c3.6-0.8,7.1-1.6,10.7-2.4
	c-2.2-6.1-6-8.5-12.9-6.9c-12.8,2.9-25.4,6.4-38.2,9.6c-1.8,0.4-3.5,1-5.3,1.4c-1.5,0.3-3.2,0.5-3.7-1.4c-0.6-2.2,1-2.9,2.7-3.4
	c4.7-1.2,9.3-2.4,14-3.6c9.2-2.4,18.3-4.8,27.5-7.1c9.7-2.4,15.3,0,20.4,8.6c1.7,2.9,4.9,2.9,7.5,3.9l0.1,0c9.9-2.6,19.8-5,30-6
	l160.9-0.9c0.7-0.1,1.4-0.1,2-0.2c8.9,2,17.8,3.9,26.7,5.9c1.3,0.4,2.4,0.9,3.4,1.2h0.1c3.7-1,6.6-2.6,8.7-6.4
	c3.7-6.8,10.4-8.1,17.4-6.5c14.4,3.4,28.7,7.3,43,10.9c1.7,0.4,3.5,1.1,2.9,3.3c-0.7,2.4-2.8,1.8-4.6,1.3c-13.3-3.5-26.7-7-40-10.4
	c-5-1.3-9.9-1.8-13.8,2.7c-1.9,2.1-2.5,3.9,1.3,4.5c2.2,0.6,4.6,1.2,7.1,1.8l44.2,10.2c3.2,0.6,6.5,1.1,9.7,1.9
	c5.8,1.4,9,6.2,7.8,11.4c-1.2,5.2-6.1,8.1-11.9,7c-2.9-0.7-5.8-1.4-8.7-2l-47-10.6c-6.2-1.9-13.4-1.4-18.1-7.2h-0.1
	c-4.1-0.7-8.1-1.3-12.2-2L382.5,270.6z`,
                scale: iconScale,
                fillColor: '#353E44',
                fillOpacity: 1,
                rotation: 0,
                anchor: anchorPoint,
                strokeOpacity: 0,
            },
            offset: '100%',
            fixedRotation: false,
        },
        {
            icon: {
                path: `M550.3,657.6c-2.9,0-5.8,0-8.7,0c-31.3,0.1-62.6,0.1-93.9,0.2c-10.3,0-20.6-0.1-31-0.1c-2.8,0-5.4,0-8.2,0
	c0-13.3,0-26.6,0.1-39.9c0-7.2-2.6-221.9-2.9-258.3h-0.4c0-21.8,0-43.6,0-65.5c16.6-3,33.3-4.1,50.1-4.8c30.8-1.3,61.5-0.6,92,3.8
	c0,20.3,0,40.5,0,60.8l0.1,0C547.4,375,550.3,636.4,550.3,657.6z`,
                scale: iconScale,
                fillColor: '#353E44',
                fillOpacity: 1,
                rotation: 0,
                anchor: anchorPoint,
                strokeOpacity: 0,
            },
            offset: '100%',
            fixedRotation: false,
        },
        {
            icon: {
                path: `M362.5,449.5c12.5,12,25.6,23.3,39.9,33.2c1.5,1,2,2.4,2.3,4.1c4.6,28.9,9.4,57.8,13.7,86.8
	c0.9,6.1,3.6,10,8.4,13.3c13,8.8,27.6,12.3,42.9,13.4c15.9,1.1,31.7,0.6,46.9-4.6c3.5-1.2,6.8-2.6,10.1-4.3
	c8.7-4.4,13.8-10.5,15.1-21c3.6-27.9,8.6-55.6,12.9-83.4c0.3-1.7,0.7-3.2,2.2-4.2c13.4-9.1,25.5-19.8,37.5-30.6
	c0.8,5.3,0.4,10.6-1.1,15.8c-10,33.7-20,67.5-30,101.2c-2.2,7.3-6.1,13.6-10.7,19.6c-1.1,1.4-2.6,2.6-2.8,4.6
	c-3.9,1.1-5.8,4.4-8.3,7.2c-2.7,2-5.4,4-8.1,6c-0.3,0.1-0.7,0.1-1,0.2c-23.8,14.1-49.4,16.2-76.1,12c-11.3-1.8-21.7-5.8-31.7-11.2
	c-2.7-1.9-5.3-3.9-8-5.8c-2.8-2.4-5.5-4.7-8.3-7.1c-0.2,0-0.4,0-0.6,0c-15-17-18.4-38.9-24.7-59.6c-6.8-22.2-13.2-44.5-19.8-66.8
	C361.6,462,360.9,455.8,362.5,449.5z`,
                scale: iconScale,
                fillColor: '#613915',
                fillOpacity: 1,
                rotation: 0,
                anchor: anchorPoint,
                strokeOpacity: 0,
            },
            offset: '100%',
            fixedRotation: false,
        },
        {
            icon: {
                path: `M334.9,319.5c0.1,3.3,0.3,6.5,0.4,9.9c0.9,2.9,0.1,6.2,1.5,9c1,10.2,3.5,19.9,7.9,29.1h-0.1
	c-0.1,0.3,0,0.7,0.3,0.9c11.4,27.7,31.4,46.7,58.9,58.2c0.5,0.2,1.1,0.5,1.6,0.7c4.9,1.8,9.3,5.6,15.2,3.8c1.7,7.2,4.2,14,7.9,20.4
	c21.9,38.4,70.7,42.3,97.9,7.8c6.6-8.4,10.3-18.1,13.4-28.1c2.9,1.8,5.3-0.3,7.9-1.1c3.2-1.2,6.6-2.3,9.7-3.7
	c18.3-8.3,34.1-19.7,45.6-36.5c11-14.3,17.1-30.7,19.8-48.5c0.7-4,1-7.9,1.7-11.9c0.1-3.7,0.3-7.5,0.2-11.2c0.1-2.2,0.6-3.5,2.9-3.7
	c0,0,0.1,0,0.1,0c0.1-4.2-1.6-7.8-4.1-11.1c-1.3-3.1-4.3-3.2-7-4c-4.4-1.2-9.1-1.8-12.7-5.1c-4.2-3.8-3.4-9.7,1.8-11.9
	c1.5-0.7,2.1-1.4,2.1-2.8c2.9-5.7,3.4-12.1,5.9-17.9c2.9-2.2,5.8-2.3,9.3-1.3c9.6,2.6,19.2,4.8,28.8,6.9c2.8,0.6,4.8,2,6.1,4.5
	c0.8,2,0.8,4.1,0.3,6.2c-1.1,4.1-2.3,8.1-3.4,12.1c-0.3,1.1-0.7,2.2-1,3.3c-1,1.5-1.2,3.2-1.3,4.9c-1.9,3.1,0.4,6,0.3,9.1
	c0,1,0,2,0,3c4-0.8,4.2,0.8,4.9,5c0.4,2.9,0.5,5.9,0.4,8.8c-0.2,2-0.3,4-0.5,6c-0.3,2.3-0.7,4.6-1,6.9
	c-3.6,21.9-10.9,42.6-21.6,62.1c-9.1,16.2-20.3,30.7-32.3,44.4c-2.7,2.8-5.4,5.6-8.1,8.4c-12,10.8-24.1,21.5-37.5,30.6
	c-1.5,1-2,2.5-2.2,4.2c-4.4,27.8-9.3,55.5-12.9,83.4c-1.4,10.5-6.5,16.7-15.1,21c-3.3,1.6-6.7,3.1-10.1,4.3
	c-15.3,5.2-31.1,5.7-46.9,4.6c-15.3-1.1-29.9-4.6-42.9-13.4c-4.8-3.2-7.5-7.2-8.4-13.3c-4.3-29-9.1-57.9-13.7-86.8
	c-0.3-1.8-0.8-3.1-2.3-4.1c-14.3-9.8-27.4-21.2-39.9-33.2c-15.1-16-28.7-33.2-39-52.7c-11.9-22.8-19.9-46.6-21.5-72.4
	c-0.1-3.1,0-6.3-0.4-9.4c-0.5-4,0.9-5.5,4.8-4.4c1.4-6.9,2.1-13.8-1.9-20.2c0.3-1.9-0.6-3.5-1.1-5.2c-1.4-4.3-3-8.6-2-13.3
	c1.1-2.4,3.1-3.8,5.7-4.4c10.7-2.6,21.5-5.1,32.2-7.7c2.6-0.6,4.4,0.8,6.4,2c1.9,6,3.9,11.9,5.8,17.9c0,1.3,0.7,2,1.9,2.6
	c6.6,3.4,6.8,9.2,0.7,13.3c-2.5,1.7-5.4,2.7-8.3,3.1c-9.5,1-12.9,7.4-14.1,15.9C335.6,314.5,334.9,319.5,334.9,319.5z`,
                scale: iconScale,
                fillColor: '#FBC488',
                fillOpacity: 1,
                rotation: 0,
                anchor: anchorPoint,
                strokeOpacity: 0,
            },
            offset: '100%',
            fixedRotation: false,
        },
        {
            icon: {
                path: `M302.2,324.3c-0.1-3.1,0-6.3-0.4-9.4c-0.5-4,0.9-5.5,4.8-4.4c8.4,1.3,16.8,2.7,25.2,4c3.5,0.1,2.7,2.9,3.1,5
	c0.1,3.3,0.3,6.5,0.4,9.9l0,0c0.9,2.9,0.1,6.2,1.5,9c1,10.2,3.5,19.9,7.9,29.1h-0.1c-0.1,0.3,0,0.7,0.3,0.9
	c11.4,27.7,31.4,46.7,58.9,58.2c0.5,0.2,1.1,0.5,1.6,0.7c4.9,1.8,9.3,5.6,15.2,3.8c1.7,7.2,4.2,14,7.9,20.4
	c21.9,38.4,70.7,42.3,97.9,7.8c6.6-8.4,10.3-18.1,13.4-28.1c2.9,1.8,5.3-0.3,7.9-1.1c3.2-1.2,6.6-2.3,9.7-3.7
	c18.3-8.3,34.1-19.7,45.6-36.5c11-14.3,17.1-30.7,19.8-48.5c0.7-4,1-7.9,1.7-11.9l0,0c0.1-3.7,0.3-7.5,0.2-11.2
	c0.1-2.2,0.6-3.5,2.9-3.7c8.4-1.4,16.8-2.7,25.1-4.1c4.1-0.8,4.3,0.7,5,5c0.4,2.9,0.5,5.9,0.4,8.8c-0.2,2-0.3,4-0.5,6
	c-0.3,2.3-0.7,4.6-1,6.9c-3.6,21.9-10.9,42.6-21.6,62.1c-9.1,16.2-20.3,30.7-32.3,44.4c-2.7,2.8-5.4,5.6-8.1,8.4
	c-12,10.8-24.1,21.5-37.5,30.6c-1.5,1-2,2.5-2.2,4.2c-4.4,27.8-9.3,55.5-12.9,83.4c-1.4,10.5-6.5,16.7-15.1,21
	c-3.3,1.6-6.7,3.1-10.1,4.3c-15.3,5.2-31.1,5.7-46.9,4.6c-15.3-1.1-29.9-4.6-42.9-13.4c-4.8-3.2-7.5-7.2-8.4-13.3
	c-4.3-29-9.1-57.9-13.7-86.8c-0.3-1.8-0.8-3.1-2.3-4.1c-14.3-9.8-27.4-21.2-39.9-33.2c-15.1-16-28.7-33.2-39-52.7
	C311.8,373.9,303.8,350.1,302.2,324.3L302.2,324.3z`,
                scale: iconScale,
                fillColor: shirtColor,
                fillOpacity: 1,
                rotation: 0,
                anchor: anchorPoint,
                strokeOpacity: 0,
            },
            offset: '100%',
            fixedRotation: false,
        },
        {
            icon: {
                path: `M540.4,406.6c-0.3-7.4-3.2-14.1-4.8-21.1c0-0.1-0.1-0.1-0.1-0.2c0.6-13.1-0.7-26.1-4.8-38.7
	c-4.6-14.5-13.8-24.5-29.1-27.9c-12.3-2.8-24.8-2.9-37.2-0.8c-17,3-28.7,12.5-34.7,28.8c-4.7,12.8-6.1,26.1-5.7,39.7h0.1
	c-2.6,7.9-5,15.7-5,24.1c-1.1,7,0.1,13.9,1.3,20.8c1.7,7.2,4.2,14,7.9,20.4c21.9,38.4,70.7,42.3,97.9,7.8
	c6.6-8.4,10.4-18.1,13.4-28.1C540.6,423.2,541.5,414.9,540.4,406.6`,
                scale: iconScale,
                fillColor: capColor,
                fillOpacity: 1,
                rotation: 0,
                anchor: anchorPoint,
                strokeOpacity: 0,
            },
            offset: '100%',
            fixedRotation: false,
        },
        {
            icon: {
                path: `M586.9,734.5c0,35-0.1,70-0.1,104.9c0,20.9-12.3,33.2-33.2,33.2c-43.6,0-87.3,0-130.9,0c-2,0-4,0.1-6,0.2
	c-3.7-0.1-7.3-0.2-11-0.2c-19.7,0-32.6-12.7-32.7-32.4c-0.1-32.8,0-65.7,0-98.5c0-2.3-0.2-4.7-0.2-7c0.1-14.4,0.1-28.8,0.2-43.2
	c0.1-7.8,1.5-15.1,6.5-21.5c7.4-9.6,17.6-12.4,29-12.4c2.8,0,5.6,0,8.3,0c10.3,0.1,20.6,0.2,31,0.1c31.3,0,62.6-0.1,93.9-0.2
	c2.9,0,5.8,0,8.7,0c1.3,0.1,2.6,0.2,4,0.2c21.1-0.3,33.5,16.7,32.6,33C586.2,705.3,586.9,719.9,586.9,734.5z`,
                scale: iconScale,
                fillColor: boxColor,
                fillOpacity: 1,
                rotation: 0,
                anchor: anchorPoint,
                strokeOpacity: 0,
            },
            offset: '100%',
            fixedRotation: false,
        },
        {
            icon: {
                path: `M594,303.1c-15.7-4.6-31-8.6-46.7-10.3c-30.5-4.4-61.2-5-92-3.8c-16.7,0.9-33.5,2-50,5
	c-2.2,0.4-4.6,0.2-6.7,1.3c-2.7,0-5.3,0.7-7.9,1.5c-8.5,1.4-16.6,4.1-24.8,6.6c0.2-1.5,0.6-3,0.8-4.5c1.1-2,2.2-3.7,3.3-5.7
	c0.3-0.3,0.3-0.6,0.2-1.1l-0.1-0.2h0c3-7.8,7.7-14.6,12.4-21.4c4.5-5.6,10.1-10,15.2-15.1c0.6-0.6,1.4-1.1,2.2-1.4
	c0.4-0.1,0.7-0.3,1.1-0.5c11.8-7.4,24.3-12.9,38-15.4l0.2,0.1c1.3-2-0.3-3.8-0.6-5.6c-1.2-7.2-2-14.3,1.1-21.2
	c2.3,5.4,6.5,7.9,11.3,9.3c0-20.9-0.2-57.3-0.1-70c0-7.9,3.8-14.3,9.1-19.9c12.3-8.9,24.6-8.9,36.9,0c3.3,3.5,5.9,7.4,7.9,11.8
	c2.3,10.8,0.8,21.8,1.1,32.6c0.2,5.1,0,32.2-0.1,46.4c5.7-1.1,11-3.5,14.9-8.9c3.7,6.9,2.1,14,0.8,21c-0.3,1.5-1.5,3-0.2,4.5
	c13.8,2.3,26.4,8.1,38.3,15.5c6.4,5.1,12.6,10.5,17.9,16.8c4.7,7.1,9.7,14,12.6,22.1c0.5,0.7,1,1.4,1.5,2.2
	C592.3,297.2,593,299.7,594,303.1z`,
                scale: iconScale,
                fillColor: bikeColor,
                fillOpacity: 1,
                rotation: 0,
                anchor: anchorPoint,
                strokeOpacity: 0,
            },
            offset: '100%',
            fixedRotation: false,
        },
        {
            icon: {
                path: `M476.1,222.4c-7.8,0-14.2-0.4-20.1-1.3c-6.1-0.9-12.8-2.7-15.9-9.9c1.4-6,5.8-9.7,10.4-13.5l0.8-0.7
		c9-4.2,18.2-6.3,28.1-6.3c8.3,0,16.9,1.4,26.2,4.4c0.7,0.5,1.3,0.9,2,1.4c3.9,2.6,7.9,5.3,10.3,9.6c0.2,0.4,0.4,0.7,0.7,1.1
		c1,1.5,2,3.1,1.6,5.2c-5.7,8-14.8,9.3-22.9,9.5c-2.4,0.1-4.7,0.1-7.1,0.2C485.5,222.2,480.7,222.4,476.1,222.4
		C476.1,222.4,476.1,222.4,476.1,222.4z`,
                scale: iconScale,
                fillColor: '#FFFFFF',
                fillOpacity: 1,
                rotation: 0,
                anchor: anchorPoint,
                strokeOpacity: 0,
            },
            offset: '100%',
            fixedRotation: false,
        },
        {
            icon: {
                path: `M479.4,191.2c8.2,0,16.7,1.4,26,4.4c0.7,0.5,1.3,0.9,2,1.3c4,2.7,7.8,5.2,10.1,9.5c0.2,0.4,0.4,0.7,0.7,1.1
		c1,1.5,1.9,2.9,1.6,4.7c-3.1,4.4-8.3,8.9-22.5,9.2c-2.4,0.1-4.7,0.1-7.1,0.2c-4.6,0.1-9.3,0.3-14,0.3c-7.8,0-14.2-0.4-20-1.3
		c-5.9-0.8-12.4-2.6-15.5-9.4c1.4-5.8,5.7-9.3,10.2-13.1l0.8-0.6C460.4,193.3,469.5,191.2,479.4,191.2 M479.4,190.2
		c-9.5,0-19,1.9-28.4,6.4c-4.9,4.1-10,8-11.5,14.7c3.1,7.1,9.4,9.3,16.4,10.3c6.7,1,13.4,1.3,20.2,1.3c7,0,14.1-0.3,21.1-0.5
		c8.8-0.2,17.7-1.7,23.4-9.8c0.6-2.8-1.2-4.8-2.3-6.7c-2.9-5.2-7.9-8-12.5-11.2C496.9,191.9,488.1,190.2,479.4,190.2L479.4,190.2z`,
                scale: iconScale,
                fillColor: '#ED3823',
                fillOpacity: 1,
                rotation: 0,
                anchor: anchorPoint,
                strokeOpacity: 0,
            },
            offset: '100%',
            fixedRotation: false,
        },
    ];
    /*
      if (config.extraIcons && config.extraIcons.length) {
        config.extraIcons.forEach((element: { path: any; fillColor: any; }) => {
          iconList.push({
            icon: {
              path: element.path,
              scale: iconScale,
              fillColor: element.fillColor,
              fillOpacity: 1,
              rotation: 0,
              anchor: anchorPoint,
              strokeOpacity: 0,
            },
            offset: '100%',
            fixedRotation: false,
          });
        });
      }
    */
    return iconList;
};


/***/ }),

/***/ 1274:
/*!************************************************!*\
  !*** ./src/app/test-map/test-map.component.ts ***!
  \************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "TestMapComponent": () => (/* binding */ TestMapComponent)
/* harmony export */ });
/* harmony import */ var C_Users_Digvijay_Pandey_WebstormProjects_synco_customer_tracking_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js */ 9369);
/* harmony import */ var rxjs__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! rxjs */ 9329);
/* harmony import */ var rxjs__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! rxjs */ 4225);
/* harmony import */ var rxjs__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! rxjs */ 2122);
/* harmony import */ var rxjs__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! rxjs */ 8922);
/* harmony import */ var _riderIcon__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../riderIcon */ 6296);
/* harmony import */ var _environments_environment__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../environments/environment */ 2340);
/* harmony import */ var _here_flexible_polyline__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../here-flexible-polyline */ 2654);
/* harmony import */ var _here_flexible_polyline__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_here_flexible_polyline__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! @angular/core */ 8259);
/* harmony import */ var _order_service__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../order.service */ 6447);
/* harmony import */ var _angular_common_http__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! @angular/common/http */ 3690);





var Polyline = google.maps.Polyline;



const _c0 = ["map"];
class TestMapComponent {
  constructor(orderService, http) {
    this.orderService = orderService;
    this.http = http;
    this.coordinates = [];
    this.markers = [];
    this.order = {};
    this.subscribe = new rxjs__WEBPACK_IMPORTED_MODULE_5__.Subscription();
    this.riderPolyLine = new Polyline();
    this.pathPolyLine = new Polyline();
    this.riderMovementPath = [];
    this.movementSubject = new rxjs__WEBPACK_IMPORTED_MODULE_6__.Subject();
    this.riderSpeed = 15;
    this.iconInitialized = false;
    this.firstRiderMove = true;
  }

  ngOnInit() {
    var _this = this;

    return (0,C_Users_Digvijay_Pandey_WebstormProjects_synco_customer_tracking_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])(function* () {
      yield _this.orderService.init().then();
      _this.order = _this.orderService.order;

      _this.mapReady();

      _this.movementSubject.pipe((0,rxjs__WEBPACK_IMPORTED_MODULE_7__.debounceTime)(_this.riderSpeed)).subscribe(a => {
        if (_this.iconInitialized) {
          _this.moveRider();
        }
      });
    })();
  }

  mapReady() {
    var _this2 = this;

    this.riderPolyLine = new Polyline();
    this.pathPolyLine = new Polyline();
    this.map = new google.maps.Map(document.getElementById("map"), {
      center: {
        lat: this.order.delivery_location.latitude,
        lng: this.order.delivery_location.longitude
      },
      zoom: 14,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      disableDefaultUI: true,
      scrollwheel: true,
      mapTypeControl: false,
      scaleControl: false,
      draggable: true,
      disableDoubleClickZoom: true,
      zoomControl: false,
      gestureHandling: 'greedy'
    });
    this.pickupLatLng = {
      lat: this.order.pick_up_location.latitude,
      lng: this.order.pick_up_location.longitude
    };
    this.markers.push(this.pickupLatLng);
    const pickupMarker = new google.maps.Marker({
      position: new google.maps.LatLng(this.pickupLatLng.lat, this.pickupLatLng.lng),
      icon: {
        url: 'assets/images/store.svg',
        scaledSize: new google.maps.Size(48, 48) // size

      },
      title: ''
    });
    pickupMarker.setMap(this.map);
    google.maps.event.addListener(pickupMarker, 'click', () => {
      const infowindow = new google.maps.InfoWindow({
        content: "Domino's store"
      });
      infowindow.open(this.map, pickupMarker);
    });
    this.dropLatLng = {
      lat: this.order.delivery_location.latitude,
      lng: this.order.delivery_location.longitude
    };
    this.markers.push(this.dropLatLng);
    const dropMarker = new google.maps.Marker({
      position: new google.maps.LatLng(this.dropLatLng.lat, this.dropLatLng.lng),
      icon: {
        url: 'assets/images/home.svg',
        scaledSize: new google.maps.Size(48, 48) // size

      },
      title: ''
    });
    dropMarker.setMap(this.map);
    google.maps.event.addListener(dropMarker, 'click', () => {
      const infowindow = new google.maps.InfoWindow({
        content: 'Drop'
      });
      infowindow.open(this.map, dropMarker);
    });
    this.getRiderPathFromHerePathThenCacheLocally(this.order).then();
    this.riderLatLng = {
      lat: this.order.rider_position.latitude,
      lng: this.order.rider_position.longitude
    }; // if (this.order.rider_position.latitude === null && this.order.rider_position.longitude === null){
    //     const bounds = new google.maps.LatLngBounds(this.dropLatLng, this.pickupLatLng);
    //     this.map.fitBounds(bounds);
    // }else{

    this.orderService.riderPosition.subscribe(res => {
      const bounds = new google.maps.LatLngBounds(res);
      this.map.fitBounds(bounds);
      this.map.setZoom(15);
    }); // }

    const handlePollingPosition = /*#__PURE__*/function () {
      var _ref = (0,C_Users_Digvijay_Pandey_WebstormProjects_synco_customer_tracking_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])(function* (lat, lng) {
        let oldLat = _this2.riderLatLng.lat;
        let oldLng = _this2.riderLatLng.lng;

        if (_this2.riderMovementPath.length) {
          const latLng = _this2.riderMovementPath[_this2.riderMovementPath.length - 1];
          oldLat = latLng.lat;
          oldLng = latLng.lng;
        }

        const coords = yield _this2.calculateRiderMovementPath({
          latitude: oldLat,
          longitude: oldLng
        }, {
          latitude: lat,
          longitude: lng
        });

        _this2.riderMovementPath.push(...coords);

        _this2.movementSubject.next('true');
      });

      return function handlePollingPosition(_x, _x2) {
        return _ref.apply(this, arguments);
      };
    }();

    this.map.setCenter(new google.maps.LatLng(this.order.rider_position.latitude, this.order.rider_position.longitude));
    handlePollingPosition(this.order.rider_position.latitude, this.order.rider_position.longitude).then();
    this.subscribe = (0,rxjs__WEBPACK_IMPORTED_MODULE_8__.interval)(3000).subscribe( /*#__PURE__*/(0,C_Users_Digvijay_Pandey_WebstormProjects_synco_customer_tracking_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])(function* () {
      if (!document.hasFocus()) {
        console.log('Browser tab is changed; skipping polling');
        return;
      }

      _this2.orderService.init().then();

      _this2.order = _this2.orderService.order;

      if (_this2.riderLatLng.lat !== _this2.order.rider_position.latitude || _this2.riderLatLng.lng !== _this2.order.rider_position.longitude) {
        handlePollingPosition(_this2.order.rider_position.latitude, _this2.order.rider_position.longitude).then();
      }
    }));

    if (this.order.status_name === 'delivered' || this.order.status_name === 'cancelled') {
      this.subscribe.unsubscribe();
    }
  }

  moveRider() {
    if (!this.riderMovementPath.length) {
      return;
    }

    const latLng = this.riderMovementPath.shift();
    this.riderLatLng = latLng;
    console.log('riderMovement', this.riderMovementPath);

    if (this.firstRiderMove || this.riderMovementPath.length !== 0) {
      console.log('check passed...........');
      this.firstRiderMove = false;

      if (latLng) {
        this.riderPolyLine.getPath().push(new google.maps.LatLng(latLng));
      }

      if (this.riderMovementPath.length) {
        this.movementSubject.next('true');
      }
    }
  }

  generateAnimationPath(a, b) {
    let coords = [];
    let metres = Math.round(google.maps.geometry.spherical.computeDistanceBetween(new google.maps.LatLng(a), new google.maps.LatLng(b)));
    metres *= 10;
    const deltaLat = (b.lat - a.lat) / metres;
    const deltaLng = (b.lng - a.lng) / metres;
    let lat = a.lat;
    let lng = a.lng;

    for (let i = 0; i <= metres; i++) {
      lat += deltaLat;
      lng += deltaLng;
      coords.push({
        lat,
        lng
      });
    }

    return coords;
  }

  calculateRiderMovementPath(a, b) {
    var _this3 = this;

    return (0,C_Users_Digvijay_Pandey_WebstormProjects_synco_customer_tracking_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])(function* () {
      let coords = [];
      let lowestDistance = 10000;
      let lowestIndex = 0;

      _this3.coordinates.forEach((pathCord, index) => {
        const diff = google.maps.geometry.spherical.computeDistanceBetween(new google.maps.LatLng(b.latitude, b.longitude), new google.maps.LatLng(pathCord.lat, pathCord.lng));

        if (diff <= lowestDistance) {
          lowestDistance = diff;
          lowestIndex = index;
        }
      });

      if (lowestDistance < 50) {
        // rider is on plotted path
        const riderMovementCoords = _this3.coordinates.splice(0, lowestIndex);

        riderMovementCoords.forEach(coordinate => {
          if (coords.length) {
            coords.push(..._this3.generateAnimationPath(coords[coords.length - 1], coordinate));
          } else {// coords.push(...this.generateAnimationPath({lat: a.latitude, lng: a.longitude}, coordinate));
          }

          coords.push(coordinate);
        });

        if (coords.length) {
          coords.shift();
        }
      } else {
        coords = yield _this3.fetchRouteFromHereMaps(a, b);
        _this3.riderMovementPath = [];

        _this3.getRiderPathFromHerePathThenCacheLocally(_this3.order, false).then();
      }

      return coords;
    })();
  }

  getRiderPathFromHerePathThenCacheLocally(order, initial = true) {
    var _this4 = this;

    return (0,C_Users_Digvijay_Pandey_WebstormProjects_synco_customer_tracking_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])(function* () {
      let origin = undefined,
          destination = undefined;

      if (order.rider_position && order.rider_position.latitude && order.rider_position.longitude) {
        origin = {
          latitude: order.rider_position.latitude,
          longitude: order.rider_position.longitude
        };
      }

      if (order.delivery_location && order.delivery_location.latitude && order.delivery_location.longitude) {
        destination = {
          latitude: order.delivery_location.latitude,
          longitude: order.delivery_location.longitude
        };
      }

      if (!origin || !destination) {
        return;
      }

      _this4.coordinates = yield _this4.fetchRouteFromHereMaps(origin, destination);

      try {
        _this4.pathPolyLine.setMap(null);
      } catch (e) {
        console.log(e);
      }

      _this4.pathPolyLine = new google.maps.Polyline({
        strokeColor: '#0047b3',
        map: _this4.map,
        path: _this4.coordinates,
        geodesic: true,
        visible: true
      });

      if (initial) {
        _this4.iconInitialized = true;
        _this4.riderPolyLine = new google.maps.Polyline({
          strokeColor: '#0078AC',
          strokeOpacity: 0,
          map: _this4.map,
          path: [{
            lat: origin.latitude + 0.0000001,
            lng: origin.longitude + 0.00000001
          }],
          icons: (0,_riderIcon__WEBPACK_IMPORTED_MODULE_1__.getRiderIconBike)(),
          zIndex: 9999999999999999999
        });

        const zoomToObject = obj => {
          const bounds = new google.maps.LatLngBounds();
          const points = obj.getPath().getArray();

          for (let n = 0; n < points.length; n++) {
            bounds.extend(points[n]);
          }

          _this4.map.fitBounds(bounds);
        };

        zoomToObject(_this4.pathPolyLine);

        _this4.moveRider();
      }
    })();
  }

  fetchRouteFromHereMaps(a, b) {
    var _this5 = this;

    return (0,C_Users_Digvijay_Pandey_WebstormProjects_synco_customer_tracking_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])(function* () {
      try {
        const response = yield _this5.http.get('https://router.hereapi.com/v8/routes', {
          params: {
            origin: `${a.latitude},${a.longitude}`,
            transportMode: 'car',
            destination: `${b.latitude},${b.longitude}`,
            'return': 'polyline',
            apikey: _environments_environment__WEBPACK_IMPORTED_MODULE_2__.environment.hereApiKey
          }
        }).toPromise();
        const latLngList = _here_flexible_polyline__WEBPACK_IMPORTED_MODULE_3__.decode(response.routes[0].sections[0].polyline).polyline;
        return latLngList.map(x => {
          return {
            lat: x[0],
            lng: x[1]
          };
        });
      } catch (e) {
        console.error(e);
        return [];
      }
    })();
  }

}

TestMapComponent.ɵfac = function TestMapComponent_Factory(t) {
  return new (t || TestMapComponent)(_angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵdirectiveInject"](_order_service__WEBPACK_IMPORTED_MODULE_4__.OrderService), _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵdirectiveInject"](_angular_common_http__WEBPACK_IMPORTED_MODULE_10__.HttpClient));
};

TestMapComponent.ɵcmp = /*@__PURE__*/_angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵdefineComponent"]({
  type: TestMapComponent,
  selectors: [["app-test-map"]],
  viewQuery: function TestMapComponent_Query(rf, ctx) {
    if (rf & 1) {
      _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵviewQuery"](_c0, 5);
    }

    if (rf & 2) {
      let _t;

      _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵqueryRefresh"](_t = _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵloadQuery"]()) && (ctx.mapElement = _t.first);
    }
  },
  decls: 1,
  vars: 0,
  consts: [["id", "map", 2, "border", "0px solid #35b0e3", "height", "60vh", "max-width", "100%"]],
  template: function TestMapComponent_Template(rf, ctx) {
    if (rf & 1) {
      _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵelement"](0, "div", 0);
    }
  },
  styles: ["\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IiIsImZpbGUiOiJ0ZXN0LW1hcC5jb21wb25lbnQuY3NzIn0= */"]
});

/***/ }),

/***/ 2340:
/*!*****************************************!*\
  !*** ./src/environments/environment.ts ***!
  \*****************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "environment": () => (/* binding */ environment)
/* harmony export */ });
// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.
const environment = {
    appVersion: (__webpack_require__(/*! ../../package.json */ 4147).version) + '-test',
    production: false,
    apiUrl: 'https://synco-test-api.roadcast.co.in/api/v1/',
    hereApiKey: '3Xz_d2T_zyHKm1WhBNRAdtmToAQ_HhLmWtMstKeFo34',
};
/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.


/***/ }),

/***/ 4431:
/*!*********************!*\
  !*** ./src/main.ts ***!
  \*********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _angular_platform_browser__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @angular/platform-browser */ 7532);
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @angular/core */ 8259);
/* harmony import */ var _app_app_module__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./app/app.module */ 6747);
/* harmony import */ var _environments_environment__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./environments/environment */ 2340);




if (_environments_environment__WEBPACK_IMPORTED_MODULE_1__.environment.production) {
    (0,_angular_core__WEBPACK_IMPORTED_MODULE_2__.enableProdMode)();
}
_angular_platform_browser__WEBPACK_IMPORTED_MODULE_3__.platformBrowser().bootstrapModule(_app_app_module__WEBPACK_IMPORTED_MODULE_0__.AppModule)
    .catch(err => console.error(err));


/***/ }),

/***/ 6700:
/*!***************************************************!*\
  !*** ./node_modules/moment/locale/ sync ^\.\/.*$ ***!
  \***************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var map = {
	"./af": 2275,
	"./af.js": 2275,
	"./ar": 857,
	"./ar-dz": 1218,
	"./ar-dz.js": 1218,
	"./ar-kw": 4754,
	"./ar-kw.js": 4754,
	"./ar-ly": 6680,
	"./ar-ly.js": 6680,
	"./ar-ma": 2178,
	"./ar-ma.js": 2178,
	"./ar-sa": 6522,
	"./ar-sa.js": 6522,
	"./ar-tn": 5682,
	"./ar-tn.js": 5682,
	"./ar.js": 857,
	"./az": 164,
	"./az.js": 164,
	"./be": 9774,
	"./be.js": 9774,
	"./bg": 947,
	"./bg.js": 947,
	"./bm": 1832,
	"./bm.js": 1832,
	"./bn": 9650,
	"./bn-bd": 4477,
	"./bn-bd.js": 4477,
	"./bn.js": 9650,
	"./bo": 6005,
	"./bo.js": 6005,
	"./br": 8492,
	"./br.js": 8492,
	"./bs": 534,
	"./bs.js": 534,
	"./ca": 2061,
	"./ca.js": 2061,
	"./cs": 4737,
	"./cs.js": 4737,
	"./cv": 1167,
	"./cv.js": 1167,
	"./cy": 7996,
	"./cy.js": 7996,
	"./da": 9528,
	"./da.js": 9528,
	"./de": 4540,
	"./de-at": 9430,
	"./de-at.js": 9430,
	"./de-ch": 7978,
	"./de-ch.js": 7978,
	"./de.js": 4540,
	"./dv": 3426,
	"./dv.js": 3426,
	"./el": 6616,
	"./el.js": 6616,
	"./en-au": 3816,
	"./en-au.js": 3816,
	"./en-ca": 2162,
	"./en-ca.js": 2162,
	"./en-gb": 3305,
	"./en-gb.js": 3305,
	"./en-ie": 1954,
	"./en-ie.js": 1954,
	"./en-il": 3060,
	"./en-il.js": 3060,
	"./en-in": 9923,
	"./en-in.js": 9923,
	"./en-nz": 3540,
	"./en-nz.js": 3540,
	"./en-sg": 6505,
	"./en-sg.js": 6505,
	"./eo": 1907,
	"./eo.js": 1907,
	"./es": 6640,
	"./es-do": 1246,
	"./es-do.js": 1246,
	"./es-mx": 6131,
	"./es-mx.js": 6131,
	"./es-us": 6430,
	"./es-us.js": 6430,
	"./es.js": 6640,
	"./et": 2551,
	"./et.js": 2551,
	"./eu": 2711,
	"./eu.js": 2711,
	"./fa": 4572,
	"./fa.js": 4572,
	"./fi": 3390,
	"./fi.js": 3390,
	"./fil": 7860,
	"./fil.js": 7860,
	"./fo": 8216,
	"./fo.js": 8216,
	"./fr": 9291,
	"./fr-ca": 8527,
	"./fr-ca.js": 8527,
	"./fr-ch": 8407,
	"./fr-ch.js": 8407,
	"./fr.js": 9291,
	"./fy": 7054,
	"./fy.js": 7054,
	"./ga": 9540,
	"./ga.js": 9540,
	"./gd": 3917,
	"./gd.js": 3917,
	"./gl": 1486,
	"./gl.js": 1486,
	"./gom-deva": 6245,
	"./gom-deva.js": 6245,
	"./gom-latn": 8868,
	"./gom-latn.js": 8868,
	"./gu": 9652,
	"./gu.js": 9652,
	"./he": 9019,
	"./he.js": 9019,
	"./hi": 2040,
	"./hi.js": 2040,
	"./hr": 3402,
	"./hr.js": 3402,
	"./hu": 9322,
	"./hu.js": 9322,
	"./hy-am": 7609,
	"./hy-am.js": 7609,
	"./id": 7942,
	"./id.js": 7942,
	"./is": 8275,
	"./is.js": 8275,
	"./it": 3053,
	"./it-ch": 4378,
	"./it-ch.js": 4378,
	"./it.js": 3053,
	"./ja": 6176,
	"./ja.js": 6176,
	"./jv": 679,
	"./jv.js": 679,
	"./ka": 2726,
	"./ka.js": 2726,
	"./kk": 2953,
	"./kk.js": 2953,
	"./km": 6957,
	"./km.js": 6957,
	"./kn": 9181,
	"./kn.js": 9181,
	"./ko": 7148,
	"./ko.js": 7148,
	"./ku": 7752,
	"./ku.js": 7752,
	"./ky": 5675,
	"./ky.js": 5675,
	"./lb": 1263,
	"./lb.js": 1263,
	"./lo": 5746,
	"./lo.js": 5746,
	"./lt": 1143,
	"./lt.js": 1143,
	"./lv": 8753,
	"./lv.js": 8753,
	"./me": 4054,
	"./me.js": 4054,
	"./mi": 1573,
	"./mi.js": 1573,
	"./mk": 202,
	"./mk.js": 202,
	"./ml": 8523,
	"./ml.js": 8523,
	"./mn": 9794,
	"./mn.js": 9794,
	"./mr": 6681,
	"./mr.js": 6681,
	"./ms": 6975,
	"./ms-my": 9859,
	"./ms-my.js": 9859,
	"./ms.js": 6975,
	"./mt": 3691,
	"./mt.js": 3691,
	"./my": 5152,
	"./my.js": 5152,
	"./nb": 7607,
	"./nb.js": 7607,
	"./ne": 1526,
	"./ne.js": 1526,
	"./nl": 6368,
	"./nl-be": 76,
	"./nl-be.js": 76,
	"./nl.js": 6368,
	"./nn": 8420,
	"./nn.js": 8420,
	"./oc-lnc": 1906,
	"./oc-lnc.js": 1906,
	"./pa-in": 4504,
	"./pa-in.js": 4504,
	"./pl": 4721,
	"./pl.js": 4721,
	"./pt": 4645,
	"./pt-br": 4548,
	"./pt-br.js": 4548,
	"./pt.js": 4645,
	"./ro": 1977,
	"./ro.js": 1977,
	"./ru": 6042,
	"./ru.js": 6042,
	"./sd": 8849,
	"./sd.js": 8849,
	"./se": 7739,
	"./se.js": 7739,
	"./si": 84,
	"./si.js": 84,
	"./sk": 2449,
	"./sk.js": 2449,
	"./sl": 3086,
	"./sl.js": 3086,
	"./sq": 3139,
	"./sq.js": 3139,
	"./sr": 607,
	"./sr-cyrl": 63,
	"./sr-cyrl.js": 63,
	"./sr.js": 607,
	"./ss": 131,
	"./ss.js": 131,
	"./sv": 1665,
	"./sv.js": 1665,
	"./sw": 5642,
	"./sw.js": 5642,
	"./ta": 3622,
	"./ta.js": 3622,
	"./te": 4825,
	"./te.js": 4825,
	"./tet": 8336,
	"./tet.js": 8336,
	"./tg": 9238,
	"./tg.js": 9238,
	"./th": 9463,
	"./th.js": 9463,
	"./tk": 9986,
	"./tk.js": 9986,
	"./tl-ph": 9672,
	"./tl-ph.js": 9672,
	"./tlh": 43,
	"./tlh.js": 43,
	"./tr": 1212,
	"./tr.js": 1212,
	"./tzl": 110,
	"./tzl.js": 110,
	"./tzm": 482,
	"./tzm-latn": 8309,
	"./tzm-latn.js": 8309,
	"./tzm.js": 482,
	"./ug-cn": 2495,
	"./ug-cn.js": 2495,
	"./uk": 4157,
	"./uk.js": 4157,
	"./ur": 984,
	"./ur.js": 984,
	"./uz": 4141,
	"./uz-latn": 3662,
	"./uz-latn.js": 3662,
	"./uz.js": 4141,
	"./vi": 2607,
	"./vi.js": 2607,
	"./x-pseudo": 6460,
	"./x-pseudo.js": 6460,
	"./yo": 2948,
	"./yo.js": 2948,
	"./zh-cn": 2658,
	"./zh-cn.js": 2658,
	"./zh-hk": 9352,
	"./zh-hk.js": 9352,
	"./zh-mo": 8274,
	"./zh-mo.js": 8274,
	"./zh-tw": 8451,
	"./zh-tw.js": 8451
};


function webpackContext(req) {
	var id = webpackContextResolve(req);
	return __webpack_require__(id);
}
function webpackContextResolve(req) {
	if(!__webpack_require__.o(map, req)) {
		var e = new Error("Cannot find module '" + req + "'");
		e.code = 'MODULE_NOT_FOUND';
		throw e;
	}
	return map[req];
}
webpackContext.keys = function webpackContextKeys() {
	return Object.keys(map);
};
webpackContext.resolve = webpackContextResolve;
module.exports = webpackContext;
webpackContext.id = 6700;

/***/ }),

/***/ 4147:
/*!**********************!*\
  !*** ./package.json ***!
  \**********************/
/***/ ((module) => {

"use strict";
module.exports = JSON.parse('{"name":"customer-tracking","version":"0.0.1","scripts":{"ng":"ng","start":"ng serve","build":"ng build","watch":"ng build --watch --configuration development","test":"ng test"},"private":true,"dependencies":{"@angular/animations":"~13.2.0","@angular/cdk":"^13.0.0","@angular/common":"~13.2.0","@angular/compiler":"~13.2.0","@angular/core":"~13.2.0","@angular/forms":"~13.2.0","@angular/platform-browser":"~13.2.0","@angular/platform-browser-dynamic":"~13.2.0","@angular/router":"~13.2.0","@types/color":"^3.0.3","@types/google.maps":"^3.49.2","bootstrap":"^5.1.3","bootstrap-cli":"^1.0.0","moment":"^2.29.4","ng-circle-progress":"^1.6.0","ngx-star-rating":"^2.1.0","rxjs":"~7.5.0","serve":"^14.0.1","smooth-icon-marker":"^2.0.0","tslib":"^2.3.0","zone.js":"~0.11.4"},"devDependencies":{"@angular-devkit/build-angular":"~13.2.6","@angular/cli":"~13.2.6","@angular/compiler-cli":"~13.2.0","@types/googlemaps":"^3.43.3","@types/jasmine":"~3.10.0","@types/node":"^12.20.55","jasmine-core":"~4.0.0","karma":"~6.3.0","karma-chrome-launcher":"~3.1.0","karma-coverage":"~2.1.0","karma-jasmine":"~4.0.0","karma-jasmine-html-reporter":"~1.7.0","typescript":"~4.5.2"}}');

/***/ })

},
/******/ __webpack_require__ => { // webpackRuntimeModules
/******/ var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
/******/ __webpack_require__.O(0, ["vendor"], () => (__webpack_exec__(4431)));
/******/ var __webpack_exports__ = __webpack_require__.O();
/******/ }
]);
//# sourceMappingURL=main.js.map
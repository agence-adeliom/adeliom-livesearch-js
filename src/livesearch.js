import Emitter from 'dauphine-js/dist/emitter';
import {$, $$, animate, addEvent, getParams, buildQuery, updateURL, mergeObjects} from "dauphine-js";
import styles from './livesearch.scss';

export default class Livesearch extends Emitter {

    constructor(settings={}) {

        super();

        this.options = {
            "pathAjax": "",
            "actionAjax": "",
            "formSelector": "[js-livesearch-form]",
            "resultsSelector": "[js-livesearch-results]",
            "loadingSelector": "[js-livesearch-loading]",
            "paginationSelector": "[js-livesearch-pagination]",
            "resetSelector": "[js-livesearch-reset]",
            "noResultSelector": "[js-livesearch-noresult]",
            "pageNumberSelector": "[js-livesearch-page]",
            "excludeFilterSelector": "[js-livesearch-exclude]",
            "submitSelector": "",
            "perPage": 9,
            "minimumTimeLoading": 1000,
            "paramsInUrl": true,
            "animationScrollTo": "smooth",
        };

        this.options = mergeObjects(this.options, settings);

        this.formWrapper = null;
        this.resetWrapper = null;

        this.filters = [];

    }

    init(callback) {

        this.formWrapper = $(this.options.formSelector);
        this.resultsWrapper = $(this.options.resultsSelector);
        this.loadingWrapper = $(this.options.loadingSelector);
        this.noResultWrapper = $(this.options.noResultSelector);

        this.paginationWrapper = this.options.paginationSelector ? $(this.options.paginationSelector) : null;

        this.submitWrapper = this.options.submitSelector ? $$(this.options.submitSelector) : null;
        this.resetWrapper = this.options.submitSelector ? $$(this.options.resetSelector) : null;

        if(!this.options.pathAjax){
            throw "Path ajax is required";
        }

        if(!this.formWrapper || !this.resultsWrapper || !this.loadingWrapper || !this.noResultWrapper){
            throw "A wrapper is missing";
        }

        this._activeFilters();

        this.formWrapper.onchange = (e) => {
            e.preventDefault();
            this._onChange(e);
        };

        if(this.resetWrapper && this.resetWrapper.length){
            this.resetWrapper.forEach((el) => {
                el.addEventListener('click', () => {
                    this.reset();
                }, false);
            });
        }

        if(this.submitWrapper && this.submitWrapper.length){
            this.submitWrapper.forEach((el) => {
                el.addEventListener('click', (e) => {
                    e.preventDefault();
                    this._handleChange();
                }, false);
            });
        }

        addEvent('click', this.options.pageNumberSelector, (e) => {

            e.preventDefault();

            const target = e.target;

            const page = target.getAttribute(this._formatAttributeSelector(this.options.pageNumberSelector));
            let newParams = getParams(window.location);
            newParams.page = page;

            const href = target.getAttribute('href');
            const hash = href.substring(href.indexOf('#'));
            const element = document.getElementById(hash.replace('#', ''));
            if(element){
                const y = element.getBoundingClientRect().top + window.pageYOffset;
                window.scrollTo({top: y, behavior: this.options.animationScrollTo});
            }

            this.emit('pageChange', {
                filters: this.filters,
                params: newParams,
                hash: hash
            });

            if(this.options.paramsInUrl){
                this._updateQuery(newParams);
            }
            else{
                this._getDatas(newParams);
            }

        });

        if(callback && typeof callback === 'function'){
            callback();
        }

    }

    _formatAttributeSelector(selector) {
        return selector.replace('[', '').replace(']', '');
    }

    _activeFilters() {
        const currentParams = getParams(window.location);
        Object.keys(currentParams).forEach((key) => {
            const input = this.formWrapper.querySelectorAll("[name=" +key+"]");
            const values = currentParams[key].split(',');
            this.filters[key] = values;
            input.forEach((el) => {
                if(el.type === "select" || el.type === 'select-multiple'){
                    el.options.forEach((option) => {
                        if(values.indexOf(option.value) !== -1){
                            option.defaultSelected = true;
                        }
                    });
                }
                if((el.type === 'checkbox' || el.type === 'radio') && values.indexOf(el.value) !== -1) {
                    el.setAttribute('checked', true);
                }
            });
        });
    }

    update(event, name, value){
        this._onChange(event, name, value);
    }

    _onChange(event, inputName, inputValue) {

        const target = inputName ? $('[name='+inputName+']') : event.target;
        if(!target || target.hasAttribute(this._formatAttributeSelector(this.options.excludeFilterSelector))){
            return;
        }

        const targetName = inputName ? inputName : target.name;
        const value = inputValue ? inputValue : target.type === "select-multiple" ? this._getSelectValues(target) : target.value;

        if(this.filters[targetName] && this.filters[targetName].length){

            if(target.type === 'checkbox'){

                const index = this.filters[targetName].indexOf(value);

                if(index !== -1){
                    this.filters[targetName].splice(index, 1);
                }
                else{
                    this.filters[targetName].push(value);
                }

            }
            else{
                this.filters[targetName] = value;
            }

            if(!this.filters[targetName].length){
                delete this.filters[targetName];
            }

        }
        else{
            this.filters[targetName] = [];
            this.filters[targetName].push(value);
        }

        if(!this.options.submitSelector){
            this._handleChange();
        }

    }

    _handleChange() {
        const newParams = {};

        Object.keys(this.filters).forEach((filter) => {
            newParams[filter] = this.filters[filter];
        });

        const currentParams = getParams(window.location);

        if(currentParams && currentParams.page){
            newParams.page = currentParams.page;
        }

        if(this.options.paramsInUrl){
            this._updateQuery(newParams);
        }
        else{
            this._getDatas(newParams);
        }
    }

    _getSelectValues(select) {
        var result = [];
        var options = select && select.options;
        var opt;

        for (var i=0, iLen=options.length; i<iLen; i++) {
            opt = options[i];

            if (opt.selected) {
                result.push(opt.value || opt.text);
            }
        }
        return result;
    }

    _updateQuery(params) {
        const newQuery = buildQuery(params, false);
        updateURL(newQuery);
        this._getDatas(params);
    }

    _getDatas(params={}) {

        const options = {};

        if(this.options.perPage){
            options.perPage = this.options.perPage;
        }

        if(this.options.actionAjax){
            options.action = this.options.actionAjax;
        }

        const query = buildQuery(mergeObjects(params, options), false);

        if(this.noResultWrapper.classList.contains('is-visible')){
            animate(this.noResultWrapper, 'animation-out', () => {
                this.loadingWrapper.classList.add('is-visible');
            }, false, true);
        }
        else{
            animate(this.resultsWrapper, 'animation-out', () => {
                this.loadingWrapper.classList.add('is-visible');
            }, true);
        }

        this.emit('beforeChange', {
            params: params,
            filters: this.filters
        });

        const xhr = new XMLHttpRequest();

        xhr.open("GET", this.options.pathAjax + '?' + query);

        xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');

        const delay = this.options.minimumTimeLoading;
        const timeInit = new Date().getTime();

        xhr.onload = () => {
            if(xhr.status === 200){

                const results = JSON.parse(xhr.response);

                const timeEnd = new Date().getTime();
                if (timeEnd-timeInit < delay) {
                    setTimeout(() => {
                        this._showResults(results, params);
                    }, delay - (timeEnd-timeInit))
                } else {
                    this._showResults(results, params);
                }
                
            }
            else{
                this.emit("error", xhr);
            }
        };

        xhr.send(this.filters);

    }

    _showResults(results, params) {

        this.resultsWrapper.innerHTML = "";

        if(this.paginationWrapper){
            this.paginationWrapper.innerHTML = "";
        }

        if(results.items && results.items.length){
            results.items.forEach((item) => {
                this.resultsWrapper.innerHTML += item;
            });
        }

        if(results.pagination){
            this.paginationWrapper.innerHTML = results.pagination;
        }

        const style = window.getComputedStyle(this.loadingWrapper, null).getPropertyValue('transiton-duration');

        animate(this.loadingWrapper, 'animation-out', () => {
            this.loadingWrapper.classList.remove('is-visible');

            if(results.items && results.items.length){
                this.resultsWrapper.removeAttribute('hidden');
                this.noResultWrapper.classList.remove('is-visible');
            }
            else{
                this.noResultWrapper.classList.add('is-visible');
            }

            this.emit("afterChange", {
                results: results,
                params: params,
                filters: this.filters
            });
        }, false, true);
    }

    reset() {
        this.formWrapper.reset();
        this.filters = [];
        updateURL("");
        this.emit('reset');
        this._getDatas();
    }

}

import Emitter from 'dauphine-js/dist/emitter';
import {$, $$, animate, addEvent, getParams, buildQuery, updateURL, mergeObjects} from "dauphine-js";

const beforeChangeEventName = 'beforeChange';
const afterChangeEventName = 'afterChange';
const pageChangeEventName = 'pageChange';

export default class Livesearch extends Emitter {

    constructor(settings = {}) {

        super();

        this.options = {
            "pathAjax": "",
            "actionAjax": "",
            "formSelector": "[js-livesearch-form]",
            "resultsSelector": "[js-livesearch-results]",
            "resultsItemsSelector": "[js-livesearch-items]",
            "loadingSelector": "[js-livesearch-loading]",
            "infiniteScrollLoadingSelector": "[js-livesearch-infinite-scroll-loading]",
            "paginationSelector": "[js-livesearch-pagination]",
            "resetSelector": "[js-livesearch-reset]",
            "noResultSelector": "[js-livesearch-noresult]",
            "pageNumberSelector": "[js-livesearch-page]",
            "excludeFilterSelector": "[js-livesearch-exclude]",
            "moreButtonSelector": "[js-livesearch-show-more]",
            "pageKey": "page",
            "moreButtonText": "Voir plus",
            "moreButtonClasses": ["btn"],
            "submitSelector": "",
            "perPage": 9,
            "minimumTimeLoading": 300,
            "paramsInUrl": true,
            "animationScrollTo": "smooth",
            "animationManually": false,
            "infiniteScroll": false,
            "infiniteScrollOffset": 200,
            "infiniteScrollPreloadedAttribute": "js-livesearch-preloaded",
            "manualInfiniteScroll": false,
            "useAnimate": true,
        };

        this.options = mergeObjects(this.options, settings);

        this.isOriginalQuery = true;
        this.reachedLastItems = false;
        this.isLoading = false;
        this.page = 1;

        this.formWrapper = null;
        this.resetWrapper = null;

        this.xhr = null;

        this.filters = [];

    }

    init(callback) {

        this.formWrapper = $(this.options.formSelector);
        this.resultsWrapper = $(this.options.resultsSelector);
        this.loadingWrapper = $(this.options.loadingSelector);
        this.noResultWrapper = $(this.options.noResultSelector);
        this.resultsItemsWrapper = $(this.options.resultsItemsSelector);

        this._checkResultsCount();

        this.paginationWrapper = this.options.paginationSelector ? $(this.options.paginationSelector) : null;

        this.submitWrapper = this.options.submitSelector ? $$(this.options.submitSelector) : null;
        this.resetWrapper = this.options.resetSelector ? $$(this.options.resetSelector) : null;

        if (!this.options.pathAjax) {
            throw "Path ajax is required";
        }

        if (!this.formWrapper || !this.resultsWrapper || !this.loadingWrapper || !this.noResultWrapper) {
            throw "A wrapper is missing";
        }

        this._activeFilters();

        if (this.options.infiniteScroll || this.options.manualInfiniteScroll) {
            this.infiniteScrollLoadingWrapper = $(this.options.infiniteScrollLoadingSelector);

            if (this.options.manualInfiniteScroll) {
                this._manualInfiniteScroll();
            } else {
                this._infiniteScroll();
            }
        }

        this.formWrapper.addEventListener("submit", (e) => {
            e.preventDefault();
        });

        this.formWrapper.onchange = (e) => {
            e.preventDefault();

            if (this.options.manualInfiniteScroll) {
                this._enableManualInfinityScroll();
            }

            this._onChange(e);
        };

        if (this.resetWrapper && this.resetWrapper.length) {
            this.resetWrapper.forEach((el) => {
                el.addEventListener('click', () => {
                    this.reset();
                }, false);
            });
        }

        if (this.submitWrapper && this.submitWrapper.length) {
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
            newParams[this.options.pageKey] = page;

            const href = target.getAttribute('href');
            const hash = href.substring(href.indexOf('#'));
            const element = document.getElementById(hash.replace('#', ''));

            let y = null;

            if (element) {
                y = element.getBoundingClientRect().top + window.pageYOffset;
                if (!this.options.animationManually) {
                    if (this.options.animationScrollTo) {
                        window.scrollTo({top: y, behavior: this.options.animationScrollTo});
                    } else {
                        window.scrollTo({top: y});
                    }
                }
            }

            this.emit(pageChangeEventName, {
                filters: this.filters,
                params: newParams,
                hash: hash,
                offset: y
            });

            if (this.options.paramsInUrl) {
                this._updateQuery(newParams);
            } else {
                this._getDatas(newParams);
            }

        });

        if (callback && typeof callback === 'function') {
            callback();
        }

    }

    _checkResultsCount() {
        const children = this.resultsItemsWrapper ? this.resultsItemsWrapper.children : this.resultsWrapper.children;

        if (children.length === 0) {
            this._displayNoResultWrapper();
            this._hideResultsWrapper();
        }
    }

    _formatAttributeSelector(selector) {
        return selector.replace('[', '').replace(']', '');
    }

    _infiniteScrollRequest(isMoreButton = false) {
        if (this.isOriginalQuery) {
            if (this.resultsWrapper.getAttribute(this.options.infiniteScrollPreloadedAttribute) && this.resultsWrapper.getAttribute(this.options.infiniteScrollPreloadedAttribute) < this.options.perPage) {
                return;
            }
        }

        if (!this.reachedLastItems && !this.isLoading) {
            this.isLoading = true;
            ++this.page;
            this._handleChange(true, isMoreButton);
        }
    }

    _infiniteScroll() {
        const infiniteScrollContainer = $(this.options.resultsSelector);

        if (infiniteScrollContainer) {
            window.addEventListener('scroll', () => {
                const windowScrollBottomPosition = window.scrollY + window.innerHeight;
                const infiniteContainerBottomPosition = infiniteScrollContainer.getBoundingClientRect().bottom + window.scrollY;

                if (windowScrollBottomPosition > (infiniteContainerBottomPosition - this.options.infiniteScrollOffset) && !this.isLoading) {
                    this._infiniteScrollRequest();
                }
            });
        }
    }

    _manualInfiniteScroll() {
        this.options.infiniteScroll = true;
        const moreButtonContainer = $(this.options.moreButtonSelector);

        if (moreButtonContainer) {
            const showMoreButton = document.createElement('button');
            showMoreButton.textContent = this.options.moreButtonText;

            this.options.moreButtonClasses.forEach(className => {
                showMoreButton.classList.add(className);
            });

            showMoreButton.addEventListener('click', () => {
                this._infiniteScrollRequest(true);
            });

            moreButtonContainer.appendChild(showMoreButton);
        }
    }

    _activeFilters() {
        const currentParams = getParams(window.location);
        Object.keys(currentParams).forEach((key) => {
            const input = this.formWrapper.querySelectorAll('[name="' + key + '"]');
            const values = currentParams[key].split(',');
            this.filters[key] = values;
            input.forEach((el) => {
                if (el.type === "select" || el.type === "select-one" || el.type === 'select-multiple') {
                    for (let i = 0; i < el.options.length; i++) {
                        const option = el.options[i];
                        if (values.indexOf(option.value) !== -1) {
                            option.defaultSelected = true;
                        }
                    }
                }
                if ((el.type === 'checkbox' || el.type === 'radio') && values.indexOf(el.value) !== -1) {
                    el.setAttribute('checked', true);
                }
                if (el.type === 'text') {
                    el.value = currentParams[key];
                }
            });
        });
    }

    update(event, name, value) {
        this._onChange(event, name, value, true);
    }

    _onChange(event, inputName, inputValue, manualUpdate = false) {

        this.isOriginalQuery = false;
        this.reachedLastItems = false;

        this.page = 1;

        const target = inputName ? $('[name=' + inputName + ']') : event.target;
        if ((!target || target.hasAttribute(this._formatAttributeSelector(this.options.excludeFilterSelector)) && !manualUpdate)) {
            return;
        }

        const targetName = inputName ? inputName : target.name;
        const value = inputValue ? inputValue : target.type === "select-multiple" ? this._getSelectValues(target) : target.value;

        if (this.filters[targetName] && this.filters[targetName].length) {

            if (target.type === 'checkbox') {

                const index = this.filters[targetName].indexOf(value);

                if (index !== -1) {
                    this.filters[targetName].splice(index, 1);
                } else {
                    this.filters[targetName].push(value);
                }

            } else {
                this.filters[targetName] = value;
            }

            if (!this.filters[targetName].length) {
                delete this.filters[targetName];
            }

        } else {
            this.filters[targetName] = [];
            this.filters[targetName].push(value);
        }

        this.emit('click', {
            filters: this.filters,
            target: target
        });

        if (!this.options.submitSelector) {
            this._handleChange();
        }

    }

    _handleChange(isInfiniteScroll = false, isMoreButton = false) {
        const newParams = {};

        Object.keys(this.filters).forEach((filter) => {
            newParams[filter] = this.filters[filter];
        });

        if (this.options.paramsInUrl) {
            this._updateQuery(newParams, isInfiniteScroll, isMoreButton);
        } else {
            this._getDatas(newParams, isInfiniteScroll, isMoreButton);
        }
    }

    _getSelectValues(select) {
        var result = [];
        var options = select && select.options;
        var opt;

        for (var i = 0, iLen = options.length; i < iLen; i++) {
            opt = options[i];
            if (opt.selected && !opt.disabled && opt.value && opt.value !== "NONE") {
                result.push(opt.value || opt.text);
            }
        }
        return result;
    }

    _updateQuery(params, isInfiniteScroll = false, isMoreButton = false) {
        const newQuery = buildQuery(params, false);
        updateURL(newQuery);
        this._getDatas(params, isInfiniteScroll, isMoreButton);
    }

    _enableManualInfinityScroll() {
        const moreButtonContainer = $(this.options.moreButtonSelector);
        moreButtonContainer.style.display = '';
        moreButtonContainer.removeAttribute('hidden');
    }

    _disableManualInfinityScroll() {
        const moreButtonContainer = $(this.options.moreButtonSelector);
        moreButtonContainer.style.display = 'none';
        moreButtonContainer.setAttribute('hidden', '');
    }

    _displayLoadingWrapper(params) {
        this.loadingWrapper.classList.add('is-visible');
        this.loadingWrapper.removeAttribute('hidden');

        this._hideResultsWrapper();

        this.emit('isLoading', {
            params: params,
            filters: this.filters
        });
    }

    _hideLoadingWrapper() {
        this.loadingWrapper.classList.remove('is-visible');
        this.loadingWrapper.setAttribute('hidden', '');
    }

    _displayInfiniteScrollLoadingWrapper() {
        if (this.infiniteScrollLoadingWrapper) {
            this.infiniteScrollLoadingWrapper.classList.add('is-visible');
            this.infiniteScrollLoadingWrapper.removeAttribute('hidden');
        }
    }

    _hideInfiniteScrollLoadingWrapper() {
        if (this.infiniteScrollLoadingWrapper) {
            const callback = () => {
                this.infiniteScrollLoadingWrapper.classList.remove('is-visible');
                this.infiniteScrollLoadingWrapper.setAttribute('hidden', '');
            };

            if (this.options.useAnimate) {
                animate(this.infiniteScrollLoadingWrapper, 'animation-out', callback(), false, true);
            } else {
                callback();
            }
        }
    }

    _displayNoResultWrapper() {
        this.noResultWrapper.removeAttribute('hidden');
        this.noResultWrapper.classList.add('is-visible');
    }

    _hideNoResultWrapper() {
        this.noResultWrapper.setAttribute('hidden', '');
        this.noResultWrapper.classList.remove('is-visible');
    }

    _displayResultsWrapper() {
        this.resultsWrapper.removeAttribute('hidden');
        this.resultsWrapper.classList.add('is-visible');
    }

    _hideResultsWrapper() {
        this.resultsWrapper.setAttribute('hidden', '');
        this.resultsWrapper.classList.remove('is-visible');
    }

    _getDatas(params = {}, infiniteScroll = false, isMoreButton = false) {

        this.isLoading = true;

        const options = {};

        if (this.options.perPage) {
            options.perPage = this.options.perPage;
        }

        if (infiniteScroll && this.page) {
            options.page = this.page;
        }

        if (this.options.actionAjax) {
            options.action = this.options.actionAjax;
        }

        const query = buildQuery(mergeObjects(params, options), false);

        if (!infiniteScroll) {
            if (this.noResultWrapper.classList.contains('is-visible')) {
                const callback = () => {
                    this._displayLoadingWrapper(params);
                };

                if (this.options.useAnimate) {
                    animate(this.noResultWrapper, 'animation-out', callback(), true);
                } else {
                    callback();
                }
            } else {
                const callback = () => {
                    this._displayLoadingWrapper(params);
                };

                if (this.options.useAnimate) {
                    animate(this.resultsWrapper, 'animation-out', callback(), true);
                } else {
                    callback();
                }
            }
        } else {
            this._displayInfiniteScrollLoadingWrapper();
        }

        if (!isMoreButton) {
            this.emit(beforeChangeEventName, {
                params: params,
                filters: this.filters,
                isInfiniteRequest: infiniteScroll,
            });
        } else {
            this.emit(pageChangeEventName, {
                params: params,
                filters: this.filters,
                isInfiniteRequest: infiniteScroll,
            });
        }

        this.cancelRequest();

        const xhr = new XMLHttpRequest();

        xhr.open("GET", this.options.pathAjax + '?' + query);

        xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');

        const delay = infiniteScroll ? 0 : this.options.minimumTimeLoading;
        const timeInit = new Date().getTime();

        this.xhr = xhr;

        xhr.onload = () => {
            if (xhr.status === 200) {

                const results = JSON.parse(xhr.response);

                if (results.items && results.items.length < this.options.perPage) {
                    this.reachedLastItems = true;
                    if (this.options.manualInfiniteScroll) {
                        this._disableManualInfinityScroll();
                    }
                } else {
                    this.reachedLastItems = false;
                    if (this.options.manualInfiniteScroll) {
                        this._enableManualInfinityScroll()
                    }
                }

                const timeEnd = new Date().getTime();
                if (timeEnd - timeInit < delay) {
                    setTimeout(() => {
                        this._showResults(results, params, infiniteScroll);
                        this.isLoading = false;
                    }, delay - (timeEnd - timeInit));
                } else {
                    this._showResults(results, params, infiniteScroll);
                    this.isLoading = false;
                }

            } else {
                this.isLoading = false;
                this.emit("error", xhr);
                this.xhr = null;
            }
        };

        xhr.send(this.filters);

    }


    _showResults(results, params, isInfinite = false) {

        this.xhr = null;

        if (!isInfinite) {
            this.resultsWrapper.innerHTML = "";
        }

        if (this.paginationWrapper) {
            this.paginationWrapper.innerHTML = "";
        }

        if (results.items && results.items.length) {
            results.items.forEach((item) => {
                this.resultsWrapper.innerHTML += item;
            });
        }

        if (results.pagination) {
            this.paginationWrapper.innerHTML = results.pagination;
        }

        if (!isInfinite) {
            const callback = () => {
                if (!isInfinite) {
                    this._hideLoadingWrapper();

                    if (results.items && results.items.length) {
                        this._hideNoResultWrapper();
                        this._displayResultsWrapper();
                    } else {
                        this._hideResultsWrapper();
                        this._displayNoResultWrapper();
                    }
                } else {
                    if (this.page !== 1 && results.items && results.items.length) {
                        this._hideNoResultWrapper();
                        this._displayResultsWrapper();
                    } else {
                        this._hideResultsWrapper();
                        this._displayNoResultWrapper();
                    }
                }

                this.emit(afterChangeEventName, {
                    results: results,
                    params: params,
                    filters: this.filters,
                    isInfiniteRequest: isInfinite,
                });
            };

            if (this.options.useAnimate) {
                animate(this.loadingWrapper, 'animation-out', callback(), false, true);
            } else {
                callback();
            }
        } else {
            this._hideInfiniteScrollLoadingWrapper();

            this.emit(afterChangeEventName, {
                results: results,
                params: params,
                filters: this.filters,
                isInfiniteRequest: isInfinite,
            });
        }
    }

    cancelRequest() {
        if (this.xhr) {
            this.xhr.abort();
            this.emit("cancelRequest", {
                filters: this.filters
            });
        }
    }

    reset(excludes = []) {
        this.noResultWrapper.classList.remove('is-visible');

        if (excludes.length === 0) {
            this.formWrapper.reset();
        }

        const currentParams = getParams(window.location);
        const newFilters = [];

        if (Object.keys(currentParams).length) {
            Object.keys(currentParams).forEach((key) => {
                const isNotExcluded = !excludes.includes(key);

                const input = this.formWrapper.querySelectorAll('[name="' + key + '"]');

                input.forEach((el) => {
                    if (el.type === 'checkbox' || el.type === 'radio') {
                        if (isNotExcluded) {
                            el.checked = false;
                        } else {
                            newFilters[key] = el.checked;
                        }
                    } else if (el.type === "select" || el.type === "select-one" || el.type === 'select-multiple') {
                        if (isNotExcluded) {
                            el.options.selectedIndex = -1;
                        } else {
                            newFilters[key] = el.value;
                        }
                    } else {
                        if (isNotExcluded) {
                            el.value = "";
                        } else {
                            newFilters[key] = el.value;
                        }
                    }
                });

            });

            if (excludes.length > 0) {
                this.filters = newFilters;
                updateURL(buildQuery(newFilters, true));
                this.emit('reset');
                this._getDatas(newFilters);
            } else {
                this.filters = [];
                updateURL("");
                this.emit('reset');
                this._getDatas();
            }
        }
    }
}

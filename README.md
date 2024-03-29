# Install

```
npm install git@github.com:agence-adeliom/adeliom-livesearch-js.git
```

# HTML

```
<form js-livesearch-form>
    ...
</form>

<div js-livesearch-loading>
    ....
</div>

<div js-livesearch-results>
    ...
</div>

<div js-livesearch-noresult>
    ...
</div>

<div js-livesearch-pagination>
    ...
</div>
```

# Import

```
import Livesearch from 'adeliom-livesearch-js';
import '~adeliom-livesearch-js/dist/livesearch.css';
```

# Available options (by default)

```
const settings = {
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
    "displayFirstPageInUrl": true,
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
    "valuesSeparator": ",",
    "handleArraysNatively": false,
    "forcedParams": {},
}
```

* `valuesSeparator` : permet de définir le séparateur de valeur dans le cas où les tableaux ne sont pas gérés nativement.
* `handleArraysNatively` : permet de gérer les tableaux nativement, c'est-à-dire sans séparateur. Le nom des champs doivent se terminer par `[]`.

# Init Class

```
const livesearch = new Livesearch(settings);
livesearch.init();
```

# Listener

```
// before ajax call
livesearch.on('beforeChange', (response) => {
    console.log(response);
});

// after render html
livesearch.on('afterChange', (response) => {
    console.log(response);
});

// when page is changed
livesearch.on('pageChange', (response) => {
    console.log(response);
});
```

# Methods

```
// Reset the form
livesearch.reset();

// Cancel a request
livesearch.cancelRequest();

// Manual update, you can pass only the event
livesearch.update(event);

// or specify a name and a value
livesearch.update(null, inputName, inputValue);

// Remove one or multiple elements from the request
livesearch.remove(inputName|[inputNames]);
```

# Development usage

## Start container

```bash
ddev start
```

## Install assets

```bash
ddev install
```

## Build assets

```bash
ddev build
```

# Install
```
yarn add https://bitbucket.org/adeliomgit/adeliom-livesearch-js.git
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
```

# Available options (by default)

```
const settings = {
    "pathAjax": "",
    "actionAjax": "",
    "filtersSelector": "[js-livesearch-form]",
    "resultsSelector": "[js-livesearch-results]",
    "loadingSelector": "[js-livesearch-loading]",
    "paginationSelector": "[js-livesearch-pagination]",
    "resetSelector": "[js-livesearch-reset]",
    "noResultSelector": "[js-livesearch-noresult]",
    "pageNumberSelector": "[js-livesearch-page]",
    "submitSelector": "",
    "perPage": 9,
    "minimumTimeLoading": 1000,
    "paramsInUrl": true,
    "animationScrollTo": "smooth",
}
```

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
uploadField.reset();

// you can pass only the event
uploadField.update(event);

// or specify a name and a value
uploadField.update(null, inputName, inputValue);
```

/*global REPORT_DATA, localStorage */
import 'babel-polyfill/dist/polyfill';
import 'bootstrap';
import $ from 'jquery';

const hasStorage = (function() {
  try {
    localStorage.setItem('_test', '1');
  } catch (e) {
    return false;
  }

  localStorage.removeItem('_test');
  return true;
}());

var filter = hasStorage
  ? JSON.parse(localStorage.getItem('filter') || '{}')
  : {};

$(function() {
  $('[data-toggle="tooltip"]').tooltip();

  renderList('engine', REPORT_DATA.engines);
  renderList('implementation', REPORT_DATA.implementations);
  filterUI();
  $('.initial-hide').removeClass('initial-hide');
});

function renderList(id, list) {
  list = list.map((implementation) => {
    return implementation.dash
      ? `<li role="separator" class="divider"></li>`
      : `<li><a href="#" data-${id}="${implementation.selector}">
        ${implementation.name}
      </a></li>`;
  }).join('');

  $(`.js-${id}-list`)
      .html(list)
      .on('click', 'a', function(e) {
        var $target = $(e.target),
            clazz = $target.data(id);

        filter[id] = filter[id] !== clazz ? clazz : undefined;

        filterUI();
        saveFilters();

        e.preventDefault();
      });
}

function filterUI() {
  // Adjust the colspan if we need to
  if (/version/.test(filter.engine)) {
    $('table').addClass('version-filter');
    toggleColspan('data-old-colspan', 'colspan');
  } else {
    $('table').removeClass('version-filter');
    toggleColspan('colspan', 'data-old-colspan');
  }

  // Update the column headers
  toggleMatching($('thead').find('th'), filter.engine);

  // Update the row headers
  toggleMatching($('tbody th'), filter.implementation);

  // Update the cells
  var toShow = '';
  if (filter.implementation) {
    toShow += `.${filter.implementation}`;
  }
  if (filter.engine) {
    toShow += `.${filter.engine}`;
  }
  toggleMatching($('tbody td'), toShow);

  // Update the selected indicators
  $('.dropdown').find('.glyphicon').remove();
  if (filter.engine) {
    $(`[data-engine="${filter.engine}"]`).prepend('<span class="glyphicon glyphicon-ok"></span>');
  }
  if (filter.implementation) {
    $(`[data-implementation="${filter.implementation}"]`).prepend('<span class="glyphicon glyphicon-ok"></span>');
  }
}

function saveFilters() {
  if (hasStorage) {
    localStorage.setItem('filter', JSON.stringify(filter));
  }
}

function toggleColspan(to, from) {
  $(`thead > tr:first-of-type > th[${from}]`).each(function() {
    var $el = $(this);
    // Node is distinct in that all of it's tested versions are stable.
    if ($el.text() !== 'node') {
      $el.attr(to, $el.attr(from))
          .removeAttr(from);
    }
  });
}

function toggleMatching($el, filterClass) {
  if (filterClass) {
    if (!(/\./.test(filterClass))) {
      filterClass = `.${filterClass}`;
    }

    $el.filter(`${filterClass}`).show();
    $el.filter(`:not([rowspan],${filterClass})`).hide();
  } else {
    $el.show();
  }
}

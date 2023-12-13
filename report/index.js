/*global REPORT_DATA, localStorage */
require('@babel/polyfill');

const hasStorage = (() => {
  try {
    localStorage.setItem('_test', '1');
  } catch (e) {
    return false;
  }

  localStorage.removeItem('_test');
  return true;
})();

const filter = hasStorage
  ? JSON.parse(localStorage.getItem('filter') || '{}')
  : {};

$(() => {
  $('[data-toggle="tooltip"]').tooltip();

  renderList('engine', REPORT_DATA.engines);
  renderList('implementation', REPORT_DATA.implementations);
  filterUI();
});

function renderList(id, list) {
  list = list.map(({dash, selector, name}) => dash
    ? `<li role="separator" class="divider"></li>`
    : `<li><a href="#" data-${id}="${selector}">
      ${name}
    </a></li>`).join('');

  $(`.js-${id}-list`)
      .html(list)
    .on('click', 'a', e => {
      const $target = $(e.target);
      const clazz = $target.data(id);
      if (id === 'engine') {
        filter[id] = filter[id] !== clazz ? clazz : undefined;
      } else {
        const list = filter[id] ? filter[id].split(' ') : []
            const index = list.indexOf(clazz)
            if (index > -1) {
              list.splice(index, 1)
            } else {
              list.push(clazz)
            }
        filter[id] = list.length > 0 ? list.join(' ') : undefined;
      }

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
  let toShow = '';
  const implementationList = filter.implementation ? filter.implementation.split(' ') : []
  const implementationListLen = implementationList.length
  for (let i = 0; i < implementationListLen; i++) {
    toShow += ` .${implementationList[i]}`;
  }
  if (filter.engine) {
    toShow += `#.${filter.engine}`;
  }
  toggleMatching($('tbody td'), toShow.trim());

  // Update the selected indicators
  $('.dropdown').find('.glyphicon').remove();
  if (filter.engine) {
    $(`[data-engine="${filter.engine}"]`).append('<span class="glyphicon glyphicon-ok"></span>');
  }
  for (let i = 0; i < implementationListLen; i++) {
    $(`[data-implementation="${implementationList[i]}"]`).append('<span class="glyphicon glyphicon-ok"></span>');
  }
}

function saveFilters() {
  if (hasStorage) {
    localStorage.setItem('filter', JSON.stringify(filter));
  }
}

function toggleColspan(to, from) {
  $(`thead > tr:first-of-type > th[${from}]`).each(function() {
    const $el = $(this);
    // Node is distinct in that all of it's tested versions are stable.
    if ($el.text() !== 'node') {
      $el.attr(to, $el.attr(from))
          .removeAttr(from);
    }
  });
}

function toggleMatching($el, filters) {
  const objList = filters ? filters.split('#') : []
  let engine = objList[1] || ''
  const implementation = objList[0] || ''
  let str = ''
  const implementationList = implementation ? implementation.split(' ') : []
  if (engine && !(/\./.test(engine))) {
    engine = `.${engine}`;
    $el.filter(`${engine}`).show();
    str += `:not([rowspan],${engine}})`
  }
  for (let i = 0; i < implementationList.length; i++) {
    const implement = implementationList[i]
    if (!(/\./.test(implement))) {
      implement = `.${implement}`;
    }
    $el.filter(`${implement}`).show();
    str += `:not([rowspan],${implement + (engine ? engine : '')})`
  }
  if (!filters) {
    $el.show();
  } else {
    $el.filter(str).hide();
  }
}

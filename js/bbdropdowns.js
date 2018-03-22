(function(global) {
  'use strict';
  var menuCache = [];

  function BbDropdowns() {
    var fingerMove = false,
      self = this,

      switchSelectText = function(menu, reset) {
        var labelText = menu.nextElementSibling.getAttribute('aria-label'),
          activeChoice = menu.parentElement.querySelector('[aria-checked="true"]');
        if (menu.getAttribute('aria-expanded') === 'true' || !activeChoice || reset) {
          menu.textContent = labelText;
        } else if (activeChoice) {
          menu.innerHTML = activeChoice.textContent + '<span class="sr-only">, ' + labelText + '</span>';
        }
      },

      showSubmenu = function(e) {
        var menu = e.target,
          subMenu = menu.nextElementSibling,
          expanded = menu.getAttribute('aria-expanded') === 'true' ? true : false,
          activeChoice = menu.parentElement.querySelector('[aria-checked="true"]');
        e.preventDefault();
        if (e.type !== 'click' && e.type !== 'keydown') {
          // Only toggle if event type is click/keypress
          expanded = false;
        }
        if (menu && subMenu) {
          menu.setAttribute('aria-expanded', expanded ? 'false' : 'true');
          subMenu.setAttribute('aria-hidden', expanded ? 'true' : 'false');
          if (e && e.keyCode && !expanded) {
            if (activeChoice) {
              activeChoice.focus();
            } else {
              subMenu.querySelector('li:first-child a').focus();
            }
          }
        }
        if (menu.getAttribute('data-select') === 'true') {
          switchSelectText(menu);
        }
      },

      hideSubmenu = function(e, hideSingleMenu) {
        var subMenus = hideSingleMenu ? [hideSingleMenu] : document.querySelectorAll('.bb-dropdowns > li > a[aria-haspopup="true"]:not([data-clickonly])');
        Array.prototype.forEach.call(subMenus, function(item) {
          if (!item.getAttribute('data-select') || !item.getAttribute('data-clickonly') && e.type !== 'mouseleave') {
            item.nextElementSibling.setAttribute('aria-hidden', 'true');
            item.setAttribute('aria-expanded', 'false');
          }
          if (item.getAttribute('data-select') === 'true') {
            switchSelectText(item);
          }
        });
      },

      tabbedOut = function(e) {
        var subMenu = e.target.parentElement.parentElement;
        setTimeout(function() {
          if (subMenu.getAttribute('aria-hidden') === 'false' && !subMenu.contains(document.activeElement)) {
            hideSubmenu(e, subMenu.previousElementSibling);
          }
        }, 100);
      },

      keyNavMenu = function(e) {
        var isSelect = e.target.getAttribute('data-select') === 'true' ? true : false,
          prevMenu;
        if (e.keyCode === 32 || e.keyCode === 13 || e.keyCode === 40 || e.keyCode === 38) {
          e.preventDefault();
          showSubmenu(e);
        } else if ((e.keyCode === 37 || e.keyCode === 39) && !isSelect) {
          e.preventDefault();
          prevMenu = e.keyCode === 37 ? e.target.parentElement.previousElementSibling : e.target.parentElement.nextElementSibling;
          if (prevMenu) {
            hideSubmenu(e, e.target);
            prevMenu.firstElementChild.focus();
          }
        }
      },

      fireChangeEvent = function(menu) {
        var changeEvent = document.createEvent('Event');
        changeEvent.initEvent('change', true, true);
        menu.dispatchEvent(changeEvent);
      },

      setSelectItem = function(e, menu, setAsDefault) {
        var submenu = e ? e.target : setAsDefault,
          openMenu = menu,
          itemChanged = false,
          lastActive;
        Array.prototype.forEach.call(menu.parentElement.querySelectorAll('li > a'), function(item) {
          if (item.getAttribute('aria-checked') === 'true') {
            lastActive = item.textContent;
          }
          item.removeAttribute('aria-checked');
        });
        submenu.blur();
        submenu.setAttribute('aria-checked', 'true');
        openMenu.setAttribute('data-value', submenu.getAttribute('data-value') ? submenu.getAttribute('data-value') : '');
        if (!lastActive || lastActive !== submenu.textContent) {
          openMenu.textContent = submenu.textContent;
          itemChanged = true;
        }
        if (!setAsDefault) {
          openMenu.click();
        }
        if (!setAsDefault && itemChanged) {
          fireChangeEvent(openMenu);
        }
        if (e && e.type !== 'click') {
          openMenu.focus();
        }
      },

      keyNavSubmenu = function(e) {
        var openMenu = document.querySelector('.bb-dropdowns > li > a[aria-expanded="true"]'),
          isSelect = e.target.getAttribute('role') === 'menuitemradio' ? true : false,
          prevItem,
          nextItem,
          prevMenu;
        if ((e.keyCode === 27 || (e.keyCode === 32 && !isSelect)) && openMenu) {
          e.preventDefault();
          openMenu.click();
          openMenu.focus();
        } else if (e.keyCode === 38) {
          e.preventDefault();
          prevItem = e.target.parentElement.previousElementSibling || e.target.parentElement.parentElement.lastElementChild;
          if (prevItem) {
            prevItem.firstElementChild.focus();
          }
        } else if (e.keyCode === 40) {
          e.preventDefault();
          nextItem = e.target.parentElement.nextElementSibling || e.target.parentElement.parentElement.firstElementChild;
          if (nextItem) {
            nextItem.firstElementChild.focus();
          }
        } else if ((e.keyCode === 37 || e.keyCode === 39) && openMenu && !isSelect) {
          e.preventDefault();
          prevMenu = e.keyCode === 37 ? openMenu.parentElement.previousElementSibling : openMenu.parentElement.nextElementSibling;
          if (prevMenu) {
            openMenu.click();
            prevMenu.firstElementChild.focus();
          }
        } else if (isSelect && e.keyCode === 9) {
          e.preventDefault();
        } else if (e.keyCode === 13 || e.keyCode === 32 || e.type === 'click' && e.target.tagName === 'A' && openMenu) {
          // This is to make anchor links work, otherwise the menu will not close
          if (isSelect) {
            e.preventDefault();
            setSelectItem(e, openMenu);
          } else {
            openMenu.click();
          }
        }
        return true;
      },

      outsideMenuTap = function(e) {
        var openMenus = document.querySelectorAll('.bb-dropdowns > li > a[aria-expanded="true"]');
        Array.prototype.forEach.call(openMenus, function(openMenu) {
          if (openMenu !== e.target && !openMenu.nextElementSibling.contains(e.target)) {
            hideSubmenu(e, openMenu);
          }
        });
      },

      calcMinWidth = function(cache) {
        cache.forEach(function(item) {
          var menuWidth,
            isSelect = item.getAttribute('data-select') === 'true' ? true : false;
          item.style.minWidth = null;
          menuWidth = item.offsetWidth;
          if (isSelect) {
            item.style.minWidth = menuWidth + 'px';
          }
          item.nextElementSibling.style.minWidth = menuWidth > 160 ? menuWidth + 'px' : null;
        });
      },

      observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
          if (mutation.removedNodes.length || mutation.addedNodes.length) {
            self.init(mutation.target.previousElementSibling);
          }
        });
      });

    this.initialized = Boolean(menuCache.length);

    this.resetSelect = function(select) {
      var selectToReset = select ? document.querySelector(select) : null;
      if (selectToReset) {
        if (menuCache.indexOf(selectToReset) !== -1 && selectToReset.getAttribute('data-select') === 'true') {
          switchSelectText(selectToReset, true);
          selectToReset.removeAttribute('data-value');
          Array.prototype.forEach.call(selectToReset.parentElement.querySelectorAll('li > a'), function(item) {
            item.removeAttribute('aria-checked');
          });
        } else {
          throw new Error('Element not initialized or not a select!');
        }
      } else {
        throw new Error('Element could not be found!');
      }
    };

    this.init = function(observed) {
      var menuItems = observed ? [observed] : document.querySelectorAll('.bb-dropdowns > li > a'),
        clickOnly = false,
        observerConfig = {'childList': true},
        isSelect;
      Array.prototype.forEach.call(menuItems, function(item) {
        var subMenu = item.nextElementSibling,
          menuWidth;
        if (menuCache.indexOf(item) !== -1 && !observed) {
          return;
        }
        if (subMenu) {
          isSelect = item.getAttribute('data-select') === 'true' ? true : false;
          item.setAttribute('aria-haspopup', 'true');
          item.setAttribute('role', 'button');
          if (!observed) {
            item.addEventListener('click', showSubmenu, false);
            item.addEventListener('focus', hideSubmenu, false);
            item.addEventListener('keydown', keyNavMenu, false);
            subMenu.addEventListener('keydown', keyNavSubmenu, false);
            subMenu.addEventListener('focusout', tabbedOut, false);
            subMenu.addEventListener('click', keyNavSubmenu, false);
            subMenu.setAttribute('aria-label', item.textContent + (isSelect ? '' : ' submenu'));
            if (item.getAttribute('data-clickonly') === 'true' || isSelect) {
              clickOnly = true;
            } else {
              item.addEventListener('mouseover', showSubmenu, false);
              item.parentElement.addEventListener('mouseleave', hideSubmenu, false);
            }
          }
          if (isSelect) {
            menuWidth = item.offsetWidth;
            item.removeAttribute('data-value');
            item.parentElement.parentElement.setAttribute('role', 'presentation');
            item.style.minWidth = menuWidth + 'px';
            subMenu.setAttribute('role', 'menu');
            if (!observed) {
              // Observe changes to list items and re-initialize
              observer.observe(subMenu, observerConfig);
            }
            Array.prototype.forEach.call(subMenu.querySelectorAll('li > a'), function(subitem) {
              subitem.setAttribute('role', 'menuitemradio');
              subitem.parentElement.setAttribute('role', 'presentation');
              if (subitem.getAttribute('aria-checked') === 'true') {
                setSelectItem(null, item, subitem);
              }
              switchSelectText(item);
            });
          }
          menuCache.push(item);
        }
      });

      calcMinWidth(menuCache);

      if (!this.initialized) {
        // Only add global event handlers once
        if (clickOnly) {
          document.addEventListener('click', function(e) {
            outsideMenuTap(e);
          });
        }

        window.addEventListener('resize', function() {
          calcMinWidth(menuCache);
        });

        document.addEventListener('touchmove', function() {
          fingerMove = true;
        });

        document.addEventListener('touchstart', function() {
          fingerMove = false;
        });

        document.addEventListener('touchend', function(e) {
          if (!fingerMove) {
            outsideMenuTap(e);
          }
        });
        document.body.classList.remove('no-js');
        this.initialized = true;
      }
    };
  }

  // Export Dropdowns
  if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = BbDropdowns;
  } else if (typeof define === 'function' && define.amd) {
    define('BbDropdowns', [], function() {
      return BbDropdowns;
    });
  } else if (typeof global === 'object') {
    // attach to window
    global.BbDropdowns = BbDropdowns;
  }
})(this);

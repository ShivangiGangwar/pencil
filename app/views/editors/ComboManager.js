function ComboManager() {
    BaseTemplatedWidget.call(this);
    this.renderer = ComboManager.DEFAULT_RENDERER;
    this.bind("click", function () {
        if (this.popup.isVisible()) {
            this.popup.close();
            return;
        }
        this.button.setAttribute("active", true);
        this.popup.show(this.button, "left-inside", "bottom", 0, 5);
    }, this.button);
    this.bind("click", this.onItemClick, this.list);
    this.bind("p:PopupShown", function () {
        thiz.ensureSelectedItemVisible();
    }, this.popup);
    this.bind("p:PopupHidden", function () {
        this.button.removeAttribute("active");
        this.popup.popupContainer.scrollTop = 0;
        // this.popup.removePopup();
        // this.popup.popupContainer.scrollTop = 0;
    }, this.popup);
    var thiz = this;
    this.popup.shouldCloseOnBlur = function (event) {
        var found = Dom.findUpward(event.target, function (node) {
            return node == thiz.button;
        });
        return !found;
    };
    this.popup.setPopupClass("ComboManagerPopup");
}

ComboManager.DEFAULT_RENDERER = function (item) {
    return "" + item;
};

__extend(BaseTemplatedWidget, ComboManager);

ComboManager.prototype.onItemClick = function (event) {
    var item = Dom.findUpwardForData(event.target, "_data");
    if (typeof(item) == "undefined") return;

    this.selectItem(item, true);
};
ComboManager.prototype.ensureSelectedItemVisible = function() {
    var comparer = this.comparer || function (a, b) { return a == b};
    for (var i = 0; i < this.list.childNodes.length; i ++) {
        var node = this.list.childNodes[i];
        var data = Dom.findUpwardForData(node, "_data");
        if (comparer(this.selectedItem, data)) {
            var oT = Dom.getOffsetTop(node);
            var oH = node.offsetHeight;
            var pT = Dom.getOffsetTop(this.list.parentNode) + 10;
            var pH = this.list.parentNode.offsetHeight - 20;

            if (oT < pT) {
                this.popup.popupContainer.scrollTop = Math.max(0, this.popup.popupContainer.scrollTop - (pT - oT));
            } else if (oT + oH > pT + pH) {
                this.popup.popupContainer.scrollTop = Math.max(0, this.popup.popupContainer.scrollTop + (oT + oH - pT - pH));
            }
            break;
        }
    }
}
ComboManager.prototype.setItems = function (items) {
    var first = null;
    this.items = items;
    this.list.innerHTML = "";
    if (!this.items) return;
    for (var i = 0; i < items.length; i++) {
        var item = items[i];
        var element = this.renderer(item);
        var node = null;
        if (element.getAttribute) {
            node = Dom.newDOMElement({
                _name: "div",
                "class": "Item",
            });
            node.appendChild(element);
        } else {
            var spec = {
                _name: "div",
                "class": "Item",
            };
            spec[this.useHtml ? "_html" : "_text"] = element;

            node = Dom.newDOMElement(spec);
        }
        if (this.decorator) this.decorator(node, item);

        node._data = item;
        this.list.appendChild(node);

        if (!first) first = item;
    }
    if (items.length > 0) this.selectItem(first);
};

ComboManager.prototype.selectItem = function (item, fromUserAction, whenMatched) {
    var comparer = this.comparer || function (a, b) { return a == b};

    var matched = false;
    if (this.items) {
        for (var i = 0; i < this.items.length; i ++) {
            if (comparer(this.items[i], item)) {
                item = this.items[i];
                matched = true;
                break;
            }
        }
    }
    if (!matched && whenMatched) return;

    var element = this.renderer(item);
    if (!element) return;

    if (element.getAttribute) {
        Dom.empty(this.buttonDisplay);
        this.buttonDisplay.appendChild(element);
    } else {
        this.buttonDisplay.innerHTML = this.useHtml ? element : Dom.htmlEncode(element);
        this.button.setAttribute("title", this.useHtml ? Dom.htmlStrip(element) : element);
    }
    if (this.decorator != null) {
        this.decorator(this.buttonDisplay, item);
    }
    this.selectedItem = item;
    if (fromUserAction) {
        Dom.emitEvent("p:ItemSelected", this.node(), {});
        this.popup.hide();
    }

    for (var i = 0; i < this.list.childNodes.length; i ++) {
        var c = this.list.childNodes[i];
        if (c.setAttribute) {
            var item = Dom.findUpwardForData(c, "_data");
            c.setAttribute("selected", comparer(item, this.selectedItem) ? "true" : "false");
        }
    }
    return matched;
};

ComboManager.prototype.getSelectedItem = function () {
    return this.selectedItem;
};
ComboManager.prototype.setDisabled = function (disabled) {
    if (disabled == true) {
        this.button.setAttribute("disabled", "true");
    } else {
        this.button.removeAttribute("disabled");
    }
};

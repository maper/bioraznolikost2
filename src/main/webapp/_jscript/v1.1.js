var ScribdX = ScribdX || {};

ScribdX.bind = function(func, obj) {
    return function() { func.apply(obj, arguments); };
};

ScribdX.hasClass = function(element, className) {
    var elementClassName = element.className;
    return (elementClassName.length > 0 && (elementClassName == className ||
      new RegExp("(^|\\s)" + className + "(\\s|$)").test(elementClassName)));

};

ScribdX.addClass = function(element, className) {
    if (!ScribdX.hasClass(element, className))
        element.className += (element.className ? ' ' : '') + className;
    return element;
};

ScribdX.removeClass = function(element, className) {
  element.className = element.className.replace(new RegExp("(^|\\s+)" + className + "(\\s+|$)"), ' ').strip();
  return element;
};


ScribdX.childWithClass = function(parent, className) {
    var children = parent.childNodes;
    var len = children.length;
    for(var i = 0; i < len; i++) {
        if(ScribdX.hasClass(children[i], className)) { return children[i]; }
    }
    return null;
};

// basic element builder (NO onClick and friends)
ScribdX.buildElement = function(tagName, attributes, html) {
    var element = document.createElement(tagName);
    if (html) { element.innerHTML = html; }
    if (attributes) {
        for (var key in attributes) { element.setAttribute(key,attributes[key]); }
    }
    return element;
};

ScribdX.setInlineStyle = function(element, styles) {
    if (element && styles) {
        for (var styleName in styles ) { (element.style[styleName] = styles[styleName]);  }
    }
};

ScribdX.show = function(element) {
    element.style.display = '';
    return element;
}

ScribdX.hide = function(element) {
    element.style.display = 'none';
    return element;
}

if(!ScribdX.DocWidget) {
    // config.type:                    _required_
    // config.resource_id:             _required_
    // config.render_widget:           defaults to true
    // config.custom_callback:         defaults to null
    // config.show_resource_owner:     defaults to false
    // config.show_doc_owner:          defaults to true
    // config.show_doc_reads:          defaults to true
    // config.show_doc_thumbnail:      defaults to false
    // config.width:                   defaults null
    // config.height:                  defaults null 
    // config.colors:                  defaults null
    ScribdX.DocWidget = function(config) {
        this.widget_id = ScribdX.DocWidget.WIDGETS.push(this) - 1;
        var default_config = ScribdX.DocWidget.TYPES[config.type].default_config;
        for (var option in default_config) { this[option] = default_config[option]; }
        this.mergeConfig(config);
        this.custom_callback && ScribdX.bind(this.custom_callback, this);
        
        if (this.render_widget) {
            this._renderShell();
            this.element = document.getElementById(this.elementId());
            this._renderDimensions();
            this.header_element = ScribdX.childWithClass(this.element, 'scribd-docwidget-header');
            this.footer_element = ScribdX.childWithClass(this.element,'scribd-docwidget-footer');
            this.upload_element = ScribdX.childWithClass(this.footer_element,'scribd-docwidget-collection-add-document');
            this.doc_collection_element = ScribdX.childWithClass(this.element, 'scribd-docwidget-collection');
            this.renderStylesheet();
        }
    };
    
    ScribdX.DocWidget.MAJOR_VERSION  = 1;
    ScribdX.DocWidget.MINOR_VERSION  = 1;
    ScribdX.DocWidget.VERSION        = 'v1.1';
    ScribdX.DocWidget.BASE_URL       = '';
    ScribdX.DocWidget.ASSETS_BASE_URL = '';
    ScribdX.DocWidget.WIDGETS = [];
    ScribdX.DocWidget.TYPES = { 
        public_document_collections : { 
            path: '/public_document_collections', 
            stylesheet_path: '/stylesheets/doc_widget/v1.0.css', 
            stylesheet_element_id: 'scribd-docwidget-1-0-style',
            upload_path : '/everywhere/document_collection_upload',
            new_collection_path: '/my_document_collections',
            root_path: '',
            default_config: { 
                render_widget: true,
                show_resource_owner: false,
                show_doc_owner: false,
                show_doc_reads: false,
                show_doc_thumbnail: false,
                show_theme: true,
                document_order: 'ascending'
            }
        } 
    };
    
    ScribdX.DocWidget.prototype.mergeConfig = function(config) {
        for (var option in config) { this[option] = config[option]; }
        this._resetRenderPipelines();
        return this;
    };
    
    ScribdX.DocWidget.prototype.asyncGET = function() {
        this.remote_script_tag = ScribdX.buildElement('script', {type: 'text/javascript', src:this.resourceUrl(), async: 'true'}, null);
        document.documentElement.firstChild.appendChild(this.remote_script_tag);
        return this;
    };

    ScribdX.DocWidget.prototype.callback = function(data) {
        if (data && data.document_collection && data.documents) {
            if (this.show_theme) {
                this._renderTheme();
            }
            this._renderJSON(data);
            if ( data.document_collection.acceptance_type === 'moderated' ) {
                ScribdX.show(this.upload_element);
            }
            ScribdX.show(this.element);
        }
        this.custom_callback && this.custom_callback(data);
    };

    ScribdX.DocWidget.prototype.colorStylesheetId = function() {
        return this.elementId() + '-color-stylesheet';
    };

    ScribdX.DocWidget.prototype.elementId = function() {
        return 'scribd-docwidget-' + this.widget_id;
    };

    ScribdX.DocWidget.prototype.renderStylesheet = function() {
        // only one stylesheet needs to be loaded
        if ( !document.getElementById(this.typeAttributes().stylesheet_element_id) ) {
            document.documentElement.firstChild.appendChild( ScribdX.buildElement( "link", { 
                id: this.typeAttributes().stylesheet_element_id, 
                rel: "stylesheet", 
                type: "text/css", 
                media: "all", 
                href: this.styleUrl()
            }));
        }
        
        var style_sheet_element = document.getElementById(this.colorStylesheetId());
        // reset css
        if ( style_sheet_element ) { 
            style_sheet_element.parentNode.removeChild(style_sheet_element);
        } 
        style_sheet_element = document.documentElement.firstChild.appendChild(ScribdX.buildElement( "style", { id: this.colorStylesheetId(), type: "text/css" }));
        // render style after css has been reset
        this.renderColorStylesheet(style_sheet_element);
    };

    ScribdX.DocWidget.prototype.renderColorStylesheet = function(style_sheet_element) {
        // only one stylesheet needs to be loaded
        if ( style_sheet_element ) {
            var css_rules = this._buildColorCSS();
            try{
                style_sheet_element.innerHTML = css_rules;
            } catch (e) { 
                try { // Safari
                    style_sheet_element.innerText = css_rules;
                } catch(e) { // IE cannot set innerHTML, so, we'll use addRule
                    var ss = style_sheet_element.styleSheet;
                    var rules = css_rules.split(/\s*[{}]\s*/);
                    var selectors = [];
                    for (var i=0; i<rules.length; i+=1) {
                        var rule_or_selectors = rules[i];
                        if ( rule_or_selectors.charAt(rule_or_selectors.length-1) === ';') {  // rule
                            for (var j=0; j<selectors.length; j+=1) {
                                ss.addRule(selectors[j], rule_or_selectors);
                            }
                            selectors = [];
                        } else { // selectors
                            selectors.push.apply(selectors, rule_or_selectors.split(','));
                        }
                    }
                }
            }
        }
    };
    
    ScribdX.DocWidget.prototype._resetRenderPipelines = function() {
        var pipeline = [];
        if (this.show_doc_owner)
            pipeline.push('_buildDocOwnerHTML');
        if (this.show_doc_reads)
            pipeline.push('_buildDocReadsHTML');
        this.doc_render_pipeline = pipeline;
        return this.doc_render_pipeline;
    };
    
    // Call only after configurations have been set.
    ScribdX.DocWidget.prototype._renderShell = function() {
        document.write( this._buildWidgetShellHTML() );
    };

    ScribdX.DocWidget.prototype._renderJSON = function(data) {
        if ( this.render_widget ) {
            this._renderDimensions();
            this.renderStylesheet();
            this._renderListHeaderHTML(data.document_collection);
            this._renderDocs(data.documents);
            // garbage collect
            document.documentElement.firstChild.removeChild(this.remote_script_tag);
            this.remote_script_tag = null;
        }
    };
    ScribdX.DocWidget.prototype._renderDimensions = function() {
        if (this.width || this.height) {
            ScribdX.setInlineStyle(this.element, {width: this.width, overflow: 'visible'});
            var height_overflow = this.height ? 'auto' : 'visible';
            ScribdX.setInlineStyle(this.doc_collection_element, {height: this.height, 'overflowY': height_overflow, 'overflowX': 'hidden'});
            
        } else {
            ScribdX.setInlineStyle(this.element, {width: null, overflow: 'visible'});
            ScribdX.setInlineStyle(this.doc_collection_element, {height: null, overflow: 'visible'});
        }
    };
    ScribdX.DocWidget.prototype._renderListHeaderHTML = function(collection) {
        if (this.header_element && collection) {
            var collection_link = '<a class="scribd-docwidget-collection-name" href="' + collection.url + '">' + collection.name + '</a>'
            if (this.show_resource_owner) {
                var thumbnail_link = [ 
                    '<a target="_scribd" class="scribd-docwidget-collection-thumb" href="', collection.user.url, '">',
                        '<img src="', collection.user.thumbnail_url, '" width="35" height="35"/>',
                    '</a>',
                ].join('');
                var collection_owner_link = '<a class="scribd-docwidget-collection-owner" href="' + collection.user.url + '">'  + collection.user.login + '</a>';
                var headers = [thumbnail_link, '<span class="scribd-docwidget-collection-summary">', collection_link, collection_owner_link + '</span>'];
                this.header_element.innerHTML = headers.join('');
            } else {
                this.header_element.innerHTML = ['<span class="scribd-docwidget-collection-summary">', collection_link, '</span>'].join('');
            }
        }
    };

    ScribdX.DocWidget.prototype._renderDocs = function(documents) {
        if (documents) {
            this.doc_collection_element.innerHTML = '';
            renderer = this.show_doc_thumbnail ? '_buildDocElement' : '_buildDocElementWithoutThumbnail';
            var len = documents.length;
            for( var i = 0; i < len; i++ ) {
                var doc = documents[i];
                var doc_html = this[renderer](doc);
                this.doc_collection_element.appendChild( ScribdX.buildElement('li', null, doc_html) );
            }
        }
    };
    
    ScribdX.DocWidget.prototype._buildDocElement = function(doc) {
        return ( ScribdX.DocWidget._buildDocThumbnailHTML(doc) + this._buildDocElementWithoutThumbnail(doc) );
    };
    
    ScribdX.DocWidget.prototype._buildDocElementWithoutThumbnail = function(doc) {
        var pipeline = this.doc_render_pipeline;
        var content = []; 
        for ( var i = 0; i < pipeline.length; i++ ) {
            content.push( ScribdX.DocWidget[pipeline[i]](doc) );
        }
        return [
            '<span class="scribd-docwidget-doc-summary">',
                '<a target="_scribd" class="scribd-docwidget-doc-title" href="', doc.url, '">' , doc.title , '</a>',
                content.join(''),
             '</span>'
        ].join('');
    };
    
    ScribdX.DocWidget.prototype._renderFooterHeaderHTML = function() {
        return [
            '<div class="scribd-docwidget-footer">',
                this._buildUploadLinkHTML(),
                '<div class="scribd-docwidget-collection-new">',
                    this._buildNewCollectionLinkHTML(),
                    this._buildLogoLinkHTML(),
                '</div>',
            '</div>'
        ].join('')
    };
    

    ScribdX.DocWidget.prototype._buildWidgetShellHTML = function() {
        var resource_header_container = '<div class="scribd-docwidget-header"></div>';
        var footer = this._renderFooterHeaderHTML()
        return '<div id="' + this.elementId() + '" class="scribd-docwidget" style="display:none;">' + resource_header_container + '<ul class="scribd-docwidget-collection"></ul>' + footer + '</div>';
    };


    ScribdX.DocWidget.prototype._buildColorCSS = function() {
        var style_sheet = '';
        if (this.colors) {
            var element_id = this.elementId();
            style_sheet = [
                '#', element_id, '{ background-color:', this.colors.background, '; }', 
                '#', element_id, ',\n', 
                '#', element_id, ' .scribd-docwidget-collection .scribd-docwidget-docwidget-doc-thumb,\n',
                '#', element_id, ' .scribd-docwidget-header .scribd-docwidget-docwidget-doc-thumb\n',
                    '{ border-color:', this.colors.secondary, '; }\n',    
                '#', element_id, ' .scribd-docwidget-doc-title,\n',
                '#', element_id, ' .scribd-docwidget-collection-owner,\n',
                '#', element_id, ' .scribd-docwidget-doc-owner-link\n',
                    '{ color:', this.colors.secondary, '; }\n',
                '#', element_id, ' .scribd-docwidget-doc-title,\n',
                '#', element_id, ' .scribd-docwidget-collection-name,\n',
                '#', element_id, ' .scribd-docwidget-collection-add-document a\n',
                    '{ color:', this.colors.primary, '; }\n',
                '#', element_id, ' .scribd-docwidget-label,\n',
                '#', element_id, ' .scribd-docwidget-doc-reads\n',
                    '{ color:', this.colors.label, '; }\n'
            ];
            
            if (this.colors.secondary) {
                var r = parseInt('0x' + this.colors.secondary.slice(1,3));
                var g = parseInt('0x' + this.colors.secondary.slice(3,5));
                var b = parseInt('0x' + this.colors.secondary.slice(5,7));
                if (r && g && b ) {
                    style_sheet = style_sheet.concat([
                        '#', element_id, ' .scribd-docwidget-doc-owner-link\n',
                        '{ background-color: rgba(', r, ',', g, ',', b, ', 0.1); }\n'
                    ]);
                }
            }
            style_sheet = style_sheet.join('');
        }
        
        return style_sheet;
    };
    
    ScribdX.DocWidget.prototype.themeClass = function() {
        return "scribd-docwidget-styled";
    };

    ScribdX.DocWidget.prototype._renderTheme = function() {
        this.element.className = 'scribd-docwidget'; // reset class name
        ScribdX.addClass(this.element, this.themeClass());
    };

    ScribdX.DocWidget.prototype._buildUploadLinkHTML = function() {
        var width  = parseInt(this.width);
        var message = ((width && width < 300) ? '&#43; Add your docs to this collection' : '&#43; Add your documents to this collection');
        return '<div class="scribd-docwidget-collection-add-document" style="display:none;"><a href="#" onclick="return ScribdX.DocWidget.popup(\'' + this.uploadUrl() + '\',320,700);">' + message + '</a></div>';
    };
    
    ScribdX.DocWidget.prototype._buildNewCollectionLinkHTML = function() {
        var width  = parseInt(this.width);
        var message = ((width && width < 300) ? 'Create a collection on Scribd' : 'Create and share your own collection on Scribd');
        return [
         '<a target="_scribd" class="scribd-docwidget-collection-new-link" target="_scribd" href="', this.newCollectionUrl(), '">', message, '</a>'
        ].join('');
    };

    ScribdX.DocWidget.prototype._buildLogoLinkHTML = function() {
        return [
         '<a target="_scribd" class="scribd-docwidget-collection-logo-link" target="_scribd" href="', this.rootUrl(), '">',
         '<img src="', ScribdX.DocWidget.ASSETS_BASE_URL, '/images/logos/scribd_logo_sdot_30x30.gif"/>',
         '</a>'
        ].join('');
    };

    ScribdX.DocWidget.prototype.resourceUrl = function() {
        return this._buildUrl('BASE_URL', 'path', [ this.resource_id, this.widget_id + '.js'], { document_order: this.document_order });
    };

    ScribdX.DocWidget.prototype.styleUrl = function() {
        return this._buildUrl('ASSETS_BASE_URL', 'stylesheet_path', null, null);
    };

    ScribdX.DocWidget.prototype.uploadUrl = function(params) {
        return this._buildUrl('BASE_URL', 'upload_path', [this.resource_id], params);
    };

    ScribdX.DocWidget.prototype.newCollectionUrl = function() {
        return this._buildUrl('BASE_URL', 'new_collection_path');
    };

    ScribdX.DocWidget.prototype.rootUrl = function() {
        return this._buildUrl('BASE_URL', 'root_path');
    };

    ScribdX.DocWidget.prototype._buildUrl = function (base_url, path, path_params, params) {
        if (!this.typeAttributes()) { return null; }
        var url = ScribdX.DocWidget[base_url] + this.typeAttributes()[path];
        if (path_params) { url += '/' + path_params.join('/'); }
        if (params) {
            url += '?';
            var param_pairs = [];
            for (var param in params) { param_pairs.push( param + '=' + params[param] ); }
            url += param_pairs.join('&');
        }
        return url;
    };

    ScribdX.DocWidget.prototype.typeAttributes = function() {
        return ScribdX.DocWidget.TYPES[this.type];
    };

    ScribdX.DocWidget._buildDocThumbnailHTML = function(doc) {
        return [ 
            '<div class="scribd-docwidget-doc-thumb">',
                '<a target="_scribd" style="background-image:url(\'' + doc.thumbnail_url + '\')" class="scribd-docwidget-doc-thumb-link" href="',  doc.url, '">',
                    (doc.page_count ? '<span class="scribd-docwidget-page-no">' + doc.page_count + ' p.</span>' : ''),
                    '<span class="scribd-docwidget-image-border"></span>',
                '</a>',
            '</div>' 
        ].join('');
    }

    ScribdX.DocWidget._buildDocOwnerHTML = function(doc) {
        return [
            '<span class="scribd-docwidget-doc-owner">',
                '<span class="scribd-docwidget-label"> From: </span>', 
                '<a target="_scribd" href="'+ doc.user.url +'" class="scribd-docwidget-doc-owner-link">', doc.user.login, '</a>',
            '</span>'
        ].join('');
    }

    ScribdX.DocWidget._buildDocReadsHTML = function(doc) {
        return [
            '<span class="scribd-docwidget-doc-reads">',
                '<span class="scribd-docwidget-label"> Reads: </span>', doc.reads,
            '</span>',
        ].join('');
    }
    
    ScribdX.DocWidget.popup = function(url, height, width) {
        var new_window=window.open(url, '_blank',('height=' + height + ',width=' + width + ',titlebar=0,toolbar=0,scrollbars=1,location=0,statusbar=0,menubar=0,resizable=1'));
        if (window.focus) { new_window.focus(); }
        return false;
    };
}

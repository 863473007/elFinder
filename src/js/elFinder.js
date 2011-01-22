(function($) {
	
	elFinder = function(el, o) {
		var self = this,
			$el = $(el);
		
		this.version = '1.2 beta';
		
		this.options = $.extend({}, this.options, o||{});
		if (!this.options.url) {
			alert('Invalid configuration! You have to set URL option.');
			return;
		}
		
		this.params = { dotFiles : false, arc : '', uplMaxSize : '' };
		
		this.id = $el.attr('id') || '';
		
		
		this.lang = this.i18[this.options.lang] ? this.options.lang : 'en';
		
		this.dir = this.i18[this.lang].dir;
		
		this.messages = this.i18[this.lang].messages;
		
		this.cwd      = {};
		this.cdc      = {};
		this.selected = [];
		this.history  = [];
		this.buffer   = [];
		
		this.locks = { 
			ui        : true, 
			shortcuts : true 
		};
		
		this.cookies = {
			view   : 'el-finder-view-'+this.id,
			places : 'el-finder-places-'+this.id,
			last   : 'el-finder-last-'+this.id
		};
		
		this._view = this.viewType(this.cookie(this.cookies.view) || 'icons');
		// this.viewType('icons')
		// this.log('viewType: '+this.viewType())
		
		
		this.listeners = {
			load   : [],
			focus  : [],
			blur   : [],
			cd     : [],
			select : [],
			error  : [],
			ajaxstart : [],
			ajaxstop : [],
			ajaxerror : [],
			lock   : []
		};
		
		
		/**
		 * Create/normalize event - add event.data object if not exists and
		 * event.data.id - document id on wich event is fired
		 * event.data.elrte - current editor instance
		 * 
		 * @return jQuery.Event
		 */
		this.event = function(e, data) {
			if (!e.type) {
				e = $.Event(e.toLowerCase());
			}
			e.data = $.extend(e.data, data, { elfinder : this });
			return e;
		}
		
		this.bind = function(e, c) {
			if (typeof(c) == 'function') {
				$.each(e.toLowerCase().split(/\s+/), function(i, e) {
					if (self.listeners[e] === void(0)) {
						self.listeners[e] = [];
					}
					self.listeners[e].push(c);
				});
			}
			return this;
		}
		
		/**
		 * Send notification to all event subscribers
		 *
		 * @param  Event|String  event or event type
		 * @param  Object        extra parameters
		 * @return elRTE
		 */
		this.trigger = function(e, d) {
			var e = this.event(e, d),
				l = this.listeners[e.type]||[], i;

			this.debug('event', e.type+', listeners - '+l.length);
			d && this.debug('event-data', d);

			for (i = 0; i < l.length; i++) {
				if (e.isPropagationStopped()) {
					break;
				}
				// try {
					l[i](e);
				// } catch (ex) {
					
				// }
			}
			return this;
		}
		
		this.shortcut = function() {
			
		}
		
		this.ajax = function(opts) {
			var error = opts.error || function(m) { self.trigger('error', { error : m}) },
				o = {
					url      : this.options.url,
					async    : true,
					type     : 'get',
					data     : opts.data,
					dataType : 'json',
					cache    : false,
					error    : function(r) { self.trigger('ajaxerror', { status : r.status }); },
					success  : function(d) {
						self.trigger('ajaxstop').debug('ajax-data', d);
						if (d.error && !error(d.error)) {
							return;
						}
						opts.success && opts.success(d);
					}
				};
				
			$.extend(o, opts.options);
			!opts.silent && this.trigger('ajaxstart', o);
			$.ajax(o);
		}
		

		
		this.lock = function(o) {
			if (o === void(0)) {
				return this.locks;
			}
			$.extend(this.locks, o);
			this.trigger('lock', { locks : this.locks });
		}
	
		this.get = function(key) {
			
		}
	
		this.getByName = function(name) {
			
		}
	
		this.last = function(key) {
			return this.options.rememberLastDir ? this.cookie(this.cookies.last, key) : void(0);
		}
		
		this.resize = function(w, h) {
			
		}
		
		this.select = function(keys, reset) {
			
		}
		
		this.cd = function(key) {
			
		}
		
		this.reload = function() {
			
		}
		
		this.copy = function(keys, cut) {
			
		}
		
		this.cut = function(keys) {
			return this.copy(keys, true);
		}
		
		this.paste = function(keys) {
			
		}
		
		this.i18n = function(m) {
			return this.messages[m] || m;
		}
		
		this.view = new this.view(this, $el);
		
		this.bind('ajaxstart ajaxerror ajaxstop', function(e) {
			var l = e.type != 'ajaxstop';
			self.lock({ ui : l, shortcuts : l });
		})

		// this.viewType('list')
		

		this.ajax({ 
			data : { 
				cmd : 'open', 
				target : this.last() || '', 
				init : true, 
				tree : true 
			},
			success : function(d) {
				var l = d.cdc.length;
				
				$.extend(self.params, d.params||{});
				self.cwd = d.cwd;
				self.cdc = {};
				for (var i = 0; i < d.cdc.length; i++) {
					self.cdc[d.cdc[i].hash] = d.cdc[i];
					self.cwd.size += d.cdc[i].size;
				}
				// self.log(self.cwd)
				self.trigger('reload', { tree : d.tree, cwd : d.cwd });
			}
		});
		
		// cookie(this.cookies.view, 'list')
	}
	
	elFinder.prototype.log = function(m) {
		window.console && window.console.log && window.console.log(m);
	}
	
	elFinder.prototype.debug = function(type, m) {
		var d = this.options.debug;
		
		if (d == 'all' || d === true || ($.isArray(d) && $.inArray(type, d) != -1)) {
			if (typeof(m) == 'string') {
				this.log('elfinder debug: ['+type+'] '+m);
			} else {
				this.log('elfinder debug: ['+type+'] ->');
				this.log(m)
			}
			
		} 
		return this;
	}
	
	elFinder.prototype.time = function(l) {
		window.console && window.console.time && window.console.time(l);
	}
	
	elFinder.prototype.timeEnd = function(l) {
		window.console && window.console.timeEnd && window.console.timeEnd(l);
	}
	
	elFinder.prototype.viewType = function(t) {
		if (t !== void(0)) {
			this._view = /^view|list$/i.test(t) ? t : 'icons';
			this.cookie(this.cookies.view, this._view);
			
		}
		return this._view;
	}
	
	elFinder.prototype.cookie = function(name, value) {
		if (value === void(0)) {
			if (document.cookie && document.cookie != '') {
				var i, c = document.cookie.split(';');
				name += '=';
				for (i=0; i<c.length; i++) {
					c[i] = $.trim(c[i]);
					if (c[i].substring(0, name.length) == name) {
						return decodeURIComponent(c[i].substring(name.length));
					}
				}
			}
			return '';
		} else {
			var d, o = $.extend({}, this.options.cookie);
			if (value===null) {
				value = '';
				o.expires = -1;
			}
			if (typeof(o.expires) == 'number') {
				d = new Date();
				d.setTime(d.getTime()+(o.expires * 24 * 60 * 60 * 1000));
				o.expires = d;
			}
			document.cookie = name+'='+encodeURIComponent(value)+'; expires='+o.expires.toUTCString()+(o.path ? '; path='+o.path : '')+(o.domain ? '; domain='+o.domain : '')+(o.secure ? '; secure' : '');
		}
	}
	
	elFinder.prototype.i18 = {
		en : {
			_translator  : '',
			_translation : 'English localization',
			dir          : 'ltr',
			messages     : {}
		}
	}
	
	
	$.fn.elfinder = function(o) {
		
		return this.each(function() {
			
			var cmd = typeof(o) == 'string' ? o : '';
			if (!this.elfinder) {
				this.elfinder = new elFinder(this, typeof(o) == 'object' ? o : {})
			}
			
			switch(cmd) {
				case 'close':
				case 'hide':
					this.elfinder.close();
					break;
					
				case 'open':
				case 'show':
					this.elfinder.open();
					break;
				
				case 'dock':
					this.elfinder.dock();
					break;
					
				case 'undock':
					this.elfinder.undock();
					break;
					
				case'destroy':
					this.elfinder.destroy();
					break;
			}
			
		})
	}
	
})(jQuery);
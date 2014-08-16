
if ( jpconcat.files['modules/carousel/jetpack-carousel.js'] ) {

/* jshint sub: true, onevar: false, multistr: true, devel: true, smarttabs: true */
/* global jetpackCarouselStrings, DocumentTouch, jetpackLikesWidgetQueue */


jQuery(document).ready(function($) {

	// gallery faded layer and container elements
	var overlay, comments, gallery, container, nextButton, previousButton, info, transitionBegin,
	caption, resizeTimeout, photo_info, close_hint, commentInterval, lastSelectedSlide,
	screenPadding = 110, originalOverflow = $('body').css('overflow'), originalHOverflow = $('html').css('overflow'), proportion = 85,
	last_known_location_hash = '', imageMeta, titleAndDescription, commentForm, leftColWrapper;

	if ( window.innerWidth <= 760 ) {
		screenPadding = Math.round( ( window.innerWidth / 760 ) * 110 );

		if ( screenPadding < 40 && ( ( 'ontouchstart' in window ) || window.DocumentTouch && document instanceof DocumentTouch ) ) {
			screenPadding = 0;
		}
	}

	var keyListener = function(e){
		switch(e.which){
			case 38: // up
				e.preventDefault();
				container.scrollTop(container.scrollTop() - 100);
				break;
			case 40: // down
				e.preventDefault();
				container.scrollTop(container.scrollTop() + 100);
				break;
			case 39: // right
				e.preventDefault();
				gallery.jp_carousel('clearCommentTextAreaValue');
				gallery.jp_carousel('next');
				break;
			case 37: // left
			case 8: // backspace
				e.preventDefault();
				gallery.jp_carousel('clearCommentTextAreaValue');
				gallery.jp_carousel('previous');
				break;
			case 27: // escape
				e.preventDefault();
				gallery.jp_carousel('clearCommentTextAreaValue');
				container.jp_carousel('close');
				break;
			default:
				// making jslint happy
				break;
		}
	};

	var resizeListener = function(/*e*/){
		clearTimeout(resizeTimeout);
		resizeTimeout = setTimeout(function(){
			gallery
				.jp_carousel('slides')
				.jp_carousel('fitSlide', true);
			gallery.jp_carousel('updateSlidePositions', true);
			gallery.jp_carousel('fitMeta', true);
		}, 200);
	};

	var prepareGallery = function( /*dataCarouselExtra*/ ){
		if (!overlay) {
			overlay = $('<div></div>')
				.addClass('jp-carousel-overlay')
				.css({
					'position' : 'absolute',
					'top'      : 0,
					'right'    : 0,
					'bottom'   : 0,
					'left'     : 0
				});

			var buttons  = '<a class="jp-carousel-commentlink" href="#">' + jetpackCarouselStrings.comment + '</a>';
			if ( 1 === Number( jetpackCarouselStrings.is_logged_in ) ) {
			}

			buttons  = $('<div class="jp-carousel-buttons">' + buttons + '</div>');

			caption    = $('<h2></h2>');
			photo_info = $('<div class="jp-carousel-photo-info"></div>').append(caption);

			imageMeta = $('<div></div>')
				.addClass('jp-carousel-image-meta')
				.css({
					'float'      : 'right',
					'margin-top' : '20px',
					'width'      :  '250px'
				});

			imageMeta
				.append( buttons )
				.append( '<ul class=\'jp-carousel-image-exif\' style=\'display:none;\'></ul>' )
				.append( '<a class=\'jp-carousel-image-download\' style=\'display:none;\'></a>' )
				.append( '<div class=\'jp-carousel-image-map\' style=\'display:none;\'></div>' );

			titleAndDescription = $('<div></div>')
				.addClass('jp-carousel-titleanddesc')
				.css({
					'width'      : '100%',
					'margin-top' : imageMeta.css('margin-top')
				});

			var commentFormMarkup = '<div id="jp-carousel-comment-form-container">';

			if ( jetpackCarouselStrings.local_comments_commenting_as && jetpackCarouselStrings.local_comments_commenting_as.length ) {
				// Jetpack comments not enabled, fallback to local comments

				if ( 1 !== Number( jetpackCarouselStrings.is_logged_in ) && 1 === Number( jetpackCarouselStrings.comment_registration ) ) {
					commentFormMarkup += '<div id="jp-carousel-comment-form-commenting-as">' + jetpackCarouselStrings.local_comments_commenting_as + '</div>';
				} else {
					commentFormMarkup += '<form id="jp-carousel-comment-form">';
					commentFormMarkup += '<textarea name="comment" class="jp-carousel-comment-form-field jp-carousel-comment-form-textarea" id="jp-carousel-comment-form-comment-field" placeholder="' + jetpackCarouselStrings.write_comment + '"></textarea>';
					commentFormMarkup += '<div id="jp-carousel-comment-form-submit-and-info-wrapper">';
					commentFormMarkup += '<div id="jp-carousel-comment-form-commenting-as">' + jetpackCarouselStrings.local_comments_commenting_as + '</div>';
					commentFormMarkup += '<input type="submit" name="submit" class="jp-carousel-comment-form-button" id="jp-carousel-comment-form-button-submit" value="'+jetpackCarouselStrings.post_comment+'" />';
					commentFormMarkup += '<span id="jp-carousel-comment-form-spinner">&nbsp;</span>';
					commentFormMarkup += '<div id="jp-carousel-comment-post-results"></div>';
					commentFormMarkup += '</div>';
					commentFormMarkup += '</form>';
				}
			}
			commentFormMarkup += '</div>';

			commentForm = $(commentFormMarkup)
				.css({
					'width'      : '100%',
					'margin-top' : '20px',
					'color'      : '#999'
				});

			comments = $('<div></div>')
				.addClass('jp-carousel-comments')
				.css({
					'width'      : '100%',
					'bottom'     : '10px',
					'margin-top' : '20px'
				});

			var commentsLoading = $('<div id="jp-carousel-comments-loading"><span>'+jetpackCarouselStrings.loading_comments+'</span></div>')
				.css({
					'width'      : '100%',
					'bottom'     : '10px',
					'margin-top' : '20px'
				});

			var leftWidth = ( $(window).width() - ( screenPadding * 2 ) ) - (imageMeta.width() + 40);
			leftWidth += 'px';

			leftColWrapper = $('<div></div>')
				.addClass('jp-carousel-left-column-wrapper')
				.css({
					'width' : Math.floor( leftWidth )
				})
				.append(titleAndDescription)
				.append(commentForm)
				.append(comments)
				.append(commentsLoading);

			var fadeaway = $('<div></div>')
				.addClass('jp-carousel-fadeaway');

			info = $('<div></div>')
				.addClass('jp-carousel-info')
				.css({
					'top'   : Math.floor( ($(window).height() / 100) * proportion ),
					'left'  : screenPadding,
					'right' : screenPadding
				})
				.append(photo_info)
				.append(imageMeta);

			if ( window.innerWidth <= 760 ) {
				photo_info.remove().insertAfter( titleAndDescription );
				info.prepend( leftColWrapper );
			}
			else {
				info.append( leftColWrapper );
			}

			var targetBottomPos = ( $(window).height() - parseInt( info.css('top'), 10 ) ) + 'px';

			nextButton = $('<div><span></span></div>')
				.addClass('jp-carousel-next-button')
				.css({
					'right'    : '15px'
				});

			previousButton = $('<div><span></span></div>')
				.addClass('jp-carousel-previous-button')
				.css({
					'left'     : 0
				});

			nextButton.add( previousButton ).css( {
				'position' : 'fixed',
				'top' : '40px',
				'bottom' : targetBottomPos,
				'width' : screenPadding
			} );

			gallery = $('<div></div>')
				.addClass('jp-carousel')
				.css({
					'position' : 'absolute',
					'top'      : 0,
					'bottom'   : targetBottomPos,
					'left'     : 0,
					'right'    : 0
				});

			close_hint = $('<div class="jp-carousel-close-hint"><span>&times;</span></div>')
				.css({
					position : 'fixed'
				});

			container = $('<div></div>')
				.addClass('jp-carousel-wrap')
				.addClass( 'jp-carousel-transitions' );

			if ( 'white' === jetpackCarouselStrings.background_color ) {
				 container.addClass('jp-carousel-light');
			}

			container.css({
					'position'   : 'fixed',
					'top'        : 0,
					'right'      : 0,
					'bottom'     : 0,
					'left'       : 0,
					'z-index'    : 2147483647,
					'overflow-x' : 'hidden',
					'overflow-y' : 'auto',
					'direction'  : 'ltr'
				})
				.hide()
				.append(overlay)
				.append(gallery)
				.append(fadeaway)
				.append(info)
				.append(nextButton)
				.append(previousButton)
				.append(close_hint)
				.appendTo($('body'))
				.click(function(e){
					var target = $(e.target), wrap = target.parents('div.jp-carousel-wrap'), data = wrap.data('carousel-extra'),
						slide = wrap.find('div.selected'), attachment_id = slide.data('attachment-id');
					data = data || [];

					if ( target.is(gallery) || target.parents().add(target).is(close_hint) ) {
						container.jp_carousel('close');
					} else if ( target.hasClass('jp-carousel-commentlink') ) {
						e.preventDefault();
						e.stopPropagation();
						$(window).unbind('keydown', keyListener);
						container.animate({scrollTop: parseInt(info.position()['top'], 10)}, 'fast');
						$('#jp-carousel-comment-form-submit-and-info-wrapper').slideDown('fast');
						$('#jp-carousel-comment-form-comment-field').focus();
					} else if ( target.hasClass('jp-carousel-comment-login') ) {
						var url = jetpackCarouselStrings.login_url + '%23jp-carousel-' + attachment_id;

						window.location.href = url;
					} else if ( target.parents('#jp-carousel-comment-form-container').length ) {
						var textarea = $('#jp-carousel-comment-form-comment-field')
							.blur(function(){
								$(window).bind('keydown', keyListener);
							})
							.focus(function(){
								$(window).unbind('keydown', keyListener);
							});

						var emailField = $('#jp-carousel-comment-form-email-field')
							.blur(function(){
								$(window).bind('keydown', keyListener);
							})
							.focus(function(){
								$(window).unbind('keydown', keyListener);
							});

						var authorField = $('#jp-carousel-comment-form-author-field')
							.blur(function(){
								$(window).bind('keydown', keyListener);
							})
							.focus(function(){
								$(window).unbind('keydown', keyListener);
							});

						var urlField = $('#jp-carousel-comment-form-url-field')
							.blur(function(){
								$(window).bind('keydown', keyListener);
							})
							.focus(function(){
								$(window).unbind('keydown', keyListener);
							});

						if ( textarea && textarea.attr('id') === target.attr('id')) {
							// For first page load
							$(window).unbind('keydown', keyListener);
							$('#jp-carousel-comment-form-submit-and-info-wrapper').slideDown('fast');
						} else if ( target.is( 'input[type="submit"]' ) ) {
							e.preventDefault();
							e.stopPropagation();

							$('#jp-carousel-comment-form-spinner').spin('small', 'white');

							var ajaxData = {
								action: 'post_attachment_comment',
								nonce:   jetpackCarouselStrings.nonce,
								blog_id: data['blog_id'],
								id:      attachment_id,
								comment: textarea.val()
							};

							if ( ! ajaxData['comment'].length ) {
								gallery.jp_carousel('postCommentError', {'field': 'jp-carousel-comment-form-comment-field', 'error': jetpackCarouselStrings.no_comment_text});
								return;
							}

							if ( 1 !== Number( jetpackCarouselStrings.is_logged_in ) ) {
								ajaxData['email']  = emailField.val();
								ajaxData['author'] = authorField.val();
								ajaxData['url']    = urlField.val();

								if ( 1 === Number( jetpackCarouselStrings.require_name_email ) ) {
									if ( ! ajaxData['email'].length || ! ajaxData['email'].match('@') ) {
										gallery.jp_carousel('postCommentError', {'field': 'jp-carousel-comment-form-email-field', 'error': jetpackCarouselStrings.no_comment_email});
										return;
									} else if ( ! ajaxData['author'].length ) {
										gallery.jp_carousel('postCommentError', {'field': 'jp-carousel-comment-form-author-field', 'error': jetpackCarouselStrings.no_comment_author});
										return;
									}
								}
							}

							$.ajax({
								type:       'POST',
								url:        jetpackCarouselStrings.ajaxurl,
								data:       ajaxData,
								dataType:   'json',
								success: function(response/*, status, xhr*/) {
									if ( 'approved' === response.comment_status ) {
										$('#jp-carousel-comment-post-results').slideUp('fast').html('<span class="jp-carousel-comment-post-success">' + jetpackCarouselStrings.comment_approved + '</span>').slideDown('fast');
									} else if ( 'unapproved' === response.comment_status ) {
										$('#jp-carousel-comment-post-results').slideUp('fast').html('<span class="jp-carousel-comment-post-success">' + jetpackCarouselStrings.comment_unapproved + '</span>').slideDown('fast');
									} else {
										// 'deleted', 'spam', false
										$('#jp-carousel-comment-post-results').slideUp('fast').html('<span class="jp-carousel-comment-post-error">' + jetpackCarouselStrings.comment_post_error + '</span>').slideDown('fast');
									}
									gallery.jp_carousel('clearCommentTextAreaValue');
									gallery.jp_carousel('getComments', {attachment_id: attachment_id, offset: 0, clear: true});
									$('#jp-carousel-comment-form-button-submit').val(jetpackCarouselStrings.post_comment);
									$('#jp-carousel-comment-form-spinner').spin(false);
								},
								error: function(/*xhr, status, error*/) {
									// TODO: Add error handling and display here
									gallery.jp_carousel('postCommentError', {'field': 'jp-carousel-comment-form-comment-field', 'error': jetpackCarouselStrings.comment_post_error});
									return;
								}
							});
						}
					} else if ( ! target.parents( '.jp-carousel-info' ).length ) {
						container.jp_carousel('next');
					}
				})
				.bind('jp_carousel.afterOpen', function(){
					$(window).bind('keydown', keyListener);
					$(window).bind('resize', resizeListener);
					gallery.opened = true;

					resizeListener();
				})
				.bind('jp_carousel.beforeClose', function(){
					var scroll = $(window).scrollTop();

					$(window).unbind('keydown', keyListener);
					$(window).unbind('resize', resizeListener);
					$(window).scrollTop(scroll);
				})
				.bind('jp_carousel.afterClose', function(){
					if ( history.pushState ) {
						history.pushState('', document.title, window.location.pathname + window.location.search);
					} else {
						last_known_location_hash = '';
						window.location.hash = '';
					}
					gallery.opened = false;
				})
				.on( 'transitionend.jp-carousel ', '.jp-carousel-slide', function ( e ) {
					// If the movement transitions take more than twice the allotted time, disable them.
					// There is some wiggle room in the 2x, since some of that time is taken up in
					// JavaScript, setting up the transition and calling the events.
					if ( 'transform' === e.originalEvent.propertyName ) {
						var transitionMultiplier = ( ( Date.now() - transitionBegin ) / 1000 ) / e.originalEvent.elapsedTime;

						container.off( 'transitionend.jp-carousel' );

						if ( transitionMultiplier >= 2 ) {
							$( '.jp-carousel-transitions' ).removeClass( 'jp-carousel-transitions' );
						}
					}
				} );

				$( '.jp-carousel-wrap' ).touchwipe( {
					wipeLeft : function ( e ) {
						e.preventDefault();
						gallery.jp_carousel( 'next' );
					},
					wipeRight : function ( e ) {
						e.preventDefault();
						gallery.jp_carousel( 'previous' );
					},
					preventDefaultEvents : false
				} );

			$( '.jetpack-likes-widget-unloaded' ).each( function() {
				jetpackLikesWidgetQueue.push( this.id );
				});

			nextButton.add(previousButton).click(function(e){
				e.preventDefault();
				e.stopPropagation();
				if ( nextButton.is(this) ) {
					gallery.jp_carousel('next');
				} else {
					gallery.jp_carousel('previous');
				}
			});
		}
	};

	var methods = {
		testForData: function(gallery) {
			gallery = $( gallery ); // make sure we have it as a jQuery object.
			return !( ! gallery.length || ! gallery.data( 'carousel-extra' ) );
		},

		testIfOpened: function() {
			return !!( 'undefined' !== typeof(gallery) && 'undefined' !== typeof(gallery.opened) && gallery.opened );
		},

		openOrSelectSlide: function( index ) {
			// The `open` method triggers an asynchronous effect, so we will get an
			// error if we try to use `open` then `selectSlideAtIndex` immediately
			// after it. We can only use `selectSlideAtIndex` if the carousel is
			// already open.
			if ( ! $( this ).jp_carousel( 'testIfOpened' ) ) {
				// The `open` method selects the correct slide during the
				// initialization.
				$( this ).jp_carousel( 'open', { start_index: index } );
			} else {
				gallery.jp_carousel( 'selectSlideAtIndex', index );
			}
		},

		open: function(options) {
			var settings = {
				'items_selector' : '.gallery-item [data-attachment-id], .tiled-gallery-item [data-attachment-id]',
				'start_index': 0
			},
			data = $(this).data('carousel-extra');

			if ( !data ) {
				return; // don't run if the default gallery functions weren't used
			}

			prepareGallery( data );

			if ( gallery.jp_carousel( 'testIfOpened' ) ) {
				return; // don't open if already opened
			}

			// make sure to stop the page from scrolling behind the carousel overlay, so we don't trigger
			// infiniscroll for it when enabled (Reader, theme infiniscroll, etc).
			originalOverflow = $('body').css('overflow');
			$('body').css('overflow', 'hidden');
			// prevent html from overflowing on some of the new themes.
			originalHOverflow = $('html').css('overflow');
			$('html').css('overflow', 'hidden');

			// Re-apply inline-block style here and give an initial value for the width
			// This value will get replaced with a more appropriate value once the slide is loaded
			// This avoids the likes widget appearing initially full width below the comment button and then shuffling up
			jQuery( '.slim-likes-widget' ).find( 'iframe' ).css( 'display', 'inline-block' ).css( 'width', '60px' );

			container.data('carousel-extra', data);

			return this.each(function() {
				// If options exist, lets merge them
				// with our default settings
				var $this = $(this);

				if ( options ) {
					$.extend( settings, options );
				}
				if ( -1 === settings.start_index ) {
					settings.start_index = 0; //-1 returned if can't find index, so start from beginning
				}

				container.trigger('jp_carousel.beforeOpen').fadeIn('fast',function(){
					container.trigger('jp_carousel.afterOpen');
					gallery
						.jp_carousel('initSlides', $this.find(settings.items_selector), settings.start_index)
						.jp_carousel('selectSlideAtIndex', settings.start_index);
				});
				gallery.html('');
			});
		},

		selectSlideAtIndex : function(index){
			var slides = this.jp_carousel('slides'), selected = slides.eq(index);

			if ( 0 === selected.length ) {
				selected = slides.eq(0);
			}

			gallery.jp_carousel('selectSlide', selected, false);
			return this;
		},

		close : function(){
			// make sure to let the page scroll again
			$('body').css('overflow', originalOverflow);
			$('html').css('overflow', originalHOverflow);
			return container
				.trigger('jp_carousel.beforeClose')
				.fadeOut('fast', function(){
					container.trigger('jp_carousel.afterClose');
				});

		},

		next : function(){
			var slide = gallery.jp_carousel( 'nextSlide' );
			container.animate({scrollTop:0}, 'fast');

			if ( slide ) {
				this.jp_carousel('selectSlide', slide);
			}
		},

		previous : function(){
			var slide = gallery.jp_carousel( 'prevSlide' );
			container.animate({scrollTop:0}, 'fast');

			if ( slide ) {
				this.jp_carousel('selectSlide', slide);
			}
		},

		resetButtons : function(current) {
			if ( current.data('liked') ) {
				$('.jp-carousel-buttons a.jp-carousel-like').addClass('liked').text(jetpackCarouselStrings.unlike);
			} else {
				$('.jp-carousel-buttons a.jp-carousel-like').removeClass('liked').text(jetpackCarouselStrings.like);
			}
		},

		selectedSlide : function(){
			return this.find('.selected');
		},

		setSlidePosition : function(x) {
			transitionBegin = Date.now();

			return this.css({
					'-webkit-transform':'translate3d(' + x + 'px,0,0)',
					'-moz-transform':'translate3d(' + x + 'px,0,0)',
					'-ms-transform':'translate(' + x + 'px,0)',
					'-o-transform':'translate(' + x + 'px,0)',
					'transform':'translate3d(' + x + 'px,0,0)'
			});
		},

		updateSlidePositions : function(animate) {
			var current = this.jp_carousel( 'selectedSlide' ),
				galleryWidth = gallery.width(),
				currentWidth = current.width(),
				previous = gallery.jp_carousel( 'prevSlide' ),
				next = gallery.jp_carousel( 'nextSlide' ),
				previousPrevious = previous.prev(),
				nextNext = next.next(),
				left = Math.floor( ( galleryWidth - currentWidth ) * 0.5 );

			current.jp_carousel( 'setSlidePosition', left ).show();

			// minimum width
			gallery.jp_carousel( 'fitInfo', animate );

			// prep the slides
			var direction = lastSelectedSlide.is( current.prevAll() ) ? 1 : -1;

			// Since we preload the `previousPrevious` and `nextNext` slides, we need
			// to make sure they technically visible in the DOM, but invisible to the
			// user. To hide them from the user, we position them outside the edges
			// of the window.
			//
			// This section of code only applies when there are more than three
			// slides. Otherwise, the `previousPrevious` and `nextNext` slides will
			// overlap with the `previous` and `next` slides which must be visible
			// regardless.
			if ( 1 === direction ) {
				if ( ! nextNext.is( previous ) ) {
					nextNext.jp_carousel( 'setSlidePosition', galleryWidth + next.width() ).show();
				}

				if ( ! previousPrevious.is( next ) ) {
					previousPrevious.jp_carousel( 'setSlidePosition', -previousPrevious.width() - currentWidth ).show();
				}
			} else {
				if ( ! nextNext.is( previous ) ) {
					nextNext.jp_carousel( 'setSlidePosition', galleryWidth + currentWidth ).show();
				}
			}

			previous.jp_carousel( 'setSlidePosition', Math.floor( -previous.width() + ( screenPadding * 0.75 ) ) ).show();
			next.jp_carousel( 'setSlidePosition', Math.ceil( galleryWidth - ( screenPadding * 0.75 ) ) ).show();
		},

		selectSlide : function(slide, animate){
			lastSelectedSlide = this.find( '.selected' ).removeClass( 'selected' );

			var slides = gallery.jp_carousel( 'slides' ).css({ 'position': 'fixed' }),
				current = $( slide ).addClass( 'selected' ).css({ 'position': 'relative' }),
				attachmentId = current.data( 'attachment-id' ),
				previous = gallery.jp_carousel( 'prevSlide' ),
				next = gallery.jp_carousel( 'nextSlide' ),
				previousPrevious = previous.prev(),
				nextNext = next.next(),
				animated,
				captionHtml;

			// center the main image
			gallery.jp_carousel( 'loadFullImage', current );

			caption.hide();

			if ( next.length === 0 && slides.length <= 2 ) {
				$( '.jp-carousel-next-button' ).hide();
			} else {
				$( '.jp-carousel-next-button' ).show();
			}

			if ( previous.length === 0 && slides.length <= 2 ) {
				$( '.jp-carousel-previous-button' ).hide();
			} else {
				$( '.jp-carousel-previous-button' ).show();
			}

			animated = current
				.add( previous )
				.add( previousPrevious )
				.add( next )
				.add( nextNext )
				.jp_carousel( 'loadSlide' );

			// slide the whole view to the x we want
			slides.not( animated ).hide();

			gallery.jp_carousel( 'updateSlidePositions', animate );

			gallery.jp_carousel( 'resetButtons', current );
			container.trigger( 'jp_carousel.selectSlide', [current] );

			gallery.jp_carousel( 'getTitleDesc', {
				title: current.data( 'title' ),
				desc: current.data( 'desc' )
			});

			// Lazy-load the Likes iframe for the current, next, and previous slides.
			gallery.jp_carousel( 'loadLikes', attachmentId );
			gallery.jp_carousel( 'updateLikesWidgetVisibility', attachmentId );

			if ( next.length > 0 ) {
				gallery.jp_carousel( 'loadLikes', next.data( 'attachment-id' ) );
			}

			if ( previous.length > 0 ) {
				gallery.jp_carousel( 'loadLikes', previous.data( 'attachment-id' ) );
			}

			var imageMeta = current.data( 'image-meta' );
			gallery.jp_carousel( 'updateExif', imageMeta );
			gallery.jp_carousel( 'updateFullSizeLink', current );
			gallery.jp_carousel( 'updateMap', imageMeta );
			gallery.jp_carousel( 'testCommentsOpened', current.data( 'comments-opened' ) );
			gallery.jp_carousel( 'getComments', {
				'attachment_id': attachmentId,
				'offset': 0,
				'clear': true
			});
			$( '#jp-carousel-comment-post-results' ).slideUp();

			// $('<div />').text(sometext).html() is a trick to go to HTML to plain
			// text (including HTML entities decode, etc)
			if ( current.data( 'caption' ) ) {
				captionHtml = $( '<div />' ).text( current.data( 'caption' ) ).html();

				if ( captionHtml === $( '<div />' ).text( current.data( 'title' ) ).html() ) {
					$( '.jp-carousel-titleanddesc-title' ).fadeOut( 'fast' ).empty();
				}

				if ( captionHtml === $( '<div />' ).text( current.data( 'desc' ) ).html() ) {
					$( '.jp-carousel-titleanddesc-desc' ).fadeOut( 'fast' ).empty();
				}

				caption.html( current.data( 'caption' ) ).fadeIn( 'slow' );
			} else {
				caption.fadeOut( 'fast' ).empty();
			}


			// Load the images for the next and previous slides.
			$( next ).add( previous ).each( function() {
				gallery.jp_carousel( 'loadFullImage', $( this ) );
			});

			window.location.hash = last_known_location_hash = '#jp-carousel-' + attachmentId;
		},

		slides : function(){
			return this.find('.jp-carousel-slide');
		},

		slideDimensions : function(){
			return {
				width: $(window).width() - (screenPadding * 2),
				height: Math.floor( $(window).height() / 100 * proportion - 60 )
			};
		},

		loadSlide : function() {
			return this.each(function(){
				var slide = $(this);
				slide.find('img')
					.one('load', function(){
						// set the width/height of the image if it's too big
						slide
							.jp_carousel('fitSlide',false);
					});
			});
		},

		bestFit : function(){
			var max        = gallery.jp_carousel('slideDimensions'),
			    orig       = this.jp_carousel('originalDimensions'),
			    orig_ratio = orig.width / orig.height,
			    w_ratio    = 1,
			    h_ratio    = 1,
			    width, height;

			if ( orig.width > max.width ) {
				w_ratio = max.width / orig.width;
			}
			if ( orig.height > max.height ) {
				h_ratio = max.height / orig.height;
			}

			if ( w_ratio < h_ratio ) {
				width = max.width;
				height = Math.floor( width / orig_ratio );
			} else if ( h_ratio < w_ratio ) {
				height = max.height;
				width = Math.floor( height * orig_ratio );
			} else {
				width = orig.width;
				height = orig.height;
			}

			return {
				width: width,
				height: height
			};
		},

		fitInfo : function(/*animated*/){
			var current = this.jp_carousel('selectedSlide'),
				size = current.jp_carousel('bestFit');

			photo_info.css({
				'left'  : Math.floor( (info.width() - size.width) * 0.5 ),
				'width' : Math.floor( size.width )
			});

			return this;
		},

		fitMeta : function(animated){
			var newInfoTop   = { top: Math.floor( $(window).height() / 100 * proportion + 5 ) + 'px' };
			var newLeftWidth = { width: ( info.width() - (imageMeta.width() + 80) ) + 'px' };

			if (animated) {
				info.animate(newInfoTop);
				leftColWrapper.animate(newLeftWidth);
			} else {
				info.animate(newInfoTop);
				leftColWrapper.css(newLeftWidth);
			}
		},

		fitSlide : function(/*animated*/){
			return this.each(function(){
				var $this      = $(this),
				    dimensions = $this.jp_carousel('bestFit'),
				    method     = 'css',
				    max        = gallery.jp_carousel('slideDimensions');

				dimensions.left = 0;
				dimensions.top = Math.floor( (max.height - dimensions.height) * 0.5 ) + 40;
				$this[method](dimensions);
			});
		},

		texturize : function(text) {
				text = '' + text; // make sure we get a string. Title "1" came in as int 1, for example, which did not support .replace().
				text = text.replace(/'/g, '&#8217;').replace(/&#039;/g, '&#8217;').replace(/[\u2019]/g, '&#8217;');
				text = text.replace(/"/g, '&#8221;').replace(/&#034;/g, '&#8221;').replace(/&quot;/g, '&#8221;').replace(/[\u201D]/g, '&#8221;');
				text = text.replace(/([\w]+)=&#[\d]+;(.+?)&#[\d]+;/g, '$1="$2"'); // untexturize allowed HTML tags params double-quotes
				return $.trim(text);
		},

		initSlides : function(items, start_index){
			if ( items.length < 2 ) {
				$( '.jp-carousel-next-button, .jp-carousel-previous-button' ).hide();
			} else {
				$( '.jp-carousel-next-button, .jp-carousel-previous-button' ).show();
			}

			// Calculate the new src.
			items.each(function(/*i*/){
				var src_item  = $(this),
					orig_size = src_item.data('orig-size') || '',
					max       = gallery.jp_carousel('slideDimensions'),
					parts     = orig_size.split(','),
					medium_file     = src_item.data('medium-file') || '',
					large_file      = src_item.data('large-file') || '',
					src;
				orig_size = {width: parseInt(parts[0], 10), height: parseInt(parts[1], 10)};

					src = src_item.data('orig-file');

					src = gallery.jp_carousel('selectBestImageSize', {
						orig_file   : src,
						orig_width  : orig_size.width,
						orig_height : orig_size.height,
						max_width   : max.width,
						max_height  : max.height,
						medium_file : medium_file,
						large_file  : large_file
					});

				// Set the final src
				$(this).data( 'gallery-src', src );
			});

			// If the start_index is not 0 then preload the clicked image first.
			if ( 0 !== start_index ) {
				$('<img/>')[0].src = $(items[start_index]).data('gallery-src');
			}

			var useInPageThumbnails = items.first().closest( '.tiled-gallery.type-rectangular' ).length > 0;

			// create the 'slide'
			items.each(function(i){
				var src_item        = $(this),
					attachment_id   = src_item.data('attachment-id') || 0,
					comments_opened = src_item.data('comments-opened') || 0,
					image_meta      = src_item.data('image-meta') || {},
					orig_size       = src_item.data('orig-size') || '',
					thumb_size      = { width : src_item[0].naturalWidth, height : src_item[0].naturalHeight },
					title           = src_item.data('image-title') || '',
					description     = src_item.data('image-description') || '',
					caption         = src_item.parents('dl').find('dd.gallery-caption').html() || '',
					src		= src_item.data('gallery-src') || '',
					medium_file     = src_item.data('medium-file') || '',
					large_file      = src_item.data('large-file') || '',
					orig_file	= src_item.data('orig-file') || '';

				var tiledCaption = src_item.parents('div.tiled-gallery-item').find('div.tiled-gallery-caption').html();
				if ( tiledCaption ) {
					caption = tiledCaption;
				}

				if ( attachment_id && orig_size.length ) {
					title       = gallery.jp_carousel('texturize', title);
					description = gallery.jp_carousel('texturize', description);
					caption     = gallery.jp_carousel('texturize', caption);

					// Initially, the image is a 1x1 transparent gif.  The preview is shown as a background image on the slide itself.
					var image = $( '<img/>' )
						.attr( 'src', 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7' )
						.css( 'width', '100%' )
						.css( 'height', '100%' );

					var slide = $('<div class="jp-carousel-slide"></div>')
							.hide()
							.css({
								//'position' : 'fixed',
								'left'     : i < start_index ? -1000 : gallery.width()
							})
							.append( image )
							.appendTo(gallery)
							.data('src', src )
							.data('title', title)
							.data('desc', description)
							.data('caption', caption)
							.data('attachment-id', attachment_id)
							.data('permalink', src_item.parents('a').attr('href'))
							.data('orig-size', orig_size)
							.data('comments-opened', comments_opened)
							.data('image-meta', image_meta)
							.data('medium-file', medium_file)
							.data('large-file', large_file)
							.data('orig-file', orig_file)
							.data('thumb-size', thumb_size)
							;

						if ( useInPageThumbnails ) {
							// Use the image already loaded in the gallery as a preview.
							slide
								.data( 'preview-image', src_item.attr( 'src' ) )
								.css( {
									'background-image' : 'url("' + src_item.attr( 'src' ) + '")',
									'background-size' : '100% 100%',
									'background-position' : 'center center'
								} );
						}

						slide.jp_carousel( 'fitSlide', false );
				}
			});
			return this;
		},

		selectBestImageSize: function(args) {
			if ( 'object' !== typeof args ) {
				args = {};
			}

			if ( 'undefined' === typeof args.orig_file ) {
				return '';
			}

			if ( 'undefined' === typeof args.orig_width || 'undefined' === typeof args.max_width ) {
				return args.orig_file;
			}

			if ( 'undefined' === typeof args.medium_file || 'undefined' === typeof args.large_file ) {
				return args.orig_file;
			}

			var medium_size       = args.medium_file.replace(/-([\d]+x[\d]+)\..+$/, '$1'),
				medium_size_parts = (medium_size !== args.medium_file) ? medium_size.split('x') : [args.orig_width, 0],
				medium_width      = parseInt( medium_size_parts[0], 10 ),
				medium_height     = parseInt( medium_size_parts[1], 10 ),
				large_size        = args.large_file.replace(/-([\d]+x[\d]+)\..+$/, '$1'),
				large_size_parts  = (large_size !== args.large_file) ? large_size.split('x') : [args.orig_width, 0],
				large_width       = parseInt( large_size_parts[0], 10 ),
				large_height      = parseInt( large_size_parts[1], 10 );

			// Give devices with a higher devicePixelRatio higher-res images (Retina display = 2, Android phones = 1.5, etc)
			if ( 'undefined' !== typeof window.devicePixelRatio && window.devicePixelRatio > 1 ) {
				args.max_width  = args.max_width * window.devicePixelRatio;
				args.max_height = args.max_height * window.devicePixelRatio;
			}

			if ( large_width >= args.max_width || large_height >= args.max_height ) {
				return args.large_file;
			}

			if ( medium_width >= args.max_width || medium_height >= args.max_height ) {
				return args.medium_file;
			}

			return args.orig_file;
		},

		originalDimensions: function() {
			var splitted = $(this).data('orig-size').split(',');
			return {width: parseInt(splitted[0], 10), height: parseInt(splitted[1], 10)};
		},

		format: function( args ) {
			if ( 'object' !== typeof args ) {
				args = {};
			}
			if ( ! args.text || 'undefined' === typeof args.text ) {
				return;
			}
			if ( ! args.replacements || 'undefined' === typeof args.replacements ) {
				return args.text;
			}
			return args.text.replace(/{(\d+)}/g, function( match, number ) {
				return typeof args.replacements[number] !== 'undefined' ? args.replacements[number] : match;
			});
		},

		shutterSpeed: function(d) {
			if (d >= 1) {
				return Math.round(d) + 's';
			}
			var df = 1, top = 1, bot = 1;
			var limit = 1e3;
			while (df !== d && limit-- > 0) {
				if (df < d) {
					top += 1;
				} else {
					bot += 1;
					top = parseInt(d * bot, 10);
				}
				df = top / bot;
			}
			if (top > 1) {
				bot = Math.round(bot / top);
				top = 1;
			}
			if (bot <= 1) {
				return '1s';
			}
			return top + '/' + bot + 's';
		},

		parseTitleDesc: function( value ) {
			if ( !value.match(' ') && value.match('_') ) {
				return '';
			}
			// Prefix list originally based on http://commons.wikimedia.org/wiki/MediaWiki:Filename-prefix-blacklist
			$([
				'CIMG',                   // Casio
				'DSC_',                   // Nikon
				'DSCF',                   // Fuji
				'DSCN',                   // Nikon
				'DUW',                    // some mobile phones
				'GEDC',                   // GE
				'IMG',                    // generic
				'JD',                     // Jenoptik
				'MGP',                    // Pentax
				'PICT',                   // misc.
				'Imagen',                 // misc.
				'Foto',                   // misc.
				'DSC',                    // misc.
				'Scan',                   // Scanners
				'SANY',                   // Sanyo
				'SAM',                    // Samsung
				'Screen Shot [0-9]+'      // Mac screenshots
			])
			.each(function(key, val){
				var regex = new RegExp('^' + val);
				if ( regex.test(value) ) {
					value = '';
					return;
				}
			});
			return value;
		},

		getTitleDesc: function( data ) {
			var title ='', desc = '', markup = '', target;

			target = $( 'div.jp-carousel-titleanddesc', 'div.jp-carousel-wrap' );
			target.hide();

			title = gallery.jp_carousel('parseTitleDesc', data.title) || '';
			desc  = gallery.jp_carousel('parseTitleDesc', data.desc)  || '';

			if ( title.length || desc.length ) {
				// $('<div />').text(sometext).html() is a trick to go to HTML to plain text (including HTML entities decode, etc)
				if ( $('<div />').text(title).html() === $('<div />').text(desc).html() ) {
					title = '';
				}

				markup  = ( title.length ) ? '<div class="jp-carousel-titleanddesc-title">' + title + '</div>' : '';
				markup += ( desc.length )  ? '<div class="jp-carousel-titleanddesc-desc">' + desc + '</div>'   : '';

				target.html( markup ).fadeIn('slow');
			}

			$( 'div#jp-carousel-comment-form-container' ).css('margin-top', '20px');
			$( 'div#jp-carousel-comments-loading' ).css('margin-top', '20px');
		},

		updateLikesWidgetVisibility: function ( attachmentId ) {
			// Only do this if likes is enabled
			if ( 'undefined' === typeof jetpackLikesWidgetQueue ) {
				return;
			}

			// Hide all likes widgets except for the one for the attachmentId passed in
			$( '.jp-carousel-buttons .jetpack-likes-widget-wrapper' ).css( 'display', 'none' ).each( function () {
				var widgetWrapper = $( this );
				if ( widgetWrapper.attr( 'data-attachment-id' ) == attachmentId ) { // jshint ignore:line
					widgetWrapper.css( 'display', 'inline-block' );
					return false;
				}
			});
		},

		loadLikes : function ( attachmentId ) {
			var dataCarouselExtra = $( '.jp-carousel-wrap' ).data( 'carousel-extra' );
			var blogId = dataCarouselExtra.likes_blog_id;

			if ( $( '#like-post-wrapper-' + blogId + '-' + attachmentId ).length === 0 ) {
				// Add the iframe the first time the slide is shown.
				var protocol = 'http';
				var originDomain = 'http://wordpress.com';

				if ( dataCarouselExtra.permalink.length ) {
					protocol = dataCarouselExtra.permalink.split( ':' )[0];

					if ( ( protocol !== 'http' ) && ( protocol !== 'https' ) ) {
						protocol = 'http';
					}

					var parts = dataCarouselExtra.permalink.split( '/' );

					if ( parts.length >= 2 ) {
						originDomain = protocol + '://' + parts[2];
					}
				}

				var dataSource = protocol + '://widgets.wp.com/likes/#blog_id=' + encodeURIComponent( blogId ) +
					'&post_id=' + encodeURIComponent( attachmentId ) +
					'&slim=1&origin=' + encodeURIComponent( originDomain );

				if ( 'en' !== jetpackCarouselStrings.lang ) {
					dataSource += '&lang=' + encodeURIComponent( jetpackCarouselStrings.lang );
				}

				var likesWidget = $( '<iframe class=\'post-likes-widget jetpack-likes-widget jetpack-resizeable\'></iframe>' )
					.attr( 'name', 'like-post-frame-' + blogId + '-' + attachmentId )
					.attr( 'src', dataSource )
					.css( 'display', 'inline-block' );

				var likesWidgetWrapper = $( '<div/>' )
					.addClass( 'jetpack-likes-widget-wrapper jetpack-likes-widget-unloaded slim-likes-widget' )
					.attr( 'id', 'like-post-wrapper-' + blogId + '-' + attachmentId )
					.attr( 'data-src', dataSource )
					.attr( 'data-name', 'like-post-frame-' + blogId + '-' + attachmentId )
					.attr( 'data-attachment-id', attachmentId )
					.css( 'display', 'none' )
					.css( 'vertical-align', 'middle' )
					.append( likesWidget )
					.append( '<div class=\'post-likes-widget-placeholder\'></div>' );

				$( '.jp-carousel-buttons' ).append( likesWidgetWrapper );
			}

		},

		// updateExif updates the contents of the exif UL (.jp-carousel-image-exif)
		updateExif: function( meta ) {
			if ( !meta || 1 !== Number( jetpackCarouselStrings.display_exif ) ) {
				return false;
			}

			var $ul = $( '<ul class=\'jp-carousel-image-exif\'></ul>' );

			$.each( meta, function( key, val ) {
				if ( 0 === parseFloat(val) || !val.length || -1 === $.inArray( key, [ 'camera', 'aperture', 'shutter_speed', 'focal_length' ] ) ) {
					return;
				}

				switch( key ) {
					case 'focal_length':
						val = val + 'mm';
						break;
					case 'shutter_speed':
						val = gallery.jp_carousel('shutterSpeed', val);
						break;
					case 'aperture':
						val = 'f/' + val;
						break;
				}

				$ul.append( '<li><h5>' + jetpackCarouselStrings[key] + '</h5>' + val + '</li>' );
			});

			// Update (replace) the content of the ul
			$( 'div.jp-carousel-image-meta ul.jp-carousel-image-exif' ).replaceWith( $ul );
		},

		// updateFullSizeLink updates the contents of the jp-carousel-image-download link
		updateFullSizeLink: function(current) {
			if(!current || !current.data) {
				return false;
			}
			var original  = current.data('orig-file').replace(/\?.+$/, ''),
				origSize  = current.data('orig-size').split(','),
				permalink = $( '<a>'+gallery.jp_carousel('format', {'text': jetpackCarouselStrings.download_original, 'replacements': origSize})+'</a>' )
					.addClass( 'jp-carousel-image-download' )
					.attr( 'href', original )
					.attr( 'target', '_blank' );

			// Update (replace) the content of the anchor
			$( 'div.jp-carousel-image-meta a.jp-carousel-image-download' ).replaceWith( permalink );
		},

		updateMap: function( meta ) {
			if ( !meta.latitude || !meta.longitude || 1 !== Number( jetpackCarouselStrings.display_geo ) ) {
				return;
			}

			var latitude  = meta.latitude,
				longitude = meta.longitude,
				$metabox  = $( 'div.jp-carousel-image-meta', 'div.jp-carousel-wrap' ),
				$mapbox   = $( '<div></div>' ),
				style     = '&scale=2&style=feature:all|element:all|invert_lightness:true|hue:0x0077FF|saturation:-50|lightness:-5|gamma:0.91';

			$mapbox
				.addClass( 'jp-carousel-image-map' )
				.html( '<img width="154" height="154" src="https://maps.googleapis.com/maps/api/staticmap?\
							center=' + latitude + ',' + longitude + '&\
							zoom=8&\
							size=154x154&\
							sensor=false&\
							markers=size:medium%7Ccolor:blue%7C' + latitude + ',' + longitude + style +'" class="gmap-main" />\
							\
						<div class="gmap-topright"><div class="imgclip"><img width="175" height="154" src="https://maps.googleapis.com/maps/api/staticmap?\
							center=' + latitude + ',' + longitude + '&\
							zoom=3&\
							size=175x154&\
							sensor=false&\
							markers=size:small%7Ccolor:blue%7C' + latitude + ',' + longitude + style + '"c /></div></div>\
							\
						' )
				.prependTo( $metabox );
		},

		testCommentsOpened: function( opened ) {
			if ( 1 === parseInt( opened, 10 ) ) {
					$('.jp-carousel-buttons').fadeIn('fast');
				commentForm.fadeIn('fast');
			} else {
					$('.jp-carousel-buttons').fadeOut('fast');
				commentForm.fadeOut('fast');
			}
		},

		getComments: function( args ) {
			clearInterval( commentInterval );

			if ( 'object' !== typeof args ) {
				return;
			}

			if ( 'undefined' === typeof args.attachment_id || ! args.attachment_id ) {
				return;
			}

			if ( ! args.offset || 'undefined' === typeof args.offset || args.offset < 1 ) {
				args.offset = 0;
			}

			var comments        = $('.jp-carousel-comments'),
				commentsLoading = $('#jp-carousel-comments-loading').show();

			if ( args.clear ) {
				comments.hide().empty();
			}

			$.ajax({
				type:       'GET',
				url:        jetpackCarouselStrings.ajaxurl,
				dataType:   'json',
				data: {
					action: 'get_attachment_comments',
					nonce:  jetpackCarouselStrings.nonce,
					id:     args.attachment_id,
					offset: args.offset
				},
				success: function(data/*, status, xhr*/) {
					if ( args.clear ) {
						comments.fadeOut('fast').empty();
					}

					$( data ).each(function(){
						var comment = $('<div></div>')
							.addClass('jp-carousel-comment')
							.attr('id', 'jp-carousel-comment-' + this['id'])
							.html(
								  '<div class="comment-gravatar">' +
								    this['gravatar_markup'] +
								  '</div>' +
								  '<div class="comment-author">' +
								    this['author_markup'] +
								  '</div>' +
								  '<div class="comment-date">' +
								    this['date_gmt'] +
								  '</div>' +
								  '<div class="comment-content">' +
								    this['content'] +
								  '</div>'
							);
						comments.append(comment);

						// Set the interval to check for a new page of comments.
						clearInterval( commentInterval );
						commentInterval = setInterval( function() {
							if ( ( $('.jp-carousel-overlay').height() - 150 ) < $('.jp-carousel-wrap').scrollTop() + $(window).height() ) {
								gallery.jp_carousel('getComments',{ attachment_id: args.attachment_id, offset: args.offset + 10, clear: false });
								clearInterval( commentInterval );
							}
						}, 300 );
					});

					// Verify (late) that the user didn't repeatldy click the arrows really fast, in which case the requested
					// attachment id might no longer match the current attachment id by the time we get the data back or a now
					// registered infiniscroll event kicks in, so we don't ever display comments for the wrong image by mistake.
					var current = $('.jp-carousel div.selected');
					if ( current && current.data && current.data('attachment-id') != args.attachment_id ) { // jshint ignore:line
						comments.fadeOut('fast');
						comments.empty();
						return;
					}

					// Increase the height of the background, semi-transparent overlay to match the new length of the comments list.
					$('.jp-carousel-overlay').height( $(window).height() + titleAndDescription.height() + commentForm.height() + ( (comments.height() > 0) ? comments.height() : imageMeta.height() ) + 200 );

					comments.show();
					commentsLoading.hide();
				},
				error: function(xhr, status, error) {
					// TODO: proper error handling
					console.log( 'Comment get fail...', xhr, status, error );
					comments.fadeIn('fast');
					commentsLoading.fadeOut('fast');
				}
			});
		},

		postCommentError: function(args) {
			if ( 'object' !== typeof args ) {
				args = {};
			}
			if ( ! args.field || 'undefined' === typeof args.field ||  ! args.error || 'undefined' === typeof args.error ) {
				return;
			}
			$('#jp-carousel-comment-post-results').slideUp('fast').html('<span class="jp-carousel-comment-post-error">'+args.error+'</span>').slideDown('fast');
			$('#jp-carousel-comment-form-spinner').spin(false);
		},

		setCommentIframeSrc: function(attachment_id) {
			var iframe = $('#jp-carousel-comment-iframe');
			// Set the proper irame src for the current attachment id
			if (iframe && iframe.length) {
				iframe.attr('src', iframe.attr('src').replace(/(postid=)\d+/, '$1'+attachment_id) );
				iframe.attr('src', iframe.attr('src').replace(/(%23.+)?$/, '%23jp-carousel-'+attachment_id) );
			}
		},

		clearCommentTextAreaValue: function() {
			var commentTextArea = $('#jp-carousel-comment-form-comment-field');
			if ( commentTextArea ) {
				commentTextArea.val('');
			}
		},

		nextSlide : function () {
			var slides = this.jp_carousel( 'slides' );
			var selected = this.jp_carousel( 'selectedSlide' );

			if ( selected.length === 0 || ( slides.length > 2 && selected.is( slides.last() ) ) ) {
				return slides.first();
			}

			return selected.next();
		},

		prevSlide : function () {
			var slides = this.jp_carousel( 'slides' );
			var selected = this.jp_carousel( 'selectedSlide' );

			if ( selected.length === 0 || ( slides.length > 2 && selected.is( slides.first() ) ) ) {
				return slides.last();
			}

			return selected.prev();
		},

		loadFullImage : function ( slide ) {
			var image = slide.find( 'img:first' );

			if ( ! image.data( 'loaded' ) ) {
				// If the width of the slide is smaller than the width of the "thumbnail" we're already using,
				// don't load the full image.

				image.on( 'load.jetpack', function () {
					image.off( 'load.jetpack' );
					$( this ).closest( '.jp-carousel-slide' ).css( 'background-image', '' );
				} );

				if ( ! slide.data( 'preview-image' ) || ( slide.data( 'thumb-size' ) && slide.width() > slide.data( 'thumb-size' ).width ) ) {
					image.attr( 'src', image.closest( '.jp-carousel-slide' ).data( 'src' ) );
				} else {
					image.attr( 'src', slide.data( 'preview-image' ) );
				}

				image.data( 'loaded', 1 );
			}
		}
	};

	$.fn.jp_carousel = function(method){
		// ask for the HTML of the gallery
		// Method calling logic
		if ( methods[method] ) {
			return methods[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ));
		} else if ( typeof method === 'object' || ! method ) {
			return methods.open.apply( this, arguments );
		} else {
			$.error( 'Method ' +	method + ' does not exist on jQuery.jp_carousel' );
		}

	};

	// register the event listener for starting the gallery
	$( document.body ).on( 'click', 'div.gallery,div.tiled-gallery', function(e) {
		if ( ! $(this).jp_carousel( 'testForData', e.currentTarget ) ) {
			return;
		}
		if ( $(e.target).parent().hasClass('gallery-caption') ) {
			return;
		}
		e.preventDefault();
		$(this).jp_carousel('open', {start_index: $(this).find('.gallery-item, .tiled-gallery-item').index($(e.target).parents('.gallery-item, .tiled-gallery-item'))});
	});

	// Makes carousel work on page load and when back button leads to same URL with carousel hash (ie: no actual document.ready trigger)
	$( window ).on( 'hashchange', function () {
		if ( ! window.location.hash || ! window.location.hash.match(/jp-carousel-(\d+)/) ) {
			return;
		}

		if ( window.location.hash === last_known_location_hash ) {
			return;
		}

		last_known_location_hash = window.location.hash;

		var gallery = $('div.gallery, div.tiled-gallery'), index = -1, n = window.location.hash.match(/jp-carousel-(\d+)/);

		if ( ! $(this).jp_carousel( 'testForData', gallery ) ) {
			return;
		}

		n = parseInt(n[1], 10);

		gallery.find('img').each(function(num, el){
			// n cannot be 0 (zero)
			if ( n && Number( $(el).data('attachment-id') ) === n ) {
				index = num;
				return false;
			}
		});

		if ( index !== -1 ) {
			gallery.jp_carousel('openOrSelectSlide', index);
		}
	});

	if ( window.location.hash ) {
		$( window ).trigger( 'hashchange' );
	}
});

/**
 * jQuery Plugin to obtain touch gestures from iPhone, iPod Touch and iPad, should also work with Android mobile phones (not tested yet!)
 * Common usage: wipe images (left and right to show the previous or next image)
 *
 * @author Andreas Waltl, netCU Internetagentur (http://www.netcu.de)
 * Version 1.1.1, modified to pass the touchmove event to the callbacks.
 */
(function($) {
$.fn.touchwipe = function(settings) {
	var config = {
			min_move_x: 20,
			min_move_y: 20,
			wipeLeft: function(/*e*/) { },
			wipeRight: function(/*e*/) { },
			wipeUp: function(/*e*/) { },
			wipeDown: function(/*e*/) { },
			preventDefaultEvents: true
	};

	if (settings) {
		$.extend(config, settings);
	}

	this.each(function() {
		var startX;
		var startY;
		var isMoving = false;

		function cancelTouch() {
			this.removeEventListener('touchmove', onTouchMove);
			startX = null;
			isMoving = false;
		}

		function onTouchMove(e) {
			if(config.preventDefaultEvents) {
				e.preventDefault();
			}
			if(isMoving) {
				var x = e.touches[0].pageX;
				var y = e.touches[0].pageY;
				var dx = startX - x;
				var dy = startY - y;
				if(Math.abs(dx) >= config.min_move_x) {
					cancelTouch();
					if(dx > 0) {
						config.wipeLeft(e);
					} else {
						config.wipeRight(e);
					}
				}
				else if(Math.abs(dy) >= config.min_move_y) {
						cancelTouch();
						if(dy > 0) {
							config.wipeDown(e);
						} else {
							config.wipeUp(e);
						}
					}
			}
		}

		function onTouchStart(e)
		{
			if (e.touches.length === 1) {
				startX = e.touches[0].pageX;
				startY = e.touches[0].pageY;
				isMoving = true;
				this.addEventListener('touchmove', onTouchMove, false);
			}
		}
		if ('ontouchstart' in document.documentElement) {
			this.addEventListener('touchstart', onTouchStart, false);
		}
	});

	return this;
};
})(jQuery);


} /* end modules/carousel/jetpack-carousel.js */

if ( jpconcat.files['modules/contact-form/js/grunion-frontend.js'] ) {

jQuery( function ( $ ) {
	$( '.contact-form input[type="date"]' ).datepicker( { dateFormat : 'yy-mm-dd' } );
} );

} /* end modules/contact-form/js/grunion-frontend.js */

if ( jpconcat.files['modules/custom-post-types/comics/comics.js'] ) {

/* jshint onevar: false, smarttabs: true, devel: true */
/* global Jetpack_Comics_Options */

jQuery( function ( $ ) {
	/**
	 * Enable front-end uploading of images for Comics users.
	 */
	var Jetpack_Comics = {
		init : function () {
			$( document ).on( 'dragover.jetpack-comics', 'body, #jetpack-comic-drop-zone', this.onDragOver );
			$( document ).on( 'dragleave.jetpack-comics', 'body, #jetpack-comic-drop-zone', this.onDragLeave );
			$( document ).on( 'drop.jetpack-comics', 'body, #jetpack-comic-drop-zone', this.onDrop );

			$( 'body' ).append( $( '<div id="jetpack-comic-drop-zone"><p class="dragging" /><p class="uploading" /></div>' ) );
			$( '#jetpack-comic-drop-zone' )
				.find( '.dragging' )
					.text( Jetpack_Comics_Options.labels.dragging )
				.end()
				.find( '.uploading' )
					.text( Jetpack_Comics_Options.labels.uploading )
					.prepend( $( '<span class="spinner"/>' ) );

			if ( ! ( 'FileReader' in window && 'File' in window ) ) {
				$( '#jetpack-comic-drop-zone .dragging' ).text( Jetpack_Comics_Options.labels.unsupported );
				$( document ).off( 'drop.jetpack-comics' ).on( 'drop.jetpack-comics', 'body, #jetpack-comic-drop-zone', this.onDragLeave );
			}
		},

		/**
		 * Only upload image files.
		 */
		filterImageFiles : function ( files ) {
			var validFiles = [];

			for ( var i = 0, _len = files.length; i < _len; i++ ) {
				if ( files[i].type.match( /^image\//i ) ) {
					validFiles.push( files[i] );
				}
			}

			return validFiles;
		},

		dragTimeout : null,

		onDragOver: function ( event ) {
			event.preventDefault();

			clearTimeout( Jetpack_Comics.dragTimeout );

			$( 'body' ).addClass( 'dragging' );
		},

		onDragLeave: function ( /*event*/ ) {
			clearTimeout( Jetpack_Comics.dragTimeout );

			// In Chrome, the screen flickers because we're moving the drop zone in front of 'body'
			// so the dragover/dragleave events happen frequently.
			Jetpack_Comics.dragTimeout = setTimeout( function () {
				$( 'body' ).removeClass( 'dragging' );
			}, 100 );
		},

		onDrop: function ( event ) {
			event.preventDefault();
			event.stopPropagation();

			// recent chrome bug requires this, see stackoverflow thread: http://bit.ly/13BU7b5
			event.originalEvent.stopPropagation();
			event.originalEvent.preventDefault();

			var files = Jetpack_Comics.filterImageFiles( event.originalEvent.dataTransfer.files );

			$( 'body' ).removeClass( 'dragging' );

			if ( files.length === 0 ) {
				alert( Jetpack_Comics_Options.labels.invalidUpload );
				return;
			}

			$( 'body' ).addClass( 'uploading' );

			var formData = new FormData();

			for ( var i = 0, fl = files.length; i < fl; i++ ) {
				formData.append( 'image_' + i, files[ i ] ); // won't work as image[]
			}

			$( '#jetpack-comic-drop-zone .uploading .spinner' ).spin();

			$.ajax( {
				url: Jetpack_Comics_Options.writeURL + '&nonce=' + Jetpack_Comics_Options.nonce,
				data: formData,
				processData: false,
				contentType: false,
				type: 'POST',
				dataType: 'json',
				xhrFields: {
					withCredentials: true
				}
			} )
			.done( function( data ) {
				$( '#jetpack-comic-drop-zone .uploading' ).text( Jetpack_Comics_Options.labels.processing );

				if ( 'url' in data ) {
					document.location.href = data.url;
				}
				else if ( 'error' in data ) {
					alert( data.error );

					$( 'body' ).removeClass( 'uploading' );
				}
			} )
			.fail( function ( /*req*/ ) {
				alert( Jetpack_Comics_Options.labels.error );
			} );
		}
	};

	Jetpack_Comics.init();
} );


} /* end modules/custom-post-types/comics/comics.js */

if ( jpconcat.files['modules/custom-post-types/js/many-items.js'] ) {

/* jshint onevar: false, smarttabs: true */

(function( $ ){
	var menuSelector, nonceInput, methods;

	methods = {
		init : function( /*options*/ ) {
			var $this = this, tbody, row;

			this
				.on( 'keypress.manyItemsTable', function( event ) {
					if ( 13 !== event.which ) {
						return;
					}

					event.preventDefault();
					if ( 'function' === typeof FormData ) {
						methods.submitRow.apply( $this );
					}
					methods.addRow.apply( $this );
				} )
				.on( 'focus.manyItemsTable', ':input', function( /*event*/ ) {
					$this.data( 'currentRow', $( this ).parents( 'tr:first' ) );
				} );

			tbody = this.find( 'tbody:last' );
			row = tbody.find( 'tr:first' ).clone();

			this.data( 'form', this.parents( 'form:first' ) );
			this.data( 'tbody', tbody );
			this.data( 'row', row );
			this.data( 'currentRow', row );

			menuSelector = $( '#nova-menu-tax' );
			nonceInput = $( '#_wpnonce' );

			return this;
		},

		destroy : function() {
			this.off( '.manyItemsTable' );

			return this;
		},

		submitRow : function() {
			var submittedRow, currentInputs, allInputs, partialFormData;

			submittedRow = this.data( 'currentRow' );
			currentInputs = submittedRow.find( ':input' );
			allInputs = this.data( 'form' ).find( ':input' ).not( currentInputs ).attr( 'disabled', true ).end();

			partialFormData = new FormData( this.data( 'form' ).get( 0 ) );
			partialFormData.append( 'ajax', '1' );
			partialFormData.append( 'nova_menu_tax', menuSelector.val() );
			partialFormData.append( '_wpnonce', nonceInput.val() );

			allInputs.attr( 'disabled', false );

			$.ajax( {
				url: '',
				type: 'POST',
				data: partialFormData,
				processData: false,
				contentType: false
			} ).complete( function( xhr ) {
				submittedRow.html( xhr.responseText );
			} );

			currentInputs.attr( 'disabled', true );

			return this;
		},

		addRow : function() {
			var row = this.data( 'row' ).clone();
			row.appendTo( this.data( 'tbody' ) );
			row.find( ':input:first' ).focus();

			return this;
		}
	};

	$.fn.manyItemsTable = function( method ) {
		// Method calling logic
		if ( methods[method] ) {
			return methods[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ) );
		} else if ( typeof method === 'object' || ! method ) {
			return methods.init.apply( this, arguments );
		} else {
			$.error( 'Method ' +  method + ' does not exist on jQuery.manyItemsTable' );
			return this;
		}
	};

	$.fn.clickAddRow = function() {
		var tbody = this.find( 'tbody:last' ),
			row = tbody.find( 'tr:first' ).clone();

		$( row ).find( 'input' ).attr( 'value', '' );
		$( row ).appendTo( tbody );
	};

})( jQuery );

jQuery( '.many-items-table' ).one( 'focus', ':input', function( event ) {
	jQuery( event.delegateTarget ).manyItemsTable();
} );
jQuery( '.many-items-table' ).on( 'click', 'a.nova-new-row', function( event ) {
	jQuery( event.delegateTarget ).clickAddRow();
} );



} /* end modules/custom-post-types/js/many-items.js */

if ( jpconcat.files['modules/custom-post-types/js/nova-drag-drop.js'] ) {

/* jshint onevar: false, smarttabs: true */
/* global _novaDragDrop */

(function($){
	var list;

	function init() {
		list = $('#the-list');
		dragMenus();
		addNonce();
		addSubmitButton();
	}

	function dragMenus() {
		list.sortable({
			cancel: '.no-items',
			stop: function( event, ui ) {
				if ( ui.item.is(':first-child') ) {
					return list.sortable('cancel');
				}
				//
				reOrder();
			}
		});
	}

	function reOrder() {
		list.find('.menu-label-row').each(function() {
			var term_id = $(this).data('term_id');
			$(this).nextUntil('.menu-label-row').each(function(i) {
				var row = $(this);
				row.find('.menu-order-value').val(i);
				row.find('.nova-menu-term').val(term_id);
			});
		});
	}

	function addSubmitButton() {
		$('.tablenav').prepend('<input type="submit" class="button-primary button-reorder alignright" value="' + _novaDragDrop.reorder + '" name="' + _novaDragDrop.reorderName + '" />');
	}

	function addNonce() {
		$('#posts-filter').append('<input type="hidden" name="' + _novaDragDrop.nonceName + '" value="' + _novaDragDrop.nonce + '" />');
	}

	// do it
	$(document).ready(init);
})(jQuery);



} /* end modules/custom-post-types/js/nova-drag-drop.js */

if ( jpconcat.files['modules/infinite-scroll/infinity.js'] ) {

(function($){ // Open closure

// Local vars
var Scroller, ajaxurl, stats, type, text, totop, timer;

// IE requires special handling
var isIE = ( -1 != navigator.userAgent.search( 'MSIE' ) );
if ( isIE ) {
	var IEVersion = navigator.userAgent.match(/MSIE\s?(\d+)\.?\d*;/);
	var IEVersion = parseInt( IEVersion[1] );
}

// HTTP ajaxurl when site is HTTPS causes Access-Control-Allow-Origin failure in Desktop and iOS Safari
if ( "https:" == document.location.protocol ) {
	infiniteScroll.settings.ajaxurl = infiniteScroll.settings.ajaxurl.replace( "http://", "https://" );
}

/**
 * Loads new posts when users scroll near the bottom of the page.
 */
Scroller = function( settings ) {
	var self = this;

	// Initialize our variables
	this.id               = settings.id;
	this.body             = $( document.body );
	this.window           = $( window );
	this.element          = $( '#' + settings.id );
	this.wrapperClass     = settings.wrapper_class;
	this.ready            = true;
	this.disabled         = false;
	this.page             = 1;
	this.offset           = settings.offset;
	this.currentday       = settings.currentday;
	this.order            = settings.order;
	this.throttle         = false;
	this.handle           = '<div id="infinite-handle"><span>' + text.replace( '\\', '' ) + '</span></div>';
	this.click_handle     = settings.click_handle;
	this.google_analytics = settings.google_analytics;
	this.history          = settings.history;
	this.origURL          = window.location.href;

	// Footer settings
	this.footer           = $( '#infinite-footer' );
	this.footer.wrap      = settings.footer;

	// Core's native MediaElement.js implementation needs special handling
	this.wpMediaelement   = null;

	// We have two type of infinite scroll
	// cases 'scroll' and 'click'

	if ( type == 'scroll' ) {
		// Bind refresh to the scroll event
		// Throttle to check for such case every 300ms

		// On event the case becomes a fact
		this.window.bind( 'scroll.infinity', function() {
			this.throttle = true;
		});

		// Go back top method
		self.gotop();

		setInterval( function() {
			if ( this.throttle ) {
				// Once the case is the case, the action occurs and the fact is no more
				this.throttle = false;
				// Reveal or hide footer
				self.thefooter();
				// Fire the refresh
				self.refresh();
			}
		}, 300 );

		// Ensure that enough posts are loaded to fill the initial viewport, to compensate for short posts and large displays.
		self.ensureFilledViewport();
		this.body.bind( 'post-load', { self: self }, self.checkViewportOnLoad );
	} else if ( type == 'click' ) {
		if ( this.click_handle ) {
			this.element.append( this.handle );
		}

		this.body.delegate( '#infinite-handle', 'click.infinity', function() {
			// Handle the handle
			if ( self.click_handle ) {
				$( '#infinite-handle' ).remove();
			}

			// Fire the refresh
			self.refresh();
		});
	}

	// Initialize any Core audio or video players loaded via IS
	this.body.bind( 'post-load', { self: self }, self.initializeMejs );
};

/**
 * Check whether we should fetch any additional posts.
 */
Scroller.prototype.check = function() {
	var container = this.element.offset();

	// If the container can't be found, stop otherwise errors result
	if ( 'object' !== typeof container ) {
		return false;
	}

	var bottom = this.window.scrollTop() + this.window.height(),
		threshold = container.top + this.element.outerHeight(false) - (this.window.height() * 2);

	return bottom > threshold;
};

/**
 * Renders the results from a successful response.
 */
Scroller.prototype.render = function( response ) {
	this.body.addClass( 'infinity-success' );

	// Check if we can wrap the html
	this.element.append( response.html );

	this.body.trigger( 'post-load', response );
	this.ready = true;
};

/**
 * Returns the object used to query for new posts.
 */
Scroller.prototype.query = function() {
	return {
		page           : this.page,
		currentday     : this.currentday,
		order          : this.order,
		scripts        : window.infiniteScroll.settings.scripts,
		styles         : window.infiniteScroll.settings.styles,
		query_args     : window.infiniteScroll.settings.query_args,
		last_post_date : window.infiniteScroll.settings.last_post_date,
	};
};

/**
 * Scroll back to top.
 */
Scroller.prototype.gotop = function() {
	var blog = $( '#infinity-blog-title' );

	blog.attr( 'title', totop );

	// Scroll to top on blog title
	blog.bind( 'click', function( e ) {
		$( 'html, body' ).animate( { scrollTop: 0 }, 'fast' );
		e.preventDefault();
	});
};


/**
 * The infinite footer.
 */
Scroller.prototype.thefooter = function() {
	var self  = this,
		width;

	// Check if we have an id for the page wrapper
	if ( $.type( this.footer.wrap ) === "string" ) {
		width = $( 'body #' + this.footer.wrap ).outerWidth( false );

		// Make the footer match the width of the page
		if ( width > 479 )
			this.footer.find( '.container' ).css( 'width', width );
	}

	// Reveal footer
	if ( this.window.scrollTop() >= 350 )
		self.footer.animate( { 'bottom': 0 }, 'fast' );
	else if ( this.window.scrollTop() < 350 )
		self.footer.animate( { 'bottom': '-50px' }, 'fast' );
};


/**
 * Controls the flow of the refresh. Don't mess.
 */
Scroller.prototype.refresh = function() {
	var	self   = this,
		query, jqxhr, load, loader, color;

	// If we're disabled, ready, or don't pass the check, bail.
	if ( this.disabled || ! this.ready || ! this.check() )
		return;

	// Let's get going -- set ready to false to prevent
	// multiple refreshes from occurring at once.
	this.ready = false;

	// Create a loader element to show it's working.
	if ( this.click_handle ) {
		loader = '<span class="infinite-loader"></span>';
		this.element.append( loader );

		loader = this.element.find( '.infinite-loader' );
		color = loader.css( 'color' );

		try {
			loader.spin( 'medium-left', color );
		} catch ( error ) { }
	}

	// Generate our query vars.
	query = $.extend({
		action: 'infinite_scroll'
	}, this.query() );

	// Fire the ajax request.
	jqxhr = $.post( infiniteScroll.settings.ajaxurl, query );

	// Allow refreshes to occur again if an error is triggered.
	jqxhr.fail( function() {
		if ( self.click_handle ) {
			loader.hide();
		}

		self.ready = true;
	});

	// Success handler
	jqxhr.done( function( response ) {
			// On success, let's hide the loader circle.
			if ( self.click_handle ) {
				loader.hide();
			}

			// Check for and parse our response.
			if ( ! response )
				return;

			response = $.parseJSON( response );

			if ( ! response || ! response.type )
				return;

			// If there are no remaining posts...
			if ( response.type == 'empty' ) {
				// Disable the scroller.
				self.disabled = true;
				// Update body classes, allowing the footer to return to static positioning
				self.body.addClass( 'infinity-end' ).removeClass( 'infinity-success' );

			// If we've succeeded...
			} else if ( response.type == 'success' ) {
				// If additional scripts are required by the incoming set of posts, parse them
				if ( response.scripts ) {
					$( response.scripts ).each( function() {
						var elementToAppendTo = this.footer ? 'body' : 'head';

						// Add script handle to list of those already parsed
						window.infiniteScroll.settings.scripts.push( this.handle );

						// Output extra data, if present
						if ( this.extra_data ) {
							var data = document.createElement('script'),
								dataContent = document.createTextNode( "//<![CDATA[ \n" + this.extra_data + "\n//]]>" );

							data.type = 'text/javascript';
							data.appendChild( dataContent );

							document.getElementsByTagName( elementToAppendTo )[0].appendChild(data);
						}

						// Build script tag and append to DOM in requested location
						var script = document.createElement('script');
						script.type = 'text/javascript';
						script.src = this.src;
						script.id = this.handle;

						// If MediaElement.js is loaded in by this set of posts, don't initialize the players a second time as it breaks them all
						if ( 'wp-mediaelement' === this.handle ) {
							self.body.unbind( 'post-load', self.initializeMejs );
						}

						if ( 'wp-mediaelement' === this.handle && 'undefined' === typeof mejs ) {
							self.wpMediaelement = {};
							self.wpMediaelement.tag = script;
							self.wpMediaelement.element = elementToAppendTo;
							setTimeout( self.maybeLoadMejs.bind( self ), 250 );
						} else {
							document.getElementsByTagName( elementToAppendTo )[0].appendChild(script);
						}
					} );
				}

				// If additional stylesheets are required by the incoming set of posts, parse them
				if ( response.styles ) {
					$( response.styles ).each( function() {
						// Add stylesheet handle to list of those already parsed
						window.infiniteScroll.settings.styles.push( this.handle );

						// Build link tag
						var style = document.createElement('link');
						style.rel = 'stylesheet';
						style.href = this.src;
						style.id = this.handle + '-css';

						// Destroy link tag if a conditional statement is present and either the browser isn't IE, or the conditional doesn't evaluate true
						if ( this.conditional && ( ! isIE || ! eval( this.conditional.replace( /%ver/g, IEVersion ) ) ) )
							var style = false;

						// Append link tag if necessary
						if ( style )
							document.getElementsByTagName('head')[0].appendChild(style);
					} );
				}

				// Increment the page number
				self.page++;

				// Record pageview in WP Stats, if available.
				if ( stats )
					new Image().src = document.location.protocol + '//pixel.wp.com/g.gif?' + stats + '&post=0&baba=' + Math.random();

				// Add new posts to the postflair object
				if ( 'object' == typeof response.postflair && 'object' == typeof WPCOM_sharing_counts )
					WPCOM_sharing_counts = $.extend( WPCOM_sharing_counts, response.postflair );

				// Render the results
				self.render.apply( self, arguments );

				// If 'click' type and there are still posts to fetch, add back the handle
				if ( type == 'click' ) {
					if ( response.lastbatch ) {
						if ( self.click_handle ) {
							$( '#infinite-handle' ).remove();
						} else {
							self.body.trigger( 'infinite-scroll-posts-end' );
						}
					} else {
						if ( self.click_handle ) {
							self.element.append( self.handle );
						} else {
							self.body.trigger( 'infinite-scroll-posts-more' );
						}
					}
				}

				// Update currentday to the latest value returned from the server
				if ( response.currentday ) {
					self.currentday = response.currentday;
				}

				// Fire Google Analytics pageview
				if ( self.google_analytics ) {
					var ga_url = self.history.path.replace( /%d/, self.page );
					if ( 'object' === typeof _gaq ) {
						_gaq.push( [ '_trackPageview', ga_url ] );
					}
					if ( 'function' === typeof ga ) {
						ga( 'send', 'pageview', ga_url );
					}
				}
			}
		});

	return jqxhr;
};

/**
 * Core's native media player uses MediaElement.js
 * The library's size is sufficient that it may not be loaded in time for Core's helper to invoke it, so we need to delay until `mejs` exists.
 */
Scroller.prototype.maybeLoadMejs = function() {
	if ( null === this.wpMediaelement ) {
		return;
	}

	if ( 'undefined' === typeof mejs ) {
		setTimeout( this.maybeLoadMejs, 250 );
	} else {
		document.getElementsByTagName( this.wpMediaelement.element )[0].appendChild( this.wpMediaelement.tag );
		this.wpMediaelement = null;

		// Ensure any subsequent IS loads initialize the players
		this.body.bind( 'post-load', { self: this }, this.initializeMejs );
	}
}

/**
 * Initialize the MediaElement.js player for any posts not previously initialized
 */
Scroller.prototype.initializeMejs = function( ev, response ) {
	// Are there media players in the incoming set of posts?
	if ( -1 === response.html.indexOf( 'wp-audio-shortcode' ) && -1 === response.html.indexOf( 'wp-video-shortcode' ) ) {
		return;
	}

	// Don't bother if mejs isn't loaded for some reason
	if ( 'undefined' === typeof mejs ) {
		return;
	}

	// Adapted from wp-includes/js/mediaelement/wp-mediaelement.js
	// Modified to not initialize already-initialized players, as Mejs doesn't handle that well
	$(function () {
		var settings = {};

		if ( typeof _wpmejsSettings !== 'undefined' ) {
			settings.pluginPath = _wpmejsSettings.pluginPath;
		}

		settings.success = function (mejs) {
			var autoplay = mejs.attributes.autoplay && 'false' !== mejs.attributes.autoplay;
			if ( 'flash' === mejs.pluginType && autoplay ) {
				mejs.addEventListener( 'canplay', function () {
					mejs.play();
				}, false );
			}
		};

		$('.wp-audio-shortcode, .wp-video-shortcode').not( '.mejs-container' ).mediaelementplayer( settings );
	});
}

/**
 * Trigger IS to load additional posts if the initial posts don't fill the window.
 * On large displays, or when posts are very short, the viewport may not be filled with posts, so we overcome this by loading additional posts when IS initializes.
 */
Scroller.prototype.ensureFilledViewport = function() {
	var	self = this,
	   	windowHeight = self.window.height(),
	   	postsHeight = self.element.height()
	   	aveSetHeight = 0,
	   	wrapperQty = 0;

	// Account for situations where postsHeight is 0 because child list elements are floated
	if ( postsHeight === 0 ) {
		$( self.element.selector + ' > li' ).each( function() {
			postsHeight += $( this ).height();
		} );

		if ( postsHeight === 0 ) {
			self.body.unbind( 'post-load', self.checkViewportOnLoad );
			return;
		}
	}

	// Calculate average height of a set of posts to prevent more posts than needed from being loaded.
	$( '.' + self.wrapperClass ).each( function() {
		aveSetHeight += $( this ).height();
		wrapperQty++;
	} );

	if ( wrapperQty > 0 )
		aveSetHeight = aveSetHeight / wrapperQty;
	else
		aveSetHeight = 0;

	// Load more posts if space permits, otherwise stop checking for a full viewport
	if ( postsHeight < windowHeight && ( postsHeight + aveSetHeight < windowHeight ) ) {
		self.ready = true;
		self.refresh();
	}
	else {
		self.body.unbind( 'post-load', self.checkViewportOnLoad );
	}
}

/**
 * Event handler for ensureFilledViewport(), tied to the post-load trigger.
 * Necessary to ensure that the variable `this` contains the scroller when used in ensureFilledViewport(). Since this function is tied to an event, `this` becomes the DOM element the event is tied to.
 */
Scroller.prototype.checkViewportOnLoad = function( ev ) {
	ev.data.self.ensureFilledViewport();
}

/**
 * Identify archive page that corresponds to majority of posts shown in the current browser window.
 */
Scroller.prototype.determineURL = function () {
	var self         = window.infiniteScroll.scroller,
		windowTop    = $( window ).scrollTop(),
		windowBottom = windowTop + $( window ).height(),
		windowSize   = windowBottom - windowTop,
		setsInView   = [],
		pageNum      = false;

	// Find out which sets are in view
	$( '.' + self.wrapperClass ).each( function() {
		var id         = $( this ).attr( 'id' ),
			setTop     = $( this ).offset().top,
			setHeight  = $( this ).outerHeight( false ),
			setBottom  = 0,
			setPageNum = $( this ).data( 'page-num' );

		// Account for containers that have no height because their children are floated elements.
		if ( 0 == setHeight ) {
			$( '> *', this ).each( function() {
				setHeight += $( this ).outerHeight( false );
			} );
		}

		// Determine position of bottom of set by adding its height to the scroll position of its top.
		setBottom = setTop + setHeight;

		// Populate setsInView object. While this logic could all be combined into a single conditional statement, this is easier to understand.
		if ( setTop < windowTop && setBottom > windowBottom ) { // top of set is above window, bottom is below
			setsInView.push({'id': id, 'top': setTop, 'bottom': setBottom, 'pageNum': setPageNum });
		}
		else if( setTop > windowTop && setTop < windowBottom ) { // top of set is between top (gt) and bottom (lt)
			setsInView.push({'id': id, 'top': setTop, 'bottom': setBottom, 'pageNum': setPageNum });
		}
		else if( setBottom > windowTop && setBottom < windowBottom ) { // bottom of set is between top (gt) and bottom (lt)
			setsInView.push({'id': id, 'top': setTop, 'bottom': setBottom, 'pageNum': setPageNum });
		}
	} );

	// Parse number of sets found in view in an attempt to update the URL to match the set that comprises the majority of the window.
	if ( 0 == setsInView.length ) {
		pageNum = -1;
	}
	else if ( 1 == setsInView.length ) {
		var setData = setsInView.pop();

		// If the first set of IS posts is in the same view as the posts loaded in the template by WordPress, determine how much of the view is comprised of IS-loaded posts
		if ( ( ( windowBottom - setData.top ) / windowSize ) < 0.5 )
			pageNum = -1;
		else
			pageNum = setData.pageNum;
	}
	else {
		var majorityPercentageInView = 0;

		// Identify the IS set that comprises the majority of the current window and set the URL to it.
		$.each( setsInView, function( i, setData ) {
			var topInView     = 0,
				bottomInView  = 0,
				percentOfView = 0;

			// Figure percentage of view the current set represents
			if ( setData.top > windowTop && setData.top < windowBottom )
				topInView = ( windowBottom - setData.top ) / windowSize;

			if ( setData.bottom > windowTop && setData.bottom < windowBottom )
				bottomInView = ( setData.bottom - windowTop ) / windowSize;

			// Figure out largest percentage of view for current set
			if ( topInView >= bottomInView )
				percentOfView = topInView;
			else if ( bottomInView >= topInView )
				percentOfView = bottomInView;

			// Does current set's percentage of view supplant the largest previously-found set?
			if ( percentOfView > majorityPercentageInView ) {
				pageNum = setData.pageNum;
				majorityPercentageInView = percentOfView;
			}
		} );
	}

	// If a page number could be determined, update the URL
	// -1 indicates that the original requested URL should be used.
	if ( 'number' == typeof pageNum ) {
		if ( pageNum != -1 )
			pageNum++;

		self.updateURL( pageNum );
	}
}

/**
 * Update address bar to reflect archive page URL for a given page number.
 * Checks if URL is different to prevent pollution of browser history.
 */
Scroller.prototype.updateURL = function( page ) {
	var self = this,
		offset = self.offset > 0 ? self.offset - 1 : 0,
		pageSlug = -1 == page ? self.origURL : window.location.protocol + '//' + self.history.host + self.history.path.replace( /%d/, page + offset ) + self.history.parameters;

	if ( window.location.href != pageSlug ) {
		history.pushState( null, null, pageSlug );
	}
}

/**
 * Ready, set, go!
 */
$( document ).ready( function() {
	// Check for our variables
	if ( 'object' != typeof infiniteScroll )
		return;

	// Set ajaxurl (for brevity)
	ajaxurl = infiniteScroll.settings.ajaxurl;

	// Set stats, used for tracking stats
	stats = infiniteScroll.settings.stats;

	// Define what type of infinity we have, grab text for click-handle
	type  = infiniteScroll.settings.type;
	text  = infiniteScroll.settings.text;
	totop = infiniteScroll.settings.totop;

	// Initialize the scroller (with the ID of the element from the theme)
	infiniteScroll.scroller = new Scroller( infiniteScroll.settings );

	/**
	 * Monitor user scroll activity to update URL to correspond to archive page for current set of IS posts
	 * IE only supports pushState() in v10 and above, so don't bother if those conditions aren't met.
	 */
	if ( ! isIE || ( isIE && IEVersion >= 10 ) ) {
		$( window ).bind( 'scroll', function() {
			clearTimeout( timer );
			timer = setTimeout( infiniteScroll.scroller.determineURL , 100 );
		});
	}
});


})(jQuery); // Close closure


} /* end modules/infinite-scroll/infinity.js */

if ( jpconcat.files['modules/likes/post-count-jetpack.js'] ) {

var wpPostLikeCount = wpPostLikeCount || {};

(function($) {

	wpPostLikeCount = jQuery.extend( wpPostLikeCount, {
		request: function( options ) {
			return $.ajax( {
				type: 'GET',
				url: wpPostLikeCount.jsonAPIbase + options.path,
				dataType : 'jsonp',
				data: options.data,
				success: function( response ) { options.success( response ); },
				error: function( response ) { options.error( response ); }
			} );
		}
	} );

})(jQuery);


} /* end modules/likes/post-count-jetpack.js */

if ( jpconcat.files['modules/likes/post-count.js'] ) {

/* jshint onevar: false, smarttabs: true */

var wpPostLikeCount = wpPostLikeCount || {};

(function($) {

	wpPostLikeCount = jQuery.extend( wpPostLikeCount, {

		jsonAPIbase: 'https://public-api.wordpress.com/rest/v1',
		APIqueue:    [],

		wpPostLikeCount: function() {
			$( '.post-like-count' ).each( function() {
				var post_id = $(this).attr( 'data-post-id' );
				var blog_id = $(this).attr( 'data-blog-id' );
				wpPostLikeCount.APIqueue.push( '/sites/' + blog_id + '/posts/' + post_id + '/likes' );
			} );
			wpPostLikeCount.getCounts();
		},

		showCount: function( post_id, count ) {
			$( '#post-like-count-' + post_id ).find( '.comment-count' ).hide();
			$( '#post-like-count-' + post_id ).find( '.comment-count' ).text( count );
			$( '#post-like-count-' + post_id ).find( '.comment-count' ).fadeIn();
		},

		getCounts: function() {
			var batchRequest = {
				path:    '/batch',
				data:    '',
				success: function( response ) {
					for ( var path in response ) {
						if ( ! response[path].error_data ) {
							var urlPieces = path.split( '/' ); // pieces[4] = post id;
							var post_id = urlPieces[4];
							wpPostLikeCount.showCount( post_id, response[path].found );
						}
					}
				},
				error: function( /*response*/ ) {
				}
			};

			var amp = '';
			for( var i = 0; i < wpPostLikeCount.APIqueue.length; i++ ) {
				if ( i > 0 ) {
					amp = '&';
				}
				batchRequest.data += amp + 'urls[]=' + wpPostLikeCount.APIqueue[i];
			}

			wpPostLikeCount.request( batchRequest );
		}
	} );

})(jQuery);

jQuery(document).ready(function(/*$*/) {
	wpPostLikeCount.wpPostLikeCount();
});


} /* end modules/likes/post-count.js */

if ( jpconcat.files['modules/photon/photon.js'] ) {

/* jshint onevar: false */

(function($){
	/**
	 * For images lacking explicit dimensions and needing them, try to add them.
	 */
	var restore_dims = function() {
		$( 'img[data-recalc-dims]' ).each( function recalc() {
			var $this = $( this );
			if ( this.complete ) {

				// Support for lazy loading: if there is a lazy-src
				// attribute and it's value is not the same as the current src we
				// should wait until the image load event
				if ( $this.data( 'lazy-src' ) && $this.attr( 'src' ) !== $this.data( 'lazy-src' ) ) {
					$this.load( recalc );
					return;
				}

				var width = this.width,
					height = this.height;

				if ( width && width > 0 && height && height > 0 ) {
					$this.attr( {
						width: width,
						height: height
					} );

					reset_for_retina( this );
				}
			}
			else {
				$this.load( recalc );
			}
		} );
	},

	/**
	 * Modify given image's markup so that devicepx-jetpack.js will act on the image and it won't be reprocessed by this script.
	 */
	reset_for_retina = function( img ) {
		$( img ).removeAttr( 'data-recalc-dims' ).removeAttr( 'scale' );
	};

	/**
	 * Check both when page loads, and when IS is triggered.
	 */
	$( document ).ready( restore_dims );

	if ( 'on' in $.fn ) {
		$( document.body ).on( 'post-load', restore_dims );
	} else {
		$( document ).delegate( 'body', 'post-load', restore_dims );
	}
})(jQuery);


} /* end modules/photon/photon.js */

if ( jpconcat.files['modules/related-posts/related-posts.js'] ) {

/* jshint onevar: false */

/**
 * Load related posts
 */
(function($) {
	var jprp = {
		response: null,

		/**
		 * Utility get related posts JSON endpoint from URLs
		 *
		 * @param string URL (optional)
		 * @return string endpoint URL
		 */
		getEndpointURL: function( URL ) {
			var locationObject = document.location;

			if ( 'string' === typeof( URL ) && URL.match( /^https?:\/\// ) ) {
				locationObject = document.createElement( 'a' );
				locationObject.href = URL;
			}

			var args = 'relatedposts=1';
			if ( ! $( '#jp-relatedposts' ).data( 'exclude' ) ) {
				args += '&relatedposts_exclude=' + $( '#jp-relatedposts' ).data( 'exclude' );
			}

			if ( '' === locationObject.search ) {
				return locationObject.pathname + '?' + args;
			} else {
				return locationObject.pathname + locationObject.search + '&' + args;
			}
		},

		getAnchor: function( post ) {
			var anchor_title = post.title;
			if ( '' !== ( '' + post.excerpt ) ) {
				anchor_title += '\n\n' + post.excerpt;
			}

			var anchor = $( '<a>' );

			anchor.attr({
				'class': 'jp-relatedposts-post-a',
				'href': post.url,
				'title': anchor_title,
				'rel': 'nofollow',
				'data-origin': post.url_meta.origin,
				'data-position': post.url_meta.position
			});

			var anchor_html = $( '<div>' ).append( anchor ).html();
			return [
				anchor_html.substring( 0, anchor_html.length-4 ),
				'</a>'
			];
		},

		generateMinimalHtml: function( posts ) {
			var self = this;
			var html = '';

			$.each( posts, function( index, post ) {
				var anchor = self.getAnchor( post );
				var classes = 'jp-relatedposts-post jp-relatedposts-post' + index;

				html += '<p class="' + classes + '" data-post-id="' + post.id + '" data-post-format="' + post.format + '">';
				html += '<span class="jp-relatedposts-post-title">' + anchor[0] + post.title + anchor[1] + '</span>';
				html += '<span class="jp-relatedposts-post-context">' + post.context + '</span>';
				html += '</p>';
			} );
			return '<div class="jp-relatedposts-items jp-relatedposts-items-minimal">' + html + '</div>';
		},

		generateVisualHtml: function( posts ) {
			var self = this;
			var html = '';

			$.each( posts, function( index, post ) {
				var anchor = self.getAnchor( post );
				var classes = 'jp-relatedposts-post jp-relatedposts-post' + index;
				if ( ! post.img.src ) {
					classes += ' jp-relatedposts-post-nothumbs';
				} else {
					classes += ' jp-relatedposts-post-thumbs';
				}

				html += '<div class="' + classes + '" data-post-id="' + post.id + '" data-post-format="' + post.format + '">';
				if ( post.img.src ) {
					html += anchor[0] + '<img class="jp-relatedposts-post-img" src="' + post.img.src + '" width="' + post.img.width + '" alt="' + post.title + '" />' + anchor[1];
				}
				html += '<h4 class="jp-relatedposts-post-title">' + anchor[0] + post.title + anchor[1] + '</h4>';
				html += '<p class="jp-relatedposts-post-excerpt">' + post.excerpt + '</p>';
				html += '<p class="jp-relatedposts-post-context">' + post.context + '</p>';
				html += '</div>';
			} );
			return '<div class="jp-relatedposts-items jp-relatedposts-items-visual">' + html + '</div>';
		},

		getTrackedUrl: function( anchor ) {
			var args = 'relatedposts_hit=1';
			args += '&relatedposts_origin=' + $( anchor ).data( 'origin' );
			args += '&relatedposts_position=' + $( anchor ).data( 'position' );

			if ( '' === anchor.search ) {
				return anchor.pathname + '?' + args;
			} else {
				return anchor.pathname + anchor.search + '&' + args;
			}
		},

		cleanupTrackedUrl: function() {
			if ( 'function' !== typeof history.replaceState ) {
				return;
			}

			var cleaned_search = document.location.search.replace( /\brelatedposts_[a-z]+=[0-9]*&?\b/gi, '' );
			if ( '?' === cleaned_search ) {
				cleaned_search = '';
			}
			if ( document.location.search !== cleaned_search ) {
				history.replaceState( {}, document.title, document.location.pathname + cleaned_search );
			}
		}
	};

	$( function() {
		jprp.cleanupTrackedUrl();

		$.getJSON( jprp.getEndpointURL(), function( response ) {
			if ( 0 === response.items.length || 0 === $( '#jp-relatedposts' ).length ) {
				return;
			}

			jprp.response = response;

			var html = '';
			if ( !response.show_thumbnails ) {
				html = jprp.generateMinimalHtml( response.items );
			} else {
				html = jprp.generateVisualHtml( response.items );
			}

			$( '#jp-relatedposts' ).append( html ).show();

			$( '#jp-relatedposts a.jp-relatedposts-post-a' ).click(function() {
				this.href = jprp.getTrackedUrl( this );
			});
		} );
	} );
})(jQuery);


} /* end modules/related-posts/related-posts.js */

if ( jpconcat.files['modules/sharedaddy/sharing.js'] ) {

var WPCOMSharing = {
	done_urls : [],
	get_counts : function( url ) {
		if ( 'undefined' != typeof WPCOMSharing.done_urls[ WPCOM_sharing_counts[ url ] ] )
			return;

		if ( jQuery( '#sharing-facebook-' + WPCOM_sharing_counts[ url ] ).length )
			jQuery.getScript( 'https://api.facebook.com/method/fql.query?query=' + encodeURIComponent( "SELECT total_count, url FROM link_stat WHERE url='" + url + "'" ) + '&format=json&callback=WPCOMSharing.update_facebook_count' );
		if ( jQuery( '#sharing-twitter-' + WPCOM_sharing_counts[ url ] ).length )
			jQuery.getScript( window.location.protocol + '//cdn.api.twitter.com/1/urls/count.json?callback=WPCOMSharing.update_twitter_count&url=' + encodeURIComponent( url ) );
		if ( jQuery( '#sharing-linkedin-' + WPCOM_sharing_counts[ url ] ).length )
			jQuery.getScript( window.location.protocol + '//www.linkedin.com/countserv/count/share?format=jsonp&callback=WPCOMSharing.update_linkedin_count&url=' + encodeURIComponent( url ) );

		WPCOMSharing.done_urls[ WPCOM_sharing_counts[ url ] ] = true;
	},
	update_facebook_count : function( data ) {
		if ( 'undefined' != typeof data[0].total_count && ( data[0].total_count * 1 ) > 0 ) {
			WPCOMSharing.inject_share_count( 'sharing-facebook-' + WPCOM_sharing_counts[ data[0].url ], data[0].total_count );
		}
	},
	update_twitter_count : function( data ) {
		if ( 'undefined' != typeof data.count && ( data.count * 1 ) > 0 ) {
			if ( 'undefined' == typeof WPCOM_sharing_counts[ data.url ] )
				data.url = data.url.replace(/\/$/, "");
			WPCOMSharing.inject_share_count( 'sharing-twitter-' + WPCOM_sharing_counts[ data.url ], data.count );
		}
	},
	update_linkedin_count : function( data ) {
		if ( 'undefined' != typeof data.count && ( data.count * 1 ) > 0 ) {
			WPCOMSharing.inject_share_count( 'sharing-linkedin-' + WPCOM_sharing_counts[ data.url ], data.count );
		}
	},
	inject_share_count : function( dom_id, count ) {
		jQuery( '#' + dom_id + ' span' ).append( '<span class="share-count">' + WPCOMSharing.format_count( count ) + '</span>' );
	},
	format_count : function( count ) {
		if ( count < 1000 )
			return count;
		if ( count >= 1000 && count < 10000 )
			return String( count ).substring( 0, 1 ) + 'K+';
		return '10K+';
	}
};

(function($){
	$.fn.extend( {
		share_is_email: function( value ) {
			return /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?$/i.test( this.val() );
		}
	} );

	$( document ).on( 'ready', WPCOMSharing_do );
	$( document.body ).on( 'post-load', WPCOMSharing_do );

	function WPCOMSharing_do() {
		if ( 'undefined' != typeof WPCOM_sharing_counts ) {
			for ( var url in WPCOM_sharing_counts ) {
				WPCOMSharing.get_counts( url );
			}
		}
		var $more_sharing_buttons = $( '.sharedaddy a.sharing-anchor' );

		$more_sharing_buttons.click( function() {
			return false;
		} );

		$( '.sharedaddy a' ).each( function() {
			if ( $( this ).attr( 'href' ) && $( this ).attr( 'href' ).indexOf( 'share=' ) != -1 )
				$( this ).attr( 'href', $( this ).attr( 'href' ) + '&nb=1' );
		} );

		// Show hidden buttons

		// Touchscreen device: use click.
		// Non-touchscreen device: use click if not already appearing due to a hover event
		$more_sharing_buttons.on( 'click', function() {
			var $more_sharing_button = $( this ),
			    $more_sharing_pane = $more_sharing_button.parents( 'div:first' ).find( '.inner' );

			if ( $more_sharing_pane.is( ':animated' ) ) {
				// We're in the middle of some other event's animation
				return;
			}

			if ( true === $more_sharing_pane.data( 'justSlid' ) ) {
				// We just finished some other event's animation - don't process click event so that slow-to-react-clickers don't get confused
				return;
			}

			$( '#sharing_email' ).slideUp( 200 );

			$more_sharing_pane.css( {
				left: $more_sharing_button.position().left + 'px',
				top: $more_sharing_button.position().top + $more_sharing_button.height() + 3 + 'px'
			} ).slideToggle( 200 );
		} );

		if ( document.ontouchstart === undefined ) {
			// Non-touchscreen device: use hover/mouseout with delay
			$more_sharing_buttons.hover( function() {
				var $more_sharing_button = $( this ),
				    $more_sharing_pane = $more_sharing_button.parents( 'div:first' ).find( '.inner' );

				if ( !$more_sharing_pane.is( ':animated' ) ) {
					// Create a timer to make the area appear if the mouse hovers for a period
					var timer = setTimeout( function() {
						$( '#sharing_email' ).slideUp( 200 );

						$more_sharing_pane.data( 'justSlid', true );
						$more_sharing_pane.css( {
							left: $more_sharing_button.position().left + 'px',
							top: $more_sharing_button.position().top + $more_sharing_button.height() + 3 + 'px'
						} ).slideDown( 200, function() {
							// Mark the item as have being appeared by the hover
							$more_sharing_button.data( 'hasoriginal', true ).data( 'hasitem', false );

							setTimeout( function() {
								$more_sharing_pane.data( 'justSlid', false );
							}, 300 );

							if ( $more_sharing_pane.find( '.share-google-plus-1' ).size() ) {
								// The pane needs to stay open for the Google+ Button
								return;
							}

							$more_sharing_pane.mouseleave( handler_item_leave ).mouseenter( handler_item_enter );
							$more_sharing_button.mouseleave( handler_original_leave ).mouseenter( handler_original_enter );
						} );

						// The following handlers take care of the mouseenter/mouseleave for the share button and the share area - if both are left then we close the share area
						var handler_item_leave = function() {
							$more_sharing_button.data( 'hasitem', false );

							if ( $more_sharing_button.data( 'hasoriginal' ) === false ) {
								var timer = setTimeout( close_it, 800 );
								$more_sharing_button.data( 'timer2', timer );
							}
						};

						var handler_item_enter = function() {
							$more_sharing_button.data( 'hasitem', true );
							clearTimeout( $more_sharing_button.data( 'timer2' ) );
						}

						var handler_original_leave = function() {
							$more_sharing_button.data( 'hasoriginal', false );

							if ( $more_sharing_button.data( 'hasitem' ) === false ) {
								var timer = setTimeout( close_it, 800 );
								$more_sharing_button.data( 'timer2', timer );
							}
						};

						var handler_original_enter = function() {
							$more_sharing_button.data( 'hasoriginal', true );
							clearTimeout( $more_sharing_button.data( 'timer2' ) );
						};

						var close_it = function() {
							$more_sharing_pane.data( 'justSlid', true );
							$more_sharing_pane.slideUp( 200, function() {
								setTimeout( function() {
									$more_sharing_pane.data( 'justSlid', false );
								}, 300 );
							} );

							// Clear all hooks
							$more_sharing_button.unbind( 'mouseleave', handler_original_leave ).unbind( 'mouseenter', handler_original_enter );
							$more_sharing_pane.unbind( 'mouseleave', handler_item_leave ).unbind( 'mouseenter', handler_item_leave );
							return false;
						};
					}, 200 );

					// Remember the timer so we can detect it on the mouseout
					$more_sharing_button.data( 'timer', timer );
				}
			}, function() {
				// Mouse out - remove any timer
				$more_sharing_buttons.each( function() {
					clearTimeout( $( this ).data( 'timer' ) );
				} );
				$more_sharing_buttons.data( 'timer', false );
			} );
		}

		$( document ).click(function() {
		
			// Click outside 
			// remove any timer
			$more_sharing_buttons.each( function() {
				clearTimeout( $( this ).data( 'timer' ) );
			} );
			$more_sharing_buttons.data( 'timer', false );
			
			// slide down forcibly
			$( '.sharedaddy .inner' ).slideUp();
			
		});
		
		// Add click functionality
		$( '.sharedaddy ul' ).each( function( item ) {

			if ( 'yep' == $( this ).data( 'has-click-events' ) )
				return;
			$( this ).data( 'has-click-events', 'yep' );

			printUrl = function ( uniqueId, urlToPrint ) {
				$( 'body:first' ).append( '<iframe style="position:fixed;top:100;left:100;height:1px;width:1px;border:none;" id="printFrame-' + uniqueId + '" name="printFrame-' + uniqueId + '" src="' + urlToPrint + '" onload="frames[\'printFrame-' + uniqueId + '\'].focus();frames[\'printFrame-' + uniqueId + '\'].print();"></iframe>' )
			};

			// Print button
			$( this ).find( 'a.share-print' ).click( function() {
				ref = $( this ).attr( 'href' );

				var do_print = function() {
					if ( ref.indexOf( '#print' ) == -1 ) {
						uid = new Date().getTime();
						printUrl( uid , ref );
					}
					else
						print();
				}

				// Is the button in a dropdown?
				if ( $( this ).parents( '.sharing-hidden' ).length > 0 ) {
					$( this ).parents( '.inner' ).slideUp( 0, function() {
						do_print();
					} );
				}
				else
					do_print();

				return false;
			} );

			// Press This button
			$( this ).find( 'a.share-press-this' ).click( function() {
			 	var s = '';

			  if ( window.getSelection )
			    s = window.getSelection();
			  else if( document.getSelection )
			    s = document.getSelection();
			  else if( document.selection )
			    s = document.selection.createRange().text;

				if ( s )
					$( this ).attr( 'href', $( this ).attr( 'href' ) + '&sel=' + encodeURI( s ) );

				if ( !window.open( $( this ).attr( 'href' ), 't', 'toolbar=0,resizable=1,scrollbars=1,status=1,width=720,height=570' ) )
					document.location.href = $( this ).attr( 'href' );

				return false;
			} );

			// Email button
			$( 'a.share-email', this ).on( 'click', function() {
				var url = $( this ).attr( 'href' ), key;

				if ( $( '#sharing_email' ).is( ':visible' ) )
					$( '#sharing_email' ).slideUp( 200 );
				else {
					$( '.sharedaddy .inner' ).slideUp();

					$( '#sharing_email .response' ).remove();
					$( '#sharing_email form' ).show();
					$( '#sharing_email form input[type=submit]' ).removeAttr( 'disabled' );
					$( '#sharing_email form a.sharing_cancel' ).show();

					key = '';
					if ( $( '#recaptcha_public_key' ).length > 0 )
						key = $( '#recaptcha_public_key' ).val();

					// Update the recaptcha
					Recaptcha.create( key, 'sharing_recaptcha', { lang : recaptcha_options.lang } );

					// Show dialog
					$( '#sharing_email' ).css( {
						left: $( this ).offset().left + 'px',
						top: $( this ).offset().top + $( this ).height() + 'px'
					} ).slideDown( 200 );

					// Hook up other buttons
					$( '#sharing_email a.sharing_cancel' ).unbind( 'click' ).click( function() {
						$( '#sharing_email .errors' ).hide();
						$( '#sharing_email' ).slideUp( 200 );
						$( '#sharing_background' ).fadeOut();
						return false;
					} );

					// Submit validation
					$( '#sharing_email input[type=submit]' ).unbind( 'click' ).click( function() {
						var form = $( this ).parents( 'form' );

						// Disable buttons + enable loading icon
						$( this ).prop( 'disabled', true );
						form.find( 'a.sharing_cancel' ).hide();
						form.find( 'img.loading' ).show();

						$( '#sharing_email .errors' ).hide();
						$( '#sharing_email .error' ).removeClass( 'error' );

						if ( $( '#sharing_email input[name=source_email]' ).share_is_email() == false )
							$( '#sharing_email input[name=source_email]' ).addClass( 'error' );

						if ( $( '#sharing_email input[name=target_email]' ).share_is_email() == false )
							$( '#sharing_email input[name=target_email]' ).addClass( 'error' );

						if ( $( '#sharing_email .error' ).length == 0 ) {
							// AJAX send the form
							$.ajax( {
								url: url,
								type: 'POST',
								data: form.serialize(),
								success: function( response ) {
									form.find( 'img.loading' ).hide();

									if ( response == '1' || response == '2' || response == '3' ) {
										$( '#sharing_email .errors-' + response ).show();
										form.find( 'input[type=submit]' ).removeAttr( 'disabled' );
										form.find( 'a.sharing_cancel' ).show();
										Recaptcha.reload();
									}
									else {
										$( '#sharing_email form' ).hide();
										$( '#sharing_email' ).append( response );
										$( '#sharing_email a.sharing_cancel' ).click( function() {
											$( '#sharing_email' ).slideUp( 200 );
											$( '#sharing_background' ).fadeOut();
											return false;
										} );
									}
								}
							} );

							return false;
						}

						form.find( 'img.loading' ).hide();
						form.find( 'input[type=submit]' ).removeAttr( 'disabled' );
						form.find( 'a.sharing_cancel' ).show();
						$( '#sharing_email .errors-1' ).show();

						return false;
					} );
				}

				return false;
			} );
		} );

		$( 'li.share-email, li.share-custom a.sharing-anchor' ).addClass( 'share-service-visible' );
	}
})( jQuery );

// Recaptcha code
var RecaptchaTemplates={};RecaptchaTemplates.VertHtml='<table id="recaptcha_table" class="recaptchatable" > <tr> <td colspan="6" class=\'recaptcha_r1_c1\'></td> </tr> <tr> <td class=\'recaptcha_r2_c1\'></td> <td colspan="4" class=\'recaptcha_image_cell\'><div id="recaptcha_image"></div></td> <td class=\'recaptcha_r2_c2\'></td> </tr> <tr> <td rowspan="6" class=\'recaptcha_r3_c1\'></td> <td colspan="4" class=\'recaptcha_r3_c2\'></td> <td rowspan="6" class=\'recaptcha_r3_c3\'></td> </tr> <tr> <td rowspan="3" class=\'recaptcha_r4_c1\' height="49"> <div class="recaptcha_input_area"> <label for="recaptcha_response_field" class="recaptcha_input_area_text"><span id="recaptcha_instructions_image" class="recaptcha_only_if_image recaptcha_only_if_no_incorrect_sol"></span><span id="recaptcha_instructions_audio" class="recaptcha_only_if_no_incorrect_sol recaptcha_only_if_audio"></span><span id="recaptcha_instructions_error" class="recaptcha_only_if_incorrect_sol"></span></label><br/> <input name="recaptcha_response_field" id="recaptcha_response_field" type="text" /> </div> </td> <td rowspan="4" class=\'recaptcha_r4_c2\'></td> <td><a id=\'recaptcha_reload_btn\'><img id=\'recaptcha_reload\' width="25" height="17" /></a></td> <td rowspan="4" class=\'recaptcha_r4_c4\'></td> </tr> <tr> <td><a id=\'recaptcha_switch_audio_btn\' class="recaptcha_only_if_image"><img id=\'recaptcha_switch_audio\' width="25" height="16" alt="" /></a><a id=\'recaptcha_switch_img_btn\' class="recaptcha_only_if_audio"><img id=\'recaptcha_switch_img\' width="25" height="16" alt=""/></a></td> </tr> <tr> <td><a id=\'recaptcha_whatsthis_btn\'><img id=\'recaptcha_whatsthis\' width="25" height="16" /></a></td> </tr> <tr> <td class=\'recaptcha_r7_c1\'></td> <td class=\'recaptcha_r8_c1\'></td> </tr> </table> ';RecaptchaTemplates.CleanCss=".recaptchatable td img{display:block}.recaptchatable .recaptcha_image_cell center img{height:57px}.recaptchatable .recaptcha_image_cell center{height:57px}.recaptchatable .recaptcha_image_cell{background-color:white;height:57px;padding:7px!important}.recaptchatable,#recaptcha_area tr,#recaptcha_area td,#recaptcha_area th{margin:0!important;border:0!important;border-collapse:collapse!important;vertical-align:middle!important}.recaptchatable *{margin:0;padding:0;border:0;color:black;position:static;top:auto;left:auto;right:auto;bottom:auto;text-align:left!important}.recaptchatable #recaptcha_image{margin:auto;border:1px solid #dfdfdf!important}.recaptchatable a img{border:0}.recaptchatable a,.recaptchatable a:hover{-moz-outline:none;border:0!important;padding:0!important;text-decoration:none;color:blue;background:none!important;font-weight:normal}.recaptcha_input_area{position:relative!important;background:none!important}.recaptchatable label.recaptcha_input_area_text{border:1px solid #dfdfdf!important;margin:0!important;padding:0!important;position:static!important;top:auto!important;left:auto!important;right:auto!important;bottom:auto!important}.recaptcha_theme_red label.recaptcha_input_area_text,.recaptcha_theme_white label.recaptcha_input_area_text{color:black!important}.recaptcha_theme_blackglass label.recaptcha_input_area_text{color:white!important}.recaptchatable #recaptcha_response_field{font-size:11pt}.recaptcha_theme_blackglass #recaptcha_response_field,.recaptcha_theme_white #recaptcha_response_field{border:1px solid gray}.recaptcha_theme_red #recaptcha_response_field{border:1px solid #cca940}.recaptcha_audio_cant_hear_link{font-size:7pt;color:black}.recaptchatable{line-height:1em;border:1px solid #dfdfdf!important}.recaptcha_error_text{color:red}";RecaptchaTemplates.CleanHtml='<table id="recaptcha_table" class="recaptchatable"> <tr height="73"> <td class=\'recaptcha_image_cell\' width="302"><center><div id="recaptcha_image"></div></center></td> <td style="padding: 10px 7px 7px 7px;"> <a id=\'recaptcha_reload_btn\'><img id=\'recaptcha_reload\' width="25" height="18" alt="" /></a> <a id=\'recaptcha_switch_audio_btn\' class="recaptcha_only_if_image"><img id=\'recaptcha_switch_audio\' width="25" height="15" alt="" /></a><a id=\'recaptcha_switch_img_btn\' class="recaptcha_only_if_audio"><img id=\'recaptcha_switch_img\' width="25" height="15" alt=""/></a> <a id=\'recaptcha_whatsthis_btn\'><img id=\'recaptcha_whatsthis\' width="25" height="16" /></a> </td> <td style="padding: 18px 7px 18px 7px;"> <img id=\'recaptcha_logo\' alt="" width="71" height="36" /> </td> </tr> <tr> <td style="padding-left: 7px;"> <div class="recaptcha_input_area" style="padding-top: 2px; padding-bottom: 7px;"> <input style="border: 1px solid #3c3c3c; width: 302px;" name="recaptcha_response_field" id="recaptcha_response_field" type="text" /> </div> </td> <td></td> <td style="padding: 4px 7px 12px 7px;"> <img id="recaptcha_tagline" width="71" height="17" /> </td> </tr> </table> ';RecaptchaTemplates.ContextHtml='<table id="recaptcha_table" class="recaptchatable"> <tr> <td colspan="6" class=\'recaptcha_r1_c1\'></td> </tr> <tr> <td class=\'recaptcha_r2_c1\'></td> <td colspan="4" class=\'recaptcha_image_cell\'><div id="recaptcha_image"></div></td> <td class=\'recaptcha_r2_c2\'></td> </tr> <tr> <td rowspan="6" class=\'recaptcha_r3_c1\'></td> <td colspan="4" class=\'recaptcha_r3_c2\'></td> <td rowspan="6" class=\'recaptcha_r3_c3\'></td> </tr> <tr> <td rowspan="3" class=\'recaptcha_r4_c1\' height="49"> <div class="recaptcha_input_area"> <label for="recaptcha_response_field" class="recaptcha_input_area_text"><span id="recaptcha_instructions_context" class="recaptcha_only_if_image recaptcha_only_if_no_incorrect_sol"></span><span id="recaptcha_instructions_audio" class="recaptcha_only_if_no_incorrect_sol recaptcha_only_if_audio"></span><span id="recaptcha_instructions_error" class="recaptcha_only_if_incorrect_sol"></span></label><br/> <input name="recaptcha_response_field" id="recaptcha_response_field" type="text" /> </div> </td> <td rowspan="4" class=\'recaptcha_r4_c2\'></td> <td><a id=\'recaptcha_reload_btn\'><img id=\'recaptcha_reload\' width="25" height="17" /></a></td> <td rowspan="4" class=\'recaptcha_r4_c4\'></td> </tr> <tr> <td><a id=\'recaptcha_switch_audio_btn\' class="recaptcha_only_if_image"><img id=\'recaptcha_switch_audio\' width="25" height="16" alt="" /></a><a id=\'recaptcha_switch_img_btn\' class="recaptcha_only_if_audio"><img id=\'recaptcha_switch_img\' width="25" height="16" alt=""/></a></td> </tr> <tr> <td><a id=\'recaptcha_whatsthis_btn\'><img id=\'recaptcha_whatsthis\' width="25" height="16" /></a></td> </tr> <tr> <td class=\'recaptcha_r7_c1\'></td> <td class=\'recaptcha_r8_c1\'></td> </tr> </table> ';RecaptchaTemplates.VertCss=".recaptchatable td img{display:block}.recaptchatable .recaptcha_r1_c1{background:url(IMGROOT/sprite.png) 0 -63px no-repeat;width:318px;height:9px}.recaptchatable .recaptcha_r2_c1{background:url(IMGROOT/sprite.png) -18px 0 no-repeat;width:9px;height:57px}.recaptchatable .recaptcha_r2_c2{background:url(IMGROOT/sprite.png) -27px 0 no-repeat;width:9px;height:57px}.recaptchatable .recaptcha_r3_c1{background:url(IMGROOT/sprite.png) 0 0 no-repeat;width:9px;height:63px}.recaptchatable .recaptcha_r3_c2{background:url(IMGROOT/sprite.png) -18px -57px no-repeat;width:300px;height:6px}.recaptchatable .recaptcha_r3_c3{background:url(IMGROOT/sprite.png) -9px 0 no-repeat;width:9px;height:63px}.recaptchatable .recaptcha_r4_c1{background:url(IMGROOT/sprite.png) -43px 0 no-repeat;width:171px;height:49px}.recaptchatable .recaptcha_r4_c2{background:url(IMGROOT/sprite.png) -36px 0 no-repeat;width:7px;height:57px}.recaptchatable .recaptcha_r4_c4{background:url(IMGROOT/sprite.png) -214px 0 no-repeat;width:97px;height:57px}.recaptchatable .recaptcha_r7_c1{background:url(IMGROOT/sprite.png) -43px -49px no-repeat;width:171px;height:8px}.recaptchatable .recaptcha_r8_c1{background:url(IMGROOT/sprite.png) -43px -49px no-repeat;width:25px;height:8px}.recaptchatable .recaptcha_image_cell center img{height:57px}.recaptchatable .recaptcha_image_cell center{height:57px}.recaptchatable .recaptcha_image_cell{background-color:white;height:57px}#recaptcha_area,#recaptcha_table{width:318px!important}.recaptchatable,#recaptcha_area tr,#recaptcha_area td,#recaptcha_area th{margin:0!important;border:0!important;padding:0!important;border-collapse:collapse!important;vertical-align:middle!important}.recaptchatable *{margin:0;padding:0;border:0;font-family:helvetica,sans-serif;font-size:8pt;color:black;position:static;top:auto;left:auto;right:auto;bottom:auto;text-align:left!important}.recaptchatable #recaptcha_image{margin:auto}.recaptchatable img{border:0!important;margin:0!important;padding:0!important}.recaptchatable a,.recaptchatable a:hover{-moz-outline:none;border:0!important;padding:0!important;text-decoration:none;color:blue;background:none!important;font-weight:normal}.recaptcha_input_area{position:relative!important;width:146px!important;height:45px!important;margin-left:20px!important;margin-right:5px!important;margin-top:4px!important;background:none!important}.recaptchatable label.recaptcha_input_area_text{margin:0!important;padding:0!important;position:static!important;top:auto!important;left:auto!important;right:auto!important;bottom:auto!important;background:none!important;height:auto!important;width:auto!important}.recaptcha_theme_red label.recaptcha_input_area_text,.recaptcha_theme_white label.recaptcha_input_area_text{color:black!important}.recaptcha_theme_blackglass label.recaptcha_input_area_text{color:white!important}.recaptchatable #recaptcha_response_field{width:145px!important;position:absolute!important;bottom:7px!important;padding:0!important;margin:0!important;font-size:10pt}.recaptcha_theme_blackglass #recaptcha_response_field,.recaptcha_theme_white #recaptcha_response_field{border:1px solid gray}.recaptcha_theme_red #recaptcha_response_field{border:1px solid #cca940}.recaptcha_audio_cant_hear_link{font-size:7pt;color:black}.recaptchatable{line-height:1em}#recaptcha_instructions_error{color:red!important}";var RecaptchaStr_en={visual_challenge:"Get a visual challenge",audio_challenge:"Get an audio challenge",refresh_btn:"Get a new challenge",instructions_visual:"Type the two words:",instructions_context:"Type the words in the boxes:",instructions_audio:"Type what you hear:",help_btn:"Help",play_again:"Play sound again",cant_hear_this:"Download sound as MP3",incorrect_try_again:"Incorrect. Try again."},RecaptchaStr_de={visual_challenge:"Visuelle Aufgabe generieren",audio_challenge:"Audio-Aufgabe generieren",
refresh_btn:"Neue Aufgabe generieren",instructions_visual:"Gib die 2 W\u00f6rter ein:",instructions_context:"",instructions_audio:"Gib die 8 Ziffern ein:",help_btn:"Hilfe",incorrect_try_again:"Falsch. Nochmals versuchen!"},RecaptchaStr_es={visual_challenge:"Obt\u00e9n un reto visual",audio_challenge:"Obt\u00e9n un reto audible",refresh_btn:"Obt\u00e9n un nuevo reto",instructions_visual:"Escribe las 2 palabras:",instructions_context:"",instructions_audio:"Escribe los 8 n\u00fameros:",help_btn:"Ayuda",
incorrect_try_again:"Incorrecto. Otro intento."},RecaptchaStr_fr={visual_challenge:"D\u00e9fi visuel",audio_challenge:"D\u00e9fi audio",refresh_btn:"Nouveau d\u00e9fi",instructions_visual:"Entrez les deux mots:",instructions_context:"",instructions_audio:"Entrez les huit chiffres:",help_btn:"Aide",incorrect_try_again:"Incorrect."},RecaptchaStr_nl={visual_challenge:"Test me via een afbeelding",audio_challenge:"Test me via een geluidsfragment",refresh_btn:"Nieuwe uitdaging",instructions_visual:"Type de twee woorden:",
instructions_context:"",instructions_audio:"Type de acht cijfers:",help_btn:"Help",incorrect_try_again:"Foute invoer."},RecaptchaStr_pt={visual_challenge:"Obter um desafio visual",audio_challenge:"Obter um desafio sonoro",refresh_btn:"Obter um novo desafio",instructions_visual:"Escreva as 2 palavras:",instructions_context:"",instructions_audio:"Escreva os 8 numeros:",help_btn:"Ajuda",incorrect_try_again:"Incorrecto. Tenta outra vez."},RecaptchaStr_ru={visual_challenge:"\u0417\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044c \u0432\u0438\u0437\u0443\u0430\u043b\u044c\u043d\u0443\u044e \u0437\u0430\u0434\u0430\u0447\u0443",
audio_challenge:"\u0417\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044c \u0437\u0432\u0443\u043a\u043e\u0432\u0443\u044e \u0437\u0430\u0434\u0430\u0447\u0443",refresh_btn:"\u0417\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044c \u043d\u043e\u0432\u0443\u044e \u0437\u0430\u0434\u0430\u0447\u0443",instructions_visual:"\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u0434\u0432\u0430 \u0441\u043b\u043e\u0432\u0430:",instructions_context:"",instructions_audio:"\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u0432\u043e\u0441\u0435\u043c\u044c \u0447\u0438\u0441\u0435\u043b:",
help_btn:"\u041f\u043e\u043c\u043e\u0449\u044c",incorrect_try_again:"\u041d\u0435\u043f\u0440\u0430\u0432\u0438\u043b\u044c\u043d\u043e."},RecaptchaStr_tr={visual_challenge:"G\u00f6rsel deneme",audio_challenge:"\u0130\u015fitsel deneme",refresh_btn:"Yeni deneme",instructions_visual:"\u0130ki kelimeyi yaz\u0131n:",instructions_context:"",instructions_audio:"Sekiz numaray\u0131 yaz\u0131n:",help_btn:"Yard\u0131m (\u0130ngilizce)",incorrect_try_again:"Yanl\u0131\u015f. Bir daha deneyin."},RecaptchaStr_it=
{visual_challenge:"Modalit\u00e0 visiva",audio_challenge:"Modalit\u00e0 auditiva",refresh_btn:"Chiedi due nuove parole",instructions_visual:"Scrivi le due parole:",instructions_context:"",instructions_audio:"Trascrivi ci\u00f2 che senti:",help_btn:"Aiuto",incorrect_try_again:"Scorretto. Riprova."},RecaptchaLangMap={en:RecaptchaStr_en,de:RecaptchaStr_de,es:RecaptchaStr_es,fr:RecaptchaStr_fr,nl:RecaptchaStr_nl,pt:RecaptchaStr_pt,ru:RecaptchaStr_ru,tr:RecaptchaStr_tr,it:RecaptchaStr_it};var RecaptchaStr=RecaptchaStr_en,RecaptchaOptions,RecaptchaDefaultOptions={tabindex:0,theme:"red",callback:null,lang:"en",custom_theme_widget:null,custom_translations:null,includeContext:false},Recaptcha={widget:null,timer_id:-1,style_set:false,theme:null,type:"image",ajax_verify_cb:null,$:function(a){return typeof a=="string"?document.getElementById(a):a},create:function(a,b,c){Recaptcha.destroy();if(b)Recaptcha.widget=Recaptcha.$(b);Recaptcha._init_options(c);Recaptcha._call_challenge(a)},destroy:function(){var a=
Recaptcha.$("recaptcha_challenge_field");a&&a.parentNode.removeChild(a);Recaptcha.timer_id!=-1&&clearInterval(Recaptcha.timer_id);Recaptcha.timer_id=-1;if(a=Recaptcha.$("recaptcha_image"))a.innerHTML="";if(Recaptcha.widget){if(Recaptcha.theme!="custom")Recaptcha.widget.innerHTML="";else Recaptcha.widget.style.display="none";Recaptcha.widget=null}},focus_response_field:function(){var a=Recaptcha.$;a=a("recaptcha_response_field");a.focus()},get_challenge:function(){if(typeof RecaptchaState=="undefined")return null;
return RecaptchaState.challenge},get_response:function(){var a=Recaptcha.$;a=a("recaptcha_response_field");if(!a)return null;return a.value},ajax_verify:function(a){Recaptcha.ajax_verify_cb=a;a=Recaptcha._get_api_server()+"/ajaxverify?c="+encodeURIComponent(Recaptcha.get_challenge())+"&response="+encodeURIComponent(Recaptcha.get_response());Recaptcha._add_script(a)},_ajax_verify_callback:function(a){Recaptcha.ajax_verify_cb(a)},_get_api_server:function(){var a=window.location.protocol,b;b=typeof _RecaptchaOverrideApiServer!=
"undefined"?_RecaptchaOverrideApiServer:"www.google.com/recaptcha/api";return a+"//"+b},_call_challenge:function(a){a=Recaptcha._get_api_server()+"/challenge?k="+a+"&ajax=1&cachestop="+Math.random();if(typeof RecaptchaOptions.extra_challenge_params!="undefined")a+="&"+RecaptchaOptions.extra_challenge_params;if(RecaptchaOptions.includeContext)a+="&includeContext=1";Recaptcha._add_script(a)},_add_script:function(a){var b=document.createElement("script");b.type="text/javascript";b.src=a;Recaptcha._get_script_area().appendChild(b)},
_get_script_area:function(){var a=document.getElementsByTagName("head");return a=!a||a.length<1?document.body:a[0]},_hash_merge:function(a){var b={};for(var c in a)for(var d in a[c])b[d]=a[c][d];if(b.theme=="context")b.includeContext=true;return b},_init_options:function(a){RecaptchaOptions=Recaptcha._hash_merge([RecaptchaDefaultOptions,a||{}])},challenge_callback:function(){Recaptcha._reset_timer();RecaptchaStr=Recaptcha._hash_merge([RecaptchaStr_en,RecaptchaLangMap[RecaptchaOptions.lang]||{},RecaptchaOptions.custom_translations||
{}]);window.addEventListener&&window.addEventListener("unload",function(){Recaptcha.destroy()},false);Recaptcha._is_ie()&&window.attachEvent&&window.attachEvent("onbeforeunload",function(){});if(navigator.userAgent.indexOf("KHTML")>0){var a=document.createElement("iframe");a.src="about:blank";a.style.height="0px";a.style.width="0px";a.style.visibility="hidden";a.style.border="none";var b=document.createTextNode("This frame prevents back/forward cache problems in Safari.");a.appendChild(b);document.body.appendChild(a)}Recaptcha._finish_widget()},
_add_css:function(a){var b=document.createElement("style");b.type="text/css";if(b.styleSheet)if(navigator.appVersion.indexOf("MSIE 5")!=-1)document.write("<style type='text/css'>"+a+"</style>");else b.styleSheet.cssText=a;else if(navigator.appVersion.indexOf("MSIE 5")!=-1)document.write("<style type='text/css'>"+a+"</style>");else{a=document.createTextNode(a);b.appendChild(a)}Recaptcha._get_script_area().appendChild(b)},_set_style:function(a){if(!Recaptcha.style_set){Recaptcha.style_set=true;Recaptcha._add_css(a+
"\n\n.recaptcha_is_showing_audio .recaptcha_only_if_image,.recaptcha_isnot_showing_audio .recaptcha_only_if_audio,.recaptcha_had_incorrect_sol .recaptcha_only_if_no_incorrect_sol,.recaptcha_nothad_incorrect_sol .recaptcha_only_if_incorrect_sol{display:none !important}")}},_init_builtin_theme:function(){var a=Recaptcha.$,b=RecaptchaStr,c=RecaptchaState,d,e;c=c.server;if(c[c.length-1]=="/")c=c.substring(0,c.length-1);var f=c+"/img/"+Recaptcha.theme;if(Recaptcha.theme=="clean"){c=RecaptchaTemplates.CleanCss;
d=RecaptchaTemplates.CleanHtml;e="png"}else{if(Recaptcha.theme=="context"){c=RecaptchaTemplates.VertCss;d=RecaptchaTemplates.ContextHtml}else{c=RecaptchaTemplates.VertCss;d=RecaptchaTemplates.VertHtml}e="gif"}c=c.replace(/IMGROOT/g,f);Recaptcha._set_style(c);Recaptcha.widget.innerHTML="<div id='recaptcha_area'>"+d+"</div>";a("recaptcha_reload").src=f+"/refresh."+e;a("recaptcha_switch_audio").src=f+"/audio."+e;a("recaptcha_switch_img").src=f+"/text."+e;a("recaptcha_whatsthis").src=f+"/help."+e;if(Recaptcha.theme==
"clean"){a("recaptcha_logo").src=f+"/logo."+e;a("recaptcha_tagline").src=f+"/tagline."+e}a("recaptcha_reload").alt=b.refresh_btn;a("recaptcha_switch_audio").alt=b.audio_challenge;a("recaptcha_switch_img").alt=b.visual_challenge;a("recaptcha_whatsthis").alt=b.help_btn;a("recaptcha_reload_btn").href="javascript:Recaptcha.reload ();";a("recaptcha_reload_btn").title=b.refresh_btn;a("recaptcha_switch_audio_btn").href="javascript:Recaptcha.switch_type('audio');";a("recaptcha_switch_audio_btn").title=b.audio_challenge;
a("recaptcha_switch_img_btn").href="javascript:Recaptcha.switch_type('image');";a("recaptcha_switch_img_btn").title=b.visual_challenge;a("recaptcha_whatsthis_btn").href=Recaptcha._get_help_link();a("recaptcha_whatsthis_btn").target="_blank";a("recaptcha_whatsthis_btn").title=b.help_btn;a("recaptcha_whatsthis_btn").onclick=function(){Recaptcha.showhelp();return false};a("recaptcha_table").className="recaptchatable recaptcha_theme_"+Recaptcha.theme;a("recaptcha_instructions_image")&&a("recaptcha_instructions_image").appendChild(document.createTextNode(b.instructions_visual));
a("recaptcha_instructions_context")&&a("recaptcha_instructions_context").appendChild(document.createTextNode(b.instructions_context));a("recaptcha_instructions_audio")&&a("recaptcha_instructions_audio").appendChild(document.createTextNode(b.instructions_audio));a("recaptcha_instructions_error")&&a("recaptcha_instructions_error").appendChild(document.createTextNode(b.incorrect_try_again))},_finish_widget:function(){var a=Recaptcha.$,b=RecaptchaState,c=RecaptchaOptions,d=c.theme;switch(d){case "red":case "white":case "blackglass":case "clean":case "custom":case "context":break;
default:d="red";break}if(!Recaptcha.theme)Recaptcha.theme=d;Recaptcha.theme!="custom"?Recaptcha._init_builtin_theme():Recaptcha._set_style("");d=document.createElement("span");d.id="recaptcha_challenge_field_holder";d.style.display="none";a("recaptcha_response_field").parentNode.insertBefore(d,a("recaptcha_response_field"));a("recaptcha_response_field").setAttribute("autocomplete","off");a("recaptcha_image").style.width="300px";a("recaptcha_image").style.height="57px";Recaptcha.should_focus=false;
Recaptcha._set_challenge(b.challenge,"image");if(c.tabindex){a("recaptcha_response_field").tabIndex=c.tabindex;if(Recaptcha.theme!="custom"){a("recaptcha_whatsthis_btn").tabIndex=c.tabindex;a("recaptcha_switch_img_btn").tabIndex=c.tabindex;a("recaptcha_switch_audio_btn").tabIndex=c.tabindex;a("recaptcha_reload_btn").tabIndex=c.tabindex}}if(Recaptcha.widget)Recaptcha.widget.style.display="";c.callback&&c.callback()},switch_type:function(a){var b=Recaptcha;b.type=a;b.reload(b.type=="audio"?"a":"v")},
reload:function(a){var b=Recaptcha,c=RecaptchaState;if(typeof a=="undefined")a="r";c=c.server+"reload?c="+c.challenge+"&k="+c.site+"&reason="+a+"&type="+b.type+"&lang="+RecaptchaOptions.lang;if(RecaptchaOptions.includeContext)c+="&includeContext=1";if(typeof RecaptchaOptions.extra_challenge_params!="undefined")c+="&"+RecaptchaOptions.extra_challenge_params;if(b.type=="audio")c+=RecaptchaOptions.audio_beta_12_08?"&audio_beta_12_08=1":"&new_audio_default=1";b.should_focus=a!="t";b._add_script(c)},finish_reload:function(a,
b){RecaptchaState.is_incorrect=false;Recaptcha._set_challenge(a,b)},_set_challenge:function(a,b){var c=Recaptcha,d=RecaptchaState,e=c.$;d.challenge=a;c.type=b;e("recaptcha_challenge_field_holder").innerHTML="<input type='hidden' name='recaptcha_challenge_field' id='recaptcha_challenge_field' value='"+d.challenge+"'/>";if(b=="audio")e("recaptcha_image").innerHTML=Recaptcha.getAudioCaptchaHtml();else if(b=="image"){var f=d.server+"image?c="+d.challenge;e("recaptcha_image").innerHTML="<img style='display:block;' height='57' width='300' src='"+
f+"'/>"}Recaptcha._css_toggle("recaptcha_had_incorrect_sol","recaptcha_nothad_incorrect_sol",d.is_incorrect);Recaptcha._css_toggle("recaptcha_is_showing_audio","recaptcha_isnot_showing_audio",b=="audio");c._clear_input();c.should_focus&&c.focus_response_field();c._reset_timer()},_reset_timer:function(){var a=RecaptchaState;clearInterval(Recaptcha.timer_id);Recaptcha.timer_id=setInterval("Recaptcha.reload('t');",(a.timeout-300)*1E3)},showhelp:function(){window.open(Recaptcha._get_help_link(),"recaptcha_popup",
"width=460,height=570,location=no,menubar=no,status=no,toolbar=no,scrollbars=yes,resizable=yes")},_clear_input:function(){var a=Recaptcha.$("recaptcha_response_field");a.value=""},_displayerror:function(a){var b=Recaptcha.$;b("recaptcha_image").innerHTML="";b("recaptcha_image").appendChild(document.createTextNode(a))},reloaderror:function(a){Recaptcha._displayerror(a)},_is_ie:function(){return navigator.userAgent.indexOf("MSIE")>0&&!window.opera},_css_toggle:function(a,b,c){var d=Recaptcha.widget;
if(!d)d=document.body;var e=d.className;e=e.replace(RegExp("(^|\\s+)"+a+"(\\s+|$)")," ");e=e.replace(RegExp("(^|\\s+)"+b+"(\\s+|$)")," ");e+=" "+(c?a:b);d.className=e},_get_help_link:function(){var a=RecaptchaOptions.lang;return"http://recaptcha.net/popuphelp/"+(a=="en"?"":a+".html")},playAgain:function(){var a=Recaptcha.$;a("recaptcha_image").innerHTML=Recaptcha.getAudioCaptchaHtml()},getAudioCaptchaHtml:function(){var a=Recaptcha,b=RecaptchaState,c=b.server+"image?c="+b.challenge;if(c.indexOf("https://")==
0)c="http://"+c.substring(8);b=b.server+"/img/audiocaptcha.swf?v2";a=a._is_ie()?'<object classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000" id="audiocaptcha" width="0" height="0" codebase="https://fpdownload.macromedia.com/get/flashplayer/current/swflash.cab"><param name="movie" value="'+b+'" /><param name="quality" value="high" /><param name="bgcolor" value="#869ca7" /><param name="allowScriptAccess" value="always" /></object><br/>':'<embed src="'+b+'" quality="high" bgcolor="#869ca7" width="0" height="0" name="audiocaptcha" align="middle" play="true" loop="false" quality="high" allowScriptAccess="always" type="application/x-shockwave-flash" pluginspage="http://www.adobe.com/go/getflashplayer"></embed> ';
c=(Recaptcha.checkFlashVer()?'<br/><a class="recaptcha_audio_cant_hear_link" href="#" onclick="Recaptcha.playAgain(); return false;">'+RecaptchaStr.play_again+"</a>":"")+'<br/><a class="recaptcha_audio_cant_hear_link" target="_blank" href="'+c+'">'+RecaptchaStr.cant_hear_this+"</a>";return a+c},gethttpwavurl:function(){var a=RecaptchaState;if(Recaptcha.type=="audio"){a=a.server+"image?c="+a.challenge;if(a.indexOf("https://")==0)a="http://"+a.substring(8);return a}return""},checkFlashVer:function(){var a=
navigator.appVersion.indexOf("MSIE")!=-1?true:false,b=navigator.appVersion.toLowerCase().indexOf("win")!=-1?true:false,c=navigator.userAgent.indexOf("Opera")!=-1?true:false,d=-1;if(navigator.plugins!=null&&navigator.plugins.length>0){if(navigator.plugins["Shockwave Flash 2.0"]||navigator.plugins["Shockwave Flash"]){a=navigator.plugins["Shockwave Flash 2.0"]?" 2.0":"";a=navigator.plugins["Shockwave Flash"+a].description;a=a.split(" ");a=a[2].split(".");d=a[0]}}else if(a&&b&&!c)try{var e=new ActiveXObject("ShockwaveFlash.ShockwaveFlash.7"),
f=e.GetVariable("$version");d=f.split(" ")[1].split(",")[0]}catch(g){}return d>=9},getlang:function(){return RecaptchaOptions.lang}};


} /* end modules/sharedaddy/sharing.js */

if ( jpconcat.files['modules/shortcodes/js/audio-shortcode.js'] ) {

/* jshint onevar:false */
/* global audioshortcode */

// Note: This file no longer exists on wpcom.

(function($) {

window.audioshortcode = {

	/**
	 * Prep the audio player once the page is ready, add listeners, etc
	 */
	prep: function( player_id, files, titles, volume, loop ) {
		// check if the player has already been prepped, no-op if it has
		var container = $( '#wp-as-' + player_id + '-container' );
		if ( container.hasClass( 'wp-as-prepped' ) ) {
			return;
		}
		container.addClass( 'wp-as-prepped' );

		// browser doesn't support HTML5 audio, no-op
		if ( ! document.createElement('audio').canPlayType ) {
			return;
		}

		// if the browser removed the script, no-op
		var player = $( '#wp-as-' + player_id ).get(0);
		if ( typeof player === 'undefined' ) {
			return;
		}

		this[player_id] = [];
		this[player_id].i = 0;
		this[player_id].files = files;
		this[player_id].titles = titles;
		player.volume = volume;

		var type_map = {
			'mp3':  'mpeg',
			'wav':  'wav',
			'ogg':  'ogg',
			'oga':  'ogg',
			'm4a':  'mp4',
			'aac':  'mp4',
			'webm': 'webm'
		};

		// strip out all the files that can't be played
		for ( var i = this[player_id].files.length-1; i >= 0; i-- ) {
			var extension = this[player_id].files[i].split( '.' ).pop();
			var type = 'audio/' + type_map[extension];
			if ( ! player.canPlayType( type ) ) {
				this.remove_track( player_id, i );
			}
		}

		// bail if there are no more good files
		if ( 0 === this[player_id].files.length ) {
			return;
		}
		player.src = this[player_id].files[0];

		// show the controls if there are still 2+ files remaining
		if ( 1 < this[player_id].files.length ) {
			$( '#wp-as-' + player_id + '-controls' ).show();
		}

		player.addEventListener( 'error', function() {
			audioshortcode.remove_track( player_id, audioshortcode[player_id].i );
			if ( 0 < audioshortcode[player_id].files.length ) {
				audioshortcode[player_id].i--;
				audioshortcode.next_track( player_id, false, loop );
			}
		}, false );

		player.addEventListener( 'ended', function() {
			audioshortcode.next_track( player_id, false, loop );
		}, false );

		player.addEventListener( 'play', function() {
			var i = audioshortcode[player_id].i;
			var titles = audioshortcode[player_id].titles;
			$( '#wp-as-' + player_id + '-playing' ).text( ' ' + titles[i] );
		}, false );

		player.addEventListener( 'pause', function() {
			$( '#wp-as-' + player_id + '-playing' ).text( '' );
		}, false );
	},

	/**
	 * Remove the track and update the player/controls if needed
	 */
	remove_track: function( player_id, index ) {
		this[player_id].files.splice( index, 1 );
		this[player_id].titles.splice( index, 1 );

		// get rid of player/controls if they can't be played
		if ( 0 === this[player_id].files.length ) {
			$( '#wp-as-' + player_id + '-container' ).html( $( '#wp-as-' + player_id + '-nope' ).html() );
			$( '#wp-as-' + player_id + '-controls' ).html( '' );
		} else if ( 1 === this[player_id].files.length ) {
			$( '#wp-as-' + player_id + '-controls' ).html( '' );
		}
	},

	/**
	 * Change the src of the player, load the file, then play it
	 */
	start_track: function( player_id, file ) {
		var player = $( '#wp-as-' + player_id ).get(0);
		player.src = file;
		player.load();
		player.play();
	},

	/**
	 * Play the previous track
	 */
	prev_track: function( player_id ) {
		var player = $( '#wp-as-' + player_id ).get(0);
		var files = this[player_id].files;
		if ( player.paused || 0 === this[player_id].i ) {
			return;
		}

		player.pause();
		if ( 0 < this[player_id].i ) {
			this[player_id].i--;
			this.start_track( player_id, files[this[player_id].i] );
		}
	},

	/**
	 * Play the next track
	 */
	next_track: function( player_id, fromClick, loop ) {
		var player = $( '#wp-as-' + player_id ).get(0);
		var files = this[player_id].files;
		if ( fromClick && ( player.paused || files.length-1 === this[player_id].i ) ) {
			return;
		}

		player.pause();
		if ( files.length-1 > this[player_id].i ) {
			this[player_id].i++;
			this.start_track( player_id, files[this[player_id].i] );
		} else if ( loop ) {
			this[player_id].i = 0;
			this.start_track( player_id, 0 );
		} else {
			this[player_id].i = 0;
			player.src = files[0];
			$( '#wp-as-' + player_id + '-playing' ).text( '' );
		}
	}
};

})(jQuery);


} /* end modules/shortcodes/js/audio-shortcode.js */

if ( jpconcat.files['modules/shortcodes/js/jmpress.min.js'] ) {

/*!
 * jmpress.js v0.4.5
 * http://jmpressjs.github.com/jmpress.js
 *
 * A jQuery plugin to build a website on the infinite canvas.
 *
 * Copyright 2013 Kyle Robinson Young @shama & Tobias Koppers @sokra
 * Licensed MIT
 * http://www.opensource.org/licenses/mit-license.php
 *
 * Based on the foundation laid by Bartek Szopka @bartaz
 */(function(e,t,s,a){"use strict";function r(e){if(e){var t=1+e.substr(1).search(/[A-Z]/),s=e.substr(0,t).toLowerCase(),a=e.substr(t).toLowerCase();return"-"+s+"-"+a}}function n(e){return e?e+",":""}function i(e){return e.length>0?e:null}function o(r){function n(t,s){var a=p(t),r={oldStyle:e(t).attr("style")||""},n={data:a,stepData:r};f.call(this,"beforeInitStep",e(t),n),r.delegate=a.delegate,f.call(this,"initStep",e(t),n),e(t).data("stepData",r),e(t).attr("id")||e(t).attr("id","step-"+(s+1)),f.call(this,"applyStep",e(t),n)}function o(t){var s=e(t).data("stepData");e(t).attr("style",s.oldStyle),f.call(this,"unapplyStep",e(t),{stepData:s})}function c(t){f.call(this,"unapplyStep",e(t),{stepData:t.data("stepData")}),f.call(this,"applyStep",e(t),{stepData:t.data("stepData")})}function l(){O&&f.call(this,"setInactive",O,{stepData:e(O).data("stepData"),reason:"deinit"}),Y.jmpressClass&&e(I).removeClass(Y.jmpressClass),f.call(this,"beforeDeinit",e(this),{}),e(A.stepSelector,I).each(function(){o.call(I,this)}),k.attr("style",Z.container),A.fullscreen&&e("html").attr("style",""),z.attr("style",Z.area),e(X).children().each(function(){I.append(e(this))}),A.fullscreen?X.remove():(X.remove(),z.remove()),f.call(this,"afterDeinit",e(this),{}),e(I).data("jmpressmethods",!1)}function f(t,s,a){a.settings=A,a.current=Y,a.container=k,a.parents=s?d(s):null,a.current=Y,a.jmpress=this;var r={};return e.each(A[t],function(e,t){r.value=t.call(I,s,a)||r.value}),r.value}function d(t){return e(t).parentsUntil(I).not(I).filter(A.stepSelector)}function v(e){return g({step:O,substep:F},e)}function g(t,s){var r;if(e.isPlainObject(t)&&(r=t.substep,t=t.step),"string"==typeof t&&(t=I.find(t).first()),!t||!e(t).data("stepData"))return!1;b.call(this);var n=e(t).data("stepData"),o=!1;if(f.call(this,"beforeChange",t,{stepData:n,reason:s,cancel:function(){o=!0}}),o)return a;var c={},l=t;e(t).data("stepData").delegate&&(l=i(e(t).parentsUntil(I).filter(A.stepSelector).filter(n.delegate))||i(e(t).near(n.delegate))||i(e(t).near(n.delegate,!0))||i(e(n.delegate,I)),l?n=l.data("stepData"):l=t),Q&&f.call(this,"setInactive",Q,{stepData:e(Q).data("stepData"),delegatedFrom:O,reason:s,target:c,nextStep:l,nextSubstep:r,nextStepData:n});var u={stepData:n,delegatedFrom:t,reason:s,target:c,substep:r,prevStep:Q,prevSubstep:F,prevStepData:Q&&e(Q).data("stepData")};return f.call(this,"beforeActive",l,u),f.call(this,"setActive",l,u),Y.jmpressClass&&e(I).removeClass(Y.jmpressClass),e(I).addClass(Y.jmpressClass="step-"+e(l).attr("id")),Y.jmpressDelegatedClass&&e(I).removeClass(Y.jmpressDelegatedClass),e(I).addClass(Y.jmpressDelegatedClass="delegating-step-"+e(t).attr("id")),f.call(this,"applyTarget",l,e.extend({canvas:X,area:z,beforeActive:Q},u)),O=t,F=u.substep,Q=l,Y.idleTimeout&&clearTimeout(Y.idleTimeout),Y.idleTimeout=setTimeout(function(){f.call(this,"idle",l,u)},Math.max(1,A.transitionDuration-100)),l}function b(){(function t(){function a(){(0!==e(k).scrollTop()||0!==e(k).scrollLeft())&&t()}if("BODY"===e(k)[0].tagName)try{s.scrollTo(0,0)}catch(r){}e(k).scrollTop(0),e(k).scrollLeft(0),setTimeout(a,1),setTimeout(a,10),setTimeout(a,100),setTimeout(a,200),setTimeout(a,400)})()}function y(e){return g.call(this,e,"jump")}function j(){return g.call(this,f.call(this,"selectNext",O,{stepData:e(O).data("stepData"),substep:F}),"next")}function D(){return g.call(this,f.call(this,"selectPrev",O,{stepData:e(O).data("stepData"),substep:F}),"prev")}function S(){return g.call(this,f.call(this,"selectHome",O,{stepData:e(O).data("stepData")}),"home")}function x(){return g.call(this,f.call(this,"selectEnd",O,{stepData:e(O).data("stepData")}),"end")}function w(t){return u(X,t||{}),e(X)}function C(){return Q&&e(Q)}function T(t,s,r){return h[t]?f.call(this,t,s,r):(e.error("callback "+t+" is not registered."),a)}function M(){var e=navigator.userAgent.toLowerCase();return-1===e.search(/(iphone)|(ipod)|(android)/)||-1!==e.search(/(chrome)/)}r=e.extend(!0,{},r||{});var P={},N=null;for(N in h)P[N]=e.isFunction(r[N])?[r[N]]:r[N],r[N]=[];var A=e.extend(!0,{},m,r);for(N in h)P[N]&&Array.prototype.push.apply(A[N],P[N]);var I=e(this),k=null,z=null,Z={container:"",area:""},X=null,Y=null,O=!1,F=null,Q=!1;if(I.data("jmpressmethods",{select:g,reselect:v,scrollFix:b,goTo:y,next:j,prev:D,home:S,end:x,canvas:w,container:function(){return k},settings:function(){return A},active:C,current:function(){return Y},fire:T,init:function(t){n.call(this,e(t),Y.nextIdNumber++)},deinit:function(t){t?o.call(this,e(t)):l.call(this)},reapply:c}),M()===!1)return A.notSupportedClass&&I.addClass(A.notSupportedClass),a;A.notSupportedClass&&I.removeClass(A.notSupportedClass);var E=e(A.stepSelector,I);k=I,z=e("<div />"),X=e("<div />"),e(I).children().filter(E).each(function(){X.append(e(this))}),A.fullscreen&&(k=e("body"),e("html").css({overflow:"hidden"}),z=I),Z.area=z.attr("style")||"",Z.container=k.attr("style")||"",A.fullscreen?(k.css({height:"100%"}),I.append(X)):(k.css({position:"relative"}),z.append(X),I.append(z)),e(k).addClass(A.containerClass),e(z).addClass(A.areaClass),e(X).addClass(A.canvasClass),t.documentElement.style.height="100%",k.css({overflow:"hidden"});var L={position:"absolute",transitionDuration:"0s"};L=e.extend({},A.animation,L),u(z,L),u(z,{top:"50%",left:"50%",perspective:"1000px"}),u(X,L),Y={},f.call(this,"beforeInit",null,{}),E.each(function(e){n.call(I,this,e)}),Y.nextIdNumber=E.length,f.call(this,"afterInit",null,{}),g.call(this,f.call(this,"selectInitialStep","init",{})),A.initClass&&e(E).removeClass(A.initClass)}function c(){return m}function l(t,s){e.isFunction(s)?g[t]?e.error("function "+t+" is already registered."):g[t]=s:h[t]?e.error("callback "+t+" is already registered."):(h[t]=1,m[t]=[])}function u(t,s){var a,r,n={};for(a in s)s.hasOwnProperty(a)&&(r=d(a),null!==r&&(n[r]=s[a]));return e(t).css(n),t}function p(t){function s(e){e=e.split("-");for(var t=1;e.length>t;t++)e[t]=e[t].substr(0,1).toUpperCase()+e[t].substr(1);return e.join("")}if(e(t)[0].dataset)return e.extend({},e(t)[0].dataset);var a={},r=e(t)[0].attributes;return e.each(r,function(e,t){"data-"===t.nodeName.substr(0,5)&&(a[s(t.nodeName.substr(5))]=t.nodeValue)}),a}function f(){return!!e(this).data("jmpressmethods")}var d=function(){var e=t.createElement("dummy").style,s="Webkit Moz O ms Khtml".split(" "),r={};return function(t){if(r[t]===a){var n=t.charAt(0).toUpperCase()+t.substr(1),i=(t+" "+s.join(n+" ")+n).split(" ");r[t]=null;for(var o in i)if(e[i[o]]!==a){r[t]=i[o];break}}return r[t]}}(),m={stepSelector:".step",containerClass:"",canvasClass:"",areaClass:"",notSupportedClass:"not-supported",fullscreen:!0,animation:{transformOrigin:"top left",transitionProperty:n(r(d("transform")))+n(r(d("perspective")))+"opacity",transitionDuration:"1s",transitionDelay:"500ms",transitionTimingFunction:"ease-in-out",transformStyle:"preserve-3d"},transitionDuration:1500},h={beforeChange:1,beforeInitStep:1,initStep:1,beforeInit:1,afterInit:1,beforeDeinit:1,afterDeinit:1,applyStep:1,unapplyStep:1,setInactive:1,beforeActive:1,setActive:1,selectInitialStep:1,selectPrev:1,selectNext:1,selectHome:1,selectEnd:1,idle:1,applyTarget:1};for(var v in h)m[v]=[];var g={init:o,initialized:f,deinit:function(){},css:u,pfx:d,defaults:c,register:l,dataset:p};e.fn.jmpress=function(t){function s(){var s=e(this).data("jmpressmethods");if(s&&s[t])return s[t].apply(this,Array.prototype.slice.call(arguments,1));if(g[t])return g[t].apply(this,Array.prototype.slice.call(arguments,1));if(h[t]&&s){var a=s.settings(),r=Array.prototype.slice.call(arguments,1)[0];e.isFunction(r)&&(a[t]=a[t]||[],a[t].push(r))}else{if("object"==typeof t||!t)return o.apply(this,arguments);e.error("Method "+t+" does not exist on jQuery.jmpress")}return this}var a,r=arguments;return e(this).each(function(e,t){a=s.apply(t,r)}),a},e.extend({jmpress:function(t){if(g[t])return g[t].apply(this,Array.prototype.slice.call(arguments,1));if(h[t]){var s=Array.prototype.slice.call(arguments,1)[0];e.isFunction(s)?m[t].push(s):e.error("Second parameter should be a function: $.jmpress( callbackName, callbackFunction )")}else e.error("Method "+t+" does not exist on jQuery.jmpress")}})})(jQuery,document,window),function(e){"use strict";function t(t,s,a,r){var n;return t.each(function(t,i){return r&&(n=s(i,a,r))?!1:e(i).is(a)?(n=i,!1):!r&&(n=s(i,a,r))?!1:undefined}),n}function s(a,r,n){var i=e(a).children();return n&&(i=e(i.get().reverse())),t(i,s,r,n)}function a(a,r,n){return t(e(a)[n?"prevAll":"nextAll"](),s,r,n)}function r(t,s,r){var n,i=e(t).parents();return i=e(i.get()),e.each(i.get(),function(t,i){return r&&e(i).is(s)?(n=i,!1):(n=a(i,s,r),n?!1:undefined)}),n}e.fn.near=function(t,n){var i=[];return e(this).each(function(e,o){var c=(n?!1:s(o,t,n))||a(o,t,n)||r(o,t,n);c&&i.push(c)}),e(i)}}(jQuery,document,window),function(e,t,s,a){"use strict";function r(e){return Math.round(1e4*e)/1e4+""}var n={3:{transform:function(t,s){var a="translate(-50%,-50%)";e.each(s,function(e,t){var s,n=["X","Y","Z"];if("translate"===t[0])a+=" translate3d("+r(t[1]||0)+"px,"+r(t[2]||0)+"px,"+r(t[3]||0)+"px)";else if("rotate"===t[0]){var i=t[4]?[1,2,3]:[3,2,1];for(s=0;3>s;s++)a+=" rotate"+n[i[s]-1]+"("+r(t[i[s]]||0)+"deg)"}else if("scale"===t[0])for(s=0;3>s;s++)a+=" scale"+n[s]+"("+r(t[s+1]||1)+")"}),e.jmpress("css",t,e.extend({},{transform:a}))}},2:{transform:function(t,s){var a="translate(-50%,-50%)";e.each(s,function(e,t){var s=["X","Y"];if("translate"===t[0])a+=" translate("+r(t[1]||0)+"px,"+r(t[2]||0)+"px)";else if("rotate"===t[0])a+=" rotate("+r(t[3]||0)+"deg)";else if("scale"===t[0])for(var n=0;2>n;n++)a+=" scale"+s[n]+"("+r(t[n+1]||1)+")"}),e.jmpress("css",t,e.extend({},{transform:a}))}},1:{transform:function(t,s){var a={top:0,left:0};e.each(s,function(e,t){"translate"===t[0]&&(a.left=Math.round(t[1]||0)+"px",a.top=Math.round(t[2]||0)+"px")}),t.animate(a,1e3)}}},i=function(){return e.jmpress("pfx","perspective")?n[3]:e.jmpress("pfx","transform")?n[2]:n[1]}();e.jmpress("defaults").reasonableAnimation={},e.jmpress("initStep",function(t,s){var a=s.data,r=s.stepData,n=parseFloat;e.extend(r,{x:n(a.x)||0,y:n(a.y)||0,z:n(a.z)||0,r:n(a.r)||0,phi:n(a.phi)||0,rotate:n(a.rotate)||0,rotateX:n(a.rotateX)||0,rotateY:n(a.rotateY)||0,rotateZ:n(a.rotateZ)||0,revertRotate:!1,scale:n(a.scale)||1,scaleX:n(a.scaleX)||!1,scaleY:n(a.scaleY)||!1,scaleZ:n(a.scaleZ)||1})}),e.jmpress("afterInit",function(t,s){var a=s.settings.stepSelector,r=s.current;r.perspectiveScale=1,r.maxNestedDepth=0;for(var n=e(s.jmpress).find(a).children(a);n.length;)r.maxNestedDepth++,n=n.children(a)}),e.jmpress("applyStep",function(t,s){e.jmpress("css",e(t),{position:"absolute",transformStyle:"preserve-3d"}),s.parents.length>0&&e.jmpress("css",e(t),{top:"50%",left:"50%"});var a=s.stepData,r=[["translate",a.x||a.r*Math.sin(a.phi*Math.PI/180),a.y||-a.r*Math.cos(a.phi*Math.PI/180),a.z],["rotate",a.rotateX,a.rotateY,a.rotateZ||a.rotate,!0],["scale",a.scaleX||a.scale,a.scaleY||a.scale,a.scaleZ||a.scale]];i.transform(t,r)}),e.jmpress("setActive",function(t,s){var r=s.target,n=s.stepData,i=r.transform=[];r.perspectiveScale=1;for(var o=s.current.maxNestedDepth;o>(s.parents.length||0);o--)i.push(["scale"],["rotate"],["translate"]);i.push(["scale",1/(n.scaleX||n.scale),1/(n.scaleY||n.scale),1/n.scaleZ]),i.push(["rotate",-n.rotateX,-n.rotateY,-(n.rotateZ||n.rotate)]),i.push(["translate",-(n.x||n.r*Math.sin(n.phi*Math.PI/180)),-(n.y||-n.r*Math.cos(n.phi*Math.PI/180)),-n.z]),r.perspectiveScale*=n.scaleX||n.scale,e.each(s.parents,function(t,s){var a=e(s).data("stepData");i.push(["scale",1/(a.scaleX||a.scale),1/(a.scaleY||a.scale),1/a.scaleZ]),i.push(["rotate",-a.rotateX,-a.rotateY,-(a.rotateZ||a.rotate)]),i.push(["translate",-(a.x||a.r*Math.sin(a.phi*Math.PI/180)),-(a.y||-a.r*Math.cos(a.phi*Math.PI/180)),-a.z]),r.perspectiveScale*=a.scaleX||a.scale}),e.each(i,function(e,t){function r(r){s.current["rotate"+r+"-"+e]===a&&(s.current["rotate"+r+"-"+e]=t[r]||0);var n=s.current["rotate"+r+"-"+e],i=t[r]||0,o=n%360,c=i%360;0>o&&(o+=360),0>c&&(c+=360);var l=c-o;-180>l?l+=360:l>180&&(l-=360),s.current["rotate"+r+"-"+e]=t[r]=n+l}"rotate"===t[0]&&(r(1),r(2),r(3))})}),e.jmpress("applyTarget",function(t,s){var r,n=s.target,o=(s.stepData,s.settings),c=1.3*n.perspectiveScale<s.current.perspectiveScale,l=n.perspectiveScale>1.3*s.current.perspectiveScale,u=-1;e.each(n.transform,function(e,t){return 1>=t.length||"rotate"===t[0]&&0===t[1]%360&&0===t[2]%360&&0===t[3]%360?a:"scale"!==t[0]?!1:(u=e,a)}),u!==s.current.oldLastScale&&(c=l=!1,s.current.oldLastScale=u);var p=[];if(-1!==u)for(;u>=0;)"scale"===n.transform[u][0]&&(p.push(n.transform[u]),n.transform[u]=["scale"]),u--;var f=o.animation;o.reasonableAnimation[s.reason]&&(f=e.extend({},f,o.reasonableAnimation[s.reason])),r={perspective:Math.round(1e3*n.perspectiveScale)+"px"},r=e.extend({},f,r),c||(r.transitionDelay="0s"),s.beforeActive||(r.transitionDuration="0s",r.transitionDelay="0s"),e.jmpress("css",s.area,r),i.transform(s.area,p),r=e.extend({},f),l||(r.transitionDelay="0s"),s.beforeActive||(r.transitionDuration="0s",r.transitionDelay="0s"),s.current.perspectiveScale=n.perspectiveScale,e.jmpress("css",s.canvas,r),i.transform(s.canvas,n.transform)})}(jQuery,document,window),function(e){"use strict";var t=e.jmpress,s="activeClass",a="nestedActiveClass",r=t("defaults");r[a]="nested-active",r[s]="active",t("setInactive",function(t,r){var n=r.settings,i=n[s],o=n[a];i&&e(t).removeClass(i),o&&e.each(r.parents,function(t,s){e(s).removeClass(o)})}),t("setActive",function(t,r){var n=r.settings,i=n[s],o=n[a];i&&e(t).addClass(i),o&&e.each(r.parents,function(t,s){e(s).addClass(o)})})}(jQuery,document,window),function(e){"use strict";function t(t,s){return e(this).find(s.settings.stepSelector).first()}function s(t,s,a,r){if(!s)return!1;var n=a.settings.stepSelector;s=e(s);do{var i=s.near(n,r);if((0===i.length||0===i.closest(t).length)&&(i=e(t).find(n)[r?"last":"first"]()),!i.length)return!1;s=i}while(s.data("stepData").exclude);return s}var a=e.jmpress;a("initStep",function(e,t){t.stepData.exclude=t.data.exclude&&-1===["false","no"].indexOf(t.data.exclude)}),a("selectInitialStep",t),a("selectHome",t),a("selectEnd",function(t,s){return e(this).find(s.settings.stepSelector).last()}),a("selectPrev",function(e,t){return s(this,e,t,!0)}),a("selectNext",function(e,t){return s(this,e,t)})}(jQuery,document,window),function(e){"use strict";e.jmpress("selectInitialStep",function(e,t){return t.settings.start})}(jQuery,document,window),function(e){"use strict";function t(t,s,a){for(var r=0;s.length-1>r;r++){var n=s[r],i=s[r+1];e(t).jmpress("initialized")?e(n,t).data("stepData")[a]=i:e(n,t).attr("data-"+a,i)}}function s(t,s,a,r){var n=s.stepData;if(n[a]){var i=e(t).near(n[a],r);if(i&&i.length)return i;if(i=e(n[a],this)[r?"last":"first"](),i&&i.length)return i}}var a=e.jmpress;a("register","route",function(e,s,a){"string"==typeof e&&(e=[e,e]),t(this,e,a?"prev":"next"),s||t(this,e.reverse(),a?"next":"prev")}),a("initStep",function(e,t){for(var s in{next:1,prev:1})t.stepData[s]=t.data[s]}),a("selectNext",function(e,t){return s.call(this,e,t,"next")}),a("selectPrev",function(e,t){return s.call(this,e,t,"prev",!0)})}(jQuery,document,window),function(e){"use strict";var t=e.jmpress,s="ajax:afterStepLoaded",a="ajax:loadStep";t("register",a),t("register",s),t("defaults").ajaxLoadedClass="loaded",t("initStep",function(t,s){s.stepData.src=e(t).attr("href")||s.data.src||!1,s.stepData.srcLoaded=!1}),t(a,function(t,a){var r=a.stepData,n=r&&r.src,i=a.settings;n&&(e(t).addClass(i.ajaxLoadedClass),r.srcLoaded=!0,e(t).load(n,function(r,n,i){e(a.jmpress).jmpress("fire",s,t,e.extend({},a,{response:r,status:n,xhr:i}))}))}),t("idle",function(t,s){if(t){var r=s.settings,n=e(this);s.stepData;var i=e(t).add(e(t).near(r.stepSelector)).add(e(t).near(r.stepSelector,!0)).add(n.jmpress("fire","selectPrev",t,{stepData:e(t).data("stepData")})).add(n.jmpress("fire","selectNext",t,{stepData:e(t).data("stepData")}));i.each(function(){var t=this,s=e(t).data("stepData");s.src&&!s.srcLoaded&&n.jmpress("fire",a,t,{stepData:e(t).data("stepData")})})}}),t("setActive",function(t){var s=e(t).data("stepData");s.src&&!s.srcLoaded&&e(this).jmpress("fire",a,t,{stepData:e(t).data("stepData")})})}(jQuery,document,window),function(e,t,s,a){"use strict";function r(){return""+Math.round(1e5*Math.random(),0)}function n(t){try{var r=e("#"+s.location.hash.replace(/^#\/?/,""));return r.length>0&&r.is(t.stepSelector)?r:a}catch(n){}}function i(e){var t="#/"+e;s.history&&s.history.pushState?s.location.hash!==t&&s.history.pushState({},"",t):s.location.hash!==t&&(s.location.hash=t)}var o=e.jmpress,c="a[href^=#]";o("defaults").hash={use:!0,update:!0,bindChange:!0},o("selectInitialStep",function(t,o){var l=o.settings,u=l.hash,p=o.current,f=e(this);return o.current.hashNamespace=".jmpress-"+r(),u.use?(u.bindChange&&(e(s).bind("hashchange"+p.hashNamespace,function(e){var t=n(l);f.jmpress("initialized")&&f.jmpress("scrollFix"),t&&t.length&&(t.attr("id")!==f.jmpress("active").attr("id")&&f.jmpress("select",t),i(t.attr("id"))),e.preventDefault()}),e(c).on("click"+p.hashNamespace,function(t){var s=e(this).attr("href");try{e(s).is(l.stepSelector)&&(f.jmpress("select",s),t.preventDefault(),t.stopPropagation())}catch(a){}})),n(l)):a}),o("afterDeinit",function(t,a){e(c).off(a.current.hashNamespace),e(s).unbind(a.current.hashNamespace)}),o("setActive",function(t,s){var a=s.settings,r=s.current;a.hash.use&&a.hash.update&&(clearTimeout(r.hashtimeout),r.hashtimeout=setTimeout(function(){i(e(s.delegatedFrom).attr("id"))},a.transitionDuration+200))})}(jQuery,document,window),function(e,t,s,a){"use strict";function r(){return""+Math.round(1e5*Math.random(),0)}function n(e){e.preventDefault(),e.stopPropagation()}var i=e.jmpress,o="next",c="prev";i("defaults").keyboard={use:!0,keys:{33:c,37:c,38:c,9:o+":"+c,32:o,34:o,39:o,40:o,36:"home",35:"end"},ignore:{INPUT:[32,37,38,39,40],TEXTAREA:[32,37,38,39,40],SELECT:[38,40]},tabSelector:"a[href]:visible, :input:visible"},i("afterInit",function(s,i){var o=i.settings,c=o.keyboard,l=c.ignore,u=i.current,p=e(this);o.fullscreen||p.attr("tabindex",0),u.keyboardNamespace=".jmpress-"+r(),e(o.fullscreen?t:p).bind("keypress"+u.keyboardNamespace,function(e){for(var t in l)if(e.target.nodeName===t&&-1!==l[t].indexOf(e.which))return;(e.which>=37&&40>=e.which||32===e.which)&&n(e)}),e(o.fullscreen?t:p).bind("keydown"+u.keyboardNamespace,function(t){var s=e(t.target);if((o.fullscreen||s.closest(p).length)&&c.use){for(var r in l)if(s[0].nodeName===r&&-1!==l[r].indexOf(t.which))return;var i,u=!1;if(9===t.which){if(s.closest(p.jmpress("active")).length?(i=s.near(c.tabSelector,t.shiftKey),e(i).closest(o.stepSelector).is(p.jmpress("active"))||(i=a)):t.shiftKey?u=!0:i=p.jmpress("active").find("a[href], :input").filter(":visible").first(),i&&i.length>0)return i.focus(),p.jmpress("scrollFix"),n(t),a;t.shiftKey&&(u=!0)}var f=c.keys[t.which];"string"==typeof f?(-1!==f.indexOf(":")&&(f=f.split(":"),f=t.shiftKey?f[1]:f[0]),p.jmpress(f),n(t)):e.isFunction(f)?f.call(p,t):f&&(p.jmpress.apply(p,f),n(t)),u&&(i=p.jmpress("active").find("a[href], :input").filter(":visible").last(),i.focus(),p.jmpress("scrollFix"))}})}),i("afterDeinit",function(s,a){e(t).unbind(a.current.keyboardNamespace)})}(jQuery,document,window),function(e,t,s,a){"use strict";function r(){return""+Math.round(1e5*Math.random(),0)}function n(e,t){return Math.max(Math.min(e,t),-t)}function i(t,s,a){var r=e(this).jmpress("current"),i=e(this).jmpress("settings"),o=e(this).jmpress("active").data("stepData"),c=e(this).jmpress("container");if(!(0===r.userZoom&&0>a)){var l=o.viewPortZoomable||i.viewPort.zoomable;if(!(r.userZoom===l&&a>0)){r.userZoom+=a;var u=e(c).innerWidth()/2,p=e(c).innerHeight()/2;t=t?t-u:t,s=s?s-p:s,r.userTranslateX=n(r.userTranslateX-a*t/r.zoomOriginWindowScale/l,u*r.userZoom*r.userZoom/l),r.userTranslateY=n(r.userTranslateY-a*s/r.zoomOriginWindowScale/l,p*r.userZoom*r.userZoom/l),e(this).jmpress("reselect","zoom")}}}var o=function(){var e=navigator.userAgent.toLowerCase(),t=/(chrome)[ \/]([\w.]+)/.exec(e)||/(webkit)[ \/]([\w.]+)/.exec(e)||/(opera)(?:.*version|)[ \/]([\w.]+)/.exec(e)||/(msie) ([\w.]+)/.exec(e)||0>e.indexOf("compatible")&&/(mozilla)(?:.*? rv:([\w.]+)|)/.exec(e)||[];return t[1]||""}(),c=e.jmpress("defaults");c.viewPort={width:!1,height:!1,maxScale:0,minScale:0,zoomable:0,zoomBindMove:!0,zoomBindWheel:!0};var l=c.keyboard.keys;l["mozilla"===o?107:187]="zoomIn",l["mozilla"===o?109:189]="zoomOut",c.reasonableAnimation.resize={transitionDuration:"0s",transitionDelay:"0ms"},c.reasonableAnimation.zoom={transitionDuration:"0s",transitionDelay:"0ms"},e.jmpress("initStep",function(e,t){for(var s in{viewPortHeight:1,viewPortWidth:1,viewPortMinScale:1,viewPortMaxScale:1,viewPortZoomable:1})t.stepData[s]=t.data[s]&&parseFloat(t.data[s])}),e.jmpress("afterInit",function(n,i){var o=this;i.current.viewPortNamespace=".jmpress-"+r(),e(s).bind("resize"+i.current.viewPortNamespace,function(){e(o).jmpress("reselect","resize")}),i.current.userZoom=0,i.current.userTranslateX=0,i.current.userTranslateY=0,i.settings.viewPort.zoomBindWheel&&e(i.settings.fullscreen?t:this).bind("mousewheel"+i.current.viewPortNamespace+" DOMMouseScroll"+i.current.viewPortNamespace,function(t,s){s=s||t.originalEvent.wheelDelta||-t.originalEvent.detail;var a=s/Math.abs(s);return 0>a?e(i.jmpress).jmpress("zoomOut",t.originalEvent.x,t.originalEvent.y):a>0&&e(i.jmpress).jmpress("zoomIn",t.originalEvent.x,t.originalEvent.y),!1}),i.settings.viewPort.zoomBindMove&&e(i.settings.fullscreen?t:this).bind("mousedown"+i.current.viewPortNamespace,function(e){i.current.userZoom&&(i.current.userTranslating={x:e.clientX,y:e.clientY},e.preventDefault(),e.stopImmediatePropagation())}).bind("mousemove"+i.current.viewPortNamespace,function(t){var s=i.current.userTranslating;s&&(e(o).jmpress("zoomTranslate",t.clientX-s.x,t.clientY-s.y),s.x=t.clientX,s.y=t.clientY,t.preventDefault(),t.stopImmediatePropagation())}).bind("mouseup"+i.current.viewPortNamespace,function(e){i.current.userTranslating&&(i.current.userTranslating=a,e.preventDefault(),e.stopImmediatePropagation())})}),e.jmpress("register","zoomIn",function(e,t){i.call(this,e||0,t||0,1)}),e.jmpress("register","zoomOut",function(e,t){i.call(this,e||0,t||0,-1)}),e.jmpress("register","zoomTranslate",function(t,s){var a=e(this).jmpress("current"),r=e(this).jmpress("settings"),i=e(this).jmpress("active").data("stepData"),o=e(this).jmpress("container"),c=i.viewPortZoomable||r.viewPort.zoomable,l=e(o).innerWidth(),u=e(o).innerHeight();a.userTranslateX=n(a.userTranslateX+t/a.zoomOriginWindowScale,l*a.userZoom*a.userZoom/c),a.userTranslateY=n(a.userTranslateY+s/a.zoomOriginWindowScale,u*a.userZoom*a.userZoom/c),e(this).jmpress("reselect","zoom")}),e.jmpress("afterDeinit",function(a,r){e(r.settings.fullscreen?t:this).unbind(r.current.viewPortNamespace),e(s).unbind(r.current.viewPortNamespace)}),e.jmpress("setActive",function(t,s){var a=s.settings.viewPort,r=s.stepData.viewPortHeight||a.height,n=s.stepData.viewPortWidth||a.width,i=s.stepData.viewPortMaxScale||a.maxScale,o=s.stepData.viewPortMinScale||a.minScale,c=r&&e(s.container).innerHeight()/r,l=n&&e(s.container).innerWidth()/n,u=(l||c)&&Math.min(l||c,c||l);if(u){u=u||1,i&&(u=Math.min(u,i)),o&&(u=Math.max(u,o));var p=s.stepData.viewPortZoomable||s.settings.viewPort.zoomable;if(p){var f=1/u-1/i;f/=p,u=1/(1/u-f*s.current.userZoom)}s.target.transform.reverse(),s.current.userTranslateX&&s.current.userTranslateY?s.target.transform.push(["translate",s.current.userTranslateX,s.current.userTranslateY,0]):s.target.transform.push(["translate"]),s.target.transform.push(["scale",u,u,1]),s.target.transform.reverse(),s.target.perspectiveScale/=u}s.current.zoomOriginWindowScale=u}),e.jmpress("setInactive",function(t,s){s.nextStep&&t&&e(s.nextStep).attr("id")===e(t).attr("id")||(s.current.userZoom=0,s.current.userTranslateX=0,s.current.userTranslateY=0)})}(jQuery,document,window),function(e){"use strict";function t(){return""+Math.round(1e5*Math.random(),0)}var s=e.jmpress;s("defaults").mouse={clickSelects:!0},s("afterInit",function(s,a){var r=a.settings,n=r.stepSelector,i=a.current,o=e(this);i.clickableStepsNamespace=".jmpress-"+t(),o.bind("click"+i.clickableStepsNamespace,function(t){if(r.mouse.clickSelects&&!i.userZoom){var s=e(t.target).closest(n);s.is(o.jmpress("active"))||s.length&&(o.jmpress("select",s[0],"click"),t.preventDefault(),t.stopPropagation())}})}),s("afterDeinit",function(t,s){e(this).unbind(s.current.clickableStepsNamespace)})}(jQuery,document,window),function(e,t){"use strict";function s(){return""+Math.round(1e5*Math.random(),0)}var a=e.jmpress;a("afterInit",function(a,r){var n=r.settings,i=r.current,o=r.jmpress;i.mobileNamespace=".jmpress-"+s();var c,l=[0,0];e(n.fullscreen?t:o).bind("touchstart"+i.mobileNamespace,function(e){c=e.originalEvent.touches[0],l=[c.pageX,c.pageY]}).bind("touchmove"+i.mobileNamespace,function(e){return c=e.originalEvent.touches[0],e.preventDefault(),!1}).bind("touchend"+i.mobileNamespace,function(t){var s=[c.pageX,c.pageY],a=[s[0]-l[0],s[1]-l[1]];return Math.max(Math.abs(a[0]),Math.abs(a[1]))>50?(a=Math.abs(a[0])>Math.abs(a[1])?a[0]:a[1],e(o).jmpress(a>0?"prev":"next"),t.preventDefault(),!1):undefined})}),a("afterDeinit",function(s,a){var r=a.settings,n=a.current,i=a.jmpress;e(r.fullscreen?t:i).unbind(n.mobileNamespace)})}(jQuery,document,window),function(e,t,s,a){"use strict";function r(t,s,n){for(var i in s){var o=i;n&&(o=n+o.substr(0,1).toUpperCase()+o.substr(1)),e.isPlainObject(s[i])?r(t,s[i],o):t[o]===a&&(t[o]=s[i])}}function n(t,s){e.isArray(s)?s.length<t.length?e.error("more nested steps than children in template"):t.each(function(t,a){a=e(a);var n=a.data(l)||{};r(n,s[t]),a.data(l,n)}):e.isFunction(s)&&t.each(function(a,n){n=e(n);var i=n.data(l)||{};r(i,s(a,n,t)),n.data(l,i)})}function i(e,t,s,a){if(s.children){var r=t.children(a.settings.stepSelector);n(r,s.children)}o(e,s)}function o(e,t){r(e,t)}var c=e.jmpress,l="_template_",u="_applied_template_",p={};c("beforeInitStep",function(t,s){t=e(t);var a=s.data,r=a.template,n=t.data(u),o=t.data(l);r&&e.each(r.split(" "),function(e,r){var n=p[r];i(a,t,n,s)}),n&&i(a,t,n,s),o&&(i(a,t,o,s),t.data(l,null),o.template&&e.each(o.template.split(" "),function(e,r){var n=p[r];i(a,t,n,s)}))}),c("beforeInit",function(t,s){var a=c("dataset",this),r=a.template,i=s.settings.stepSelector;if(r){var o=p[r];n(e(this).find(i).filter(function(){return!e(this).parent().is(i)}),o.children)}}),c("register","template",function(t,s){p[t]=p[t]?e.extend(!0,{},p[t],s):e.extend(!0,{},s)}),c("register","apply",function(t,s){if(s)if(e.isArray(s))n(e(t),s);else{var a;a="string"==typeof s?p[s]:e.extend(!0,{},s),e(t).each(function(t,s){s=e(s);var n=s.data(u)||{};r(n,a),s.data(u,n)})}else{var i=e(this).jmpress("settings").stepSelector;n(e(this).find(i).filter(function(){return!e(this).parent().is(i)}),t)}})}(jQuery,document,window),function(e){"use strict";e.jmpress("setActive",function(t,s){s.prevStep!==t&&e(t).triggerHandler("enterStep")}),e.jmpress("setInactive",function(t,s){s.nextStep!==t&&e(t).triggerHandler("leaveStep")})}(jQuery,document,window),function(e,t,s,a){"use strict";function r(t){for(var s=t.split(" "),a=s[0],r={willClass:"will-"+a,doClass:"do-"+a,hasClass:"has-"+a},n="",i=1;s.length>i;i++){var o=s[i];switch(n){case"":"after"===o?n="after":e.warn("unknown keyword in '"+t+"'. '"+o+"' unknown.");break;case"after":if(o.match(/^[1-9][0-9]*m?s?/)){var c=parseFloat(o);-1!==o.indexOf("ms")?c*=1:-1!==o.indexOf("s")?c*=1e3:-1!==o.indexOf("m")&&(c*=6e4),r.delay=c}else r.after=Array.prototype.slice.call(s,i).join(" "),i=s.length}}return r}function n(t,s,a,r){r=r||t.length-1,a=a||0;for(var n=a;r+1>n;n++)if(e(t[n].element).is(s))return n}function i(t,s,a){e.each(s._on,function(e,s){t.push({substep:s.substep,delay:s.delay+a}),i(t,s.substep,s.delay+a)})}e.jmpress("defaults").customAnimationDataAttribute="jmpress",e.jmpress("afterInit",function(e,t){t.current.animationTimeouts=[],t.current.animationCleanupWaiting=[]}),e.jmpress("applyStep",function(t,s){function o(e,t){return t.substep._after?(u=t.substep._after,!1):a}var c={},l=[];if(e(t).find("[data-"+s.settings.customAnimationDataAttribute+"]").each(function(a,r){e(r).closest(s.settings.stepSelector).is(t)&&l.push({element:r})}),0!==l.length){e.each(l,function(t,a){a.info=r(e(a.element).data(s.settings.customAnimationDataAttribute)),e(a.element).addClass(a.info.willClass),a._on=[],a._after=null});var u={_after:a,_on:[],info:{}};if(e.each(l,function(e,t){var s=t.info.after;if(s)if("step"===s)s=u;else if("prev"===s)s=l[e-1];else{var r=n(l,s,0,e-1);r===a&&(r=n(l,s)),s=r===a||r===e?l[e-1]:l[r]}else s=l[e-1];if(s){if(!t.info.delay){if(!s._after)return s._after=t,a;s=s._after}s._on.push({substep:t,delay:t.info.delay||0})}}),u._after===a&&0===u._on.length){var p=n(l,s.stepData.startSubstep)||0;u._after=l[p]}var f=[];do{var d=[{substep:u,delay:0}];i(d,u,0),f.push(d),u=null,e.each(d,o)}while(u);c.list=f,e(t).data("substepsData",c)}}),e.jmpress("unapplyStep",function(t){var s=e(t).data("substepsData");s&&e.each(s.list,function(t,s){e.each(s,function(t,s){s.substep.info.willClass&&e(s.substep.element).removeClass(s.substep.info.willClass),s.substep.info.hasClass&&e(s.substep.element).removeClass(s.substep.info.hasClass),s.substep.info.doClass&&e(s.substep.element).removeClass(s.substep.info.doClass)})})}),e.jmpress("setActive",function(t,s){var r=e(t).data("substepsData");if(r){s.substep===a&&(s.substep="prev"===s.reason?r.list.length-1:0);var n=s.substep;e.each(s.current.animationTimeouts,function(e,t){clearTimeout(t)}),s.current.animationTimeouts=[],e.each(r.list,function(t,a){var r=n>t,i=n>=t;e.each(a,function(t,a){function n(){e(a.substep.element).addClass(a.substep.info.doClass)}a.substep.info.hasClass&&e(a.substep.element)[(r?"add":"remove")+"Class"](a.substep.info.hasClass),i&&!r&&a.delay&&"prev"!==s.reason?a.substep.info.doClass&&(e(a.substep.element).removeClass(a.substep.info.doClass),s.current.animationTimeouts.push(setTimeout(n,a.delay))):a.substep.info.doClass&&e(a.substep.element)[(i?"add":"remove")+"Class"](a.substep.info.doClass)})})}}),e.jmpress("setInactive",function(t,s){function a(t){e.each(t.list,function(t,s){e.each(s,function(t,s){s.substep.info.hasClass&&e(s.substep.element).removeClass(s.substep.info.hasClass),s.substep.info.doClass&&e(s.substep.element).removeClass(s.substep.info.doClass)})})}if(s.nextStep!==t){e.each(s.current.animationCleanupWaiting,function(e,t){a(t)}),s.current.animationCleanupWaiting=[];var r=e(t).data("substepsData");r&&s.current.animationCleanupWaiting.push(r)}}),e.jmpress("selectNext",function(t,s){if(s.substep!==a){var r=e(t).data("substepsData");if(r)return s.substep<r.list.length-1?{step:t,substep:s.substep+1}:a}}),e.jmpress("selectPrev",function(t,s){if(s.substep!==a){var r=e(t).data("substepsData");if(r)return s.substep>0?{step:t,substep:s.substep-1}:a}})}(jQuery,document,window),function(e,t){"use strict";e.jmpress("register","toggle",function(s,a,r){var n=this;e(t).bind("keydown",function(t){t.keyCode===s&&(e(n).jmpress("initialized")?e(n).jmpress("deinit"):e(n).jmpress(a))}),r&&e(n).jmpress(a)})}(jQuery,document,window),function(e){"use strict";function t(t,s,a){if(t.secondary&&-1!==t.secondary.split(" ").indexOf(s)){for(var r in t)if(r.length>9&&0===r.indexOf("secondary")){var n=t[r],i=r.substr(9);i=i.substr(0,1).toLowerCase()+i.substr(1),t[r]=t[i],t[i]=n}e(this).jmpress("reapply",e(a))}}e.jmpress("initStep",function(e,t){for(var s in t.data)0===s.indexOf("secondary")&&(t.stepData[s]=t.data[s])}),e.jmpress("beforeActive",function(s,a){t.call(a.jmpress,e(s).data("stepData"),"self",s);var r=e(s).parent();e(r).children(a.settings.stepSelector).each(function(s,r){var n=e(r).data("stepData");t.call(a.jmpress,n,"siblings",r)});for(var n=1;a.parents.length>n;n++)e(a.parents[n]).children(a.settings.stepSelector).each()}),e.jmpress("setInactive",function(s,a){function r(s,r){var n=e(r).data("stepData");t.call(a.jmpress,n,"grandchildren",r)}t.call(a.jmpress,e(s).data("stepData"),"self",s);
var n=e(s).parent();e(n).children(a.settings.stepSelector).each(function(s,r){var n=e(r).data("stepData");t.call(a.jmpress,n,"siblings",r)});for(var i=1;a.parents.length>i;i++)e(a.parents[i]).children(a.settings.stepSelector).each(r)})}(jQuery,document,window),function(e,t,s,a){"use strict";e.jmpress("defaults").duration={defaultValue:-1,defaultAction:"next",barSelector:a,barProperty:"width",barPropertyStart:"0",barPropertyEnd:"100%"},e.jmpress("initStep",function(e,t){t.stepData.duration=t.data.duration&&parseInt(t.data.duration,10),t.stepData.durationAction=t.data.durationAction}),e.jmpress("setInactive",function(t,s){var a=s.settings,r=a.duration,n=s.current;if(s.stepData.duration||r.defaultValue,n.durationTimeout){if(r.barSelector){var i={transitionProperty:r.barProperty,transitionDuration:"0",transitionDelay:"0",transitionTimingFunction:"linear"};i[r.barProperty]=r.barPropertyStart;var o=e(r.barSelector);e.jmpress("css",o,i),o.each(function(t,s){var a=e(s).next(),r=e(s).parent();e(s).detach(),a.length?a.insertBefore(s):r.append(s)})}clearTimeout(n.durationTimeout),delete n.durationTimeout}}),e.jmpress("setActive",function(t,s){var r=s.settings,n=r.duration,i=s.current,o=s.stepData.duration||n.defaultValue;if(o&&o>0){if(n.barSelector){var c={transitionProperty:n.barProperty,transitionDuration:o-2*r.transitionDuration/3-100+"ms",transitionDelay:2*r.transitionDuration/3+"ms",transitionTimingFunction:"linear"};c[n.barProperty]=n.barPropertyEnd,e.jmpress("css",e(n.barSelector),c)}var l=this;i.durationTimeout&&(clearTimeout(i.durationTimeout),i.durationTimeout=a),i.durationTimeout=setTimeout(function(){var t=s.stepData.durationAction||n.defaultAction;e(l).jmpress(t)},o)}})}(jQuery,document,window),function(e,t,s){"use strict";var a=e.jmpress,r="jmpress-presentation-";a("defaults").presentationMode={use:!0,url:"presentation-screen.html",notesUrl:!1,transferredValues:["userZoom","userTranslateX","userTranslateY"]},a("defaults").keyboard.keys[80]="presentationPopup",a("afterInit",function(t,a){var n=a.current;if(n.selectMessageListeners=[],a.settings.presentationMode.use){s.addEventListener("message",function(t){try{if("string"!=typeof t.data||0!==t.data.indexOf(r))return;var i=JSON.parse(t.data.slice(r.length));switch(i.type){case"select":e.each(a.settings.presentationMode.transferredValues,function(e,t){a.current[t]=i[t]}),/[a-z0-9\-]+/i.test(i.targetId)&&typeof i.substep in{number:1,undefined:1}?e(a.jmpress).jmpress("select",{step:"#"+i.targetId,substep:i.substep},i.reason):e.error("For security reasons the targetId must match /[a-z0-9\\-]+/i and substep must be a number.");break;case"listen":n.selectMessageListeners.push(t.source);break;case"ok":clearTimeout(n.presentationPopupTimeout);break;case"read":try{t.source.postMessage(r+JSON.stringify({type:"url",url:s.location.href,notesUrl:a.settings.presentationMode.notesUrl}),"*")}catch(o){e.error("Cannot post message to source: "+o)}break;default:throw"Unknown message type: "+i.type}}catch(o){e.error("Received message is malformed: "+o)}});try{s.parent&&s.parent!==s&&s.parent.postMessage(r+JSON.stringify({type:"afterInit"}),"*")}catch(i){e.error("Cannot post message to parent: "+i)}}}),a("afterDeinit",function(t,a){if(a.settings.presentationMode.use)try{s.parent&&s.parent!==s&&s.parent.postMessage(r+JSON.stringify({type:"afterDeinit"}),"*")}catch(n){e.error("Cannot post message to parent: "+n)}}),a("setActive",function(t,s){var a=e(s.delegatedFrom).attr("id"),n=s.substep,i=s.reason;e.each(s.current.selectMessageListeners,function(t,o){try{var c={type:"select",targetId:a,substep:n,reason:i};e.each(s.settings.presentationMode.transferredValues,function(e,t){c[t]=s.current[t]}),o.postMessage(r+JSON.stringify(c),"*")}catch(l){e.error("Cannot post message to listener: "+l)}})}),a("register","presentationPopup",function(){function t(){n.jmpress("current").presentationPopupTimeout=setTimeout(t,100);try{a.postMessage(r+JSON.stringify({type:"url",url:s.location.href,notesUrl:n.jmpress("settings").presentationMode.notesUrl}),"*")}catch(e){}}var a,n=e(this);n.jmpress("settings").presentationMode.use&&(a=s.open(e(this).jmpress("settings").presentationMode.url),n.jmpress("current").presentationPopupTimeout=setTimeout(t,100))})}(jQuery,document,window);

} /* end modules/shortcodes/js/jmpress.min.js */

if ( jpconcat.files['modules/shortcodes/js/jquery.cycle.js'] ) {

/*!
 * jQuery Cycle Plugin (with Transition Definitions)
 * Examples and documentation at: http://jquery.malsup.com/cycle/
 * Copyright (c) 2007-2010 M. Alsup
 * Version: 2.9999.8 (26-OCT-2012)
 * Dual licensed under the MIT and GPL licenses.
 * http://jquery.malsup.com/license.html
 * Requires: jQuery v1.3.2 or later
 */
;(function($, undefined) {
"use strict";

var ver = '2.9999.8';

// if $.support is not defined (pre jQuery 1.3) add what I need
if ($.support === undefined) {
	$.support = {
		opacity: !($.browser.msie)
	};
}

function debug(s) {
	if ($.fn.cycle.debug)
		log(s);
}
function log() {
	if (window.console && console.log)
		console.log('[cycle] ' + Array.prototype.join.call(arguments,' '));
}
$.expr[':'].paused = function(el) {
	return el.cyclePause;
};


// the options arg can be...
//   a number  - indicates an immediate transition should occur to the given slide index
//   a string  - 'pause', 'resume', 'toggle', 'next', 'prev', 'stop', 'destroy' or the name of a transition effect (ie, 'fade', 'zoom', etc)
//   an object - properties to control the slideshow
//
// the arg2 arg can be...
//   the name of an fx (only used in conjunction with a numeric value for 'options')
//   the value true (only used in first arg == 'resume') and indicates
//	 that the resume should occur immediately (not wait for next timeout)

$.fn.cycle = function(options, arg2) {
	var o = { s: this.selector, c: this.context };

	// in 1.3+ we can fix mistakes with the ready state
	if (this.length === 0 && options != 'stop') {
		if (!$.isReady && o.s) {
			log('DOM not ready, queuing slideshow');
			$(function() {
				$(o.s,o.c).cycle(options,arg2);
			});
			return this;
		}
		// is your DOM ready?  http://docs.jquery.com/Tutorials:Introducing_$(document).ready()
		log('terminating; zero elements found by selector' + ($.isReady ? '' : ' (DOM not ready)'));
		return this;
	}

	// iterate the matched nodeset
	return this.each(function() {
		var opts = handleArguments(this, options, arg2);
		if (opts === false)
			return;

		opts.updateActivePagerLink = opts.updateActivePagerLink || $.fn.cycle.updateActivePagerLink;

		// stop existing slideshow for this container (if there is one)
		if (this.cycleTimeout)
			clearTimeout(this.cycleTimeout);
		this.cycleTimeout = this.cyclePause = 0;
		this.cycleStop = 0; // issue #108

		var $cont = $(this);
		var $slides = opts.slideExpr ? $(opts.slideExpr, this) : $cont.children();
		var els = $slides.get();

		if (els.length < 2) {
			log('terminating; too few slides: ' + els.length);
			return;
		}

		var opts2 = buildOptions($cont, $slides, els, opts, o);
		if (opts2 === false)
			return;

		var startTime = opts2.continuous ? 10 : getTimeout(els[opts2.currSlide], els[opts2.nextSlide], opts2, !opts2.backwards);

		// if it's an auto slideshow, kick it off
		if (startTime) {
			startTime += (opts2.delay || 0);
			if (startTime < 10)
				startTime = 10;
			debug('first timeout: ' + startTime);
			this.cycleTimeout = setTimeout(function(){go(els,opts2,0,!opts.backwards);}, startTime);
		}
	});
};

function triggerPause(cont, byHover, onPager) {
	var opts = $(cont).data('cycle.opts');
	if (!opts)
		return;
	var paused = !!cont.cyclePause;
	if (paused && opts.paused)
		opts.paused(cont, opts, byHover, onPager);
	else if (!paused && opts.resumed)
		opts.resumed(cont, opts, byHover, onPager);
}

// process the args that were passed to the plugin fn
function handleArguments(cont, options, arg2) {
	if (cont.cycleStop === undefined)
		cont.cycleStop = 0;
	if (options === undefined || options === null)
		options = {};
	if (options.constructor == String) {
		switch(options) {
		case 'destroy':
		case 'stop':
			var opts = $(cont).data('cycle.opts');
			if (!opts)
				return false;
			cont.cycleStop++; // callbacks look for change
			if (cont.cycleTimeout)
				clearTimeout(cont.cycleTimeout);
			cont.cycleTimeout = 0;
			if (opts.elements)
				$(opts.elements).stop();
			$(cont).removeData('cycle.opts');
			if (options == 'destroy')
				destroy(cont, opts);
			return false;
		case 'toggle':
			cont.cyclePause = (cont.cyclePause === 1) ? 0 : 1;
			checkInstantResume(cont.cyclePause, arg2, cont);
			triggerPause(cont);
			return false;
		case 'pause':
			cont.cyclePause = 1;
			triggerPause(cont);
			return false;
		case 'resume':
			cont.cyclePause = 0;
			checkInstantResume(false, arg2, cont);
			triggerPause(cont);
			return false;
		case 'prev':
		case 'next':
			opts = $(cont).data('cycle.opts');
			if (!opts) {
				log('options not found, "prev/next" ignored');
				return false;
			}
			$.fn.cycle[options](opts);
			return false;
		default:
			options = { fx: options };
		}
		return options;
	}
	else if (options.constructor == Number) {
		// go to the requested slide
		var num = options;
		options = $(cont).data('cycle.opts');
		if (!options) {
			log('options not found, can not advance slide');
			return false;
		}
		if (num < 0 || num >= options.elements.length) {
			log('invalid slide index: ' + num);
			return false;
		}
		options.nextSlide = num;
		if (cont.cycleTimeout) {
			clearTimeout(cont.cycleTimeout);
			cont.cycleTimeout = 0;
		}
		if (typeof arg2 == 'string')
			options.oneTimeFx = arg2;
		go(options.elements, options, 1, num >= options.currSlide);
		return false;
	}
	return options;

	function checkInstantResume(isPaused, arg2, cont) {
		if (!isPaused && arg2 === true) { // resume now!
			var options = $(cont).data('cycle.opts');
			if (!options) {
				log('options not found, can not resume');
				return false;
			}
			if (cont.cycleTimeout) {
				clearTimeout(cont.cycleTimeout);
				cont.cycleTimeout = 0;
			}
			go(options.elements, options, 1, !options.backwards);
		}
	}
}

function removeFilter(el, opts) {
	if (!$.support.opacity && opts.cleartype && el.style.filter) {
		try { el.style.removeAttribute('filter'); }
		catch(smother) {} // handle old opera versions
	}
}

// unbind event handlers
function destroy(cont, opts) {
	if (opts.next)
		$(opts.next).unbind(opts.prevNextEvent);
	if (opts.prev)
		$(opts.prev).unbind(opts.prevNextEvent);

	if (opts.pager || opts.pagerAnchorBuilder)
		$.each(opts.pagerAnchors || [], function() {
			this.unbind().remove();
		});
	opts.pagerAnchors = null;
	$(cont).unbind('mouseenter.cycle mouseleave.cycle');
	if (opts.destroy) // callback
		opts.destroy(opts);
}

// one-time initialization
function buildOptions($cont, $slides, els, options, o) {
	var startingSlideSpecified;
	// support metadata plugin (v1.0 and v2.0)
	var opts = $.extend({}, $.fn.cycle.defaults, options || {}, $.metadata ? $cont.metadata() : $.meta ? $cont.data() : {});
	var meta = $.isFunction($cont.data) ? $cont.data(opts.metaAttr) : null;
	if (meta)
		opts = $.extend(opts, meta);
	if (opts.autostop)
		opts.countdown = opts.autostopCount || els.length;

	var cont = $cont[0];
	$cont.data('cycle.opts', opts);
	opts.$cont = $cont;
	opts.stopCount = cont.cycleStop;
	opts.elements = els;
	opts.before = opts.before ? [opts.before] : [];
	opts.after = opts.after ? [opts.after] : [];

	// push some after callbacks
	if (!$.support.opacity && opts.cleartype)
		opts.after.push(function() { removeFilter(this, opts); });
	if (opts.continuous)
		opts.after.push(function() { go(els,opts,0,!opts.backwards); });

	saveOriginalOpts(opts);

	// clearType corrections
	if (!$.support.opacity && opts.cleartype && !opts.cleartypeNoBg)
		clearTypeFix($slides);

	// container requires non-static position so that slides can be position within
	if ($cont.css('position') == 'static')
		$cont.css('position', 'relative');
	if (opts.width)
		$cont.width(opts.width);
	if (opts.height && opts.height != 'auto')
		$cont.height(opts.height);

	if (opts.startingSlide !== undefined) {
		opts.startingSlide = parseInt(opts.startingSlide,10);
		if (opts.startingSlide >= els.length || opts.startSlide < 0)
			opts.startingSlide = 0; // catch bogus input
		else
			startingSlideSpecified = true;
	}
	else if (opts.backwards)
		opts.startingSlide = els.length - 1;
	else
		opts.startingSlide = 0;

	// if random, mix up the slide array
	if (opts.random) {
		opts.randomMap = [];
		for (var i = 0; i < els.length; i++)
			opts.randomMap.push(i);
		opts.randomMap.sort(function(a,b) {return Math.random() - 0.5;});
		if (startingSlideSpecified) {
			// try to find the specified starting slide and if found set start slide index in the map accordingly
			for ( var cnt = 0; cnt < els.length; cnt++ ) {
				if ( opts.startingSlide == opts.randomMap[cnt] ) {
					opts.randomIndex = cnt;
				}
			}
		}
		else {
			opts.randomIndex = 1;
			opts.startingSlide = opts.randomMap[1];
		}
	}
	else if (opts.startingSlide >= els.length)
		opts.startingSlide = 0; // catch bogus input
	opts.currSlide = opts.startingSlide || 0;
	var first = opts.startingSlide;

	// set position and zIndex on all the slides
	$slides.css({position: 'absolute', top:0, left:0}).hide().each(function(i) {
		var z;
		if (opts.backwards)
			z = first ? i <= first ? els.length + (i-first) : first-i : els.length-i;
		else
			z = first ? i >= first ? els.length - (i-first) : first-i : els.length-i;
		$(this).css('z-index', z);
	});

	// make sure first slide is visible
	$(els[first]).css('opacity',1).show(); // opacity bit needed to handle restart use case
	removeFilter(els[first], opts);

	// stretch slides
	if (opts.fit) {
		if (!opts.aspect) {
	        if (opts.width)
	            $slides.width(opts.width);
	        if (opts.height && opts.height != 'auto')
	            $slides.height(opts.height);
		} else {
			$slides.each(function(){
				var $slide = $(this);
				var ratio = (opts.aspect === true) ? $slide.width()/$slide.height() : opts.aspect;
				if( opts.width && $slide.width() != opts.width ) {
					$slide.width( opts.width );
					$slide.height( opts.width / ratio );
				}

				if( opts.height && $slide.height() < opts.height ) {
					$slide.height( opts.height );
					$slide.width( opts.height * ratio );
				}
			});
		}
	}

	if (opts.center && ((!opts.fit) || opts.aspect)) {
		$slides.each(function(){
			var $slide = $(this);
			$slide.css({
				"margin-left": opts.width ?
					((opts.width - $slide.width()) / 2) + "px" :
					0,
				"margin-top": opts.height ?
					((opts.height - $slide.height()) / 2) + "px" :
					0
			});
		});
	}

	if (opts.center && !opts.fit && !opts.slideResize) {
		$slides.each(function(){
			var $slide = $(this);
			$slide.css({
				"margin-left": opts.width ? ((opts.width - $slide.width()) / 2) + "px" : 0,
				"margin-top": opts.height ? ((opts.height - $slide.height()) / 2) + "px" : 0
			});
		});
	}

	// stretch container
	var reshape = (opts.containerResize || opts.containerResizeHeight) && !$cont.innerHeight();
	if (reshape) { // do this only if container has no size http://tinyurl.com/da2oa9
		var maxw = 0, maxh = 0;
		for(var j=0; j < els.length; j++) {
			var $e = $(els[j]), e = $e[0], w = $e.outerWidth(), h = $e.outerHeight();
			if (!w) w = e.offsetWidth || e.width || $e.attr('width');
			if (!h) h = e.offsetHeight || e.height || $e.attr('height');
			maxw = w > maxw ? w : maxw;
			maxh = h > maxh ? h : maxh;
		}
		if (opts.containerResize && maxw > 0 && maxh > 0)
			$cont.css({width:maxw+'px',height:maxh+'px'});
		if (opts.containerResizeHeight && maxh > 0)
			$cont.css({height:maxh+'px'});
	}

	var pauseFlag = false;  // https://github.com/malsup/cycle/issues/44
	if (opts.pause)
		$cont.bind('mouseenter.cycle', function(){
			pauseFlag = true;
			this.cyclePause++;
			triggerPause(cont, true);
		}).bind('mouseleave.cycle', function(){
				if (pauseFlag)
					this.cyclePause--;
				triggerPause(cont, true);
		});

	if (supportMultiTransitions(opts) === false)
		return false;

	// apparently a lot of people use image slideshows without height/width attributes on the images.
	// Cycle 2.50+ requires the sizing info for every slide; this block tries to deal with that.
	var requeue = false;
	options.requeueAttempts = options.requeueAttempts || 0;
	$slides.each(function() {
		// try to get height/width of each slide
		var $el = $(this);
		this.cycleH = (opts.fit && opts.height) ? opts.height : ($el.height() || this.offsetHeight || this.height || $el.attr('height') || 0);
		this.cycleW = (opts.fit && opts.width) ? opts.width : ($el.width() || this.offsetWidth || this.width || $el.attr('width') || 0);

		if ( $el.is('img') ) {
			// sigh..  sniffing, hacking, shrugging...  this crappy hack tries to account for what browsers do when
			// an image is being downloaded and the markup did not include sizing info (height/width attributes);
			// there seems to be some "default" sizes used in this situation
			var loadingIE	= ($.browser.msie  && this.cycleW == 28 && this.cycleH == 30 && !this.complete);
			var loadingFF	= ($.browser.mozilla && this.cycleW == 34 && this.cycleH == 19 && !this.complete);
			var loadingOp	= ($.browser.opera && ((this.cycleW == 42 && this.cycleH == 19) || (this.cycleW == 37 && this.cycleH == 17)) && !this.complete);
			var loadingOther = (this.cycleH === 0 && this.cycleW === 0 && !this.complete);
			// don't requeue for images that are still loading but have a valid size
			if (loadingIE || loadingFF || loadingOp || loadingOther) {
				if (o.s && opts.requeueOnImageNotLoaded && ++options.requeueAttempts < 100) { // track retry count so we don't loop forever
					log(options.requeueAttempts,' - img slide not loaded, requeuing slideshow: ', this.src, this.cycleW, this.cycleH);
					setTimeout(function() {$(o.s,o.c).cycle(options);}, opts.requeueTimeout);
					requeue = true;
					return false; // break each loop
				}
				else {
					log('could not determine size of image: '+this.src, this.cycleW, this.cycleH);
				}
			}
		}
		return true;
	});

	if (requeue)
		return false;

	opts.cssBefore = opts.cssBefore || {};
	opts.cssAfter = opts.cssAfter || {};
	opts.cssFirst = opts.cssFirst || {};
	opts.animIn = opts.animIn || {};
	opts.animOut = opts.animOut || {};

	$slides.not(':eq('+first+')').css(opts.cssBefore);
	$($slides[first]).css(opts.cssFirst);

	if (opts.timeout) {
		opts.timeout = parseInt(opts.timeout,10);
		// ensure that timeout and speed settings are sane
		if (opts.speed.constructor == String)
			opts.speed = $.fx.speeds[opts.speed] || parseInt(opts.speed,10);
		if (!opts.sync)
			opts.speed = opts.speed / 2;

		var buffer = opts.fx == 'none' ? 0 : opts.fx == 'shuffle' ? 500 : 250;
		while((opts.timeout - opts.speed) < buffer) // sanitize timeout
			opts.timeout += opts.speed;
	}
	if (opts.easing)
		opts.easeIn = opts.easeOut = opts.easing;
	if (!opts.speedIn)
		opts.speedIn = opts.speed;
	if (!opts.speedOut)
		opts.speedOut = opts.speed;

	opts.slideCount = els.length;
	opts.currSlide = opts.lastSlide = first;
	if (opts.random) {
		if (++opts.randomIndex == els.length)
			opts.randomIndex = 0;
		opts.nextSlide = opts.randomMap[opts.randomIndex];
	}
	else if (opts.backwards)
		opts.nextSlide = opts.startingSlide === 0 ? (els.length-1) : opts.startingSlide-1;
	else
		opts.nextSlide = opts.startingSlide >= (els.length-1) ? 0 : opts.startingSlide+1;

	// run transition init fn
	if (!opts.multiFx) {
		var init = $.fn.cycle.transitions[opts.fx];
		if ($.isFunction(init))
			init($cont, $slides, opts);
		else if (opts.fx != 'custom' && !opts.multiFx) {
			log('unknown transition: ' + opts.fx,'; slideshow terminating');
			return false;
		}
	}

	// fire artificial events
	var e0 = $slides[first];
	if (!opts.skipInitializationCallbacks) {
		if (opts.before.length)
			opts.before[0].apply(e0, [e0, e0, opts, true]);
		if (opts.after.length)
			opts.after[0].apply(e0, [e0, e0, opts, true]);
	}
	if (opts.next)
		$(opts.next).bind(opts.prevNextEvent,function(){return advance(opts,1);});
	if (opts.prev)
		$(opts.prev).bind(opts.prevNextEvent,function(){return advance(opts,0);});
	if (opts.pager || opts.pagerAnchorBuilder)
		buildPager(els,opts);

	exposeAddSlide(opts, els);

	return opts;
}

// save off original opts so we can restore after clearing state
function saveOriginalOpts(opts) {
	opts.original = { before: [], after: [] };
	opts.original.cssBefore = $.extend({}, opts.cssBefore);
	opts.original.cssAfter  = $.extend({}, opts.cssAfter);
	opts.original.animIn	= $.extend({}, opts.animIn);
	opts.original.animOut   = $.extend({}, opts.animOut);
	$.each(opts.before, function() { opts.original.before.push(this); });
	$.each(opts.after,  function() { opts.original.after.push(this); });
}

function supportMultiTransitions(opts) {
	var i, tx, txs = $.fn.cycle.transitions;
	// look for multiple effects
	if (opts.fx.indexOf(',') > 0) {
		opts.multiFx = true;
		opts.fxs = opts.fx.replace(/\s*/g,'').split(',');
		// discard any bogus effect names
		for (i=0; i < opts.fxs.length; i++) {
			var fx = opts.fxs[i];
			tx = txs[fx];
			if (!tx || !txs.hasOwnProperty(fx) || !$.isFunction(tx)) {
				log('discarding unknown transition: ',fx);
				opts.fxs.splice(i,1);
				i--;
			}
		}
		// if we have an empty list then we threw everything away!
		if (!opts.fxs.length) {
			log('No valid transitions named; slideshow terminating.');
			return false;
		}
	}
	else if (opts.fx == 'all') {  // auto-gen the list of transitions
		opts.multiFx = true;
		opts.fxs = [];
		for (var p in txs) {
			if (txs.hasOwnProperty(p)) {
				tx = txs[p];
				if (txs.hasOwnProperty(p) && $.isFunction(tx))
					opts.fxs.push(p);
			}
		}
	}
	if (opts.multiFx && opts.randomizeEffects) {
		// munge the fxs array to make effect selection random
		var r1 = Math.floor(Math.random() * 20) + 30;
		for (i = 0; i < r1; i++) {
			var r2 = Math.floor(Math.random() * opts.fxs.length);
			opts.fxs.push(opts.fxs.splice(r2,1)[0]);
		}
		debug('randomized fx sequence: ',opts.fxs);
	}
	return true;
}

// provide a mechanism for adding slides after the slideshow has started
function exposeAddSlide(opts, els) {
	opts.addSlide = function(newSlide, prepend) {
		var $s = $(newSlide), s = $s[0];
		if (!opts.autostopCount)
			opts.countdown++;
		els[prepend?'unshift':'push'](s);
		if (opts.els)
			opts.els[prepend?'unshift':'push'](s); // shuffle needs this
		opts.slideCount = els.length;

		// add the slide to the random map and resort
		if (opts.random) {
			opts.randomMap.push(opts.slideCount-1);
			opts.randomMap.sort(function(a,b) {return Math.random() - 0.5;});
		}

		$s.css('position','absolute');
		$s[prepend?'prependTo':'appendTo'](opts.$cont);

		if (prepend) {
			opts.currSlide++;
			opts.nextSlide++;
		}

		if (!$.support.opacity && opts.cleartype && !opts.cleartypeNoBg)
			clearTypeFix($s);

		if (opts.fit && opts.width)
			$s.width(opts.width);
		if (opts.fit && opts.height && opts.height != 'auto')
			$s.height(opts.height);
		s.cycleH = (opts.fit && opts.height) ? opts.height : $s.height();
		s.cycleW = (opts.fit && opts.width) ? opts.width : $s.width();

		$s.css(opts.cssBefore);

		if (opts.pager || opts.pagerAnchorBuilder)
			$.fn.cycle.createPagerAnchor(els.length-1, s, $(opts.pager), els, opts);

		if ($.isFunction(opts.onAddSlide))
			opts.onAddSlide($s);
		else
			$s.hide(); // default behavior
	};
}

// reset internal state; we do this on every pass in order to support multiple effects
$.fn.cycle.resetState = function(opts, fx) {
	fx = fx || opts.fx;
	opts.before = []; opts.after = [];
	opts.cssBefore = $.extend({}, opts.original.cssBefore);
	opts.cssAfter  = $.extend({}, opts.original.cssAfter);
	opts.animIn	= $.extend({}, opts.original.animIn);
	opts.animOut   = $.extend({}, opts.original.animOut);
	opts.fxFn = null;
	$.each(opts.original.before, function() { opts.before.push(this); });
	$.each(opts.original.after,  function() { opts.after.push(this); });

	// re-init
	var init = $.fn.cycle.transitions[fx];
	if ($.isFunction(init))
		init(opts.$cont, $(opts.elements), opts);
};

// this is the main engine fn, it handles the timeouts, callbacks and slide index mgmt
function go(els, opts, manual, fwd) {
	var p = opts.$cont[0], curr = els[opts.currSlide], next = els[opts.nextSlide];

	// opts.busy is true if we're in the middle of an animation
	if (manual && opts.busy && opts.manualTrump) {
		// let manual transitions requests trump active ones
		debug('manualTrump in go(), stopping active transition');
		$(els).stop(true,true);
		opts.busy = 0;
		clearTimeout(p.cycleTimeout);
	}

	// don't begin another timeout-based transition if there is one active
	if (opts.busy) {
		debug('transition active, ignoring new tx request');
		return;
	}


	// stop cycling if we have an outstanding stop request
	if (p.cycleStop != opts.stopCount || p.cycleTimeout === 0 && !manual)
		return;

	// check to see if we should stop cycling based on autostop options
	if (!manual && !p.cyclePause && !opts.bounce &&
		((opts.autostop && (--opts.countdown <= 0)) ||
		(opts.nowrap && !opts.random && opts.nextSlide < opts.currSlide))) {
		if (opts.end)
			opts.end(opts);
		return;
	}

	// if slideshow is paused, only transition on a manual trigger
	var changed = false;
	if ((manual || !p.cyclePause) && (opts.nextSlide != opts.currSlide)) {
		changed = true;
		var fx = opts.fx;
		// keep trying to get the slide size if we don't have it yet
		curr.cycleH = curr.cycleH || $(curr).height();
		curr.cycleW = curr.cycleW || $(curr).width();
		next.cycleH = next.cycleH || $(next).height();
		next.cycleW = next.cycleW || $(next).width();

		// support multiple transition types
		if (opts.multiFx) {
			if (fwd && (opts.lastFx === undefined || ++opts.lastFx >= opts.fxs.length))
				opts.lastFx = 0;
			else if (!fwd && (opts.lastFx === undefined || --opts.lastFx < 0))
				opts.lastFx = opts.fxs.length - 1;
			fx = opts.fxs[opts.lastFx];
		}

		// one-time fx overrides apply to:  $('div').cycle(3,'zoom');
		if (opts.oneTimeFx) {
			fx = opts.oneTimeFx;
			opts.oneTimeFx = null;
		}

		$.fn.cycle.resetState(opts, fx);

		// run the before callbacks
		if (opts.before.length)
			$.each(opts.before, function(i,o) {
				if (p.cycleStop != opts.stopCount) return;
				o.apply(next, [curr, next, opts, fwd]);
			});

		// stage the after callacks
		var after = function() {
			opts.busy = 0;
			$.each(opts.after, function(i,o) {
				if (p.cycleStop != opts.stopCount) return;
				o.apply(next, [curr, next, opts, fwd]);
			});
			if (!p.cycleStop) {
				// queue next transition
				queueNext();
			}
		};

		debug('tx firing('+fx+'); currSlide: ' + opts.currSlide + '; nextSlide: ' + opts.nextSlide);

		// get ready to perform the transition
		opts.busy = 1;
		if (opts.fxFn) // fx function provided?
			opts.fxFn(curr, next, opts, after, fwd, manual && opts.fastOnEvent);
		else if ($.isFunction($.fn.cycle[opts.fx])) // fx plugin ?
			$.fn.cycle[opts.fx](curr, next, opts, after, fwd, manual && opts.fastOnEvent);
		else
			$.fn.cycle.custom(curr, next, opts, after, fwd, manual && opts.fastOnEvent);
	}
	else {
		queueNext();
	}

	if (changed || opts.nextSlide == opts.currSlide) {
		// calculate the next slide
		var roll;
		opts.lastSlide = opts.currSlide;
		if (opts.random) {
			opts.currSlide = opts.nextSlide;
			if (++opts.randomIndex == els.length) {
				opts.randomIndex = 0;
				opts.randomMap.sort(function(a,b) {return Math.random() - 0.5;});
			}
			opts.nextSlide = opts.randomMap[opts.randomIndex];
			if (opts.nextSlide == opts.currSlide)
				opts.nextSlide = (opts.currSlide == opts.slideCount - 1) ? 0 : opts.currSlide + 1;
		}
		else if (opts.backwards) {
			roll = (opts.nextSlide - 1) < 0;
			if (roll && opts.bounce) {
				opts.backwards = !opts.backwards;
				opts.nextSlide = 1;
				opts.currSlide = 0;
			}
			else {
				opts.nextSlide = roll ? (els.length-1) : opts.nextSlide-1;
				opts.currSlide = roll ? 0 : opts.nextSlide+1;
			}
		}
		else { // sequence
			roll = (opts.nextSlide + 1) == els.length;
			if (roll && opts.bounce) {
				opts.backwards = !opts.backwards;
				opts.nextSlide = els.length-2;
				opts.currSlide = els.length-1;
			}
			else {
				opts.nextSlide = roll ? 0 : opts.nextSlide+1;
				opts.currSlide = roll ? els.length-1 : opts.nextSlide-1;
			}
		}
	}
	if (changed && opts.pager)
		opts.updateActivePagerLink(opts.pager, opts.currSlide, opts.activePagerClass);

	function queueNext() {
		// stage the next transition
		var ms = 0, timeout = opts.timeout;
		if (opts.timeout && !opts.continuous) {
			ms = getTimeout(els[opts.currSlide], els[opts.nextSlide], opts, fwd);
         if (opts.fx == 'shuffle')
            ms -= opts.speedOut;
      }
		else if (opts.continuous && p.cyclePause) // continuous shows work off an after callback, not this timer logic
			ms = 10;
		if (ms > 0)
			p.cycleTimeout = setTimeout(function(){ go(els, opts, 0, !opts.backwards); }, ms);
	}
}

// invoked after transition
$.fn.cycle.updateActivePagerLink = function(pager, currSlide, clsName) {
   $(pager).each(function() {
       $(this).children().removeClass(clsName).eq(currSlide).addClass(clsName);
   });
};

// calculate timeout value for current transition
function getTimeout(curr, next, opts, fwd) {
	if (opts.timeoutFn) {
		// call user provided calc fn
		var t = opts.timeoutFn.call(curr,curr,next,opts,fwd);
		while (opts.fx != 'none' && (t - opts.speed) < 250) // sanitize timeout
			t += opts.speed;
		debug('calculated timeout: ' + t + '; speed: ' + opts.speed);
		if (t !== false)
			return t;
	}
	return opts.timeout;
}

// expose next/prev function, caller must pass in state
$.fn.cycle.next = function(opts) { advance(opts,1); };
$.fn.cycle.prev = function(opts) { advance(opts,0);};

// advance slide forward or back
function advance(opts, moveForward) {
	var val = moveForward ? 1 : -1;
	var els = opts.elements;
	var p = opts.$cont[0], timeout = p.cycleTimeout;
	if (timeout) {
		clearTimeout(timeout);
		p.cycleTimeout = 0;
	}
	if (opts.random && val < 0) {
		// move back to the previously display slide
		opts.randomIndex--;
		if (--opts.randomIndex == -2)
			opts.randomIndex = els.length-2;
		else if (opts.randomIndex == -1)
			opts.randomIndex = els.length-1;
		opts.nextSlide = opts.randomMap[opts.randomIndex];
	}
	else if (opts.random) {
		opts.nextSlide = opts.randomMap[opts.randomIndex];
	}
	else {
		opts.nextSlide = opts.currSlide + val;
		if (opts.nextSlide < 0) {
			if (opts.nowrap) return false;
			opts.nextSlide = els.length - 1;
		}
		else if (opts.nextSlide >= els.length) {
			if (opts.nowrap) return false;
			opts.nextSlide = 0;
		}
	}

	var cb = opts.onPrevNextEvent || opts.prevNextClick; // prevNextClick is deprecated
	if ($.isFunction(cb))
		cb(val > 0, opts.nextSlide, els[opts.nextSlide]);
	go(els, opts, 1, moveForward);
	return false;
}

function buildPager(els, opts) {
	var $p = $(opts.pager);
	$.each(els, function(i,o) {
		$.fn.cycle.createPagerAnchor(i,o,$p,els,opts);
	});
	opts.updateActivePagerLink(opts.pager, opts.startingSlide, opts.activePagerClass);
}

$.fn.cycle.createPagerAnchor = function(i, el, $p, els, opts) {
	var a;
	if ($.isFunction(opts.pagerAnchorBuilder)) {
		a = opts.pagerAnchorBuilder(i,el);
		debug('pagerAnchorBuilder('+i+', el) returned: ' + a);
	}
	else
		a = '<a href="#">'+(i+1)+'</a>';

	if (!a)
		return;
	var $a = $(a);
	// don't reparent if anchor is in the dom
	if ($a.parents('body').length === 0) {
		var arr = [];
		if ($p.length > 1) {
			$p.each(function() {
				var $clone = $a.clone(true);
				$(this).append($clone);
				arr.push($clone[0]);
			});
			$a = $(arr);
		}
		else {
			$a.appendTo($p);
		}
	}

	opts.pagerAnchors =  opts.pagerAnchors || [];
	opts.pagerAnchors.push($a);

	var pagerFn = function(e) {
		e.preventDefault();
		opts.nextSlide = i;
		var p = opts.$cont[0], timeout = p.cycleTimeout;
		if (timeout) {
			clearTimeout(timeout);
			p.cycleTimeout = 0;
		}
		var cb = opts.onPagerEvent || opts.pagerClick; // pagerClick is deprecated
		if ($.isFunction(cb))
			cb(opts.nextSlide, els[opts.nextSlide]);
		go(els,opts,1,opts.currSlide < i); // trigger the trans
//		return false; // <== allow bubble
	};

	if ( /mouseenter|mouseover/i.test(opts.pagerEvent) ) {
		$a.hover(pagerFn, function(){/* no-op */} );
	}
	else {
		$a.bind(opts.pagerEvent, pagerFn);
	}

	if ( ! /^click/.test(opts.pagerEvent) && !opts.allowPagerClickBubble)
		$a.bind('click.cycle', function(){return false;}); // suppress click

	var cont = opts.$cont[0];
	var pauseFlag = false; // https://github.com/malsup/cycle/issues/44
	if (opts.pauseOnPagerHover) {
		$a.hover(
			function() {
				pauseFlag = true;
				cont.cyclePause++;
				triggerPause(cont,true,true);
			}, function() {
				if (pauseFlag)
					cont.cyclePause--;
				triggerPause(cont,true,true);
			}
		);
	}
};

// helper fn to calculate the number of slides between the current and the next
$.fn.cycle.hopsFromLast = function(opts, fwd) {
	var hops, l = opts.lastSlide, c = opts.currSlide;
	if (fwd)
		hops = c > l ? c - l : opts.slideCount - l;
	else
		hops = c < l ? l - c : l + opts.slideCount - c;
	return hops;
};

// fix clearType problems in ie6 by setting an explicit bg color
// (otherwise text slides look horrible during a fade transition)
function clearTypeFix($slides) {
	debug('applying clearType background-color hack');
	function hex(s) {
		s = parseInt(s,10).toString(16);
		return s.length < 2 ? '0'+s : s;
	}
	function getBg(e) {
		for ( ; e && e.nodeName.toLowerCase() != 'html'; e = e.parentNode) {
			var v = $.css(e,'background-color');
			if (v && v.indexOf('rgb') >= 0 ) {
				var rgb = v.match(/\d+/g);
				return '#'+ hex(rgb[0]) + hex(rgb[1]) + hex(rgb[2]);
			}
			if (v && v != 'transparent')
				return v;
		}
		return '#ffffff';
	}
	$slides.each(function() { $(this).css('background-color', getBg(this)); });
}

// reset common props before the next transition
$.fn.cycle.commonReset = function(curr,next,opts,w,h,rev) {
	$(opts.elements).not(curr).hide();
	if (typeof opts.cssBefore.opacity == 'undefined')
		opts.cssBefore.opacity = 1;
	opts.cssBefore.display = 'block';
	if (opts.slideResize && w !== false && next.cycleW > 0)
		opts.cssBefore.width = next.cycleW;
	if (opts.slideResize && h !== false && next.cycleH > 0)
		opts.cssBefore.height = next.cycleH;
	opts.cssAfter = opts.cssAfter || {};
	opts.cssAfter.display = 'none';
	$(curr).css('zIndex',opts.slideCount + (rev === true ? 1 : 0));
	$(next).css('zIndex',opts.slideCount + (rev === true ? 0 : 1));
};

// the actual fn for effecting a transition
$.fn.cycle.custom = function(curr, next, opts, cb, fwd, speedOverride) {
	var $l = $(curr), $n = $(next);
	var speedIn = opts.speedIn, speedOut = opts.speedOut, easeIn = opts.easeIn, easeOut = opts.easeOut;
	$n.css(opts.cssBefore);
	if (speedOverride) {
		if (typeof speedOverride == 'number')
			speedIn = speedOut = speedOverride;
		else
			speedIn = speedOut = 1;
		easeIn = easeOut = null;
	}
	var fn = function() {
		$n.animate(opts.animIn, speedIn, easeIn, function() {
			cb();
		});
	};
	$l.animate(opts.animOut, speedOut, easeOut, function() {
		$l.css(opts.cssAfter);
		if (!opts.sync)
			fn();
	});
	if (opts.sync) fn();
};

// transition definitions - only fade is defined here, transition pack defines the rest
$.fn.cycle.transitions = {
	fade: function($cont, $slides, opts) {
		$slides.not(':eq('+opts.currSlide+')').css('opacity',0);
		opts.before.push(function(curr,next,opts) {
			$.fn.cycle.commonReset(curr,next,opts);
			opts.cssBefore.opacity = 0;
		});
		opts.animIn	   = { opacity: 1 };
		opts.animOut   = { opacity: 0 };
		opts.cssBefore = { top: 0, left: 0 };
	}
};

$.fn.cycle.ver = function() { return ver; };

// override these globally if you like (they are all optional)
$.fn.cycle.defaults = {
    activePagerClass: 'activeSlide', // class name used for the active pager link
    after:            null,     // transition callback (scope set to element that was shown):  function(currSlideElement, nextSlideElement, options, forwardFlag)
    allowPagerClickBubble: false, // allows or prevents click event on pager anchors from bubbling
    animIn:           null,     // properties that define how the slide animates in
    animOut:          null,     // properties that define how the slide animates out
    aspect:           false,    // preserve aspect ratio during fit resizing, cropping if necessary (must be used with fit option)
    autostop:         0,        // true to end slideshow after X transitions (where X == slide count)
    autostopCount:    0,        // number of transitions (optionally used with autostop to define X)
    backwards:        false,    // true to start slideshow at last slide and move backwards through the stack
    before:           null,     // transition callback (scope set to element to be shown):     function(currSlideElement, nextSlideElement, options, forwardFlag)
    center:           null,     // set to true to have cycle add top/left margin to each slide (use with width and height options)
    cleartype:        !$.support.opacity,  // true if clearType corrections should be applied (for IE)
    cleartypeNoBg:    false,    // set to true to disable extra cleartype fixing (leave false to force background color setting on slides)
    containerResize:  1,        // resize container to fit largest slide
    containerResizeHeight:  0,  // resize containers height to fit the largest slide but leave the width dynamic
    continuous:       0,        // true to start next transition immediately after current one completes
    cssAfter:         null,     // properties that defined the state of the slide after transitioning out
    cssBefore:        null,     // properties that define the initial state of the slide before transitioning in
    delay:            0,        // additional delay (in ms) for first transition (hint: can be negative)
    easeIn:           null,     // easing for "in" transition
    easeOut:          null,     // easing for "out" transition
    easing:           null,     // easing method for both in and out transitions
    end:              null,     // callback invoked when the slideshow terminates (use with autostop or nowrap options): function(options)
    fastOnEvent:      0,        // force fast transitions when triggered manually (via pager or prev/next); value == time in ms
    fit:              0,        // force slides to fit container
    fx:               'fade',   // name of transition effect (or comma separated names, ex: 'fade,scrollUp,shuffle')
    fxFn:             null,     // function used to control the transition: function(currSlideElement, nextSlideElement, options, afterCalback, forwardFlag)
    height:           'auto',   // container height (if the 'fit' option is true, the slides will be set to this height as well)
    manualTrump:      true,     // causes manual transition to stop an active transition instead of being ignored
    metaAttr:         'cycle',  // data- attribute that holds the option data for the slideshow
    next:             null,     // element, jQuery object, or jQuery selector string for the element to use as event trigger for next slide
    nowrap:           0,        // true to prevent slideshow from wrapping
    onPagerEvent:     null,     // callback fn for pager events: function(zeroBasedSlideIndex, slideElement)
    onPrevNextEvent:  null,     // callback fn for prev/next events: function(isNext, zeroBasedSlideIndex, slideElement)
    pager:            null,     // element, jQuery object, or jQuery selector string for the element to use as pager container
    pagerAnchorBuilder: null,   // callback fn for building anchor links:  function(index, DOMelement)
    pagerEvent:       'click.cycle', // name of event which drives the pager navigation
    pause:            0,        // true to enable "pause on hover"
    pauseOnPagerHover: 0,       // true to pause when hovering over pager link
    prev:             null,     // element, jQuery object, or jQuery selector string for the element to use as event trigger for previous slide
    prevNextEvent:    'click.cycle',// event which drives the manual transition to the previous or next slide
    random:           0,        // true for random, false for sequence (not applicable to shuffle fx)
    randomizeEffects: 1,        // valid when multiple effects are used; true to make the effect sequence random
    requeueOnImageNotLoaded: true, // requeue the slideshow if any image slides are not yet loaded
    requeueTimeout:   250,      // ms delay for requeue
    rev:              0,        // causes animations to transition in reverse (for effects that support it such as scrollHorz/scrollVert/shuffle)
    shuffle:          null,     // coords for shuffle animation, ex: { top:15, left: 200 }
    skipInitializationCallbacks: false, // set to true to disable the first before/after callback that occurs prior to any transition
    slideExpr:        null,     // expression for selecting slides (if something other than all children is required)
    slideResize:      1,        // force slide width/height to fixed size before every transition
    speed:            1000,     // speed of the transition (any valid fx speed value)
    speedIn:          null,     // speed of the 'in' transition
    speedOut:         null,     // speed of the 'out' transition
    startingSlide:    undefined,// zero-based index of the first slide to be displayed
    sync:             1,        // true if in/out transitions should occur simultaneously
    timeout:          4000,     // milliseconds between slide transitions (0 to disable auto advance)
    timeoutFn:        null,     // callback for determining per-slide timeout value:  function(currSlideElement, nextSlideElement, options, forwardFlag)
    updateActivePagerLink: null,// callback fn invoked to update the active pager link (adds/removes activePagerClass style)
    width:            null      // container width (if the 'fit' option is true, the slides will be set to this width as well)
};

})(jQuery);


/*!
 * jQuery Cycle Plugin Transition Definitions
 * This script is a plugin for the jQuery Cycle Plugin
 * Examples and documentation at: http://malsup.com/jquery/cycle/
 * Copyright (c) 2007-2010 M. Alsup
 * Version:	 2.73
 * Dual licensed under the MIT and GPL licenses:
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.gnu.org/licenses/gpl.html
 */
(function($) {
"use strict";

//
// These functions define slide initialization and properties for the named
// transitions. To save file size feel free to remove any of these that you
// don't need.
//
$.fn.cycle.transitions.none = function($cont, $slides, opts) {
	opts.fxFn = function(curr,next,opts,after){
		$(next).show();
		$(curr).hide();
		after();
	};
};

// not a cross-fade, fadeout only fades out the top slide
$.fn.cycle.transitions.fadeout = function($cont, $slides, opts) {
	$slides.not(':eq('+opts.currSlide+')').css({ display: 'block', 'opacity': 1 });
	opts.before.push(function(curr,next,opts,w,h,rev) {
		$(curr).css('zIndex',opts.slideCount + (rev !== true ? 1 : 0));
		$(next).css('zIndex',opts.slideCount + (rev !== true ? 0 : 1));
	});
	opts.animIn.opacity = 1;
	opts.animOut.opacity = 0;
	opts.cssBefore.opacity = 1;
	opts.cssBefore.display = 'block';
	opts.cssAfter.zIndex = 0;
};

// scrollUp/Down/Left/Right
$.fn.cycle.transitions.scrollUp = function($cont, $slides, opts) {
	$cont.css('overflow','hidden');
	opts.before.push($.fn.cycle.commonReset);
	var h = $cont.height();
	opts.cssBefore.top = h;
	opts.cssBefore.left = 0;
	opts.cssFirst.top = 0;
	opts.animIn.top = 0;
	opts.animOut.top = -h;
};
$.fn.cycle.transitions.scrollDown = function($cont, $slides, opts) {
	$cont.css('overflow','hidden');
	opts.before.push($.fn.cycle.commonReset);
	var h = $cont.height();
	opts.cssFirst.top = 0;
	opts.cssBefore.top = -h;
	opts.cssBefore.left = 0;
	opts.animIn.top = 0;
	opts.animOut.top = h;
};
$.fn.cycle.transitions.scrollLeft = function($cont, $slides, opts) {
	$cont.css('overflow','hidden');
	opts.before.push($.fn.cycle.commonReset);
	var w = $cont.width();
	opts.cssFirst.left = 0;
	opts.cssBefore.left = w;
	opts.cssBefore.top = 0;
	opts.animIn.left = 0;
	opts.animOut.left = 0-w;
};
$.fn.cycle.transitions.scrollRight = function($cont, $slides, opts) {
	$cont.css('overflow','hidden');
	opts.before.push($.fn.cycle.commonReset);
	var w = $cont.width();
	opts.cssFirst.left = 0;
	opts.cssBefore.left = -w;
	opts.cssBefore.top = 0;
	opts.animIn.left = 0;
	opts.animOut.left = w;
};
$.fn.cycle.transitions.scrollHorz = function($cont, $slides, opts) {
	$cont.css('overflow','hidden').width();
	opts.before.push(function(curr, next, opts, fwd) {
		if (opts.rev)
			fwd = !fwd;
		$.fn.cycle.commonReset(curr,next,opts);
		opts.cssBefore.left = fwd ? (next.cycleW-1) : (1-next.cycleW);
		opts.animOut.left = fwd ? -curr.cycleW : curr.cycleW;
	});
	opts.cssFirst.left = 0;
	opts.cssBefore.top = 0;
	opts.animIn.left = 0;
	opts.animOut.top = 0;
};
$.fn.cycle.transitions.scrollVert = function($cont, $slides, opts) {
	$cont.css('overflow','hidden');
	opts.before.push(function(curr, next, opts, fwd) {
		if (opts.rev)
			fwd = !fwd;
		$.fn.cycle.commonReset(curr,next,opts);
		opts.cssBefore.top = fwd ? (1-next.cycleH) : (next.cycleH-1);
		opts.animOut.top = fwd ? curr.cycleH : -curr.cycleH;
	});
	opts.cssFirst.top = 0;
	opts.cssBefore.left = 0;
	opts.animIn.top = 0;
	opts.animOut.left = 0;
};

// slideX/slideY
$.fn.cycle.transitions.slideX = function($cont, $slides, opts) {
	opts.before.push(function(curr, next, opts) {
		$(opts.elements).not(curr).hide();
		$.fn.cycle.commonReset(curr,next,opts,false,true);
		opts.animIn.width = next.cycleW;
	});
	opts.cssBefore.left = 0;
	opts.cssBefore.top = 0;
	opts.cssBefore.width = 0;
	opts.animIn.width = 'show';
	opts.animOut.width = 0;
};
$.fn.cycle.transitions.slideY = function($cont, $slides, opts) {
	opts.before.push(function(curr, next, opts) {
		$(opts.elements).not(curr).hide();
		$.fn.cycle.commonReset(curr,next,opts,true,false);
		opts.animIn.height = next.cycleH;
	});
	opts.cssBefore.left = 0;
	opts.cssBefore.top = 0;
	opts.cssBefore.height = 0;
	opts.animIn.height = 'show';
	opts.animOut.height = 0;
};

// shuffle
$.fn.cycle.transitions.shuffle = function($cont, $slides, opts) {
	var i, w = $cont.css('overflow', 'visible').width();
	$slides.css({left: 0, top: 0});
	opts.before.push(function(curr,next,opts) {
		$.fn.cycle.commonReset(curr,next,opts,true,true,true);
	});
	// only adjust speed once!
	if (!opts.speedAdjusted) {
		opts.speed = opts.speed / 2; // shuffle has 2 transitions
		opts.speedAdjusted = true;
	}
	opts.random = 0;
	opts.shuffle = opts.shuffle || {left:-w, top:15};
	opts.els = [];
	for (i=0; i < $slides.length; i++)
		opts.els.push($slides[i]);

	for (i=0; i < opts.currSlide; i++)
		opts.els.push(opts.els.shift());

	// custom transition fn (hat tip to Benjamin Sterling for this bit of sweetness!)
	opts.fxFn = function(curr, next, opts, cb, fwd) {
		if (opts.rev)
			fwd = !fwd;
		var $el = fwd ? $(curr) : $(next);
		$(next).css(opts.cssBefore);
		var count = opts.slideCount;
		$el.animate(opts.shuffle, opts.speedIn, opts.easeIn, function() {
			var hops = $.fn.cycle.hopsFromLast(opts, fwd);
			for (var k=0; k < hops; k++) {
				if (fwd)
					opts.els.push(opts.els.shift());
				else
					opts.els.unshift(opts.els.pop());
			}
			if (fwd) {
				for (var i=0, len=opts.els.length; i < len; i++)
					$(opts.els[i]).css('z-index', len-i+count);
			}
			else {
				var z = $(curr).css('z-index');
				$el.css('z-index', parseInt(z,10)+1+count);
			}
			$el.animate({left:0, top:0}, opts.speedOut, opts.easeOut, function() {
				$(fwd ? this : curr).hide();
				if (cb) cb();
			});
		});
	};
	$.extend(opts.cssBefore, { display: 'block', opacity: 1, top: 0, left: 0 });
};

// turnUp/Down/Left/Right
$.fn.cycle.transitions.turnUp = function($cont, $slides, opts) {
	opts.before.push(function(curr, next, opts) {
		$.fn.cycle.commonReset(curr,next,opts,true,false);
		opts.cssBefore.top = next.cycleH;
		opts.animIn.height = next.cycleH;
		opts.animOut.width = next.cycleW;
	});
	opts.cssFirst.top = 0;
	opts.cssBefore.left = 0;
	opts.cssBefore.height = 0;
	opts.animIn.top = 0;
	opts.animOut.height = 0;
};
$.fn.cycle.transitions.turnDown = function($cont, $slides, opts) {
	opts.before.push(function(curr, next, opts) {
		$.fn.cycle.commonReset(curr,next,opts,true,false);
		opts.animIn.height = next.cycleH;
		opts.animOut.top   = curr.cycleH;
	});
	opts.cssFirst.top = 0;
	opts.cssBefore.left = 0;
	opts.cssBefore.top = 0;
	opts.cssBefore.height = 0;
	opts.animOut.height = 0;
};
$.fn.cycle.transitions.turnLeft = function($cont, $slides, opts) {
	opts.before.push(function(curr, next, opts) {
		$.fn.cycle.commonReset(curr,next,opts,false,true);
		opts.cssBefore.left = next.cycleW;
		opts.animIn.width = next.cycleW;
	});
	opts.cssBefore.top = 0;
	opts.cssBefore.width = 0;
	opts.animIn.left = 0;
	opts.animOut.width = 0;
};
$.fn.cycle.transitions.turnRight = function($cont, $slides, opts) {
	opts.before.push(function(curr, next, opts) {
		$.fn.cycle.commonReset(curr,next,opts,false,true);
		opts.animIn.width = next.cycleW;
		opts.animOut.left = curr.cycleW;
	});
	$.extend(opts.cssBefore, { top: 0, left: 0, width: 0 });
	opts.animIn.left = 0;
	opts.animOut.width = 0;
};

// zoom
$.fn.cycle.transitions.zoom = function($cont, $slides, opts) {
	opts.before.push(function(curr, next, opts) {
		$.fn.cycle.commonReset(curr,next,opts,false,false,true);
		opts.cssBefore.top = next.cycleH/2;
		opts.cssBefore.left = next.cycleW/2;
		$.extend(opts.animIn, { top: 0, left: 0, width: next.cycleW, height: next.cycleH });
		$.extend(opts.animOut, { width: 0, height: 0, top: curr.cycleH/2, left: curr.cycleW/2 });
	});
	opts.cssFirst.top = 0;
	opts.cssFirst.left = 0;
	opts.cssBefore.width = 0;
	opts.cssBefore.height = 0;
};

// fadeZoom
$.fn.cycle.transitions.fadeZoom = function($cont, $slides, opts) {
	opts.before.push(function(curr, next, opts) {
		$.fn.cycle.commonReset(curr,next,opts,false,false);
		opts.cssBefore.left = next.cycleW/2;
		opts.cssBefore.top = next.cycleH/2;
		$.extend(opts.animIn, { top: 0, left: 0, width: next.cycleW, height: next.cycleH });
	});
	opts.cssBefore.width = 0;
	opts.cssBefore.height = 0;
	opts.animOut.opacity = 0;
};

// blindX
$.fn.cycle.transitions.blindX = function($cont, $slides, opts) {
	var w = $cont.css('overflow','hidden').width();
	opts.before.push(function(curr, next, opts) {
		$.fn.cycle.commonReset(curr,next,opts);
		opts.animIn.width = next.cycleW;
		opts.animOut.left   = curr.cycleW;
	});
	opts.cssBefore.left = w;
	opts.cssBefore.top = 0;
	opts.animIn.left = 0;
	opts.animOut.left = w;
};
// blindY
$.fn.cycle.transitions.blindY = function($cont, $slides, opts) {
	var h = $cont.css('overflow','hidden').height();
	opts.before.push(function(curr, next, opts) {
		$.fn.cycle.commonReset(curr,next,opts);
		opts.animIn.height = next.cycleH;
		opts.animOut.top   = curr.cycleH;
	});
	opts.cssBefore.top = h;
	opts.cssBefore.left = 0;
	opts.animIn.top = 0;
	opts.animOut.top = h;
};
// blindZ
$.fn.cycle.transitions.blindZ = function($cont, $slides, opts) {
	var h = $cont.css('overflow','hidden').height();
	var w = $cont.width();
	opts.before.push(function(curr, next, opts) {
		$.fn.cycle.commonReset(curr,next,opts);
		opts.animIn.height = next.cycleH;
		opts.animOut.top   = curr.cycleH;
	});
	opts.cssBefore.top = h;
	opts.cssBefore.left = w;
	opts.animIn.top = 0;
	opts.animIn.left = 0;
	opts.animOut.top = h;
	opts.animOut.left = w;
};

// growX - grow horizontally from centered 0 width
$.fn.cycle.transitions.growX = function($cont, $slides, opts) {
	opts.before.push(function(curr, next, opts) {
		$.fn.cycle.commonReset(curr,next,opts,false,true);
		opts.cssBefore.left = this.cycleW/2;
		opts.animIn.left = 0;
		opts.animIn.width = this.cycleW;
		opts.animOut.left = 0;
	});
	opts.cssBefore.top = 0;
	opts.cssBefore.width = 0;
};
// growY - grow vertically from centered 0 height
$.fn.cycle.transitions.growY = function($cont, $slides, opts) {
	opts.before.push(function(curr, next, opts) {
		$.fn.cycle.commonReset(curr,next,opts,true,false);
		opts.cssBefore.top = this.cycleH/2;
		opts.animIn.top = 0;
		opts.animIn.height = this.cycleH;
		opts.animOut.top = 0;
	});
	opts.cssBefore.height = 0;
	opts.cssBefore.left = 0;
};

// curtainX - squeeze in both edges horizontally
$.fn.cycle.transitions.curtainX = function($cont, $slides, opts) {
	opts.before.push(function(curr, next, opts) {
		$.fn.cycle.commonReset(curr,next,opts,false,true,true);
		opts.cssBefore.left = next.cycleW/2;
		opts.animIn.left = 0;
		opts.animIn.width = this.cycleW;
		opts.animOut.left = curr.cycleW/2;
		opts.animOut.width = 0;
	});
	opts.cssBefore.top = 0;
	opts.cssBefore.width = 0;
};
// curtainY - squeeze in both edges vertically
$.fn.cycle.transitions.curtainY = function($cont, $slides, opts) {
	opts.before.push(function(curr, next, opts) {
		$.fn.cycle.commonReset(curr,next,opts,true,false,true);
		opts.cssBefore.top = next.cycleH/2;
		opts.animIn.top = 0;
		opts.animIn.height = next.cycleH;
		opts.animOut.top = curr.cycleH/2;
		opts.animOut.height = 0;
	});
	opts.cssBefore.height = 0;
	opts.cssBefore.left = 0;
};

// cover - curr slide covered by next slide
$.fn.cycle.transitions.cover = function($cont, $slides, opts) {
	var d = opts.direction || 'left';
	var w = $cont.css('overflow','hidden').width();
	var h = $cont.height();
	opts.before.push(function(curr, next, opts) {
		$.fn.cycle.commonReset(curr,next,opts);
		opts.cssAfter.display = '';
		if (d == 'right')
			opts.cssBefore.left = -w;
		else if (d == 'up')
			opts.cssBefore.top = h;
		else if (d == 'down')
			opts.cssBefore.top = -h;
		else
			opts.cssBefore.left = w;
	});
	opts.animIn.left = 0;
	opts.animIn.top = 0;
	opts.cssBefore.top = 0;
	opts.cssBefore.left = 0;
};

// uncover - curr slide moves off next slide
$.fn.cycle.transitions.uncover = function($cont, $slides, opts) {
	var d = opts.direction || 'left';
	var w = $cont.css('overflow','hidden').width();
	var h = $cont.height();
	opts.before.push(function(curr, next, opts) {
		$.fn.cycle.commonReset(curr,next,opts,true,true,true);
		if (d == 'right')
			opts.animOut.left = w;
		else if (d == 'up')
			opts.animOut.top = -h;
		else if (d == 'down')
			opts.animOut.top = h;
		else
			opts.animOut.left = -w;
	});
	opts.animIn.left = 0;
	opts.animIn.top = 0;
	opts.cssBefore.top = 0;
	opts.cssBefore.left = 0;
};

// toss - move top slide and fade away
$.fn.cycle.transitions.toss = function($cont, $slides, opts) {
	var w = $cont.css('overflow','visible').width();
	var h = $cont.height();
	opts.before.push(function(curr, next, opts) {
		$.fn.cycle.commonReset(curr,next,opts,true,true,true);
		// provide default toss settings if animOut not provided
		if (!opts.animOut.left && !opts.animOut.top)
			$.extend(opts.animOut, { left: w*2, top: -h/2, opacity: 0 });
		else
			opts.animOut.opacity = 0;
	});
	opts.cssBefore.left = 0;
	opts.cssBefore.top = 0;
	opts.animIn.left = 0;
};

// wipe - clip animation
$.fn.cycle.transitions.wipe = function($cont, $slides, opts) {
	var w = $cont.css('overflow','hidden').width();
	var h = $cont.height();
	opts.cssBefore = opts.cssBefore || {};
	var clip;
	if (opts.clip) {
		if (/l2r/.test(opts.clip))
			clip = 'rect(0px 0px '+h+'px 0px)';
		else if (/r2l/.test(opts.clip))
			clip = 'rect(0px '+w+'px '+h+'px '+w+'px)';
		else if (/t2b/.test(opts.clip))
			clip = 'rect(0px '+w+'px 0px 0px)';
		else if (/b2t/.test(opts.clip))
			clip = 'rect('+h+'px '+w+'px '+h+'px 0px)';
		else if (/zoom/.test(opts.clip)) {
			var top = parseInt(h/2,10);
			var left = parseInt(w/2,10);
			clip = 'rect('+top+'px '+left+'px '+top+'px '+left+'px)';
		}
	}

	opts.cssBefore.clip = opts.cssBefore.clip || clip || 'rect(0px 0px 0px 0px)';

	var d = opts.cssBefore.clip.match(/(\d+)/g);
	var t = parseInt(d[0],10), r = parseInt(d[1],10), b = parseInt(d[2],10), l = parseInt(d[3],10);

	opts.before.push(function(curr, next, opts) {
		if (curr == next) return;
		var $curr = $(curr), $next = $(next);
		$.fn.cycle.commonReset(curr,next,opts,true,true,false);
		opts.cssAfter.display = 'block';

		var step = 1, count = parseInt((opts.speedIn / 13),10) - 1;
		(function f() {
			var tt = t ? t - parseInt(step * (t/count),10) : 0;
			var ll = l ? l - parseInt(step * (l/count),10) : 0;
			var bb = b < h ? b + parseInt(step * ((h-b)/count || 1),10) : h;
			var rr = r < w ? r + parseInt(step * ((w-r)/count || 1),10) : w;
			$next.css({ clip: 'rect('+tt+'px '+rr+'px '+bb+'px '+ll+'px)' });
			(step++ <= count) ? setTimeout(f, 13) : $curr.css('display', 'none');
		})();
	});
	$.extend(opts.cssBefore, { display: 'block', opacity: 1, top: 0, left: 0 });
	opts.animIn	   = { left: 0 };
	opts.animOut   = { left: 0 };
};

})(jQuery);


} /* end modules/shortcodes/js/jquery.cycle.js */

if ( jpconcat.files['modules/shortcodes/js/main.js'] ) {

(function($){
	var jmpressOpts = {
		fullscreen       : false,
		hash             : { use : false },
		mouse            : { clickSelects : false },
		keyboard         : { use : true },
		animation        : { transitionDuration : '1s' },
		presentationMode : false,
		stepSelector     : '.step',
		duration : {
			defaultValue: 0
		}
	};

	/**
	 * Presentation constructor
	 */
	function Presentation (wrapper) {
		var _self, duration, new_css, ie_regex, matches;

		_self = this;

		_self.wrapper      = $(wrapper);                  // The wrapper for toggling fullscreen
		_self.slideshow    = $('.presentation', wrapper); // Holds the slides for jmpress
		_self.navLeft      = $('.nav-arrow-left', wrapper);
		_self.navRight     = $('.nav-arrow-right', wrapper);
		_self.expandButton = $('.nav-fullscreen-button', wrapper);
		_self.overlay      = $('.autoplay-overlay', wrapper);
		_self.fullscreen   = false;
		_self.autoPlaying  = false;
		_self.autoplayTime = parseFloat(_self.slideshow.attr('data-autoplay'), 10) || 0;

		// The wrapper is scaled to the contents' size so that its border wraps tightly
		_self.wrapper.css({
			width: _self.slideshow.width(),
			height: _self.slideshow.height()
		});

		duration = _self.slideshow.attr('duration') || '1s';
		jmpressOpts.animation.transitionDuration = duration;

		// Compensate for transition times
		if( _self.autoplayTime ) {
			_self.autoplayTime += parseFloat(duration, 10) * 1000;
		}

		// Set the opacity transition duration
		// as it is delegated by css and not jmpress
		duration = 'opacity ' + duration;
		new_css = {
			'width'             : _self.slideshow.width(),
			'height'            : _self.slideshow.height(),
			'-webkit-transition': duration,
			'-moz-transition'   : duration,
			'-ms-transition'    : duration,
			'-o-transition'     : duration,
			'transition'        : duration
		};

		$('.step', _self.slideshow).each(function(i, step) {
			$(step).css(new_css);
		});

		// Apply attribute to allow fading individual bullets here,
		// otherwise wp_kses will strip the attribute out
		$('.step.fadebullets li', _self.slideshow).each(function(i, step) {
			$(step).attr('data-jmpress', 'fade');
		});

		// Register resizing to window when fullscreen
		$(window).resize(function() {
			if ( _self.fullscreen ) {
				_self.resizePresentation();
			}
		});

		// Register the nav bars to move the slides
		_self.navLeft.on('click', function(){
			_self.slideshow.jmpress('prev');
			_self.overlay.css('opacity', 0);
			return false;
		});

		_self.navRight.on('click', function(){
			_self.slideshow.jmpress('next');
			_self.overlay.css('opacity', 0);
			return false;
		});

		_self.slideshow.on('click', function() {
			_self.setAutoplay(true);
			return false;
		});

		_self.slideshow.on('focusout', function() {
			_self.setAutoplay(false);
		});

		// Register toggling fullscreen except for IE 9 or lower
		ie_regex = /MSIE\s(\d+)\.\d+/;
		matches = ie_regex.exec(navigator.userAgent);

		if ( matches && parseInt(matches[1], 10) < 10 ) {
			_self.expandButton.remove();
			_self.expandButton = null;
		} else {
			_self.expandButton.on('click', function() {
				_self.setFullscreen( !_self.fullscreen );
				return false;
			});
		}

		// Register ESC key to exit fullscreen
		$(window).on('keydown', function( event ) {
			if ( event.which === 27 ) {
				_self.setFullscreen( false );
			}
		});

		// Start the presentation
		_self.slideshow.jmpress(jmpressOpts);

		// Make content visible and remove error message on jmpress success
		if ( _self.slideshow.jmpress('initialized') ) {
			_self.slideshow.css('display', '');
			_self.overlay.css('display', '');
			$('.not-supported-msg', _self.wrapper).remove();
		}

		// A bug in Firefox causes issues with the nav arrows appearing
		// on hover in presentation mode. Explicitly disabling fullscreen
		// on init seems to fix the issue
		_self.setFullscreen( false );
	}

	$.extend( Presentation.prototype, {
		resizePresentation: function () {
			var scale, duration, settings, new_css, widthScale, heightScale;

			// Set the animation duration to 0 during resizing
			// so that there isn't an animation delay when scaling
			// up the slide contents
			settings = this.slideshow.jmpress('settings');
			duration = settings.animation.transitionDuration;

			settings.animation.transitionDuration = '0s';
			this.slideshow.jmpress('reselect');

			scale   = 1;
			new_css = {
				top   : 0,
				left  : 0,
				zoom  : 1
			};

			// Expand the presentation to fill the lesser of the max width or height
			// This avoids content moving past the window for certain window sizes
			if ( this.fullscreen ) {
				widthScale  = $(window).width()  / this.slideshow.width();
				heightScale = $(window).height() / this.slideshow.height();

				scale = Math.min(widthScale, heightScale);

				new_css.top  = ( $(window).height() - (scale * this.slideshow.height()) ) / 2;
				new_css.left = ( $(window).width()  - (scale * this.slideshow.width() ) ) / 2;
			}

			// Firefox does not support the zoom property; IE does, but it does not work
			// well like in webkit, so we manually transform and position the slideshow
			if ( this.slideshow.css('-moz-transform') || this.slideshow.css('-ms-transform') ) {
				// Firefox keeps the center of the element in place and expands outward
				// so we must shift everything to compensate
				new_css.top  += (scale - 1) * this.slideshow.height() / 2;
				new_css.left += (scale - 1) * this.slideshow.width()  / 2;

				scale = 'scale(' + scale + ')';

				$.extend(new_css, {
					'-moz-transform'   : scale,
					'-ms-transform'    : scale,
					'transform'        : scale
				});
			} else {
				// webkit scales everything with zoom so we need to offset the right amount
				// so that the content is vertically centered after scaling effects
				new_css.top  /= scale;
				new_css.left /= scale;
				new_css.zoom  = scale;
			}

			this.slideshow.css(new_css);

			settings.animation.transitionDuration = duration;
			this.slideshow.jmpress('reselect');
		},

		setFullscreen: function ( on ) {
			this.fullscreen = on;
			this.setAutoplay(false);

			// Save the scroll positions before going into fullscreen mode
			if ( on ) {
				this.scrollVert  = $(window).scrollTop();
				this.scrollHoriz = $(window).scrollLeft();

				// Chrome Bug: Force scroll to be at top
				// otherwise the presentation can end up offscreen
				$(window).scrollTop(0);
				$(window).scrollLeft(0);
			}

			$('html').toggleClass('presentation-global-fullscreen', on);
			$('body').toggleClass('presentation-global-fullscreen', on);

			this.wrapper.toggleClass('presentation-wrapper-fullscreen', on);

			this.wrapper.parents().each(function(i, e){
				$(e).toggleClass('presentation-wrapper-fullscreen-parent', on);
			});

			this.resizePresentation();

			// Reset the scroll positions after exiting fullscreen mode
			if ( !on ) {
				$(window).scrollTop(this.scrollVert);
				$(window).scrollLeft(this.scrollHoriz);
			}
		},

		setAutoplay: function ( on ) {
			var _self = this, newAutoplayTime;

			if ( _self.autoPlaying === on ) {
				return;
			}

			newAutoplayTime = (on && _self.autoplayTime > 0) ? _self.autoplayTime : 0;
			_self.slideshow.jmpress('settings').duration.defaultValue = newAutoplayTime;

			// Move to the next slide when activating autoplay
			if( newAutoplayTime ) {
				_self.slideshow.jmpress('next');
				_self.overlay.css('opacity', 0);
			} else {
				_self.slideshow.jmpress('reselect');
			}

			_self.autoPlaying = on;
		}
	});

	$( document ).ready( function(){
		$('.presentation-wrapper').map(function() {
			new Presentation(this);
		});
	});

})(jQuery);


} /* end modules/shortcodes/js/main.js */

if ( jpconcat.files['modules/shortcodes/js/slideshow-shortcode.js'] ) {

/* jshint onevar:false, loopfunc:true */
/* global jetpackSlideshowSettings, escape */

function JetpackSlideshow( element, width, height, transition ) {
	this.element = element;
	this.images = [];
	this.controls = {};
	this.transition = transition || 'fade';

	var currentWidth = this.element.width();
	if ( !width || width > currentWidth ) {
		width = currentWidth;
	}

	this.width = width;
	this.height = height;
	this.element.css( {
		'height': this.height + 'px'
		} );
}

JetpackSlideshow.prototype.showLoadingImage = function( toggle ) {
	if ( toggle ) {
		this.loadingImage_ = document.createElement( 'div' );
		this.loadingImage_.className = 'slideshow-loading';
		var img = document.createElement( 'img' );
		img.src = jetpackSlideshowSettings.spinner;
		this.loadingImage_.appendChild( img );
		this.loadingImage_.appendChild( this.makeZeroWidthSpan() );
		this.loadingImage_.style.lineHeight = this.height + 'px';
		this.element.append( this.loadingImage_ );
	} else if ( this.loadingImage_ ) {
		this.loadingImage_.parentNode.removeChild( this.loadingImage_ );
		this.loadingImage_ = null;
	}
};

JetpackSlideshow.prototype.init = function() {
	this.showLoadingImage(true);

	var self = this;
	// Set up DOM.
	for ( var i = 0; i < this.images.length; i++ ) {
		var imageInfo = this.images[i];
		var img = document.createElement( 'img' );
		img.src = imageInfo.src + '?w=' + this.width;
		img.align = 'middle';
		var caption = document.createElement( 'div' );
		caption.className = 'slideshow-slide-caption';
		caption.innerHTML = imageInfo.caption;
		var container = document.createElement('div');
		container.className = 'slideshow-slide';
		container.style.lineHeight = this.height + 'px';

		// Hide loading image once first image has loaded.
		if ( i === 0 ) {
			if ( img.complete ) {
				// IE, image in cache
				setTimeout( function() {
					self.finishInit_();
				}, 1);
			} else {
				jQuery( img ).load(function() {
					self.finishInit_();
				});
			}
		}
		container.appendChild( img );
		// I'm not sure where these were coming from, but IE adds
		// bad values for width/height for portrait-mode images
		img.removeAttribute('width');
		img.removeAttribute('height');
		container.appendChild( this.makeZeroWidthSpan() );
		container.appendChild( caption );
		this.element.append( container );
	}
};

JetpackSlideshow.prototype.makeZeroWidthSpan = function() {
	var emptySpan = document.createElement( 'span' );
	emptySpan.className = 'slideshow-line-height-hack';
	// Having a NBSP makes IE act weird during transitions, but other
	// browsers ignore a text node with a space in it as whitespace.
	if (jQuery.browser.msie) {
		emptySpan.appendChild( document.createTextNode(' ') );
	} else {
		emptySpan.innerHTML = '&nbsp;';
	}
	return emptySpan;
};

JetpackSlideshow.prototype.finishInit_ = function() {
	this.showLoadingImage( false );
	this.renderControls_();

	var self = this;
	// Initialize Cycle instance.
	this.element.cycle( {
		fx: this.transition,
		prev: this.controls.prev,
		next: this.controls.next,
		slideExpr: '.slideshow-slide',
		onPrevNextEvent: function() {
			return self.onCyclePrevNextClick_.apply( self, arguments );
		}
	} );

	var slideshow = this.element;
	jQuery( this.controls.stop ).click( function() {
		var button = jQuery(this);
		if ( ! button.hasClass( 'paused' ) ) {
			slideshow.cycle( 'pause' );
			button.removeClass( 'running' );
			button.addClass( 'paused' );
		} else {
			button.addClass( 'running' );
			button.removeClass( 'paused' );
			slideshow.cycle( 'resume', true );
		}
		return false;
	} );

	var controls = jQuery( this.controlsDiv_ );
	slideshow.mouseenter( function() {
		controls.fadeIn();
	} );
	slideshow.mouseleave( function() {
		controls.fadeOut();
	} );

	this.initialized_ = true;
};

JetpackSlideshow.prototype.renderControls_ = function() {
	if ( this.controlsDiv_ ) {
		return;
	}

	var controlsDiv = document.createElement( 'div' );
	controlsDiv.className = 'slideshow-controls';

	var controls = [ 'prev', 'stop', 'next' ];
	for ( var i = 0; i < controls.length; i++ ) {
		var controlName = controls[i];
		var a = document.createElement( 'a' );
		a.href = '#';
		controlsDiv.appendChild( a );
		this.controls[controlName] = a;
	}
	this.element.append( controlsDiv );
	this.controlsDiv_ = controlsDiv;
};

JetpackSlideshow.prototype.onCyclePrevNextClick_ = function( isNext, i/*, slideElement*/ ) {
	// If blog_id not present don't track page views
	if ( ! jetpackSlideshowSettings.blog_id ) {
		return;
	}

	var postid = this.images[i].id;
	var stats = new Image();
	stats.src = document.location.protocol +
		'//pixel.wp.com/g.gif?host=' +
		escape( document.location.host ) +
		'&rand=' + Math.random() +
		'&blog=' + jetpackSlideshowSettings.blog_id +
		'&subd=' + jetpackSlideshowSettings.blog_subdomain +
		'&user_id=' + jetpackSlideshowSettings.user_id +
		'&post=' + postid +
		'&ref=' + escape( document.location );
};

( function ( $ ) {
	function jetpack_slideshow_init() {
		$( '.jetpack-slideshow-noscript' ).remove();

		$( '.jetpack-slideshow' ).each( function () {
			var container = $( this );

			if ( container.data( 'processed' ) ) {
				return;
			}

			var slideshow = new JetpackSlideshow( container, container.data( 'width' ), container.data( 'height' ), container.data( 'trans' ) );
			slideshow.images = container.data( 'gallery' );
			slideshow.init();

			container.data( 'processed', true );
		} );
	}

	$( document ).ready( jetpack_slideshow_init );
	$( 'body' ).on( 'post-load', jetpack_slideshow_init );
} )( jQuery );


} /* end modules/shortcodes/js/slideshow-shortcode.js */

if ( jpconcat.files['modules/theme-tools/js/suggest.js'] ) {

/*
 * WARNING: This file is distributed verbatim in Jetpack.
 * There should be nothing WordPress.com specific in this file.
 *
 */

/* global ajaxurl:true */
jQuery( function( $ ) {
	$( '#customize-control-featured-content-tag-name input' ).suggest( ajaxurl + '?action=ajax-tag-search&tax=post_tag', { delay: 500, minchars: 2 } );
} );


} /* end modules/theme-tools/js/suggest.js */

if ( jpconcat.files['modules/theme-tools/responsive-videos/responsive-videos.js'] ) {

( function( $ ) {

	/**
	 * A function to help debouncing.
	 */
	var debounce = function( func, wait ) {

		var timeout, args, context, timestamp;

		return function() {

			context = this;
			args = [].slice.call( arguments, 0 );
			timestamp = new Date();

			var later = function() {

				var last = ( new Date() ) - timestamp;

				if ( last < wait ) {
					timeout = setTimeout( later, wait - last );
				} else {
					timeout = null;
					func.apply( context, args );
				}

			};

			if ( ! timeout ) {
				timeout = setTimeout( later, wait );
			}

		};

	};

	/**
	 * A function to resize videos.
	 */
	function responsive_videos() {
		
		$( '.jetpack-video-wrapper' ).find( 'embed, iframe, object' ).each( function() {
			var video_element, video_width, video_height, video_ratio, video_wrapper, container_width;
			
			video_element = $( this );

			if ( ! video_element.attr( 'data-ratio' ) ) {
				video_element
					.attr( 'data-ratio', this.height / this.width )
					.attr( 'data-width', this.width )
					.attr( 'data-height', this.height )
					.css( {
						'display' : 'block',
						'margin'  : 0
					} );
			}

			video_width     = video_element.attr( 'data-width' );
			video_height    = video_element.attr( 'data-height' );
			video_ratio     = video_element.attr( 'data-ratio' );
			video_wrapper   = video_element.parent();
			container_width = video_wrapper.width();

			if ( video_ratio === 'Infinity' ) {
				video_width = '100%';
			}

			video_element
				.removeAttr( 'height' )
				.removeAttr( 'width' );

			if ( video_width > container_width ) {
				video_element
					.width( container_width )
					.height( container_width * video_ratio );
			} else {
				video_element
					.width( video_width )
					.height( video_height );
			}

		} );

	}

	/**
	 * Load responsive_videos().
	 * Trigger resize to make sure responsive_videos() is loaded after IS.
	 */
	$( window ).load( responsive_videos ).resize( debounce( responsive_videos, 100 ) ).trigger( 'resize' );
	$( document ).on( 'post-load', responsive_videos );

} )( jQuery );

} /* end modules/theme-tools/responsive-videos/responsive-videos.js */

if ( jpconcat.files['modules/theme-tools/responsive-videos/responsive-videos.min.js'] ) {

!function(t){function a(){t(".jetpack-video-wrapper").find("embed, iframe, object").each(function(){var a=t(this);a.attr("data-ratio")||a.attr("data-ratio",this.height/this.width).attr("data-width",this.width).attr("data-height",this.height).css({display:"block",margin:0});var i=a.attr("data-width"),e=a.attr("data-height"),r=a.attr("data-ratio"),h=a.parent(),n=h.width();"Infinity"===r&&(i="100%"),a.removeAttr("height").removeAttr("width"),i>n?a.width(n).height(n*r):a.width(i).height(e)})}var i=function(t,a){var i,e,r,h;return function(){r=this,e=[].slice.call(arguments,0),h=new Date;var n=function(){var d=new Date-h;a>d?i=setTimeout(n,a-d):(i=null,t.apply(r,e))};i||(i=setTimeout(n,a))}};t(window).load(a).resize(i(a,100)).trigger("resize"),t(document).on("post-load",a)}(jQuery);

} /* end modules/theme-tools/responsive-videos/responsive-videos.min.js */

if ( jpconcat.files['modules/tiled-gallery/tiled-gallery/tiled-gallery.js'] ) {

/* jshint onevar:false, smarttabs:true */

( function($) {

	function TiledGalleryCollection() {
		this.galleries = [];
		this.findAndSetupNewGalleries();
	}

	TiledGalleryCollection.prototype.findAndSetupNewGalleries = function() {
		var self = this;
		$( '.tiled-gallery.tiled-gallery-unresized' ).each( function() {
			self.galleries.push( new TiledGallery( $( this ) ) );
		} );
	};

	TiledGalleryCollection.prototype.resizeAll = function() {
		$.each(this.galleries, function(i, gallery) {
			gallery.resize();
		} );
	};

	function TiledGallery( galleryElem ) {
		this.gallery = galleryElem;

		this.addCaptionEvents();

		// Resize when initialized to fit the gallery to window dimensions
		this.resize();

		// Displays the gallery and prevents it from being initialized again
		this.gallery.removeClass( 'tiled-gallery-unresized' );
	}

	/**
	 * Selector for all resizeable elements inside a Tiled Gallery
	 */

	TiledGallery.prototype.resizeableElementsSelector = '.gallery-row, .gallery-group, .tiled-gallery-item img';

	/**
	 * Story
	 */

	TiledGallery.prototype.addCaptionEvents = function() {
		// Hide captions
		this.gallery.find( '.tiled-gallery-caption' ).hide();

		// Add hover effects to bring the caption up and down for each item
		this.gallery.find( '.tiled-gallery-item' ).hover(
			function() { $( this ).find( '.tiled-gallery-caption' ).stop(true, true).slideDown( 'fast' ); },
			function() { $( this ).find( '.tiled-gallery-caption' ).stop(true, true).slideUp( 'fast' ); }
		);
	};

	TiledGallery.prototype.getExtraDimension = function( el, attribute, mode ) {
		if ( mode === 'horizontal' ) {
			var left = ( attribute === 'border' ) ? 'borderLeftWidth' : attribute + 'Left';
			var right = ( attribute === 'border' ) ? 'borderRightWidth' : attribute + 'Right';
			return ( parseInt( el.css( left ), 10 ) || 0 ) +  ( parseInt( el.css( right ), 10 ) || 0 );
		} else if ( mode === 'vertical' ) {
			var top = ( attribute === 'border' ) ? 'borderTopWidth' : attribute + 'Top';
			var bottom = ( attribute === 'border' ) ? 'borderBottomWidth' : attribute + 'Bottom';
			return ( parseInt( el.css( top ), 10 ) || 0 ) + ( parseInt( el.css( bottom ), 10 ) || 0 );
		} else {
			return 0;
		}
	};

	TiledGallery.prototype.resize = function() {
		// Resize everything in the gallery based on the ratio of the current content width
		// to the original content width;
		var originalWidth = this.gallery.data( 'original-width' );
		var currentWidth = this.gallery.parent().width();
		var resizeRatio = Math.min( 1, currentWidth / originalWidth );

		var self = this;
		this.gallery.find( this.resizeableElementsSelector ).each( function () {
			var thisGalleryElement = $( this );

			var marginWidth = self.getExtraDimension( thisGalleryElement, 'margin', 'horizontal' );
			var marginHeight = self.getExtraDimension( thisGalleryElement, 'margin', 'vertical' );

			var paddingWidth = self.getExtraDimension( thisGalleryElement, 'padding', 'horizontal' );
			var paddingHeight = self.getExtraDimension( thisGalleryElement, 'padding', 'vertical' );

			var borderWidth = self.getExtraDimension( thisGalleryElement, 'border', 'horizontal' );
			var borderHeight = self.getExtraDimension( thisGalleryElement, 'border', 'vertical' );

			// Take all outer dimensions into account when resizing so that images
			// scale with constant empty space between them
			var outerWidth = thisGalleryElement.data( 'original-width' ) + paddingWidth + borderWidth + marginWidth;
			var outerHeight = thisGalleryElement.data( 'original-height' ) + paddingHeight + borderHeight + marginHeight;

			// Subtract margins so that images don't overflow on small browser windows
			thisGalleryElement
				.width( Math.floor( resizeRatio * outerWidth ) - marginWidth )
				.height( Math.floor( resizeRatio * outerHeight ) - marginHeight );
		} );
	};

	/**
	 * Resizing logic
	 */

	var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;

	function attachResizeInAnimationFrames( tiledGalleries ) {
		var resizing = false;
		var resizeTimeout = null;

		function handleFrame() {
			tiledGalleries.resizeAll();
			if ( resizing ) {
				requestAnimationFrame( handleFrame );
			}
		}

		$( window ).resize( function() {
			clearTimeout( resizeTimeout );

			if ( ! resizing ) {
				requestAnimationFrame( handleFrame );
			}
			resizing = true;
			resizeTimeout = setTimeout( function() {
				resizing = false;
			}, 15 );
		} );
	}

	function attachPlainResize( tiledGalleries ) {
		$( window ).resize( function() {
			tiledGalleries.resizeAll();
		} );
	}

	/**
	 * Ready, set...
	 */

	$( document ).ready( function() {
		var tiledGalleries = new TiledGalleryCollection();

		$( 'body' ).on( 'post-load', function() {
			tiledGalleries.findAndSetupNewGalleries();
		} );
		$( document ).on( 'page-rendered.wpcom-newdash', function() {
			tiledGalleries.findAndSetupNewGalleries();
		} );

		// Chrome is a unique snow flake and will start lagging on occasion
		// It helps if we only resize on animation frames
		//
		// For other browsers it seems like there is no lag even if we resize every
		// time there is an event
		if ( window.chrome && requestAnimationFrame ) {
			attachResizeInAnimationFrames( tiledGalleries );
		} else {
			attachPlainResize( tiledGalleries );
		}
	});

})(jQuery);


} /* end modules/tiled-gallery/tiled-gallery/tiled-gallery.js */

if ( jpconcat.files['modules/videopress/videopress-admin.js'] ) {

/* jshint onevar: false, smarttabs: true, devel: true */
/* global VideoPressAdminSettings, setUserSetting */

/**
 * VideoPress Admin
 *
 * @todo i18n
 */
(function($) {
	var media = wp.media;
	var VideoPress = VideoPress || {};

	VideoPress.caps = VideoPressAdminSettings.caps;
	VideoPress.l10n = VideoPressAdminSettings.l10n;

	/**
	 * Create a new controller that simply adds a videopress key
	 * to the library query
	 */
	media.controller.VideoPress = media.controller.Library.extend({
		defaults: _.defaults({
			id:         'videopress',
			router:     'videopress',
			toolbar:    'videopress-toolbar',
			title:      'VideoPress',
			priority:   200,
			searchable: true,
			sortable:   false
		}, media.controller.Library.prototype.defaults ),

		initialize: function() {
			if ( ! this.get('library') ) {
				this.set( 'library', media.query({ videopress: true }) );
			}

			media.controller.Library.prototype.initialize.apply( this, arguments );
		},

		/**
		 * The original function saves content for the browse router only,
		 * so we hi-jack it a little bit.
		 */
		saveContentMode: function() {
			if ( 'videopress' !== this.get('router') ) {
				return;
			}

			var mode = this.frame.content.mode(),
				view = this.frame.router.get();

			if ( view && view.get( mode ) ) {

				// Map the Upload a Video back to the regular Upload Files.
				if ( 'upload_videopress' === mode ) {
					mode = 'upload';
				}

				setUserSetting( 'libraryContent', mode );
			}
		}
	});

	/**
	 * VideoPress Uploader
	 */
	media.view.VideoPressUploader = media.View.extend({
		tagName:   'div',
		className: 'uploader-videopress',
		template:  media.template('videopress-uploader'),

		events: {
			'submit .videopress-upload-form': 'submitForm'
		},

		initialize: function() {
			var that = this;

			if ( ! window.addEventListener ) {
				window.attachEvent( 'onmessage', function() { return that.messageHandler.apply( that, arguments ); } );
			} else {
				window.addEventListener( 'message', function() { return that.messageHandler.apply( that, arguments ); }, false );
			}

			return media.View.prototype.initialize.apply( this, arguments );
		},

		submitForm: function() {
			var data = false;

			this.clearErrors();

			if ( this.$( 'input[name="videopress_file"]').val().length < 1 ) {
				this.error( VideoPress.l10n.selectVideoFile );
				return false;
			}

			// Prevent multiple submissions.
			this.$( '.videopress-upload-form .button' ).prop( 'disabled', true );

			// A non-async request for an upload token.
			media.ajax( 'videopress-get-upload-token', { async: false } ).done( function( response ) {
				data = response;
				data.success = true;
			}).fail( function( response ) {
				data = response;
				data.success = false;
			});

			if ( ! data.success ) {
				// Re-enable form elements.
				this.$( '.videopress-upload-form .button' ).prop( 'disabled', false );

				// Display an error message and cancel form submission.
				this.error( data.message );
				return false;
			}

			this.error( VideoPress.l10n.videoUploading, 'updated' );

			// Set the form token.
			this.$( 'input[name="videopress_blog_id"]' ).val( data.videopress_blog_id );
			this.$( 'input[name="videopress_token"]' ).val( data.videopress_token );
			this.$( '.videopress-upload-form' ).attr( 'action', data.videopress_action_url );
			return true;
		},

		error: function( message, type ) {
			type = type || 'error';
			var div = $( '<div />' ).html( $( '<p />' ).text( message ) ).addClass( type );
			this.$( '.videopress-errors' ).html( div );
			return this;
		},

		success: function( message ) {
			return this.error( message, 'updated' );
		},

		clearErrors: function() {
			this.$( '.videopress-errors' ).html('');
			return this;
		},

		messageHandler: function( event ) {
			if ( ! event.origin.match( /\.wordpress\.com$/ ) ) {
				return;
			}

			if ( event.data.indexOf && event.data.indexOf( 'vpUploadResult::' ) === 0 ) {
				var result = JSON.parse( event.data.substr( 16 ) );

				if ( ! result || ! result.code ) {
					this.error( VideoPress.l10n.unknownError );
					this.$( '.videopress-upload-form .button' ).prop( 'disabled', false );
					return;
				}

				if ( 'success' === result.code && result.data ) {
					var that = this, controller = this.controller,
					    state = controller.states.get( 'videopress' );

					// Our new video has been added, so we need to reset the library.
					// Since the Media API caches all queries, we add a random attribute
					// to avoid the cache, then call more() to actually fetch the data.

					state.set( 'library', media.query({ videopress:true, vp_random:Math.random() }) );
					state.get( 'library' ).more().done(function(){
						var model = state.get( 'library' ).get( result.data.attachment_id );

						// Clear errors and select the uploaded item.
						that.clearErrors();
						state.get( 'selection' ).reset([ model ]);
						controller.content.mode( 'browse' );
					});
				} else {
					this.error( result.code );

					// Re-enable form elements.
					this.$( '.videopress-upload-form .button' ).prop( 'disabled', false );
				}
			}
		}
	});

	/**
	 * Add a custom sync function that would add a few extra
	 * options for models which are VideoPress videos.
	 */
	var attachmentSync = media.model.Attachment.prototype.sync;
	media.model.Attachment.prototype.sync = function( method, model, options ) {
		if ( model.get( 'vp_isVideoPress' ) ) {
			console.log( 'syncing ' + model.get( 'vp_guid' ) );
			options.data = _.extend( options.data || {}, {
				is_videopress: true,
				vp_nonces: model.get( 'vp_nonces' )
			} );
		}

		// Call the original sync routine.
		return attachmentSync.apply( this, arguments );
	};

	/**
	 * Extend the default Attachment Details view. Check for vp_isVideoPress before
	 * adding anything to these methods.
	 */
	var AttachmentDetails = media.view.Attachment.Details;
	media.view.Attachment.Details = AttachmentDetails.extend({

		initialize: function() {
			if ( this.model.get( 'vp_isVideoPress' ) ) {
				_.extend( this.events, {
					'click a.videopress-preview': 'vpPreview',
					'change .vp-radio': 'vpRadioChange',
					'change .vp-checkbox': 'vpCheckboxChange'
				});
			}
			return AttachmentDetails.prototype.initialize.apply( this, arguments );
		},

		render: function() {
			var r = AttachmentDetails.prototype.render.apply( this, arguments );
			if ( this.model.get( 'vp_isVideoPress' ) ) {
				var template = media.template( 'videopress-attachment' );
				var options = this.model.toJSON();

				options.can = {};
				options.can.save = !! options.nonces.update;

				this.$el.append( template( options ) );
			}
			return r;
		},

		// Handle radio buttons
		vpRadioChange: function(e) {
			$( e.target ).parents( '.vp-setting' ).find( '.vp-radio-text' ).val( e.target.value ).change();
		},

		// And checkboxes
		vpCheckboxChange: function(e) {
			$( e.target ).parents( '.vp-setting' ).find( '.vp-checkbox-text' ).val( Number( e.target.checked ) ).change();
		},

		vpPreview: function() {
			VideoPressModal.render( this );
			return this;
		}
	});

	/**
	 * Don't display the uploader dropzone for the VideoPress router.
	 */
	var UploaderWindow = media.view.UploaderWindow;
	media.view.UploaderWindow = UploaderWindow.extend({
		show: function() {
			if ( 'videopress' !== this.controller.state().get('id') ) {
				UploaderWindow.prototype.show.apply( this, arguments );
			}

			return this;
		}
	});

	/**
	 * Don't display the uploader in the attachments browser.
	 */
	var AttachmentsBrowser = media.view.AttachmentsBrowser;
	media.view.AttachmentsBrowser = AttachmentsBrowser.extend({
		createUploader: function() {
			if ( 'videopress' !== this.controller.state().get('id') ) {
				return AttachmentsBrowser.prototype.createUploader.apply( this, arguments );
			}
		}
	});

	/**
	 * Add VideoPress-specific methods for all frames.
	 */
	_.extend( media.view.MediaFrame.prototype, { VideoPress: { // this.VideoPress.method()

		// When the VideoPress router is activated.
		activate: function() {
			var view = _.first( this.views.get( '.media-frame-router' ) ),
			    viewSettings = {};

			if ( VideoPress.caps.read_videos ) {
				viewSettings.browse = { text: VideoPress.l10n.VideoPressLibraryRouter, priority: 40 };
			}

			if ( VideoPress.caps.upload_videos ) {
				viewSettings.upload_videopress = { text: VideoPress.l10n.uploadVideoRouter, priority: 20 };
			}

			view.set( viewSettings );

			// Intercept and clear all incoming uploads
			wp.Uploader.queue.on( 'add', this.VideoPress.disableUpload, this );

			// Map the Upload Files view to the Upload a Video one (upload_videopress vs. upload)
			if ( 'upload' === this.content.mode() && VideoPress.caps.upload_videos ) {
				this.content.mode( 'upload_videopress' );
			} else {
				this.content.mode( 'browse' );
			}
		},

		// When navigated away from the VideoPress router.
		deactivate: function( /*view*/ ) {
			wp.Uploader.queue.off( 'add', this.VideoPress.disableUpload );
		},

		// Disable dragdrop uploads in the VideoPress router.
		disableUpload: function( attachment ) {
			var uploader = this.uploader.uploader.uploader;
			uploader.stop();
			uploader.splice();
			attachment.destroy();
		},

		// Runs on videopress:insert event fired by our custom toolbar
		insert: function( selection ) {
			var guid = selection.models[0].get( 'vp_guid' ).replace( /[^a-zA-Z0-9]+/, '' );
			media.editor.insert( '[wpvideo ' + guid + ']' );
			return this;
		},

		// Triggered by the upload_videopress router item.
		uploadVideo: function() {
			this.content.set( new media.view.VideoPressUploader({
				controller: this
			}) );
			return this;
		},

		// Create a custom toolbar
		createToolbar: function( /*toolbar*/ ) {
			// Alow an option to hide the toolbar.
			if ( this.options.VideoPress && this.options.VideoPress.hideToolbar ) {
				return this;
			}

			var controller = this;
			this.toolbar.set( new media.view.Toolbar({
				controller: this,
				items: {
					insert: {
						style:    'primary',
						text:     VideoPress.l10n.insertVideoButton,
						priority: 80,
						requires: {
							library: true,
							selection: true
						},

						click: function() {
							var state = controller.state(),
								selection = state.get('selection');

							controller.close();
							state.trigger( 'videopress:insert', selection ).reset();
						}
					}
				}
			}) );
		}
	}});

	var MediaFrame = {};

	/**
	 * Extend the selection media frame
	 */
	MediaFrame.Select = media.view.MediaFrame.Select;
	media.view.MediaFrame.Select = MediaFrame.Select.extend({
		bindHandlers: function() {
			MediaFrame.Select.prototype.bindHandlers.apply( this, arguments );

			this.on( 'router:create:videopress', this.createRouter, this );
			this.on( 'router:activate:videopress', this.VideoPress.activate, this );
			this.on( 'router:deactivate:videopress', this.VideoPress.deactivate, this );

			this.on( 'content:render:upload_videopress', this.VideoPress.uploadVideo, this );
			this.on( 'toolbar:create:videopress-toolbar', this.VideoPress.createToolbar, this );
			this.on( 'videopress:insert', this.VideoPress.insert, this );
		}
	});

	/**
	 * Extend the post editor media frame with our own
	 */
	MediaFrame.Post = media.view.MediaFrame.Post;
	media.view.MediaFrame.Post = MediaFrame.Post.extend({
		createStates: function() {
			MediaFrame.Post.prototype.createStates.apply( this, arguments );
			this.states.add([ new media.controller.VideoPress() ]);
		}
	});

	/**
	 * A VideoPress Modal view that we can use to preview videos.
	 * Expects a controller object on render.
	 */
	var VideoPressModalView = Backbone.View.extend({
		'className': 'videopress-modal-container',
		'template': wp.media.template( 'videopress-media-modal' ),

		// Render the VideoPress modal with a video object by guid.
		render: function( controller ) {
			this.delegateEvents( {
				'click .videopress-modal-close': 'closeModal',
				'click .videopress-modal-backdrop': 'closeModal'
			} );

			this.model = controller.model;
			this.guid = this.model.get( 'vp_guid' );

			if ( ! this.$frame ) {
				this.$frame = $( '.media-frame-content' );
			}

			this.$el.html( this.template( { 'video' : this.model.get( 'vp_embed' ) } ) );
			this.$modal = this.$( '.videopress-modal' );
			this.$modal.hide();

			this.$frame.append( this.$el );
			this.$modal.slideDown( 'fast' );

			return this;
		},

		closeModal: function() {
			var view = this;
			this.$modal.slideUp( 'fast', function() { view.remove(); } );
			return this;
		}
	});

	var VideoPressModal = new VideoPressModalView();

	// Configuration screen behavior
	$(document).on( 'ready', function() {
		var $form = $( '#videopress-settings' );

		// Not on a configuration screen
		if ( ! $form.length ) {
			return;
		}

		var $access = $form.find( 'input[name="videopress-access"]' ),
		    $upload = $form.find( 'input[name="videopress-upload"]' );

		$access.on( 'change', function() {
			var access = $access.filter( ':checked' ).val();
			$upload.attr( 'disabled', ! access );

			if ( ! access ) {
				$upload.attr( 'checked', false );
			}
		});

		$access.trigger( 'change' );
	});

	// Media -> VideoPress menu
	$(document).on( 'click', '#videopress-browse', function() {

		wp.media({
			state: 'videopress',
			states: [ new media.controller.VideoPress() ],
			VideoPress: { hideToolbar: true }
		}).open();

		return false;
	});
})(jQuery);


} /* end modules/videopress/videopress-admin.js */

if ( jpconcat.files['modules/widgets/gallery/js/gallery.js'] ) {

(function($){
	$(function(){
		// Fixes a bug with carousels being triggered even when a widget's Link To option is not set to carousel.
		// Happens when another gallery is loaded on the page, either in a post or separate widget
		$( '.widget-gallery .no-carousel .tiled-gallery-item a' ).on( 'click', function( event ){
			// Have to trigger default, instead of carousel
			event.stopPropagation();

			return true;
		});
	});
})(jQuery);

} /* end modules/widgets/gallery/js/gallery.js */

if ( jpconcat.files['modules/wpgroho.js'] ) {

/* global WPGroHo:true, Gravatar */
WPGroHo = jQuery.extend( {
	my_hash: '',
	data: {},
	renderers: {},
	syncProfileData: function( hash, id ) {
		if ( !WPGroHo.data[hash] ) {
			WPGroHo.data[hash] = {};
			jQuery( 'div.grofile-hash-map-' + hash + ' span' ).each( function() {
				WPGroHo.data[hash][this.className] = jQuery( this ).text();
			} );
		}

		WPGroHo.appendProfileData( WPGroHo.data[hash], hash, id );
	},
	appendProfileData: function( data, hash, id ) {
		for ( var key in data ) {
			if ( jQuery.isFunction( WPGroHo.renderers[key] ) ) {
				return WPGroHo.renderers[key]( data[key], hash, id, key );
			}

			jQuery( '#' + id ).find( 'h4' ).after( jQuery( '<p class="grav-extra ' + key + '" />' ).html( data[key] ) );
		}
	}
}, WPGroHo );

jQuery( document ).ready( function() {
	Gravatar.profile_cb = function( h, d ) {
		WPGroHo.syncProfileData( h, d );
	};

	Gravatar.my_hash = WPGroHo.my_hash;
	Gravatar.init( 'body', '#wpadminbar' );
} );


} /* end modules/wpgroho.js */
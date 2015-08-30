<nav-button class="{ active: active }">
  <a name="link" href="#/{ opts.view }">
    <i name="icon" class="icon icon-{ opts.icon }"></i>
    <span>{ opts.title }</span>
  </a>
  <script>
    this.on('mount', function() {
      $(this.link).tooltip({
        title: opts.title,
        placement: 'bottom',
        trigger: 'hover',
        animation: false,
        container: 'body',
        template: '<div class="tooltip navbar-tooltip" role="tooltip">'
            + '    <div class="tooltip-arrow"></div>'
            + '    <div class="tooltip-inner"></div>'
            + '</div>'
      });
    });

    app.watch('route', this, function(view) {
      this.update({active: view === opts.view});
    });
  </script>
</nav-button>
